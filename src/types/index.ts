export interface Category {
  id: string;
  name: string;
  description?: string;
  promo?: string;
  image?: string;
}

export interface Supplement {
  id: string;
  name: string;
  price: string;
  isAvailable: boolean;
  isSelected?: boolean;
}

export interface ProductSupplement {
  type: "BOISSONS" | "SAUCES" | "PETITE OU GROSSE FAIM";
  items: Supplement[];
  required?: boolean;
}

export interface Review {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  comment: string;
  date: string;
  likes?: number;
}

export interface OrderHistory {
  id: string;
  userId: string;
  restaurantId: string;
  items: {
    productId: string;
    quantity: number;
    supplements?: {
      [key: string]: string[];
    };
  }[];
  total: string;
  status:
    | "pending"
    | "confirmed"
    | "preparing"
    | "ready"
    | "delivered"
    | "cancelled";
  date: string;
  deliveryAddress?: string;
  paymentMethod: "cash" | "card" | "mobile_money";
}

export interface Notification {
  id: string;
  userId: string;
  icon: string;
  iconBgColor: string;
  title: string;
  date: string;
  time: string;
  message: string;
  type: "order" | "promo" | "info" | "payment" | "account";
  isRead: boolean;
  showChevron?: boolean;
  notifBanner: string;
  notifTitle: string;
  data?: {
    orderId?: string;
    promoId?: string;
    serviceId?: string;
    paymentMethodId?: string;
    userId?: string;
  };
}

export interface NotificationSettings {
  orderUpdates: {
    enabled: boolean;
    preferences: {
      orderConfirmation: boolean;
      orderPreparation: boolean;
      orderReady: boolean;
      deliveryStatus: boolean;
      orderDelivered: boolean;
      orderCancelled: boolean;
    };
    channels: {
      inApp: boolean;
      email: boolean;
      sms: boolean;
    };
  };
  promotions: {
    enabled: boolean;
    preferences: {
      dailyDeals: boolean;
      weekendSpecials: boolean;
      newItems: boolean;
      specialEvents: boolean;
      personalizedOffers: boolean;
    };
    frequency: "daily" | "weekly" | "monthly" | "never";
    channels: {
      inApp: boolean;
      email: boolean;
      sms: boolean;
    };
  };
  newsletter: {
    enabled: boolean;
    preferences: {
      newsAndUpdates: boolean;
      recipes: boolean;
      tips: boolean;
      events: boolean;
    };
    frequency: "weekly" | "monthly" | "never";
    channels: {
      email: boolean;
    };
  };
  pushNotifications: {
    enabled: boolean;
    preferences: {
      sound: boolean;
      vibration: boolean;
      banner: boolean;
      lockScreen: boolean;
    };
    quiet_hours: {
      enabled: boolean;
      start: string;
      end: string;
    };
  };
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone: string;
  isConnected: boolean;
  password: string;
  profilePicture: string;
  favorites: {
    restaurants: string[];
    products: string[];
  };
  addresses: {
    id: string;
    name: string;
    address: string;
    details?: string;
    isDefault: boolean;
  }[];
  notificationPreferences: {
    specialOffers: boolean;
    promotion: boolean;
    orders: boolean;
    appUpdates: boolean;
    newService: boolean;
  };
  orderHistory: OrderHistory[];
  reviews: string[];
  notifications: Notification[];
  notificationSettings: NotificationSettings;
  createdAt: string;
  lastLogin: string;
}

// ✅ TYPES STRICTS POUR LES SUPPLÉMENTS - UNIFIÉ
export interface SupplementItem {
  id: string;
  name: string;
  price: string; // Unifié en string pour la cohérence avec l'API
  image?: string;
  quantity?: number;
  category: 'ACCESSORY' | 'FOOD' | 'DRINK';
  isAvailable: boolean;
  isSelected?: boolean;
}

export interface SupplementType {
  type: 'ACCESSORY' | 'FOOD' | 'DRINK';
  items: SupplementItem[];
  isIncluded?: boolean;
  required?: boolean;
}

// ✅ TYPES STRICTS POUR LES CATÉGORIES
export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  image?: string;
}

// ✅ INTERFACE MENU ITEM SÉCURISÉE
export interface MenuItem {
  id: string;
  name: string;
  description: string;
  restaurant: string;
  restaurantId: string; // ✅ Type unique au lieu de string | string[]
  price: string;
  categoryId: string;
  category_id?: string;
  category?: MenuCategory | string; // ✅ Type strict au lieu de any
  isAvailable: boolean;
  isNew?: boolean;
  ingredients?: string[];
  image: string;
  imageUrl?: string;
  rating?: number;
  supplements: {
    boissons?: SupplementType;
    sauces?: SupplementType;
    portions?: SupplementType;
    ACCESSORY?: SupplementItem[]; // ✅ Type strict au lieu de any[]
    FOOD?: SupplementItem[]; // ✅ Type strict au lieu de any[]
    DRINK?: SupplementItem[]; // ✅ Type strict au lieu de any[]
  };
  reviews: string[];
  totalReviews: number;
  is_promotion: boolean;
  promotion_price?: number | string;
  dish_restaurants?: Array<{
    id?: string;
    dish_id?: string;
    restaurant_id?: string;
    restaurant?: {
      id: string;
      name: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  }>;
  dish_supplements?: Array<{
    id?: string;
    dish_id?: string;
    supplement_id?: string;
    supplement?: {
      id: string;
      name: string;
      price?: number | string;
      type?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  }>;
  is_alway_epice?: boolean; // ✅ Nom corrigé sans "s"
}

export interface Schedule {
  day:
    | "Lundi"
    | "Mardi"
    | "Mercredi"
    | "Jeudi"
    | "Vendredi"
    | "Samedi"
    | "Dimanche";
  openingTime: string;
  closingTime: string;
}

export interface Restaurant {
  id: string;
  name: string;
  description?: string;
  address: string;
  location: string;
  phone: string;
  email?: string;
  isOpen: boolean;
  closingTime?: string;
  openingTime?: string;
  deliveryStartTime: string;
  deliveryEndTime?: string;
  image?: string;
  latitude?: number;
  longitude?: number;
  schedule: Schedule[];
  tables: {
    capacity: number;
    quantity: number;
    type: "indoor" | "outdoor" | "smoking" | "non-smoking";
  }[];
  reservationTimeSlots: string[];
  maxReservationSize: number;
  minReservationSize: number;
  reservationLeadHours: number;
  reservationMaxDays: number;
  reservationSettings?: {
    timeSlots: string[];
    maxSize: number;
    minSize: number;
    leadHours: number;
    maxDays: number;
  };
}

export interface TableReservation {
  id: string;
  userId: string;
  restaurantId: string;
  date: string;
  time: string;
  numberOfPeople: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  specialRequests?: string;
  occasion?: "birthday" | "anniversary" | "business" | "other";
  tablePreference?: "rounded" | "rectangle" | "long";
  createdAt: string;
  updatedAt?: string;
}

export interface PromoDetails {
  discount: number;
  validUntil: string;
  originalPrices: {
    [menuId: string]: string;
  };
}

export interface PromoBanner {
  id: string;
  background: string;
  image: string;
  percentText: string;
  mainText: string;
  subText: string;
  color?: string;
  offerId: string;
  menuIds: string[];
  promoDetails: PromoDetails;
}

export interface PromoCode {
  code: string;
  discount: number;
  type: "percent" | "fixed";
  validUntil: string;
  description: string;
  minOrderValue?: number;
  maxDiscount?: number;
  isReusable?: boolean;
  isFirstOrderOnly?: boolean;
  restrictions?: {
    categoryIds?: string[];
    productIds?: string[];
    restaurantIds?: string[];
  };
}
