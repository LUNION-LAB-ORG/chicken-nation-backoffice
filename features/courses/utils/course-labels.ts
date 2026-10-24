import type { Course, CourseStatut, DeliveryStatut, DeliveryFailureReason, CourseOfferStatus } from '../types/course.types';

/** Mots de la conception du 24/10 (3.3) : « Recherche d'un livreur », « Aucun livreur trouvé ». */
export const COURSE_STATUT_LABELS: Record<CourseStatut, string> = {
  PENDING_ASSIGNMENT: "Recherche d'un livreur",
  ACCEPTED: 'Vers le restaurant',
  AT_RESTAURANT: 'Au restaurant',
  IN_DELIVERY: 'En livraison',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
  EXPIRED: 'Aucun livreur trouvé',
};

/**
 * Classes Tailwind (couleurs) pour l'UI des badges Course, alignées sur l'état
 * d'une course de l'écran Commandes : ambre en recherche, bleu en route, vert
 * au restaurant, gris terminée, rouge en cas de problème.
 */
export const COURSE_STATUT_CLASSES: Record<CourseStatut, string> = {
  PENDING_ASSIGNMENT: 'bg-amber-100 text-amber-800',
  ACCEPTED: 'bg-blue-100 text-blue-800',
  AT_RESTAURANT: 'bg-green-100 text-green-800',
  IN_DELIVERY: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-gray-100 text-gray-700',
  CANCELLED: 'bg-red-100 text-red-800',
  EXPIRED: 'bg-red-100 text-red-800',
};

export const DELIVERY_STATUT_LABELS: Record<DeliveryStatut, string> = {
  PENDING: 'À livrer',
  IN_ROUTE: 'En route',
  ARRIVED: 'Chez le client',
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
  CANCELLED: 'Retirée',
};

export const OFFER_STATUS_CLASSES: Record<CourseOfferStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  REFUSED: 'bg-red-100 text-red-800',
  EXPIRED: 'bg-gray-200 text-gray-700',
  CANCELLED: 'bg-slate-100 text-slate-600',
};

export const formatDelivererName = (d?: { first_name?: string | null; last_name?: string | null; phone?: string | null } | null): string => {
  if (!d) return '—';
  const name = [d.first_name, d.last_name].filter(Boolean).join(' ').trim();
  return name || d.phone || '—';
};

// ============================================================
// DURÉE D'UNE COURSE (colonne « Durée » du tableau)
// ============================================================

export interface DureeCourse {
  /** « 31 min », « 1 h 05 » ; vide quand la course n'est pas partie. */
  texte: string;
  /** Tournée signalée en retard par le serveur (`delay_alerted_at`). */
  enRetard: boolean;
}

const minutesEntre = (debut: string, fin: number): number | null => {
  const t = Date.parse(debut);
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.floor((fin - t) / 60_000));
};

const lisible = (m: number): string => (m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}`);

/**
 * Terminée : du départ (récupération) à la dernière livraison. En
 * livraison : temps écoulé depuis le départ, et « En retard » quand le
 * serveur l'a signalé. Sinon vide.
 */
export function dureeCourse(
  course: Pick<Course, 'statut' | 'picked_up_at' | 'completed_at' | 'delay_alerted_at'>,
  maintenant: Date,
): DureeCourse {
  const vide: DureeCourse = { texte: '', enRetard: false };
  if (!course.picked_up_at) return vide;
  if (course.statut === 'COMPLETED' && course.completed_at) {
    const fin = Date.parse(course.completed_at);
    const m = Number.isNaN(fin) ? null : minutesEntre(course.picked_up_at, fin);
    return m === null ? vide : { texte: lisible(m), enRetard: false };
  }
  if (course.statut === 'IN_DELIVERY') {
    const m = minutesEntre(course.picked_up_at, maintenant.getTime());
    return m === null ? vide : { texte: lisible(m), enRetard: !!course.delay_alerted_at };
  }
  return vide;
}
