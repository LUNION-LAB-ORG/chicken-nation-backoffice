import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { KeyRound } from 'lucide-react';

import { useOuvrirCommande } from '../../../orders/hooks/useOuvrirCommande';
import { libelleAdresse } from '../../../orders/utils/adresse-commande';
import type { Delivery } from '../../types/course.types';
import { DELIVERY_FAILURE_LABELS, badgeReportee } from '../../utils/course-labels';
import { DeliveryStatutBadge } from '../DeliveryStatutBadge';

interface Props {
  deliveries: Delivery[];
}

/**
 * Liste des Deliveries d'une Course avec timeline + PIN + statut. La
 * référence de la commande mène à la page Commandes (à qui peut les lire) :
 * une livraison annulée par le livreur se reprend sur la commande (« Annuler
 * la commande », menu ⋮ du tiroir), pas sur la course.
 */
export function DeliveriesList({ deliveries }: Props) {
  const ouvrirCommande = useOuvrirCommande();
  const sorted = [...deliveries].sort((a, b) => a.sequence_order - b.sequence_order);

  if (sorted.length === 0) {
    return <p className="text-sm text-gray-400">Aucune livraison.</p>;
  }

  return (
    <div className="space-y-3">
      {sorted.map((delivery) => {
        const client = [delivery.order.customer?.first_name, delivery.order.customer?.last_name]
          .filter(Boolean)
          .join(' ')
          .trim() || delivery.order.fullname || null;
        const terminalDate = delivery.delivered_at ?? delivery.failed_at;
        // « Plus tard » (27/10) : à côté du statut, qui reste.
        const reportee = badgeReportee(delivery);
        return (
          <div
            key={delivery.id}
            className="border border-slate-200 rounded-lg p-3 bg-white"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  #{delivery.sequence_order} ·{' '}
                  {ouvrirCommande ? (
                    <button
                      type="button"
                      onClick={() => ouvrirCommande(delivery.order.reference)}
                      title="Voir le détail de la commande"
                      className="font-semibold text-gray-900 underline-offset-2 hover:text-[#F17922] hover:underline"
                    >
                      {delivery.order.reference}
                    </button>
                  ) : (
                    delivery.order.reference
                  )}
                </div>
                {client && <div className="text-xs text-gray-500">{client}</div>}
              </div>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                <DeliveryStatutBadge statut={delivery.statut} />
                {reportee && (
                  <span className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700">
                    {reportee}
                  </span>
                )}
              </div>
            </div>
            <div className="text-xs text-gray-600 space-y-0.5">
              {/* L'adresse arrive en texte JSON : `.address` lu tel quel affichait « — ». */}
              <div>📍 {libelleAdresse(delivery.order.address)}</div>
              <div>
                Frais : <strong>{delivery.order.delivery_fee.toLocaleString('fr-FR')} F</strong>
              </div>

              {/* Code de récupération : le CLIENT le donne au livreur pour
                  confirmer la remise. Affiché au staff (support : client qui
                  ne retrouve plus son code, litige) — jamais au livreur. */}
              {delivery.delivery_pin && (
                <div className="mt-1.5 inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5">
                  <KeyRound className="h-3.5 w-3.5 text-[#F17922]" />
                  <span className="text-[11px] text-gray-500">Code client</span>
                  <span className="font-mono text-sm font-bold tracking-[0.25em] text-gray-800">
                    {delivery.delivery_pin}
                  </span>
                </div>
              )}
              {terminalDate && (
                <div>
                  Terminée le {format(new Date(terminalDate), 'dd MMM yyyy HH:mm', { locale: fr })}
                </div>
              )}
              {delivery.failure_reason && (
                <div className="text-red-600 mt-1">
                  ⚠ {DELIVERY_FAILURE_LABELS[delivery.failure_reason]}
                  {delivery.failure_note ? ` : ${delivery.failure_note}` : ''}
                </div>
              )}

              {/* Sous-traitance Turbo : qui livre et comment le joindre.
                  Le staff doit savoir qu'un livreur EXTERNE va se présenter. */}
              {(delivery.turbo_course_id || delivery.turbo_courier_id) && (
                <div className="mt-2 rounded-md bg-[#FFF6E9] border border-[#F5D8AE] px-2.5 py-2">
                  <div className="font-semibold text-[#7A3502]">
                    🛵 Livreur externe Turbo
                  </div>
                  <div className="text-[#7A3502]">
                    {delivery.turbo_courier_name ?? 'Livreur non encore communiqué'}
                    {delivery.turbo_courier_phone ? ` · ${delivery.turbo_courier_phone}` : ''}
                  </div>
                  {delivery.turbo_courier_location_at && (
                    <div className="text-[#9796A1] mt-0.5">
                      Position reçue le{' '}
                      {format(new Date(delivery.turbo_courier_location_at), 'dd MMM HH:mm', {
                        locale: fr,
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
