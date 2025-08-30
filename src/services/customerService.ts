
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://chicken.turbodeliveryapp.com';
const API_PREFIX = '/api/v1';
const CUSTOMERS_ENDPOINT = '/customer';
const REVIEWS_ENDPOINT = '/reviews';
const ORDERS_ENDPOINT = '/orders';
const CUSTOMER_ORDERS_ENDPOINT = '/orders/customer';



function getAuthToken() {
  try {
    // Vérifier si nous sommes côté client (browser)
    if (typeof document === 'undefined') {
      return '';
    }

    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'chicken-nation-token') {
        return decodeURIComponent(value);
      }
    }

    return '';
  } catch {
    return '';
  }
}


type CustomerStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'NEW';

export interface CustomerAddress {
  id: string;
  name?: string;
  address?: string;
  street?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  details?: string;
  is_default?: boolean;
  isDefault?: boolean;
}

export interface Customer {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string;
  addresses?: CustomerAddress[];
  image?: string | null;
  created_at: string;
  updated_at: string;
  entity_status: CustomerStatus;
  birth_day?: string | null;
  totalOrders?: number;
  lastOrderDate?: string;
  isConnected?: boolean;
}

export interface CustomerQuery {
  page?: number;
  limit?: number;
  status?: CustomerStatus;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  restaurantId?: string;
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

// Fonction pour gérer les erreurs d'authentification
async function handleAuthError<T>(response: Response, retryFn: () => Promise<T>): Promise<T | null> {
  if (response.status === 401) {

    try {
      // Tenter de rafraîchir le token depuis les cookies
      const getCookieValue = (name: string): string | null => {
        if (typeof document === 'undefined') return null;
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
          const [cookieName, value] = cookie.trim().split('=');
          if (cookieName === name) {
            return decodeURIComponent(value);
          }
        }
        return null;
      };

      const refreshToken = getCookieValue('chicken-nation-refresh-token');
      if (refreshToken) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh-token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken }),
          });

          if (response.ok) {
            const data = await response.json();
            // Mettre à jour le token dans les cookies
            if (data.accessToken && typeof document !== 'undefined') {
              const expires = new Date();
              expires.setDate(expires.getDate() + 7);
              const cookieString = `chicken-nation-token=${encodeURIComponent(data.accessToken)}; expires=${expires.toUTCString()}; path=/; secure=${process.env.NODE_ENV === 'production'}; samesite=lax`;
              document.cookie = cookieString;
            }

            // Réessayer la requête originale
            return retryFn();
          }
        } catch {
          // Échec du rafraîchissement du token
        }
      }

      // Si le rafraîchissement échoue ou n'est pas possible, déconnecter proprement
      if (typeof document !== 'undefined') {
        // Nettoyer les cookies d'authentification
        const authCookieNames = ['chicken-nation-token', 'chicken-nation-refresh-token', 'chicken-nation-user', 'chicken-nation-auth'];
        authCookieNames.forEach(name => {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        });
        window.location.href = '/';
      }
      return null;
    } catch {
      throw new Error(`Erreur d'authentification: ${response.status} ${response.statusText}`);
    }
  }

  // Pour les autres erreurs, on laisse passer
  throw new Error(`API Error: ${response.status} ${response.statusText}`);
}

export async function getCustomers(params: CustomerQuery = {}): Promise<PaginatedResponse<Customer>> {
  const { page = 1, limit = 10, status = 'ACTIVE', search, sortBy, sortOrder, restaurantId } = params;

  // Construire les paramètres de requête
  const queryParams = new URLSearchParams();
  queryParams.append('page', page.toString());
  queryParams.append('limit', limit.toString());
  if (status) queryParams.append('status', status);
  if (search) queryParams.append('search', search);
  if (sortBy) queryParams.append('sortBy', sortBy);
  if (sortOrder) queryParams.append('sortOrder', sortOrder);

  // ✅ Ajouter le filtrage par restaurant pour les managers
  if (restaurantId) {
    queryParams.append('restaurantId', restaurantId);
  }

  const url = `${API_URL}${API_PREFIX}${CUSTOMERS_ENDPOINT}?${queryParams}`;

  try {
    const token = getAuthToken();
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const result = await handleAuthError(response, () => getCustomers(params));
      if (result === null) {
        throw new Error('Authentication failed');
      }
      return result;
    }

    const data = await response.json();

    // ✅ Le backend envoie maintenant toujours un objet avec pagination
    // Vérifier que la réponse a le bon format
    if (!data.data || !Array.isArray(data.data)) {
      throw new Error('Format de réponse invalide: data.data manquant ou n\'est pas un tableau');
    }

    if (!data.meta) {
      throw new Error('Format de réponse invalide: data.meta manquant');
    }

    // Enrichir les données avec les informations sur les commandes
    const enrichedData = await enrichCustomersWithOrderInfo(data);

    return enrichedData as PaginatedResponse<Customer>;
  } catch (error) {
    throw error;
  }
}

// ✅ Nouvelle fonction pour récupérer les clients d'un restaurant spécifique
export async function getRestaurantCustomers(restaurantId: string, params: CustomerQuery = {}): Promise<Customer[]> {
  if (!restaurantId) throw new Error('ID restaurant manquant');

  const { search, status = 'ACTIVE' } = params;

  // Construire les paramètres de requête
  const queryParams = new URLSearchParams();
  if (status) queryParams.append('status', status);
  if (search) queryParams.append('search', search);

  const url = `${API_URL}${API_PREFIX}/restaurants/${restaurantId}/clients${queryParams.toString() ? `?${queryParams}` : ''}`;

  try {
    const token = getAuthToken();
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const result = await handleAuthError(response, () => getRestaurantCustomers(restaurantId, params));
      if (result === null) {
        throw new Error('Authentication failed');
      }
      return result;
    }

    const data = await response.json();

    // Le nouvel endpoint retourne directement un tableau de clients
    if (!Array.isArray(data)) {
      throw new Error('Format de réponse invalide: la réponse n\'est pas un tableau');
    }

    return data as Customer[];
  } catch (error) {
    throw error;
  }
}

// ✅ Nouvelle fonction pour récupérer les clients sans enrichissement (pour les dropdowns)
export async function getAllCustomers(params: CustomerQuery = {}): Promise<PaginatedResponse<Customer>> {
  const { page = 1, limit = 100, status = 'ACTIVE', search, sortBy, sortOrder, restaurantId } = params;

  // Construire les paramètres de requête
  const queryParams = new URLSearchParams();
  queryParams.append('page', page.toString());
  queryParams.append('limit', limit.toString());
  if (status) queryParams.append('status', status);
  if (search) queryParams.append('search', search);
  if (sortBy) queryParams.append('sortBy', sortBy);
  if (sortOrder) queryParams.append('sortOrder', sortOrder);

  if (restaurantId) {
    queryParams.append('restaurantId', restaurantId);
  }

  const url = `${API_URL}${API_PREFIX}${CUSTOMERS_ENDPOINT}?${queryParams}`;

  try {
    const token = getAuthToken();
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const result = await handleAuthError(response, () => getAllCustomers(params));
      if (result === null) {
        throw new Error('Authentication failed');
      }
      return result;
    }

    const data = await response.json();

    // Vérifier que la réponse a le bon format
    if (!data.data || !Array.isArray(data.data)) {
      throw new Error('Format de réponse invalide: data.data manquant ou n\'est pas un tableau');
    }

    if (!data.meta) {
      throw new Error('Format de réponse invalide: data.meta manquant');
    }

    // ✅ Retourner directement sans enrichissement pour éviter les erreurs 404
    return data as PaginatedResponse<Customer>;
  } catch (error) {
    throw error;
  }
}

// Fonction pour enrichir les données des clients avec les informations sur les commandes
async function enrichCustomersWithOrderInfo(customersData: PaginatedResponse<Customer>): Promise<PaginatedResponse<Customer>> {
  // ✅ Le backend envoie maintenant toujours un objet avec pagination

  if (!customersData.data || !Array.isArray(customersData.data)) {
    throw new Error('Format de données invalide: customersData.data manquant ou n\'est pas un tableau');
  }

  // Enrichir les données des clients
  const enrichedCustomers = await Promise.all(
    customersData.data.map(async (customer: Customer) => {
      return await enrichCustomerWithOrderInfo(customer);
    })
  );

  return {
    ...customersData,
    data: enrichedCustomers
  };
}

// Fonction pour enrichir un client individuel avec ses informations de commande
async function enrichCustomerWithOrderInfo(customer: Customer): Promise<Customer> {
  // ✅ Toujours définir les valeurs par défaut d'abord
  const defaultEnrichment = {
    ...customer,
    isConnected: customer.entity_status === 'ACTIVE',
    totalOrders: 0,
    lastOrderDate: undefined
  };

  try {
    // ✅ Récupérer TOUTES les commandes du client pour avoir le bon total
    const ordersResponse = await getCustomerOrders(customer.id, { page: 1, limit: 100 });

    // Vérifier si la réponse contient des commandes
    if (ordersResponse && ordersResponse.data && ordersResponse.data.length > 0) {
      // Trier les commandes par date pour obtenir la plus récente
      const sortedOrders = ordersResponse.data.sort((a, b) =>
        new Date(b.created_at || b.date || 0).getTime() - new Date(a.created_at || a.date || 0).getTime()
      );


      return {
        ...defaultEnrichment,

        totalOrders: ordersResponse.meta?.totalItems || ordersResponse.data.length,

        lastOrderDate: sortedOrders[0]?.created_at || sortedOrders[0]?.date
      };
    } else {
      // Si le client n'a pas de commandes, retourner les valeurs par défaut
      return defaultEnrichment;
    }
  } catch {
    // Gérer les erreurs de manière explicite
    return defaultEnrichment;
  }
}

export async function getCustomerById(id: string): Promise<Customer> {
  if (!id) throw new Error('ID client manquant');
  const url = `${API_URL}${API_PREFIX}${CUSTOMERS_ENDPOINT}/${id}`;

  const token = getAuthToken();
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    await handleAuthError(response, () => getCustomerById(id));
  }
  const data = await response.json();

  return data;
}

export async function updateCustomerStatus(id: string, status: CustomerStatus): Promise<Customer> {
  if (!id || !status) throw new Error('ID ou statut manquant');
  const url = `${API_URL}${API_PREFIX}${CUSTOMERS_ENDPOINT}/${id}/status`;

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
    await handleAuthError(response, () => updateCustomerStatus(id, status));
  }
  return await response.json();
}

export async function deleteCustomer(id: string): Promise<void> {
  if (!id) throw new Error('ID client manquant');
  const url = `${API_URL}${API_PREFIX}${CUSTOMERS_ENDPOINT}/${id}`;

  const token = getAuthToken();
  const response = await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    await handleAuthError(response, () => deleteCustomer(id));
  }
}

export async function updateCustomer(id: string, data: Partial<Customer>): Promise<Customer> {
  if (!id || !data) throw new Error('ID ou données manquantes');
  const url = `${API_URL}${API_PREFIX}${CUSTOMERS_ENDPOINT}/${id}`;

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
    await handleAuthError(response, () => updateCustomer(id, data));
  }
  return await response.json();
}

// --- Ajout getCustomerOrders et getCustomerReviews ---

export interface CustomerOrder {
  id: string;
  customer_id: string;
  total_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
  date?: string;
  items?: unknown[];
}

export async function getCustomerOrders(id: string, params: { page?: number; limit?: number } = {}): Promise<PaginatedResponse<CustomerOrder>> {
  if (!id) throw new Error('ID client manquant');

  // Construire les paramètres de requête
  const queryParams = new URLSearchParams();
  if (params.page !== undefined) queryParams.append('page', params.page.toString());
  if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());

  // Utiliser le nouvel endpoint dédié aux commandes par client
  const url = `${API_URL}${API_PREFIX}${CUSTOMER_ORDERS_ENDPOINT}/${id}${queryParams.toString() ? `?${queryParams}` : ''}`;

  const token = getAuthToken();
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  // Gérer spécifiquement l'erreur 404 pour les commandes
  if (response.status === 404) {


    return getCustomerOrdersLegacy(id, params);
  }

  if (!response.ok) {
    await handleAuthError(response, () => getCustomerOrders(id, params));
  }

  return await response.json();
}

// Fonction de fallback utilisant l'ancien endpoint
async function getCustomerOrdersLegacy(id: string, params: { page?: number; limit?: number } = {}): Promise<PaginatedResponse<CustomerOrder>> {
  const queryParams = new URLSearchParams({ customerId: id });
  if (params.page !== undefined) queryParams.append('page', params.page.toString());
  if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
  const url = `${API_URL}${API_PREFIX}${ORDERS_ENDPOINT}?${queryParams}`;

  const token = getAuthToken();
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  // Gérer spécifiquement l'erreur 404 pour les commandes
  if (response.status === 404) {
    return { data: [], meta: { totalItems: 0, itemCount: 0, itemsPerPage: 10, totalPages: 0, currentPage: 1 } };
  }

  if (!response.ok) {
    await handleAuthError(response, () => getCustomerOrdersLegacy(id, params));
  }

  return await response.json();
}

export interface CustomerReview {
  id: string;
  customer_id: string;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
  dish_id?: string;
  restaurant_id?: string;
}

export async function getCustomerReviews(id: string, params: { page?: number; limit?: number } = {}): Promise<PaginatedResponse<CustomerReview>> {
  if (!id) throw new Error('ID client manquant');
  const queryParams = new URLSearchParams({ customerId: id });
  if (params.page !== undefined) queryParams.append('page', params.page.toString());
  if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
  const url = `${API_URL}${API_PREFIX}${REVIEWS_ENDPOINT}?${queryParams}`;

  const token = getAuthToken();
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });


  // Gérer spécifiquement l'erreur 404 pour les avis
  if (response.status === 404) {

    return { data: [], meta: { totalItems: 0, itemCount: 0, itemsPerPage: 10, totalPages: 0, currentPage: 1 } };
  }

  if (!response.ok) {
    await handleAuthError(response, () => getCustomerReviews(id, params));
  }
  return await response.json();
}

