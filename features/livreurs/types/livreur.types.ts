/**
 * Types du module Livreurs — alignés sur le modèle Prisma `Deliverer`
 * et les réponses du backend `deliverers` module.
 */

export type DelivererStatus = 'PENDING_VALIDATION' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED';
export type VehiculeType = 'MOTO' | 'VELO' | 'VOITURE';
export type Genre = 'HOMME' | 'FEMME';
export type EntityStatus = 'NEW' | 'ACTIVE' | 'INACTIVE' | 'DELETED';

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
  restaurant_id?: string | null;
  restaurant?: RestaurantLight | null;

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
