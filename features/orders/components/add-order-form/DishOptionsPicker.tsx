"use client";

import React from "react";
import { AlertCircle, Check, RotateCw } from "lucide-react";
import { DishOptionGroup } from "../../../menus/types/dish-option.types";
import {
  basculerChoix,
  choixDuGroupe,
  consigneGroupe,
} from "../../utils/dishOptions";

/**
 * MENUS COMPOSABLES — composition d'un plat pendant la prise de commande.
 *
 * L'opérateur répond aux questions du plat pour le compte de son client : quelle
 * sauce, quel format. Il ne configure rien, il choisit.
 *
 * Les groupes restent toujours dépliés : ce sont des questions souvent
 * obligatoires, les replier cacherait à l'opérateur ce qui l'empêche de valider.
 */
export default function DishOptionsPicker({
  groups,
  selection,
  onChange,
  chargement,
  erreur,
  onReessayer,
}: {
  groups: DishOptionGroup[];
  selection: string[];
  onChange: (ids: string[]) => void;
  chargement: boolean;
  erreur: string | null;
  onReessayer: () => void;
}) {
  if (chargement) {
    return (
      <div className="mb-4 space-y-3">
        <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
        <div className="h-24 animate-pulse rounded-xl bg-gray-100" />
      </div>
    );
  }

  if (erreur) {
    return (
      <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4">
        <p className="flex items-center gap-2 text-[13px] font-semibold text-red-600">
          <AlertCircle size={15} /> Options du plat indisponibles
        </p>
        <p className="mt-1 text-[12px] text-red-500">{erreur}</p>
        <button
          type="button"
          onClick={onReessayer}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[12px] font-semibold text-red-600 hover:bg-red-100 cursor-pointer"
        >
          <RotateCw size={13} /> Réessayer
        </button>
      </div>
    );
  }

  if (groups.length === 0) return null;

  return (
    <div className="mb-5 space-y-4">
      <label className="block text-sm font-semibold text-[#595959]">
        Composer le plat
      </label>

      {[...groups]
        .sort((a, b) => a.position - b.position)
        .map((groupe) => {
          const idsGroupe = new Set(groupe.items.map((i) => i.id));
          const retenus = selection.filter((id) => idsGroupe.has(id));
          const complet = retenus.length >= groupe.max_select;
          const incomplet = retenus.length < groupe.min_select;
          const exclusif = groupe.max_select === 1;

          return (
            <div
              key={groupe.id}
              className="rounded-xl border border-gray-200 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-gray-800">
                    {groupe.name}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#9796A1]">
                    {groupe.description || consigneGroupe(groupe)}
                  </p>
                </div>
                {incomplet ? (
                  <span className="shrink-0 rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-semibold text-[#F17922]">
                    À choisir
                  </span>
                ) : (
                  <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-500">
                    {retenus.length}/{groupe.max_select}
                  </span>
                )}
              </div>

              <div className="mt-3 space-y-1">
                {choixDuGroupe(groupe).map((item) => {
                  const choisi = retenus.includes(item.id);
                  const epuise = !item.available;
                  // Plafond atteint : les choix restants se grisent, plutôt que
                  // de laisser un clic sans effet visible.
                  const bloque = epuise || (!choisi && complet && !exclusif);

                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={bloque}
                      onClick={() =>
                        onChange(basculerChoix(groups, selection, item.id))
                      }
                      title={
                        epuise
                          ? "Ce choix n'est plus disponible"
                          : bloque
                            ? "Nombre maximum de choix atteint"
                            : undefined
                      }
                      className={`flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left transition-colors ${
                        bloque
                          ? "cursor-not-allowed opacity-40"
                          : "cursor-pointer hover:bg-gray-50"
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-2.5">
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center border-2 ${
                            exclusif ? "rounded-full" : "rounded"
                          } ${
                            choisi
                              ? "border-[#F17922] bg-[#F17922]"
                              : "border-gray-300"
                          }`}
                        >
                          {choisi &&
                            (exclusif ? (
                              <span className="h-1.5 w-1.5 rounded-full bg-white" />
                            ) : (
                              <Check size={10} strokeWidth={4} color="#ffffff" />
                            ))}
                        </span>
                        <span className="truncate text-[13px] text-gray-700">
                          {item.label}
                          {epuise && (
                            <span className="ml-1.5 text-[11px] text-gray-400">
                              épuisé
                            </span>
                          )}
                        </span>
                      </span>

                      {/* Un choix inclus n'affiche rien, surtout pas « + 0 ». */}
                      {item.price_delta > 0 && (
                        <span className="shrink-0 text-[12px] font-semibold text-[#F17922]">
                          + {item.price_delta.toLocaleString("fr-FR")} XOF
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
    </div>
  );
}
