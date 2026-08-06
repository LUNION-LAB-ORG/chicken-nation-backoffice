"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Inbox } from "lucide-react";
import { useDashboardStore } from "@/store/dashboardStore";
import {
  useConversationListQuery,
  useMessageListQuery,
  useEnvoyerMessageMutation,
  useMarquerLuMutation,
  useTicketListQuery,
  useTicketDetailQuery,
  useEnvoyerMessageTicketMutation,
  useModifierStatutTicketMutation,
  useAssignerTicketMutation,
  useMessagerieSocketSync,
  useTicketSocketSync,
} from "../../messagerie";
import type { IConversation } from "../../messagerie/types/conversation.type";
import type { ITicket } from "../../messagerie/types/ticket.type";
import { useAuthStore } from "../../users/hook/authStore";
import SupportList, { ElementSupport } from "./SupportList";
import SupportThread, { MessageFil } from "./SupportThread";
import { Puce, Vide } from "./primitives";

/**
 * Poste de support unifié.
 *
 * Avant, messages clients et tickets vivaient dans deux modules séparés, avec
 * deux mises en page, deux recherches, deux gestuelles pour la même intention :
 * répondre à quelqu'un qui attend. Ici, une seule pile, un seul fil, un seul
 * jeu de gestes. Le type d'élément devient un filtre, pas une autre application.
 */

/**
 * Extrait la liste quelle que soit la forme renvoyée par l'API : tableau nu,
 * { data } ou { items }. Le backoffice mélange les trois selon les endpoints,
 * et supposer la mauvaise forme fait planter tout l'écran.
 */
function listeDe<T>(source: unknown): T[] {
  if (Array.isArray(source)) return source as T[];
  if (source && typeof source === "object") {
    const o = source as { data?: unknown; items?: unknown };
    if (Array.isArray(o.data)) return o.data as T[];
    if (Array.isArray(o.items)) return o.items as T[];
  }
  return [];
}

const STATUT_VERS_FILTRE: Record<string, ElementSupport["statut"]> = {
  OPEN: "ouvert",
  IN_PROGRESS: "en_cours",
  RESOLVED: "resolu",
  CLOSED: "ferme",
};

/** Servent uniquement à typer les extractions de listes. */
const ticketMessagesVide: import("../../messagerie/types/ticket.type").ITicketMessage[] = [];
const messagesFilVide: import("../../messagerie/types/conversation.type").IMessage[] = [];

export default function SupportWorkspace() {
  const { user } = useAuthStore();
  const pendingConversationId = useDashboardStore((s) => s.pendingConversationId);
  const clearPendingConversation = useDashboardStore((s) => s.clearPendingConversation);
  const pendingTicketId = useDashboardStore((s) => s.pendingTicketId);
  const clearPendingTicket = useDashboardStore((s) => s.clearPendingTicket);

  const [filtre, setFiltre] = useState<"tous" | "message" | "ticket">("tous");
  const [recherche, setRecherche] = useState("");
  const [rechercheDifferee, setRechercheDifferee] = useState("");
  const [selection, setSelection] = useState<ElementSupport | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setRechercheDifferee(recherche), 300);
    return () => clearTimeout(t);
  }, [recherche]);

  // Un seul socket pour les deux flux (connexion partagée en interne).
  useMessagerieSocketSync();
  useTicketSocketSync({ enabled: true, playSound: true });

  const { data: conversationsBrut, isLoading: chargeConv } =
    useConversationListQuery();
  const { data: ticketsBrut, isLoading: chargeTickets } = useTicketListQuery({});
  const conversations = useMemo(
    () => listeDe<IConversation>(conversationsBrut),
    [conversationsBrut]
  );
  const tickets = useMemo(() => listeDe<ITicket>(ticketsBrut), [ticketsBrut]);

  /* ── Fusion des deux sources en une pile unique ───────────────────────── */

  const elements = useMemo<ElementSupport[]>(() => {
    const depuisConversations: ElementSupport[] = conversations.map(
      (c) => {
        const dernier = c.messages?.[c.messages.length - 1];
        const nom =
          c.customer
            ? `${c.customer.first_name ?? ""} ${c.customer.last_name ?? ""}`.trim()
            : c.users?.[0]?.fullName ?? "Discussion interne";
        return {
          id: c.id,
          type: "message" as const,
          nom: nom || "Client",
          image: c.customer?.image ?? null,
          apercu: dernier?.body ?? "",
          date: dernier?.createdAt ?? c.updatedAt ?? c.createdAt,
          nonLus: c.unreadNumber ?? 0,
        };
      }
    );

    const depuisTickets: ElementSupport[] = tickets.map((t) => {
      const dernier = t.messages?.[0] ?? t.messages?.[t.messages.length - 1];
      const nom =
        t.customer?.name ||
        [t.customer?.first_name, t.customer?.last_name].filter(Boolean).join(" ") ||
        "Client";
      return {
        id: t.id,
        type: "ticket" as const,
        nom: nom || "Client",
        image: t.customer?.image ?? null,
        apercu: dernier?.body ?? t.subject ?? "",
        date: t.updatedAt ?? t.createdAt,
        nonLus: t.unreadCount ?? 0,
        code: t.code,
        statut: STATUT_VERS_FILTRE[t.status] ?? "ouvert",
        urgent: t.priority === "HIGH" || t.priority === "URGENT",
        agent: t.assignee?.fullname ?? t.assignee?.name ?? null,
      };
    });

    const tout = [...depuisConversations, ...depuisTickets];
    const q = rechercheDifferee.trim().toLowerCase();
    const filtres = tout
      .filter((e) => (filtre === "tous" ? true : e.type === filtre))
      .filter((e) =>
        q
          ? e.nom.toLowerCase().includes(q) ||
            e.apercu.toLowerCase().includes(q) ||
            (e.code ?? "").toLowerCase().includes(q)
          : true
      );

    // Les non lus d'abord, puis le plus récent : l'agent traite ce qui attend.
    return filtres.sort((a, b) => {
      if (!!a.nonLus !== !!b.nonLus) return a.nonLus ? -1 : 1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [conversations, tickets, filtre, rechercheDifferee]);

  const compteurs = useMemo(
    () => ({
      tous: elements.filter((e) => e.nonLus > 0).length,
      message: elements.filter((e) => e.type === "message" && e.nonLus > 0).length,
      ticket: elements.filter((e) => e.type === "ticket" && e.nonLus > 0).length,
    }),
    [elements]
  );

  /* ── Ouverture demandée depuis ailleurs (notification, escalade) ──────── */

  useEffect(() => {
    if (pendingConversationId) {
      const el = elements.find((e) => e.id === pendingConversationId);
      setSelection(
        el ?? {
          id: pendingConversationId,
          type: "message",
          nom: "Conversation",
          apercu: "",
          date: new Date().toISOString(),
          nonLus: 0,
        }
      );
      clearPendingConversation();
    }
  }, [pendingConversationId, elements, clearPendingConversation]);

  useEffect(() => {
    if (pendingTicketId) {
      const el = elements.find((e) => e.id === pendingTicketId);
      setSelection(
        el ?? {
          id: pendingTicketId,
          type: "ticket",
          nom: "Ticket",
          apercu: "",
          date: new Date().toISOString(),
          nonLus: 0,
        }
      );
      setFiltre("tous");
      clearPendingTicket();
    }
  }, [pendingTicketId, elements, clearPendingTicket]);

  /* ── Fil sélectionné ──────────────────────────────────────────────────── */

  const estTicket = selection?.type === "ticket";
  const { data: messagesBrut, isLoading: chargeMessages } = useMessageListQuery(
    estTicket ? null : selection?.id ?? null
  );
  const messagesConv = useMemo(
    () => listeDe<(typeof messagesFilVide)[number]>(messagesBrut),
    [messagesBrut]
  );
  const { data: ticket, isLoading: chargeTicket } = useTicketDetailQuery(
    estTicket ? selection?.id ?? null : null
  );

  const envoyerConv = useEnvoyerMessageMutation();
  const envoyerTicket = useEnvoyerMessageTicketMutation();
  const marquerLu = useMarquerLuMutation();
  const changerStatut = useModifierStatutTicketMutation();
  const assigner = useAssignerTicketMutation();

  // Marquer lu à l'ouverture d'une conversation qui attend.
  useEffect(() => {
    if (selection && !estTicket && selection.nonLus > 0) {
      marquerLu.mutate(selection.id);
    }
    // marquerLu est stable, on ne le met pas en dépendance pour éviter la boucle
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection?.id, estTicket]);

  const messagesFil = useMemo<MessageFil[]>(() => {
    if (estTicket) {
      const liste = [...listeDe<(typeof ticketMessagesVide)[number]>(ticket?.messages)].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      return liste.map((m) => ({
        id: m.id,
        corps: m.body,
        date: m.createdAt,
        interne: m.internal,
        auteurAgent: m.authorUser
          ? {
              nom: m.authorUser.fullname ?? m.authorUser.name ?? "Agent",
              image: m.authorUser.image,
            }
          : null,
        auteurExterne: m.authorUser
          ? null
          : {
              nom:
                m.authorCustomer?.name ||
                [m.authorCustomer?.first_name, m.authorCustomer?.last_name]
                  .filter(Boolean)
                  .join(" ") ||
                [m.authorDeliverer?.first_name, m.authorDeliverer?.last_name]
                  .filter(Boolean)
                  .join(" ") ||
                "Client",
              image: m.authorCustomer?.image ?? m.authorDeliverer?.image ?? null,
            },
      }));
    }
    return [...messagesConv]
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
      .map((m) => ({
        id: m.id,
        corps: m.body,
        date: m.createdAt,
        auteurAgent: m.authorUser
          ? { nom: m.authorUser.name, image: m.authorUser.image }
          : null,
        auteurExterne: m.authorUser
          ? null
          : {
              nom: m.authorCustomer?.name ?? "Client",
              image: m.authorCustomer?.image ?? null,
            },
      }));
  }, [estTicket, ticket, messagesConv]);

  const envoyer = async (corps: string, interne: boolean) => {
    if (!selection) return;
    if (estTicket) {
      await envoyerTicket.mutateAsync({
        ticketId: selection.id,
        data: { body: corps, internal: interne } as never,
      });
    } else {
      await envoyerConv.mutateAsync({
        conversationId: selection.id,
        body: corps,
      });
    }
  };

  /* ── Rendu ────────────────────────────────────────────────────────────── */

  const sousTitre = estTicket ? (
    <>
      {ticket?.code && (
        <span className="font-mono text-[11px] text-stone-400">
          {ticket.code}
        </span>
      )}
      {ticket?.order?.code && <span>Commande {ticket.order.code}</span>}
      {ticket?.category?.name && <span>{ticket.category.name}</span>}
      {ticket?.customer?.phone && <span>{ticket.customer.phone}</span>}
      {selection?.urgent && <Puce ton="urgent">Prioritaire</Puce>}
    </>
  ) : (
    <>
      {selection?.nom && <span>Conversation client</span>}
    </>
  );

  const actionsTicket = estTicket && ticket && (
    <>
      <select
        value={ticket.status}
        onChange={(e) =>
          changerStatut.mutate({
            ticketId: ticket.id,
            statut: e.target.value as never,
          })
        }
        className="h-8 rounded-lg border border-stone-200 bg-white px-2 text-xs font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#F17922]/25 cursor-pointer"
      >
        <option value="OPEN">Ouvert</option>
        <option value="IN_PROGRESS">En cours</option>
        <option value="RESOLVED">Résolu</option>
        <option value="CLOSED">Fermé</option>
      </select>
      {!ticket.assignee && user?.id && (
        <button
          type="button"
          onClick={() =>
            assigner.mutate({ ticketId: ticket.id, assigneeId: user.id })
          }
          className="h-8 rounded-lg bg-stone-900 px-2.5 text-xs font-medium text-white hover:bg-stone-800 cursor-pointer"
        >
          Prendre en charge
        </button>
      )}
    </>
  );

  return (
    <div className="flex h-full min-h-0 bg-white">
      {/* Pile */}
      <aside
        className={`${
          selection ? "hidden lg:flex" : "flex"
        } h-full w-full shrink-0 flex-col border-r border-stone-200 lg:w-[360px] xl:w-[400px]`}
      >
        <SupportList
          elements={elements}
          chargement={chargeConv || chargeTickets}
          selection={selection?.id ?? null}
          onSelect={setSelection}
          recherche={recherche}
          onRecherche={setRecherche}
          filtre={filtre}
          onFiltre={setFiltre}
          compteurs={compteurs}
        />
      </aside>

      {/* Fil */}
      <main className={`${selection ? "flex" : "hidden lg:flex"} min-w-0 flex-1`}>
        {selection ? (
          <SupportThread
            titre={selection.nom}
            sousTitre={sousTitre}
            avatar={{ nom: selection.nom, image: selection.image }}
            messages={messagesFil}
            chargement={estTicket ? chargeTicket : chargeMessages}
            onRetour={() => setSelection(null)}
            onEnvoyer={envoyer}
            envoiEnCours={envoyerConv.isPending || envoyerTicket.isPending}
            actions={actionsTicket}
            autoriserNoteInterne={estTicket}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center bg-stone-50">
            <Vide
              icone={<Inbox size={34} strokeWidth={1.5} />}
              titre="Choisissez une discussion"
              aide="Les non lus apparaissent en haut de la liste"
            />
          </div>
        )}
      </main>
    </div>
  );
}
