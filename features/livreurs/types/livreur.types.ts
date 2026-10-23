/**
 * Types du module Livreurs — alignés sur le modèle Prisma `Deliverer`
 * et les réponses du backend `deliverers` module.
 */

export type DelivererStatus = 'PENDING_VALIDATION' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED';
export type VehiculeType = 'MOTO' | 'VELO' | 'VOITURE';
export type Genre = 'HOMME' | 'FEMME';
export type EntityStatus = 'NEW' | 'ACTIVE' | 'INACTIVE' | 'DELETED';

/**
 * État d'un livreur pour une offre de course, calculé par le serveur avec la
 * règle unique (backend `deliverers/helpers/disponibilite.rules.ts`), par
 * ordre de priorité : inactif, en pause, pause automatique, en course, offre
 * en attente, hors service. Sinon : disponible.
 */
export type EtatDisponibilite =
  | 'DISPONIBLE'
  | 'INACTIF'
  | 'EN_PAUSE'
  | 'PAUSE_AUTO'
  | 'EN_COURSE'
  | 'OFFRE_EN_ATTENTE'
  | 'HORS_SERVICE';

/**
 * Champ `disponibilite` porté par chaque livreur de `GET /deliverers` et de
 * `GET /deliverers/live-locations` (lot 1 du 22/10). Absent sur un serveur
 * plus ancien.
 */
export interface DisponibiliteLivreur {
  etat: EtatDisponibilite;
  /** Texte prêt à afficher : « En pause jusqu'à 14 h 32 », « Hors service »… */
  libelle: string;
  /** Peut recevoir une offre (et donc une affectation forcée) maintenant. */
  peut_recevoir_offre: boolean;
  /** Texte exact du refus (409) d'une affectation forcée, null si disponible. */
  message_refus: string | null;
  en_pause: boolean;
  en_pause_auto: boolean;
  /** Fin de la pause manuelle (ISO). Une pause sans fin vaut le 31/12/2099. */
  pause_until: string | null;
  auto_pause_until: string | null;
  /** Dans la file : il a touché « Reprendre » ou ouvert l'appli disponible. */
  en_service: boolean;
  en_course: boolean;
  offre_en_attente: boolean;
  /** Course de l'offre en attente : l'affectation forcée sur CETTE course reste permise (renvoi). */
  offre_course_id: string | null;
}

export interface RestaurantLight {
  id: string;
  name: string;
  address?: string;
  phone?: string;
}

export interface Livreur {
  id: string;
  /** Référence métier unique (LIV-YYMMDD-XXXXX) */
  reference: string;
  phone: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  genre?: Genre | null;
  image?: string | null; // key S3

  // Véhicule & documents
  type_vehicule?: VehiculeType | null;
  piece_identite?: string | null; // key S3
  permis_conduire?: string | null; // key S3
  numero_permis?: string | null;
  numero_immatriculation?: string | null;

  // Statut métier
  status: DelivererStatus;
  is_operational: boolean;
  /** Motif du dernier refus (status REJECTED). */
  rejection_reason?: string | null;
  restaurant_id?: string | null;
  restaurant?: RestaurantLight | null;
  /** Lieu d'habitation choisi par le livreur (sert au tri des restaurants par proximité). */
  home_location?: { lat: number; lng: number } | null;
  home_address?: string | null;

  /** État pour une offre de course (liste admin), absent sur un ancien serveur. */
  disponibilite?: DisponibiliteLivreur;
  /**
   * L'appli du livreur a-t-elle une connexion temps réel ouverte avec le
   * serveur ? `false` : une offre ne lui arrive que par notification. `null` :
   * le serveur n'a pas pu le savoir. Absent sur un ancien serveur.
   */
  appli_connectee?: boolean | null;

  // Sessions / dates
  last_login_at?: string | null;
  deletion_scheduled_at?: string | null;
  entity_status: EntityStatus;
  created_at: string;
  updated_at: string;
}

// === Requêtes / filtres ===

export interface LivreursQueryFilters {
  status?: DelivererStatus;
  restaurant_id?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface LivreursListResponse {
  items: Livreur[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// === Payloads mutations ===

export interface RejectLivreurPayload {
  reason: string;
}

export interface SuspendLivreurPayload {
  reason?: string;
}

export interface AssignRestaurantPayload {
  restaurant_id: string;
}
