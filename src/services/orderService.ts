// --- Order Service ---

const API_URL = process.env.NEXT_PUBLIC_API_URL
const API_PREFIX = '/api/v1';
const ORDERS_ENDPOINT = '/orders';

// Récupérer le token d'authentification depuis les cookies
function getAuthToken() {
  try {
    if (typeof document === 'undefined') return null;

    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'chicken-nation-token') {
        return decodeURIComponent(value);
      }
    }

    console.error('Token non trouvé dans les cookies');
    return null;
  } catch (error) {
    console.error('Erreur lors de la récupération du token:', error);
    return null;
  }
}

// Types pour les commandes
export type OrderStatus = 'PENDING' | 'CANCELLED' | 'ACCEPTED' | 'IN_PROGRESS' | 'READY' | 'PICKED_UP' | 'DELIVERED' | 'COLLECTED' | 'COMPLETED';
export type OrderType = 'DELIVERY' | 'PICKUP' | 'TABLE';

export interface OrderQuery {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  type?: OrderType;
  customerId?: string;
  restaurantId?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  reference?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ✅ Interface qui correspond aux VRAIES données de l'API
export interface ApiOrderRaw {
  id: string;
  reference: string;
  order_number?: string;
  status: OrderStatus;
  type: OrderType;
  amount: number;
  net_amount?: number;
  delivery_fee?: number;
  tax?: number;
  discount?: number;
  created_at: string;
  updated_at: string;
  date?: string;
  time?: string;
  fullname: string;
  email?: string | null;
  phone?: string;
  customer_id: string;
  customer: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string;
    image?: string | null;
  };
  restaurant_id: string;
  restaurant: {
    id: string;
    name: string;
    image?: string;
    address?: string;
    phone?: string;
    email?: string;
    latitude?: number;
    longitude?: number;
  };
  address: string; // JSON string
  table_type?: string | null;
  places?: number | null;
  order_items: Array<{
    id: string;
    dish_id?: string;
    name?: string;
    amount?: number;
    price?: number;
    quantity?: number;
    epice?: boolean;
    dish?: {
      id: string;
      name: string;
      description?: string;
      price: number;
      image?: string;
      category?: string;
    };
  }>;
  paiements: Array<{
    id?: string;
    method?: string;
    status?: string;
    amount?: number;
    [key: string]: unknown;
  }>;
  paied: boolean;
  paied_at?: string | null;
  note?: string | null;
  promotion_id?: string | null;
  code_promo?: string | null;
  points?: number;
  entity_status: string;
  estimated_delivery_time?: string | null;
  estimated_preparation_time?: string | null;
  completed_at?: string | null;
  [key: string]: unknown;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

// Fonction pour récupérer les commandes avec filtres
export async function getOrders(params: OrderQuery = {}): Promise<PaginatedResponse<ApiOrderRaw>> {

  const {
    page = 1,
    limit = 10,
    status,
    type,
    customerId,
    restaurantId,
    startDate,
    endDate,
    minAmount,
    maxAmount,
    reference,
    sortBy = 'created_at',
    sortOrder = 'desc'
  } = params;

  // Construire les paramètres de requête
  const queryParams = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    sortBy,
    sortOrder
  });

  // Ajouter les filtres optionnels
  if (status) queryParams.append('status', status);
  if (type) queryParams.append('type', type);
  if (customerId) queryParams.append('customerId', customerId);
  if (restaurantId) queryParams.append('restaurantId', restaurantId);
  if (startDate) queryParams.append('startDate', startDate);
  if (endDate) queryParams.append('endDate', endDate);
  if (minAmount !== undefined) queryParams.append('minAmount', String(minAmount));
  if (maxAmount !== undefined) queryParams.append('maxAmount', String(maxAmount));
  if (reference) queryParams.append('reference', reference);

  const url = `${API_URL}${API_PREFIX}${ORDERS_ENDPOINT}?${queryParams}`;

  try {
    const token = getAuthToken();


    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });


    // Gérer spécifiquement l'erreur 404
    if (response.status === 404) {
      return { data: [], meta: { totalItems: 0, itemCount: 0, itemsPerPage: 12, totalPages: 0, currentPage: 1 } };
    }

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return data;
  } catch (error) {
    throw error;
  }
}

// Fonction pour récupérer une commande par son ID
export async function getOrderById(id: string): Promise<ApiOrderRaw> {
  if (!id) throw new Error('ID commande manquant');
  const url = `${API_URL}${API_PREFIX}${ORDERS_ENDPOINT}/${id}`;

  try {
    const token = getAuthToken();

    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();


    // Enrichir les données si nécessaire
    if (data) {
      // S'assurer que les informations client sont disponibles
      if (!data.customer && data.fullname) {
        data.customer = {
          id: data.customer_id || '',
          firstName: data.fullname.split(' ')[0] || '',
          lastName: data.fullname.split(' ').slice(1).join(' ') || '',
          email: data.email || '',
          phone: data.phone || ''
        };
      }

      // S'assurer que les informations de prix sont disponibles
      if (data.order_items && Array.isArray(data.order_items) && data.order_items.length > 0) {
        // Calculer le total si non disponible
        if (!data.total && !data.amount) {
          data.total = data.order_items.reduce((sum, item) => {
            const price = item.price || item.amount || 0;
            const quantity = item.quantity || 1;
            return sum + (price * quantity);
          }, 0);
        }
      }
    }

    return data;
  } catch (error) {
    console.error('[orderService] Erreur lors de la récupération de la commande:', error);
    throw error;
  }
}

export async function getRawOrderById(id: string): Promise<ApiOrderRaw> {
  if (!id) throw new Error('ID commande manquant');
  const url = `${API_URL}${API_PREFIX}${ORDERS_ENDPOINT}/${id}`;

  try {
    const token = getAuthToken();
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return data;
  } catch (error) {
    throw error;
  }
}

// Fonction pour mettre à jour le statut d'une commande
export async function updateOrderStatus(id: string, status: OrderStatus): Promise<ApiOrderRaw> {
  if (!id || !status) throw new Error('ID ou statut manquant');
  const url = `${API_URL}${API_PREFIX}${ORDERS_ENDPOINT}/${id}/status`;



  try {
    const token = getAuthToken();
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return data;
  } catch (error) {
    throw error;
  }
}

// Fonction pour supprimer une commande
export async function deleteOrder(id: string): Promise<void> {
  if (!id) throw new Error('ID commande manquant');
  const url = `${API_URL}${API_PREFIX}${ORDERS_ENDPOINT}/${id}`;


  try {
    const token = getAuthToken();
    const response = await fetch(url, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    throw error;
  }
}

// Fonction pour mettre à jour une commande
export async function updateOrder(id: string, data: Partial<ApiOrderRaw>): Promise<ApiOrderRaw> {
  if (!id || !data) throw new Error('ID ou données manquantes');
  const url = `${API_URL}${API_PREFIX}${ORDERS_ENDPOINT}/${id}`;



  try {
    const token = getAuthToken();
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });



    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data2 = await response.json();
    return data2;
  } catch (error) {
    throw error;
  }
}
