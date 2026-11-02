import React from "react";
import { useDashboardStore } from "@/store/dashboardStore";
import { fmtMontant, STATUT_COMMANDE } from "../../../crm/utils/crm-ui";
import type { StatutCommande } from "../../../crm/types/campagne.type";
import { libelleCanal } from "../../../orders/utils/canal-commande";
import { ouvrirCommandeParReference } from "../../../orders/utils/ouvrir-commande";
import { nomCourtRestaurant } from "../../../restaurants/utils/nom-court";
import { useCommandeAvisMutation } from "../../queries/avis-prive.mutation";
import type { AvisFiche, CommandeRecente } from "../../types/avis-prive.types";
import { corpsCommande, formatRecu } from "../../utils/avis-prive";
import { Carte } from "./Elements";

/** « Yopougon · Manuel · Gbonhi Max · Terminée » */
function detail(c: CommandeRecente): string {
  return [
    nomCourtRestaurant(c.restaurant?.name),
    libelleCanal(c),
    c.plats.join(", "),
    STATUT_COMMANDE[c.status as StatutCommande] ?? c.status,
  ]
    .filter(Boolean)
    .join(" · ");
}

/**
 * Dernières commandes du client rapproché. Qui traite coche celle que l'avis
 * concerne (elle part dans le ticket d'un incident) ; les autres lisent. La
 * référence ouvre la commande. Absent pour le marketing (`null`).
 */
export function DernieresCommandes({
  avis,
  peutTraiter,
  peutVoirCommandes,
}: {
  avis: AvisFiche;
  peutTraiter: boolean;
  peutVoirCommandes: boolean;
}) {
  const setFilter = useDashboardStore((s) => s.setFilter);
  const setActiveTab = useDashboardStore((s) => s.setActiveTab);
  const mutation = useCommandeAvisMutation();

  if (avis.dernieres_commandes === null) return null;
  const commandes = avis.dernieres_commandes;

  const cocher = (orderId: string | null) => mutation.mutate({ id: avis.id, valeur: corpsCommande(avis, orderId) });

  return (
    <Carte
      titre="Dernières commandes"
      droite={
        peutTraiter && avis.order_id ? (
          <button
            type="button"
            onClick={() => cocher(null)}
            disabled={mutation.isPending}
            className="text-xs font-semibold text-gray-500 hover:text-[#F17922] disabled:opacity-50"
          >
            Décocher
          </button>
        ) : undefined
      }
    >
      {!avis.rapproche ? (
        <p className="text-sm text-gray-500">Aucun compte client avec ce numéro.</p>
      ) : commandes.length === 0 ? (
        <p className="text-sm text-gray-500">Aucune commande.</p>
      ) : (
        <>
          {peutTraiter && <p className="text-xs text-gray-500">Cocher la commande concernée par l&apos;avis.</p>}
          <div role="radiogroup" aria-label="Commande concernée par l'avis">
            {commandes.map((c) => (
              <div key={c.id} className="flex min-h-11 items-start gap-3 border-t border-slate-100 py-2.5">
                <input
                  type="radio"
                  name={`commande-${avis.id}`}
                  checked={avis.order_id === c.id}
                  onChange={() => cocher(c.id)}
                  disabled={!peutTraiter || mutation.isPending}
                  aria-label={`Commande ${c.reference}`}
                  className="mt-0.5 h-[18px] w-[18px] shrink-0 accent-[#F17922] disabled:cursor-not-allowed"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-gray-900">
                    {peutVoirCommandes ? (
                      <button
                        type="button"
                        onClick={() => ouvrirCommandeParReference(c.reference, { setFilter, setActiveTab })}
                        className="hover:text-[#F17922] hover:underline"
                      >
                        {c.reference}
                      </button>
                    ) : (
                      c.reference
                    )}{" "}
                    · {formatRecu(c.created_at)}
                  </div>
                  <div className="text-[13px] text-gray-600">{detail(c)}</div>
                </div>
                <div className="whitespace-nowrap text-sm font-semibold text-gray-900">{fmtMontant(c.amount)}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </Carte>
  );
}
