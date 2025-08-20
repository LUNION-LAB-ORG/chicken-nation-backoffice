// Interface pour les données de commande
export interface OrderData {
  id: string;
  reference: string;
  customer_id: string;
  paied: boolean;
  delivery_fee: number;
  points: number;
  type: 'DELIVERY' | 'TAKEAWAY' | 'DINE_IN';
  table_type?: string | null;
  places?: number | null;
  address: string; // JSON string format: {"title": "...", "address": "...", "street": "...", "city": "...", "latitude": number, "longitude": number}
  code_promo?: string | null;
  tax: number;
  amount: number;
  net_amount: number;
  discount: number;
  date: string; // ISO date string
  time: string; // Format "HH:mm"
  estimated_delivery_time?: string | null;
  estimated_preparation_time?: string | null;
  fullname: string;
  phone: string;
  email: string;
  note?: string | null;
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERING' | 'COMPLETED' | 'CANCELLED';
  restaurant_id: string;
  promotion_id?: string | null;
  entity_status: 'ACTIVE' | 'INACTIVE';
  completed_at?: string | null;
  paied_at?: string | null;
  created_at: string;
  updated_at: string;
  order_items: OrderItem[];
  paiements: Payment[];
  customer: Customer;
  restaurant: Restaurant;
}

// Interface pour les articles de commande
export interface OrderItem {
  id: string;
  quantity: number;
  amount: number;
  epice: boolean; // Indique si l'article est épicé
  order_id: string;
  dish_id: string;
  supplements: Supplement[]; // Array of supplements (peut être vide)
  created_at: string;
  updated_at: string;
  dish: Dish;
}

// Interface pour les plats
export interface Dish {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string; // Path vers l'image
  is_promotion: boolean;
  promotion_price?: number;
  category_id: string;
  entity_status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
}

// Interface pour les suppléments (si utilisé)
export interface Supplement {
  id: string;
  name: string;
  price: number;
  // Ajouter d'autres propriétés selon votre structure
}

// Interface pour les paiements
export interface Payment {
  id: string;
  amount: number;
  total: number;
  mode: 'MOBILE_MONEY' | 'CARD' | 'CASH' | 'BANK_TRANSFER';
  source?: string | null;
  fees: number;
  client?: string | null;
  client_id?: string | null;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  reference: string;
  failure_code?: string | null;
  failure_message?: string | null;
  order_id: string;
  entity_status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
}

// Interface pour le client
export interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  image?: string | null;
}

// Interface pour le restaurant
export interface Restaurant {
  id: string;
  name: string;
  image: string;
  address: string;
  phone: string;
  email: string;
  latitude: number;
  longitude: number;
}

// Interface pour l'adresse parsée (quand on parse le JSON de address)
export interface ParsedAddress {
  title: string;
  address: string;
  street: string;
  city: string;
  latitude: number;
  longitude: number;
}

// Interface pour les props du composant Receipt
export interface ReceiptProps {
  orderData?: OrderData;
}

// Types utilitaires pour les énumérations
export type OrderType = 'DELIVERY' | 'TAKEAWAY' | 'DINE_IN';
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERING' | 'COMPLETED' | 'CANCELLED';
export type PaymentMode = 'MOBILE_MONEY' | 'CARD' | 'CASH' | 'BANK_TRANSFER';
export type PaymentStatus = 'SUCCESS' | 'PENDING' | 'FAILED';
export type EntityStatus = 'ACTIVE' | 'INACTIVE';

// Interface simplifiée pour l'affichage dans le receipt (données transformées)
export interface ReceiptItem {
  description: string;
  details?: string;
  quantity: number;
  unitPrice: number;
  price: number;
  isPromotion: boolean;
  isSpicy: boolean;
}

// Interface pour les données formatées du receipt
export interface ReceiptData {
  reference: string;
  restaurant: string;
  address: string;
  phone: string;
  customer: string;
  customerPhone: string;
  date: string;
  time: string;
  deliveryFee: number;
  netAmount: number;
  tax: number;
  totalAmount: number;
  paymentRef: string;
  status: OrderStatus;
  type: OrderType;
  deliveryAddress: string;
  items: ReceiptItem[];
}
