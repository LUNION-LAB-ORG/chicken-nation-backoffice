export type ProspectPlatform = "GLOVO" | "YANGO";

export type ProspectStatus =
  | "NOUVEAU"
  | "A_APPELER"
  | "JOINT"
  | "NON_JOIGNABLE"
  | "REFUS"
  | "COUPON_ENVOYE"
  | "INSCRIT"
  | "CONVERTI";

export interface ProspectRestaurantLite {
  id: string;
  name: string;
}

export interface ProspectCreatorLite {
  id: string;
  fullname: string;
}

export interface Prospect {
  id: string;
  platform: ProspectPlatform;
  name: string;
  order_number: string;
  phone: string;
  status: ProspectStatus;
  restaurant_id: string;
  restaurant?: ProspectRestaurantLite | null;
  created_by?: string | null;
  creator?: ProspectCreatorLite | null;
  customer_id?: string | null;
  promo_code_id?: string | null;
  called_at?: string | null;
  coupon_sent_at?: string | null;
  registered_at?: string | null;
  converted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProspectQuery {
  restaurantId?: string;
  platform?: ProspectPlatform;
  status?: ProspectStatus;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface CreateProspectPayload {
  platform: ProspectPlatform;
  name: string;
  order_number: string;
  phone: string;
  restaurant_id?: string;
}

export interface CheckPhoneResult {
  exists: boolean;
  prospect: {
    id: string;
    name: string;
    status: ProspectStatus;
    restaurant?: ProspectRestaurantLite | null;
    created_at: string;
  } | null;
}

// ============================================================
// PHASE 2 — Call Center
// ============================================================

export type CallResult = "JOINT" | "NON_JOIGNABLE" | "REFUS";

export type ProspectMessageKind =
  | "DECOUVERTE"
  | "RELANCE_1"
  | "RELANCE_2_FIDELITE";

export interface ProspectCall {
  id: string;
  result: CallResult;
  rank: number;
  note?: string | null;
  created_at: string;
  agent?: { id: string; fullname: string } | null;
}

export interface ProspectMessage {
  id: string;
  kind: ProspectMessageKind;
  rank: number;
  body: string;
  created_at: string;
}

export interface ProspectCouponLite {
  id: string;
  code: string;
  expiration_date: string;
  is_active?: boolean;
  usage_count?: number;
}

export interface ProspectDetail extends Prospect {
  customer?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    phone: string;
  } | null;
  promo_code?: ProspectCouponLite | null;
  calls: ProspectCall[];
  messages: ProspectMessage[];
}

export interface CallQueueItem extends Prospect {
  _count?: { calls: number; messages: number };
}

export interface CallQueueResponse {
  queue: CallQueueItem[];
  indicators: { toCall: number; joinedToday: number; couponsToday: number };
}

export interface SendCouponResult {
  prospect: Prospect;
  coupon: { code: string; expiration_date: string };
  message: string;
}

// ============================================================
// PHASE 3 — Analytics
// ============================================================

export interface ProspectStoreStat {
  restaurant_id: string;
  name: string;
  total: number;
  converted: number;
}

export interface ProspectStats {
  total: number;
  funnel: {
    saisis: number;
    verifies: number;
    coupon_envoye: number;
    inscrits: number;
    convertis: number;
  };
  platform: { glovo: number; yango: number };
  conversion_rate: number;
  coupons: { sent: number; used: number; usage_rate: number };
  sales: { count: number; ca: number; average: number };
  by_store: ProspectStoreStat[];
}

export type CouponState = "ACTIVE" | "USED" | "EXPIRED";

export interface CouponRow {
  id: string;
  code: string;
  name: string;
  platform: ProspectPlatform;
  restaurant?: ProspectRestaurantLite | null;
  sent_at: string | null;
  expiration_date: string | null;
  state: CouponState;
}

export interface SaleRow {
  id: string;
  name: string;
  platform: ProspectPlatform;
  restaurant?: ProspectRestaurantLite | null;
  coupon: string | null;
  amount: number;
  date: string | null;
}

export interface SalesResponse {
  data: SaleRow[];
  totals: { count: number; ca: number; average: number };
}
