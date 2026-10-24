import type { DisponibiliteLivreur, PresenceAppliServeur, VehiculeType } from "./livreur.types";

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
  // Complétés le 24/10 (conception, 11.5) ; absents sur un serveur plus ancien.
  restaurant_id?: string;
  pickup_code?: string;
  at_restaurant_at?: string | null;
  picked_up_at?: string | null;
  parti_at?: string | null;
  estimated_duration_min?: number | null;
  /** Fin prévue de la tournée (ISO), règle commune du retard. */
  fin_prevue?: string | null;
  en_retard?: boolean;
  /** Minutes de retard au-delà de la fin prévue ; null sans retard. */
  retard_min?: number | null;
}

/** Réponse d'un livreur à un créneau du jour ; null s'il n'y est pas affecté. */
export type ReponseCreneau = "ASSIGNED" | "CONFIRMED" | "REFUSED" | null;

/** Planning du jour d'un livreur (plannings envoyés ou confirmés, repos du jour). */
export interface CreneauDuJour {
  matin: ReponseCreneau;
  soir: ReponseCreneau;
  repos: boolean;
}

export interface IDelivererLive extends PresenceAppliServeur {
  id: string;
  first_name: string | null;
  last_name: string | null;
  image: string | null;
  type_vehicule: VehiculeType | null;
  restaurant: { id: string; name: string; latitude?: number | null; longitude?: number | null } | null;
  /** `{ lat, lng }` ou null si pas encore remonté */
  location: { lat: number; lng: number } | null;
  location_at: string | null;
  /** `true` si le GPS est plus récent que `deliverer.gps_expiration_minutes` */
  location_fresh: boolean;
  speed_kmh: number | null;
  heading_deg: number | null;
  availability: IDelivererAvailability;
  /**
   * Rang parmi TOUS les livreurs lus ensemble (anciens écrans) : juste pour
   * un seul restaurant. Préférer `rang_file`.
   */
  queue_rank: number | null;
  /** Place dans la file de SON restaurant (1 = premier) ; absent sur un serveur plus ancien. */
  rang_file?: number | null;
  pause_until: string | null;
  auto_pause_until: string | null;
  /**
   * État par la règle unique du serveur (lot 1 du 22/10) : c'est lui qu'on
   * affiche. `availability` ne sert plus que si le serveur est plus ancien.
   */
  disponibilite?: DisponibiliteLivreur;
  /** Connexion temps réel de l'appli (voir `Livreur.appli_connectee`). */
  appli_connectee?: boolean | null;
  active_course: IDelivererLiveCourse | null;
  // Avec `jour=true` seulement (vue Livreurs « Aujourd'hui »), absents sur un serveur plus ancien.
  creneau_du_jour?: CreneauDuJour;
  /** Temps en ligne de la journée, en secondes ; null si le serveur n'a pas pu le lire. */
  en_ligne_aujourdhui_s?: number | null;
  /** Courses terminées depuis le début de la journée de service. */
  courses_du_jour?: number;
}
