import { DELIVERY_STATUT_CLASSES, DELIVERY_STATUT_LABELS } from '../utils/course-labels';
import type { DeliveryStatut } from '../types/course.types';

interface Props {
  statut: DeliveryStatut;
  size?: 'sm' | 'md';
}

/** Pastille colorée affichant le statut d'une Delivery. */
export function DeliveryStatutBadge({ statut, size = 'md' }: Props) {
  const sizeCls = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${sizeCls} ${DELIVERY_STATUT_CLASSES[statut]}`}>
      {DELIVERY_STATUT_LABELS[statut]}
    </span>
  );
}
