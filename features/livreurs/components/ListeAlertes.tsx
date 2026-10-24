'use client';

import { useState } from 'react';

import type { SignalLivraison } from '../../courses/types/tableau-livraison.types';
import { texteSignal } from '../../courses/utils/textes-signaux';
import { ALERTES_VISIBLES, libelleVoirPlus } from '../utils/groupes-en-direct';

/**
 * « À SURVEILLER » D'EN DIRECT (conception du 24/10, 9.2) : les alertes du
 * serveur (`signaux` de `GET /livraison/tableau`) du restaurant choisi,
 * rouges d'abord puis la plus ancienne. Cinq lignes, puis « Voir les 3
 * autres ».
 *
 * Ligne de hauteur fixe : L1 point de couleur et phrase, L2 restaurant et
 * course (le restaurant part quand un seul est affiché). Le toucher est
 * décidé par l'écran : livreur choisi sur la carte, sinon fiche de la course.
 */

export interface ListeAlertesProps {
  /** Déjà filtrées et triées (`alertesEnDirect`) ; null pendant le premier chargement. */
  signaux: SignalLivraison[] | null;
  /** Noms des restaurants pour L2 ; null quand un seul restaurant est affiché. */
  nomsRestaurants: ReadonlyMap<string, string> | null;
  maintenant: Date;
  onToucher: (signal: SignalLivraison) => void;
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

export function ListeAlertes({ signaux, nomsRestaurants, maintenant, onToucher }: ListeAlertesProps) {
  const [tout, setTout] = useState(false);

  const total = signaux?.length ?? 0;
  const visibles = signaux ? (tout ? signaux : signaux.slice(0, ALERTES_VISIBLES)) : [];
  const voirPlus = libelleVoirPlus(total, tout);

  return (
    <section className="pb-1">
      <h3 className="flex items-center gap-2 px-3 pb-1 pt-3 text-sm font-semibold text-[#18181B]">
        À surveiller
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
            return (
              <li key={`${s.cle}-${s.course?.id ?? ''}-${s.livreur?.id ?? ''}-${i}`}>
                <button
                  type="button"
                  onClick={() => onToucher(s)}
                  className="flex h-12 w-full items-start gap-2 px-3 py-2 text-left transition-colors hover:bg-[#FAFAFA]"
                >
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
    </section>
  );
}

export default ListeAlertes;
