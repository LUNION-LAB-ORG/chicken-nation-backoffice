"use client";

import React, { useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";

import { formatDelivererName } from "../../../courses/utils/course-labels";
import { BoutonDebloquer } from "../../../livreurs/components/BoutonDebloquer";
import { useMaintenant } from "../../../livreurs/hook/use-maintenant";
import {
  COULEURS_ETAT,
  appliActiveDe,
  appliEtatDe,
  choixAffectation,
  comparerPourAffectation,
} from "../../../livreurs/utils/disponibilite";
import type { Order } from "../../../orders/types/order.types";
import { useAffecterCommandeMutation } from "../../queries/gestes-commande.mutation";
import { useLivreursAffectationQuery } from "../../queries/livreurs-affectation.query";
import { peutRecevoirCommande, sousTitreAffectation } from "../../utils/affectation-commande";

interface Props {
  order: Order;
  onClose: () => void;
}

/**
 * « Affecter à un livreur » : les livreurs qui peuvent livrer la commande,
 * avec leur état. Ceux du restaurant, puis (10/11) ceux d'un autre restaurant
 * détectés près de lui ou déjà en course pour lui : leur seconde ligne dit
 * d'où ils viennent. Un livreur en course peut être choisi : la commande
 * rejoint sa course. Le refus du serveur est affiché tel quel, l'état est
 * relu toutes les 15 s.
 */
export const AffecterCommandeModal: React.FC<Props> = ({ order, onClose }) => {
  const [choisiId, setChoisiId] = useState<string | null>(null);
  const maintenant = useMaintenant(10 * 1000, true);
  const { data, isLoading } = useLivreursAffectationQuery(order.id);
  const affecter = useAffecterCommandeMutation();

  const lignes = useMemo(
    () =>
      (data?.items ?? [])
        .map((livreur) => {
          const etat = choixAffectation(
            livreur.disponibilite,
            order.id,
            maintenant,
            appliActiveDe(livreur),
            appliEtatDe(livreur),
          );
          const selectionnable = peutRecevoirCommande(livreur.disponibilite);
          const enCourse = livreur.disponibilite?.en_course === true;
          return {
            livreur,
            nom: formatDelivererName(livreur),
            choix: { ...etat, selectionnable },
            enCourse,
            sousTitre: sousTitreAffectation(livreur, enCourse),
          };
        })
        // À état égal, ceux du restaurant avant ceux d'ailleurs.
        .sort((a, b) =>
          a.choix.selectionnable === b.choix.selectionnable && a.choix.etat === b.choix.etat && !a.livreur.renfort !== !b.livreur.renfort
            ? a.livreur.renfort
              ? 1
              : -1
            : comparerPourAffectation(a, b),
        ),
    [data, order.id, maintenant],
  );

  // Un livreur choisi qui vient de passer en pause n'est plus choisi.
  const choisi = lignes.find((l) => l.livreur.id === choisiId && l.choix.selectionnable) ?? null;

  const confirmer = () => {
    if (!choisi) return;
    affecter.mutate({ orderId: order.id, delivererId: choisi.livreur.id }, { onSuccess: onClose });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Affecter à un livreur"
        className="bg-white rounded-2xl shadow-xl p-6 max-w-lg w-full max-h-[85vh] flex flex-col"
      >
        <h2 className="text-xl font-bold text-gray-900 mb-1">Affecter à un livreur</h2>
        <p className="text-sm text-gray-600 mb-3">{order.reference}</p>

        <div className="flex-1 overflow-y-auto border border-slate-200 rounded-lg">
          {isLoading ? (
            <p className="p-4 text-sm text-gray-500">Chargement des livreurs…</p>
          ) : lignes.length === 0 ? (
            <p className="p-4 text-sm text-gray-500">Aucun livreur actif rattaché à ce restaurant ni à proximité.</p>
          ) : (
            <ul>
              {lignes.map(({ livreur, nom, choix, sousTitre }) => {
                const couleurs = choix.etat ? COULEURS_ETAT[choix.etat] : null;
                const selectionne = choisi?.livreur.id === livreur.id;
                return (
                  <li key={livreur.id} className="flex items-center border-b last:border-b-0">
                    <button
                      type="button"
                      disabled={!choix.selectionnable}
                      aria-pressed={selectionne}
                      title={choix.selectionnable ? undefined : (choix.raison ?? undefined)}
                      onClick={() => {
                        setChoisiId(livreur.id);
                        affecter.reset();
                      }}
                      className={`min-w-0 flex-1 text-left px-4 py-3 transition flex items-center gap-3 ${
                        !choix.selectionnable
                          ? "bg-gray-50 cursor-not-allowed"
                          : selectionne
                            ? "bg-orange-50"
                            : "hover:bg-gray-50"
                      }`}
                    >
                      <div className={`flex-1 min-w-0 ${choix.selectionnable ? "" : "opacity-50"}`}>
                        <div className="text-sm font-medium text-gray-900 truncate">{nom}</div>
                        <div className="text-xs text-gray-500 truncate">{sousTitre}</div>
                      </div>
                      {choix.libelle && couleurs && (
                        <span
                          className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                          style={{ backgroundColor: couleurs.fond, color: couleurs.texte }}
                        >
                          {choix.libelle}
                        </span>
                      )}
                    </button>
                    {/* Pause automatique : « Débloquer » pour le siège (10/11), puis il devient choisissable. */}
                    {choix.etat === "PAUSE_AUTO" && <BoutonDebloquer livreurId={livreur.id} className="mr-3" />}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {affecter.error && (
          <div
            role="alert"
            className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{affecter.error.message}</span>
          </div>
        )}

        <div className="flex gap-3 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={confirmer}
            disabled={!choisi || affecter.isPending}
            className="flex-1 py-2.5 rounded-lg bg-[#F17922] text-white text-sm font-semibold disabled:opacity-50"
          >
            {affecter.isPending ? "Envoi…" : "Affecter"}
          </button>
        </div>
      </div>
    </div>
  );
};
