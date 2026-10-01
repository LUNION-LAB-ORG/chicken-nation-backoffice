import React from "react";
import { Levier } from "../../../types/analyse.type";
import { fmtNombre, fmtPct } from "../../../utils/crm-ui";

export interface EtapeBarre {
  libelle: string;
  nombre: number;
}

/** Part d'une étape dans la précédente, à une décimale ; vide sans base. */
const part = (n: number, base: number) => (base > 0 ? Math.round((n / base) * 1000) / 10 : null);

/**
 * Entonnoir en barres horizontales : chaque étape est proportionnelle à la
 * première, le nombre est à droite et, sous chaque nombre, la part de
 * l'étape précédente. Même lecture que l'entonnoir du PDF.
 */
export function EntonnoirBarres({ etapes, couleur, titre }: { etapes: EtapeBarre[]; couleur: string; titre?: string }) {
  const max = Math.max(1, ...etapes.map((e) => e.nombre));
  return (
    <div>
      {titre && <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">{titre}</p>}
      <ol className="space-y-2">
        {etapes.map((e, i) => {
          const p = i === 0 ? null : part(e.nombre, etapes[i - 1].nombre);
          return (
            <li key={e.libelle} className="grid grid-cols-[104px_minmax(0,1fr)_auto] items-center gap-3 sm:grid-cols-[132px_minmax(0,1fr)_auto]">
              {/* Sur téléphone le libellé passe sur deux lignes plutôt que d'être coupé : « Coupons envoyés » doit se lire. */}
              <span className="min-w-0 text-sm leading-tight text-gray-700 sm:truncate">{e.libelle}</span>
              <div className="h-6 overflow-hidden rounded-md bg-gray-100">
                <div
                  className="h-full rounded-md"
                  style={{
                    width: `${e.nombre > 0 ? Math.max(2, (e.nombre / max) * 100) : 0}%`,
                    backgroundColor: couleur,
                    opacity: 1 - i * 0.12,
                  }}
                />
              </div>
              <span className="w-20 text-right">
                <span className="block text-sm font-semibold tabular-nums text-gray-900">{fmtNombre(e.nombre)}</span>
                {p !== null && <span className="block text-[11px] tabular-nums text-gray-400">{fmtPct(p)}</span>}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** Les cinq étapes d'un levier, avec le mot de la première (« Captés », « Entrés en inactivité ») et de la dernière. */
export const etapesLevier = (l: Levier, entree: string, vente: string): EtapeBarre[] => [
  { libelle: entree, nombre: l.entres.valeur },
  { libelle: "Appelés", nombre: l.appeles.valeur },
  { libelle: "Joints", nombre: l.joints.valeur },
  { libelle: "Coupons envoyés", nombre: l.coupons.valeur },
  { libelle: vente, nombre: l.ventes.valeur },
];
