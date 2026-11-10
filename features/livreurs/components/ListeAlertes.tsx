'use client';

import { useState } from 'react';

import type { GesteAlerte } from '../../courses/hooks/use-gestes-alerte';
import type { SignalLivraison } from '../../courses/types/tableau-livraison.types';
import { texteSignal } from '../../courses/utils/textes-signaux';
import {
  ALERTES_VISIBLES,
  confirmationCoursesAnciennes,
  libelleVoirPlus,
  texteCoursesAnciennes,
} from '../utils/groupes-en-direct';

/**
 * « À TRAITER » DE LA CARTE LIVE (conception du 24/10, 9.2 ; seul « À
 * traiter » depuis le 10/11) : les alertes du serveur (`signaux` de
 * `GET /livraison/tableau`) du restaurant choisi, rouges d'abord puis la plus
 * ancienne. Cinq lignes, puis « Voir les 3 autres ».
 *
 * Ligne : L1 point de couleur et phrase, L2 restaurant et course (le
 * restaurant part quand un seul est affiché), puis les gestes de l'ancien
 * « À traiter » de l'écran Courses quand l'alerte en a (`gestes`). Le toucher
 * est décidé par l'écran : livreur choisi sur la carte, sinon fiche de la course.
 *
 * Sous la liste, une seule ligne pour les courses restées ouvertes d'une
 * journée passée (`anciennes`), jamais une alerte ; l'administrateur les
 * ferme, après une question.
 */

export interface CoursesAnciennesProps {
  nombre: number;
  /** Administrateur seulement. */
  peutFermer: boolean;
  enCours: boolean;
  onFermer: () => void;
}

export interface ListeAlertesProps {
  /** Déjà filtrées et triées (`alertesEnDirect`) ; null pendant le premier chargement. */
  signaux: SignalLivraison[] | null;
  /** Noms des restaurants pour L2 ; null quand un seul restaurant est affiché. */
  nomsRestaurants: ReadonlyMap<string, string> | null;
  maintenant: Date;
  onToucher: (signal: SignalLivraison) => void;
  /** Boutons d'une alerte (Forcer, Turbo, Relancer, Sac rapporté) ; absent : aucun. */
  gestes?: (signal: SignalLivraison) => GesteAlerte[];
  anciennes?: CoursesAnciennesProps | null;
}

function Squelette() {
  return (
    <div aria-hidden>
      {[0, 1].map((i) => (
        <div key={i} className="flex h-12 items-start gap-2 px-3 py-2">
          <div className="mt-1.5 h-2 w-2 shrink-0 animate-pulse rounded-full bg-[#F4F4F5]" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="h-3 w-52 animate-pulse rounded-full bg-[#F4F4F5]" />
            <div className="h-2.5 w-32 animate-pulse rounded-full bg-[#F4F4F5]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function LigneAnciennes({ nombre, peutFermer, enCours, onFermer }: CoursesAnciennesProps) {
  const [question, setQuestion] = useState(false);
  const texte = texteCoursesAnciennes(nombre);
  if (!texte) return null;
  return (
    <div className="mx-3 mb-2 mt-1 rounded-lg bg-[#FAFAFA] px-3 py-2 text-xs text-[#52525B]">
      {question ? (
        <>
          <p>{confirmationCoursesAnciennes(nombre)}</p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              disabled={enCours}
              onClick={() => {
                onFermer();
                setQuestion(false);
              }}
              className="h-7 rounded-lg bg-[#F17922] px-3 font-semibold text-white hover:opacity-90 disabled:opacity-60"
            >
              {enCours ? 'Envoi…' : 'Fermer'}
            </button>
            <button
              type="button"
              onClick={() => setQuestion(false)}
              className="h-7 rounded-lg border border-[#E4E4E7] bg-white px-3 font-semibold text-[#18181B] hover:bg-[#F4F4F5]"
            >
              Annuler
            </button>
          </div>
        </>
      ) : (
        <div className="flex items-center gap-2">
          <span className="min-w-0 flex-1">{texte}</span>
          {peutFermer && (
            <button
              type="button"
              disabled={enCours}
              onClick={() => setQuestion(true)}
              className="h-7 shrink-0 rounded-lg border border-[#F17922] bg-white px-2.5 font-semibold text-[#F17922] hover:bg-orange-50 disabled:opacity-60"
            >
              {enCours ? 'Envoi…' : nombre === 1 ? 'La fermer' : 'Les fermer'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function ListeAlertes({ signaux, nomsRestaurants, maintenant, onToucher, gestes, anciennes }: ListeAlertesProps) {
  const [tout, setTout] = useState(false);

  const total = signaux?.length ?? 0;
  const visibles = signaux ? (tout ? signaux : signaux.slice(0, ALERTES_VISIBLES)) : [];
  const voirPlus = libelleVoirPlus(total, tout);

  return (
    <section className="pb-1">
      <h3 className="flex items-center gap-2 px-3 pb-1 pt-3 text-sm font-semibold text-[#18181B]">
        À traiter
        {total > 0 && (
          <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[11px] font-semibold leading-none text-red-700">
            {total}
          </span>
        )}
      </h3>

      {!signaux ? (
        <Squelette />
      ) : total === 0 ? (
        <p className="px-3 pb-2 text-sm text-[#A1A1AA]">Rien à signaler.</p>
      ) : (
        <ul>
          {visibles.map((s, i) => {
            const { titre, detail } = texteSignal(s, {
              restaurant: nomsRestaurants?.get(s.restaurant_id) ?? null,
              maintenant,
            });
            const rouge = s.gravite === 'rouge';
            const boutons = gestes ? gestes(s) : [];
            return (
              <li
                key={`${s.cle}-${s.course?.id ?? ''}-${s.livreur?.id ?? ''}-${i}`}
                className="px-3 py-2 transition-colors hover:bg-[#FAFAFA]"
              >
                <button type="button" onClick={() => onToucher(s)} className="flex w-full items-start gap-2 text-left">
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${rouge ? 'bg-red-600' : 'bg-amber-500'}`}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block truncate text-[13px] font-medium leading-4 ${rouge ? 'text-red-700' : 'text-amber-800'}`}
                      title={titre}
                    >
                      {titre}
                    </span>
                    <span className="mt-0.5 block h-4 truncate text-[11px] leading-4 text-[#71717A]" title={detail || undefined}>
                      {detail}
                    </span>
                  </span>
                </button>
                {boutons.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5 pl-4">
                    {boutons.map(({ cle, libelle, Icone, principal, occupe, desactive, agir }) => (
                      <button
                        key={cle}
                        type="button"
                        disabled={desactive}
                        onClick={agir}
                        className={`inline-flex h-7 items-center gap-1 rounded-lg px-2 text-[11px] font-semibold transition disabled:opacity-60 ${
                          principal
                            ? 'bg-[#F17922] text-white hover:opacity-90'
                            : 'border border-[#F17922] text-[#F17922] hover:bg-orange-50'
                        }`}
                      >
                        <Icone className={`h-3.5 w-3.5 ${occupe ? 'animate-spin' : ''}`} />
                        {libelle}
                      </button>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {voirPlus && (
        <button
          type="button"
          onClick={() => setTout((v) => !v)}
          className="w-full px-3 py-1.5 text-left text-xs font-semibold text-[#F17922] hover:bg-orange-50/40"
        >
          {voirPlus}
        </button>
      )}

      {anciennes && <LigneAnciennes {...anciennes} />}
    </section>
  );
}

export default ListeAlertes;
