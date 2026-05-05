import type { VehiculeType } from "./livreur.types";

export type CourseStatut =
  | "PENDING_ASSIGNMENT"
  | "ACCEPTED"
  | "AT_RESTAURANT"
  | "IN_DELIVERY"
  | "COMPLETED"
  | "CANCELLED"
  | "EXPIRED";

export type DeliveryStatut =
  | "PENDING"
  | "IN_ROUTE"
  | "ARRIVED"
  | "DELIVERED"
  | "FAILED"
  | "CANCELLED";

/** Disponibilité dérivée côté backend à partir du state courant du livreur. */
export type IDelivererAvailability =
  | "available" // en queue, prêt
  | "paused" // pause manuelle
  | "auto_paused" // pause forcée (3 refus en 15 min)
  | "in_course" // a une course active
  | "offline"; // connecté mais pas encore dispo

export interface IDelivererLiveDelivery {
  id: string;
  statut: DeliveryStatut;
  sequence_order: number;
  order_reference: string | null;
  /** JSON string de `{ address, latitude, longitude, ... }` */
  address: string | null;
}

export interface IDelivererLiveCourse {
  id: string;
  reference: string;
  statut: CourseStatut;
  assigned_at: string | null;
  deliveries: IDelivererLiveDelivery[];
}

export interface IDelivererLive {
  id: string;
  first_name: string | null;
  last_name: string | null;
  image: string | null;
  type_vehicule: VehiculeType | null;
  restaurant: { id: string; name: string } | null;
  /** `{ lat, lng }` ou null si pas encore remonté */
  location: { lat: number; lng: number } | null;
  location_at: string | null;
  /** `true` si le GPS est plus récent que `deliverer.gps_expiration_minutes` */
  location_fresh: boolean;
  speed_kmh: number | null;
  heading_deg: number | null;
  availability: IDelivererAvailability;
  /** Position FIFO dans la queue (null si hors queue). */
  queue_rank: number | null;
  pause_until: string | null;
  auto_pause_until: string | null;
  active_course: IDelivererLiveCourse | null;
}
