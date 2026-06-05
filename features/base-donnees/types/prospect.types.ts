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
