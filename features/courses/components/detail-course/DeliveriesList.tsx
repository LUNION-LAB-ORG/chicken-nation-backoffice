import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import type { Delivery } from '../../types/course.types';
import { DELIVERY_FAILURE_LABELS } from '../../utils/course-labels';
import { DeliveryStatutBadge } from '../DeliveryStatutBadge';

interface Props {
  deliveries: Delivery[];
}

/** Liste des Deliveries d'une Course avec timeline + PIN + statut. */
export function DeliveriesList({ deliveries }: Props) {
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
          .trim() || delivery.order.fullname || '—';
        const terminalDate = delivery.delivered_at ?? delivery.failed_at;
        return (
          <div
            key={delivery.id}
            className="border border-slate-200 rounded-lg p-3 bg-white"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  #{delivery.sequence_order} — {delivery.order.reference}
                </div>
                <div className="text-xs text-gray-500">{client}</div>
              </div>
              <DeliveryStatutBadge statut={delivery.statut} />
            </div>
            <div className="text-xs text-gray-600 space-y-0.5">
              <div>📍 {delivery.order.address?.address ?? '—'}</div>
              <div>
                Frais : <strong>{delivery.order.delivery_fee.toLocaleString('fr-FR')} F</strong>
              </div>
              {terminalDate && (
                <div>
                  Terminée le {format(new Date(terminalDate), 'dd MMM yyyy HH:mm', { locale: fr })}
                </div>
              )}
              {delivery.failure_reason && (
                <div className="text-red-600 mt-1">
                  ⚠ {DELIVERY_FAILURE_LABELS[delivery.failure_reason]}
                  {delivery.failure_note ? ` — ${delivery.failure_note}` : ''}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
