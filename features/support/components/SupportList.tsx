"use client";

import React, { useMemo } from "react";
import { MessageSquare, Search, TicketCheck } from "lucide-react";
import { Avatar, LigneFantome, Puce, Vide, heureCourte } from "./primitives";

/**
 * Liste unifiée du poste de support.
 *
 * Une conversation et un ticket sont deux formes du même objet pour l'agent :
 * quelqu'un attend une réponse. Ils partagent donc la même ligne, la même
 * gestuelle, le même tri. Le type se lit à une petite icône, pas à une mise en
 * page différente.
 *
 * Le rail de trois pixels à gauche porte l'état non lu : il se repère en vision
 * périphérique pendant qu'on parcourt la liste, sans avoir à lire.
 */

export type ElementSupport = {
  id: string;
  type: "message" | "ticket";
  nom: string;
  image?: string | null;
  apercu: string;
  date: string;
  nonLus: number;
  /** Ticket : code, statut, priorité. Conversation : rien. */
  code?: string;
  statut?: "ouvert" | "en_cours" | "resolu" | "ferme";
  urgent?: boolean;
  /** Agent en charge, pour les tickets. */
  agent?: string | null;
};

const STATUT_LIBELLE: Record<
  NonNullable<ElementSupport["statut"]>,
  { texte: string; ton: "neutre" | "attente" | "resolu" }
> = {
  ouvert: { texte: "Ouvert", ton: "attente" },
  en_cours: { texte: "En cours", ton: "attente" },
  resolu: { texte: "Résolu", ton: "resolu" },
  ferme: { texte: "Fermé", ton: "neutre" },
};

export default function SupportList({
  elements,
  chargement,
  selection,
  onSelect,
  recherche,
  onRecherche,
  filtre,
  onFiltre,
  compteurs,
}: {
  elements: ElementSupport[];
  chargement: boolean;
  selection: string | null;
  onSelect: (el: ElementSupport) => void;
  recherche: string;
  onRecherche: (v: string) => void;
  filtre: "tous" | "message" | "ticket";
  onFiltre: (f: "tous" | "message" | "ticket") => void;
  compteurs: { tous: number; message: number; ticket: number };
}) {
  // Regroupement par jour : l'agent situe immédiatement ce qui est frais.
  const groupes = useMemo(() => {
    const map = new Map<string, ElementSupport[]>();
    elements.forEach((el) => {
      const d = new Date(el.date);
      const auj = new Date();
      let cle: string;
      if (d.toDateString() === auj.toDateString()) cle = "Aujourd'hui";
      else {
        const hier = new Date(auj);
        hier.setDate(hier.getDate() - 1);
        cle =
          d.toDateString() === hier.toDateString()
            ? "Hier"
            : d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
      }
      const liste = map.get(cle) ?? [];
      liste.push(el);
      map.set(cle, liste);
    });
    return Array.from(map.entries());
  }, [elements]);

  const ONGLETS: { cle: typeof filtre; libelle: string }[] = [
    { cle: "tous", libelle: "Tout" },
    { cle: "message", libelle: "Messages" },
    { cle: "ticket", libelle: "Tickets" },
  ];

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Recherche et bascule : la seule zone fixe, tout le reste défile */}
      <div className="shrink-0 px-3 pt-3 pb-2">
        <div className="relative">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
          />
          <input
            value={recherche}
            onChange={(e) => onRecherche(e.target.value)}
            placeholder="Rechercher un client, une référence"
            className="h-10 w-full rounded-xl bg-stone-100 pl-9 pr-3 text-sm text-stone-800 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F17922]/25"
          />
        </div>

        <div className="mt-2.5 flex gap-1">
          {ONGLETS.map((o) => {
            const actif = filtre === o.cle;
            const n = compteurs[o.cle];
            return (
              <button
                key={o.cle}
                type="button"
                onClick={() => onFiltre(o.cle)}
                className={`flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg text-[13px] font-medium transition-colors cursor-pointer ${
                  actif
                    ? "bg-stone-900 text-white"
                    : "text-stone-500 hover:bg-stone-100"
                }`}
              >
                {o.libelle}
                {n > 0 && (
                  <span
                    className={`text-[11px] font-semibold ${
                      actif ? "text-white/60" : "text-stone-400"
                    }`}
                  >
                    {n}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Pile */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {chargement ? (
          <div className="pt-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <LigneFantome key={i} />
            ))}
          </div>
        ) : elements.length === 0 ? (
          <Vide
            icone={<MessageSquare size={30} strokeWidth={1.5} />}
            titre={recherche ? "Rien ne correspond" : "Rien à traiter"}
            aide={recherche ? "Essayez un autre mot" : "Tout est à jour"}
          />
        ) : (
          groupes.map(([jour, lignes]) => (
            <section key={jour}>
              <h3 className="sticky top-0 z-10 bg-white/90 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-stone-400 backdrop-blur">
                {jour}
              </h3>
              {lignes.map((el) => {
                const actif = selection === el.id;
                const nonLu = el.nonLus > 0;
                const st = el.statut ? STATUT_LIBELLE[el.statut] : null;
                return (
                  <button
                    key={el.id}
                    type="button"
                    onClick={() => onSelect(el)}
                    className={`relative flex w-full items-start gap-3 px-4 py-3 text-left transition-colors cursor-pointer ${
                      actif ? "bg-stone-100" : "hover:bg-stone-50"
                    }`}
                  >
                    {/* Rail d'état : se lit sans être regardé */}
                    <span
                      className={`absolute left-0 top-2 bottom-2 w-[3px] rounded-r ${
                        nonLu
                          ? "bg-[#F17922]"
                          : actif
                            ? "bg-stone-300"
                            : "bg-transparent"
                      }`}
                    />

                    <Avatar name={el.nom} src={el.image} size={38} />

                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline gap-2">
                        <span
                          className={`truncate text-sm ${
                            nonLu
                              ? "font-semibold text-stone-900"
                              : "font-medium text-stone-700"
                          }`}
                        >
                          {el.nom}
                        </span>
                        <span className="ml-auto shrink-0 text-[11px] tabular-nums text-stone-400">
                          {heureCourte(el.date)}
                        </span>
                      </span>

                      <span className="mt-0.5 flex items-center gap-1.5">
                        {el.type === "ticket" ? (
                          <TicketCheck
                            size={13}
                            className="shrink-0 text-stone-400"
                          />
                        ) : (
                          <MessageSquare
                            size={13}
                            className="shrink-0 text-stone-300"
                          />
                        )}
                        <span
                          className={`truncate text-[13px] ${
                            nonLu ? "text-stone-700" : "text-stone-400"
                          }`}
                        >
                          {el.apercu || "Pièce jointe"}
                        </span>
                        {nonLu && (
                          <span className="ml-auto flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-[#F17922] px-1 text-[10px] font-bold text-white">
                            {el.nonLus > 9 ? "9+" : el.nonLus}
                          </span>
                        )}
                      </span>

                      {(st || el.urgent || el.code) && (
                        <span className="mt-1.5 flex flex-wrap items-center gap-1">
                          {el.code && (
                            <span className="font-mono text-[10px] text-stone-400">
                              {el.code}
                            </span>
                          )}
                          {st && <Puce ton={st.ton}>{st.texte}</Puce>}
                          {el.urgent && <Puce ton="urgent">Prioritaire</Puce>}
                          {el.agent && (
                            <span className="truncate text-[10px] text-stone-400">
                              {el.agent}
                            </span>
                          )}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </section>
          ))
        )}
      </div>
    </div>
  );
}
