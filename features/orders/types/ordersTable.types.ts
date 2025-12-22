export interface Order {
  // Identifiants
  id: string;
  reference: string;
  orderNumber?: string;

  // Informations client
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  userId: string;

  // Dates
  date: string;
  createdAt?: string;
  updatedAt?: string;

  // Statut et type
  status:
    | "NOUVELLE"
    | "EN COURS"
    | "EN PRÉPARATION"
    | "LIVRÉ"
    | "COLLECTÉ"
    | "ANNULÉE"
    | "LIVRAISON"
    | "PRÊT"
    | "TERMINÉ";
  statusDisplayText?: string;
  orderType: "À livrer" | "À table" | "À récupérer";

  // Prix
  totalPrice: number;
  deliveryPrice: number;
  subtotal?: number;
  tax?: number;
  discount?: number;

  // Localisation
  address: string;
  tableNumber?: string;
  tableType?: string;
  numberOfGuests?: number;

  // Restaurant
  restaurant?: string;
  restaurantId?: string;

  // Items
  items?: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    image?: string;
    epice?: boolean;
    supplemens?: string;
    supplementsPrice?: number;
  }>;

  // Paiement
  paymentMethod?: string;
  paymentStatus?: string;
  paiements?: Array<{
    id?: string;
    mode?: string;
    source?: string;
    status?: string;
    amount?: number;
  }>;

  // Notes
  notes?: string;
  specialInstructions?: string;

  // Métadonnées
  source?: string;
  platform?: string;
  estimatedDelivery?: string;

  paied?: boolean;
  hidden?: boolean;
  auto: boolean;
  note?: string;
}

export interface OrdersTableProps {
  onViewDetails: (order: Order) => void;
  searchQuery?: string;
  onFilteredOrdersChange?: (orders: Order[]) => void;
  selectedRestaurant?: string | null;
  currentUser?: {
    id: string;
    role: string;
    restaurant_id?: string;
    [key: string]: unknown;
  } | null;
  filteredOrders?: Order[];
  activeFilter?: string;
  onActiveFilterChange?: (filter: string) => void;
  selectedDate?: Date | null;
  onSelectedDateChange?: (date: Date | null) => void;
}