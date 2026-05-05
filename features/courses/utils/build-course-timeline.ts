import type { CourseWithAttempts } from '../types/course.types';

export type CourseTimelineEventKind =
  | 'created'
  | 'offer_sent'
  | 'offer_refused'
  | 'offer_expired'
  | 'offer_accepted'
  | 'at_restaurant'
  | 'picked_up'
  | 'delivery_in_route'
  | 'delivery_arrived'
  | 'delivery_delivered'
  | 'delivery_failed'
  | 'completed'
  | 'cancelled';

export interface ICourseTimelineEvent {
  kind: CourseTimelineEventKind;
  at: string; // ISO
  title: string;
  subtitle?: string;
}

/** Helpers pour extraire un nom lisible d'un deliverer */
function delivererName(d?: { first_name?: string | null; last_name?: string | null; phone?: string | null } | null): string {
  if (!d) return 'livreur inconnu';
  return [d.first_name, d.last_name].filter(Boolean).join(' ').trim() || d.phone || 'livreur';
}

/**
 * Reconstitue la timeline complète de la vie de la course (création → terminal)
 * en croisant Course + Deliveries + CourseOfferAttempt. Triée chronologiquement ASC.
 */
export function buildCourseTimeline(course: CourseWithAttempts): ICourseTimelineEvent[] {
  const events: ICourseTimelineEvent[] = [];

  // 1. Création
  events.push({
    kind: 'created',
    at: course.created_at,
    title: 'Course créée',
    subtitle: `Référence ${course.reference} · ${course.deliveries.length} livraison${course.deliveries.length > 1 ? 's' : ''}`,
  });

  // 2. Tentatives d'affectation
  for (const att of course.offer_attempts) {
    events.push({
      kind: 'offer_sent',
      at: att.offered_at,
      title: `Offre envoyée à ${delivererName(att.deliverer)}`,
      subtitle: att.deliverer.reference,
    });

    if (att.responded_at) {
      if (att.status === 'REFUSED') {
        events.push({
          kind: 'offer_refused',
          at: att.responded_at,
          title: `Refusée par ${delivererName(att.deliverer)}`,
          subtitle: att.refusal_reason ?? undefined,
        });
      } else if (att.status === 'EXPIRED') {
        events.push({
          kind: 'offer_expired',
          at: att.responded_at,
          title: `Offre expirée (${delivererName(att.deliverer)})`,
          subtitle: 'Pas de réponse dans le délai imparti',
        });
      } else if (att.status === 'ACCEPTED') {
        events.push({
          kind: 'offer_accepted',
          at: att.responded_at,
          title: `Acceptée par ${delivererName(att.deliverer)}`,
        });
      }
    }
  }

  // 3. Transitions Course
  if (course.at_restaurant_at) {
    events.push({
      kind: 'at_restaurant',
      at: course.at_restaurant_at,
      title: 'Livreur arrivé au restaurant',
      subtitle: 'Détecté via GPS (< 200m)',
    });
  }
  if (course.picked_up_at) {
    events.push({
      kind: 'picked_up',
      at: course.picked_up_at,
      title: 'Récupération validée par la caissière',
      subtitle: `Code retrait ${course.pickup_code}`,
    });
  }

  // 4. Events Delivery
  for (const d of course.deliveries) {
    if (d.in_route_at) {
      events.push({
        kind: 'delivery_in_route',
        at: d.in_route_at,
        title: `Livraison #${d.sequence_order} démarrée`,
        subtitle: d.order.reference,
      });
    }
    if (d.arrived_at) {
      events.push({
        kind: 'delivery_arrived',
        at: d.arrived_at,
        title: `Arrivée chez le client #${d.sequence_order}`,
        subtitle: d.order.reference,
      });
    }
    if (d.delivered_at) {
      events.push({
        kind: 'delivery_delivered',
        at: d.delivered_at,
        title: `Livraison #${d.sequence_order} confirmée`,
        subtitle: `PIN validé · ${d.order.reference}`,
      });
    }
    if (d.failed_at) {
      events.push({
        kind: 'delivery_failed',
        at: d.failed_at,
        title: `Livraison #${d.sequence_order} échouée`,
        subtitle: d.failure_reason ?? undefined,
      });
    }
  }

  // 5. Terminal
  if (course.completed_at) {
    events.push({
      kind: 'completed',
      at: course.completed_at,
      title: 'Course terminée',
    });
  }
  if (course.cancelled_at) {
    events.push({
      kind: 'cancelled',
      at: course.cancelled_at,
      title: `Course annulée${course.cancelled_by ? ` par ${course.cancelled_by}` : ''}`,
      subtitle: course.cancelled_reason ?? undefined,
    });
  }

  return events.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
}
