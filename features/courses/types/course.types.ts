/**
 * Types du module Courses (backoffice admin) — miroir du modèle backend
 * `Course` + `Delivery` + `CourseOfferAttempt`.
 */

export type CourseStatut =
  | 'PENDING_ASSIGNMENT'
  | 'ACCEPTED'
  | 'AT_RESTAURANT'
  | 'IN_DELIVERY'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED';

export type DeliveryStatut =
  | 'PENDING'
  | 'IN_ROUTE'
  | 'ARRIVED'
  | 'DELIVERED'
  | 'FAILED'
  | 'CANCELLED';

export type DeliveryFailureReason =
  | 'CLIENT_ABSENT'
  | 'CLIENT_REFUSED'
  | 'ADDRESS_NOT_FOUND'
  | 'CLIENT_UNREACHABLE'
  | 'WRONG_ORDER'
  | 'OTHER';

export type CourseOfferStatus = 'PENDING' | 'ACCEPTED' | 'REFUSED' | 'EXPIRED';

// ============================================================
// SOUS-STRUCTURES
// ============================================================

export interface OrderAddress {
  title?: string;
  address: string;
  street?: string;
  city?: string;
  longitude: number;
  latitude: number;
  note?: string;
}

export interface OrderCustomerLight {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
}

/** Statut Order miroir backend (pour préserver OrderForDelivery autonome) */
export type OrderStatusLight =
  | 'PENDING'
  | 'CANCELLED'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'READY'
  | 'PICKED_UP'
  | 'COLLECTED'
  | 'COMPLETED';

export type PaymentMethodLight = 'ONLINE' | 'OFFLINE';

export interface OrderForDelivery {
  id: string;
  reference: string;
  status: OrderStatusLight;
  paied: boolean;
  payment_method: PaymentMethodLight | null;
  amount: number;
  net_amount: number;
  delivery_fee: number;
  address: OrderAddress;
  fullname?: string | null;
  phone?: string | null;
  note?: string | null;
  customer?: OrderCustomerLight | null;
}

export interface Delivery {
  id: string;
  course_id: string;
  sequence_order: number;
  order_id: string;
  statut: DeliveryStatut;
  in_route_at?: string | null;
  arrived_at?: string | null;
  delivered_at?: string | null;
  failed_at?: string | null;
  failure_reason?: DeliveryFailureReason | null;
  failure_note?: string | null;
  order: OrderForDelivery;
}

export interface RestaurantForCourse {
  id: string;
  name: string;
  image?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface DelivererForCourse {
  id: string;
  reference: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  image?: string | null;
}

export interface CourseOfferAttempt {
  id: string;
  course_id: string;
  deliverer_id: string;
  status: CourseOfferStatus;
  offered_at: string;
  expires_at: string;
  responded_at?: string | null;
  refusal_reason?: string | null;
  deliverer: DelivererForCourse;
}

// ============================================================
// COURSE (entité principale)
// ============================================================

export interface Course {
  id: string;
  reference: string;
  /** Code 3 chiffres donné au restaurant */
  pickup_code: string;
  statut: CourseStatut;
  deliverer_id?: string | null;
  deliverer?: DelivererForCourse | null;
  restaurant_id: string;
  restaurant: RestaurantForCourse;
  deliveries: Delivery[];
  assigned_at?: string | null;
  picked_up_at?: string | null;
  completed_at?: string | null;
  cancelled_at?: string | null;
  cancelled_by?: string | null;
  cancelled_reason?: string | null;
  offer_expires_at?: string | null;
  refusal_count: number;
  total_delivery_fee: number;
  estimated_duration_min?: number | null;
  created_at: string;
  updated_at: string;
}

/** Course avec ses tentatives d'affectation (endpoint GET /courses/:id) */
export interface CourseWithAttempts extends Course {
  offer_attempts: CourseOfferAttempt[];
}

// ============================================================
// REQUÊTES / FILTRES
// ============================================================

export interface CoursesQueryFilters {
  statut?: CourseStatut;
  restaurant_id?: string;
  deliverer_id?: string;
  /** Recherche sur reference ou pickup_code */
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface CoursesListResponse {
  items: Course[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================
// PAYLOADS MUTATIONS
// ============================================================

export interface ForceAssignPayload {
  deliverer_id: string;
}

export interface CancelCoursePayload {
  reason?: string;
}

// ============================================================
// STATS (page Courses — KPI + charts)
// ============================================================

export interface ICourseStatsFilters {
  restaurant_id?: string;
  startDate?: string;
  endDate?: string;
}

export interface ICourseStatsDailyPoint {
  date: string; // YYYY-MM-DD
  total: number;
  completed: number;
  cancelled: number;
}

export interface ICourseStatsDistribution {
  statut: 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
  count: number;
}

export interface ICourseStats {
  period: { startDate: string; endDate: string };
  totals: {
    total: number;
    active: number;
    completed: number;
    cancelled: number;
    expired: number;
    pendingAssignment: number;
  };
  successRate: number; // %
  totalRevenue: number;
  avgDurationMin: number;
  distribution: ICourseStatsDistribution[];
  dailyBreakdown: ICourseStatsDailyPoint[];
}
