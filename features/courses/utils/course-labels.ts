import type { CourseStatut, DeliveryStatut, DeliveryFailureReason, CourseOfferStatus } from '../types/course.types';

export const COURSE_STATUT_LABELS: Record<CourseStatut, string> = {
  PENDING_ASSIGNMENT: 'En attente d\'affectation',
  ACCEPTED: 'Acceptée',
  AT_RESTAURANT: 'Au restaurant',
  IN_DELIVERY: 'En livraison',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
  EXPIRED: 'Expirée',
};

/** Classes Tailwind (couleurs) pour l'UI des badges Course */
export const COURSE_STATUT_CLASSES: Record<CourseStatut, string> = {
  PENDING_ASSIGNMENT: 'bg-amber-100 text-amber-800',
  ACCEPTED: 'bg-blue-100 text-blue-800',
  AT_RESTAURANT: 'bg-indigo-100 text-indigo-800',
  IN_DELIVERY: 'bg-purple-100 text-purple-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  EXPIRED: 'bg-gray-200 text-gray-700',
};

export const DELIVERY_STATUT_LABELS: Record<DeliveryStatut, string> = {
  PENDING: 'En attente',
  IN_ROUTE: 'En route',
  ARRIVED: 'Arrivé',
  DELIVERED: 'Livrée',
  FAILED: 'Échec',
  CANCELLED: 'Annulée',
};

export const DELIVERY_STATUT_CLASSES: Record<DeliveryStatut, string> = {
  PENDING: 'bg-gray-100 text-gray-700',
  IN_ROUTE: 'bg-blue-100 text-blue-800',
  ARRIVED: 'bg-indigo-100 text-indigo-800',
  DELIVERED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-200 text-gray-700',
};

export const DELIVERY_FAILURE_LABELS: Record<DeliveryFailureReason, string> = {
  CLIENT_ABSENT: 'Client absent',
  CLIENT_REFUSED: 'Client a refusé',
  ADDRESS_NOT_FOUND: 'Adresse introuvable',
  CLIENT_UNREACHABLE: 'Client injoignable',
  WRONG_ORDER: 'Mauvaise commande',
  OTHER: 'Autre',
};

export const OFFER_STATUS_LABELS: Record<CourseOfferStatus, string> = {
  PENDING: 'Envoyée',
  ACCEPTED: 'Acceptée',
  REFUSED: 'Refusée',
  EXPIRED: 'Expirée',
};

export const OFFER_STATUS_CLASSES: Record<CourseOfferStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  REFUSED: 'bg-red-100 text-red-800',
  EXPIRED: 'bg-gray-200 text-gray-700',
};

export const formatDelivererName = (d?: { first_name?: string | null; last_name?: string | null; phone?: string | null } | null): string => {
  if (!d) return '—';
  const name = [d.first_name, d.last_name].filter(Boolean).join(' ').trim();
  return name || d.phone || '—';
};
