"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Lock, MessagesSquare, SendHorizonal } from "lucide-react";
import { Avatar, Vide, jourLisible } from "./primitives";

/**
 * Fil de discussion du poste de support.
 *
 * Deux partis pris qui font toute la différence de densité :
 *
 * 1. Les messages consécutifs d'un même auteur, à moins de cinq minutes
 *    d'écart, forment un bloc : un seul nom, un seul avatar, une seule heure.
 *    Un échange de dix répliques tient alors sur un écran au lieu de trois.
 * 2. L'en-tête tient sur une ligne. Les informations de contexte se lisent
 *    d'un regard au lieu d'occuper un panneau entier, comme c'était le cas
 *    avant avec quatre répétitions de la même donnée.
 */

export type MessageFil = {
  id: string;
  corps: string;
  date: string;
  /** null pour le client ou le livreur, l'agent sinon. */
  auteurAgent?: { nom: string; image?: string | null } | null;
  auteurExterne?: { nom: string; image?: string | null } | null;
  /** Note interne : visible du staff uniquement. */
  interne?: boolean;
  /** Message en cours d'envoi (affichage optimiste). */
  enCours?: boolean;
};

type Bloc = {
  cle: string;
  agent: boolean;
  nom: string;
  image?: string | null;
  interne: boolean;
  messages: MessageFil[];
};

export default function SupportThread({
  titre,
  sousTitre,
  avatar,
  messages,
  chargement,
  onRetour,
  onEnvoyer,
  envoiEnCours,
  actions,
  autoriserNoteInterne = false,
}: {
  titre: string;
  sousTitre?: React.ReactNode;
  avatar?: { nom: string; image?: string | null };
  messages: MessageFil[];
  chargement: boolean;
  onRetour: () => void;
  onEnvoyer: (corps: string, interne: boolean) => void | Promise<void>;
  envoiEnCours: boolean;
  /** Contrôles propres au type de fil, affichés dans l'en-tête. */
  actions?: React.ReactNode;
  autoriserNoteInterne?: boolean;
}) {
  const [saisie, setSaisie] = useState("");
  const [interne, setInterne] = useState(false);
  const finRef = useRef<HTMLDivElement>(null);
  const zoneRef = useRef<HTMLDivElement>(null);

  // Descendre au dernier message, sauf si l'agent est remonté lire l'historique.
  useEffect(() => {
    const zone = zoneRef.current;
    if (!zone) return;
    const proche =
      zone.scrollHeight - zone.scrollTop - zone.clientHeight < 200;
    if (proche) finRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  // Regroupement par auteur puis par proximité dans le temps.
  const blocs = useMemo<Bloc[]>(() => {
    const out: Bloc[] = [];
    messages.forEach((m) => {
      const agent = !!m.auteurAgent;
      const nom = m.auteurAgent?.nom ?? m.auteurExterne?.nom ?? "Client";
      const image = m.auteurAgent?.image ?? m.auteurExterne?.image ?? null;
      const dernier = out[out.length - 1];
      const memeAuteur =
        dernier &&
        dernier.agent === agent &&
        dernier.nom === nom &&
        dernier.interne === !!m.interne;
      const proche =
        dernier &&
        new Date(m.date).getTime() -
          new Date(dernier.messages[dernier.messages.length - 1].date).getTime() <
          5 * 60 * 1000;
      if (memeAuteur && proche) {
        dernier.messages.push(m);
      } else {
        out.push({
          cle: m.id,
          agent,
          nom,
          image,
          interne: !!m.interne,
          messages: [m],
        });
      }
    });
    return out;
  }, [messages]);

  const envoyer = async () => {
    const corps = saisie.trim();
    if (!corps || envoiEnCours) return;
    setSaisie("");
    await onEnvoyer(corps, interne);
  };

  return (
    <div className="flex h-full min-w-0 flex-col bg-stone-50">
      {/* En-tête : une ligne, pas un panneau */}
      <header className="flex shrink-0 items-center gap-3 border-b border-stone-200 bg-white px-3 py-2.5 sm:px-4">
        <button
          type="button"
          onClick={onRetour}
          className="-ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100 lg:hidden cursor-pointer"
          aria-label="Revenir à la liste"
        >
          <ArrowLeft size={18} />
        </button>

        {avatar && <Avatar name={avatar.nom} src={avatar.image} size={38} />}

        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[15px] font-semibold text-stone-900">
            {titre}
          </h2>
          {sousTitre && (
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-500">
              {sousTitre}
            </div>
          )}
        </div>

        {actions && (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </header>

      {/* Fil */}
      <div
        ref={zoneRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-6"
      >
        {chargement ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className={`flex ${i % 2 ? "justify-end" : "justify-start"}`}
              >
                <div className="h-14 w-2/3 max-w-md animate-pulse rounded-2xl bg-stone-200/70" />
              </div>
            ))}
          </div>
        ) : blocs.length === 0 ? (
          <Vide
            icone={<MessagesSquare size={30} strokeWidth={1.5} />}
            titre="Aucun message"
            aide="Écrivez le premier message ci-dessous"
          />
        ) : (
          <div className="mx-auto max-w-3xl space-y-1">
            {blocs.map((bloc, i) => {
              const jourPrecedent =
                i > 0
                  ? new Date(
                      blocs[i - 1].messages[0].date
                    ).toDateString()
                  : null;
              const jourCourant = new Date(bloc.messages[0].date).toDateString();
              const nouveauJour = jourPrecedent !== jourCourant;

              return (
                <React.Fragment key={bloc.cle}>
                  {nouveauJour && (
                    <div className="flex items-center gap-3 py-4">
                      <span className="h-px flex-1 bg-stone-200" />
                      <span className="text-[11px] font-medium uppercase tracking-wide text-stone-400">
                        {jourLisible(bloc.messages[0].date)}
                      </span>
                      <span className="h-px flex-1 bg-stone-200" />
                    </div>
                  )}

                  <div
                    className={`flex gap-2.5 pt-3 ${
                      bloc.agent ? "flex-row-reverse" : ""
                    }`}
                  >
                    <Avatar name={bloc.nom} src={bloc.image} size={30} />

                    <div
                      className={`flex min-w-0 max-w-[min(78%,42rem)] flex-col gap-1 ${
                        bloc.agent ? "items-end" : "items-start"
                      }`}
                    >
                      <span className="px-1 text-[11px] font-medium text-stone-500">
                        {bloc.nom}
                        <span className="ml-1.5 font-normal tabular-nums text-stone-400">
                          {new Date(
                            bloc.messages[0].date
                          ).toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {bloc.interne && (
                          <span className="ml-1.5 inline-flex items-center gap-0.5 text-amber-600">
                            <Lock size={10} /> note interne
                          </span>
                        )}
                      </span>

                      {bloc.messages.map((m) => (
                        <div
                          key={m.id}
                          className={`w-fit max-w-full whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-[14px] leading-relaxed transition-opacity ${
                            m.enCours ? "opacity-50" : ""
                          } ${
                            bloc.interne
                              ? "border border-amber-200 bg-amber-50 text-amber-900"
                              : bloc.agent
                                ? "bg-[#F17922] text-white"
                                : "border border-stone-200 bg-white text-stone-800"
                          }`}
                        >
                          {m.corps}
                        </div>
                      ))}
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
            <div ref={finRef} />
          </div>
        )}
      </div>

      {/* Zone de réponse */}
      <footer className="shrink-0 border-t border-stone-200 bg-white px-3 py-3 sm:px-6">
        <div className="mx-auto max-w-3xl">
          {autoriserNoteInterne && (
            <div className="mb-2 flex gap-1">
              <button
                type="button"
                onClick={() => setInterne(false)}
                className={`h-7 rounded-md px-2.5 text-xs font-medium transition-colors cursor-pointer ${
                  !interne
                    ? "bg-stone-900 text-white"
                    : "text-stone-500 hover:bg-stone-100"
                }`}
              >
                Réponse au client
              </button>
              <button
                type="button"
                onClick={() => setInterne(true)}
                className={`inline-flex h-7 items-center gap-1 rounded-md px-2.5 text-xs font-medium transition-colors cursor-pointer ${
                  interne
                    ? "bg-amber-500 text-white"
                    : "text-stone-500 hover:bg-stone-100"
                }`}
              >
                <Lock size={11} /> Note interne
              </button>
            </div>
          )}

          <div
            className={`flex items-end gap-2 rounded-2xl border px-3 py-2 transition-colors ${
              interne
                ? "border-amber-300 bg-amber-50/60"
                : "border-stone-200 bg-stone-50 focus-within:border-[#F17922]/40 focus-within:bg-white"
            }`}
          >
            <textarea
              value={saisie}
              onChange={(e) => setSaisie(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  envoyer();
                }
              }}
              rows={1}
              placeholder={
                interne ? "Note visible par l'équipe" : "Écrire un message"
              }
              className="max-h-40 min-h-[24px] flex-1 resize-none bg-transparent text-[14px] leading-6 text-stone-800 placeholder:text-stone-400 focus:outline-none"
              style={{
                height: "auto",
              }}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
              }}
            />
            <button
              type="button"
              onClick={envoyer}
              disabled={!saisie.trim() || envoiEnCours}
              className={`mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
                saisie.trim() && !envoiEnCours
                  ? "bg-[#F17922] text-white hover:bg-[#d96a1b] cursor-pointer"
                  : "bg-stone-200 text-stone-400"
              }`}
              aria-label="Envoyer"
            >
              <SendHorizonal size={17} />
            </button>
          </div>

          <p className="mt-1.5 px-1 text-[11px] text-stone-400">
            Entrée pour envoyer, Maj et Entrée pour aller à la ligne
          </p>
        </div>
      </footer>
    </div>
  );
}
