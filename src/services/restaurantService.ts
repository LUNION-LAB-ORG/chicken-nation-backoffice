export interface Schedule {
  [day: string]: string;
}

export interface Restaurant {
  id?: string;
  name: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  email: string;
  schedule: Schedule[];
  managerFullname?: string;
  managerEmail?: string;
  managerPhone?: string;
  manager?: string | {
    id?: string;
    email: string;
    password: string;
    fullname?: string;
    phone?: string;
  };
  image?: string;
  active?: boolean;
  entity_status?: string;
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
}

import { getHumanReadableError, validateRestaurantError } from '@/utils/errorMessages';

const API_URL = process.env.NEXT_PUBLIC_API_PREFIX;

const RESTAURANTS_URL =   API_URL + '/restaurants';

// Fonction utilitaire pour récupérer le token depuis les cookies
function getAuthToken(): string | null {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'chicken-nation-token') {
      return decodeURIComponent(value);
    }
  }
  return null;
}

export async function getAllRestaurants(): Promise<Restaurant[]> {
  try {
    const token = getAuthToken();

    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(RESTAURANTS_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return data.data.map((restaurant: Restaurant) => ({
      ...restaurant,
      active: restaurant?.entity_status === 'ACTIVE',
      createdAt: restaurant?.created_at
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération des restaurants:', error);
    const userMessage = getHumanReadableError(error);
    throw new Error(userMessage);
  }
}


export async function getRestaurantById(id: string): Promise<Restaurant> {
  try {
    const token = getAuthToken();

    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${RESTAURANTS_URL}/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

     let restaurantData;
    if (data && data.data) {
      restaurantData = data.data;
    } else if (data && typeof data === 'object') {
       restaurantData = data;
    } else {
      throw new Error('Format de réponse API inattendu');
    }


    if (restaurantData.schedule && typeof restaurantData.schedule === 'string') {
      try {
        restaurantData.schedule = JSON.parse(restaurantData.schedule);
      } catch (error) {
        console.error('Erreur lors du parsing du schedule:', error);
         restaurantData.schedule = [];
      }
    }

     return {
      ...restaurantData,
      active: restaurantData?.entity_status === 'ACTIVE' || restaurantData?.active === true,
      createdAt: restaurantData?.created_at || restaurantData?.createdAt
    };
  } catch (error) {
    console.error(`Erreur lors de la récupération du restaurant ${id}:`, error);
    const userMessage = getHumanReadableError(error);
    throw new Error(userMessage);
  }
}

/**
 * Crée un nouveau restaurant
 */
export async function createRestaurant(formData: FormData): Promise<Restaurant> {
  try {
    const token = getAuthToken();

    if (!token) {
      throw new Error('Authentication required');
    }

     const scheduleStr = formData.get('schedule');
    if (scheduleStr && typeof scheduleStr === 'string') {
       formData.delete('schedule');

      try {
         const scheduleData = JSON.parse(scheduleStr);

         if (Array.isArray(scheduleData)) {
           const formattedSchedule = scheduleData.map(item => {
             if (typeof item === 'object' && Object.keys(item).length === 1) {
              return item;
            }


            return item;
          });

           formData.set('schedule', JSON.stringify(formattedSchedule));
        } else {
          console.error('Les données de schedule ne sont pas un tableau:' );
        }
      } catch (error) {
        console.error('Erreur lors du parsing du schedule:', error);
      }
    }


    const response = await fetch(RESTAURANTS_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
       },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(` Erreur ${response.status}:`, errorText);
      throw new Error(`Erreur: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    const restaurant = data.restaurant || data.data;

     if (data.managerCredentials) {
      restaurant.manager = {
        email: data.managerCredentials.email,
        password: data.managerCredentials.password
      };

    }

    return {
      ...restaurant,
      active: restaurant?.entity_status === 'ACTIVE',
      createdAt: restaurant?.created_at
    };
  } catch (error) {
    console.error(` Erreur:`, error);
    const userMessage = validateRestaurantError(error, 'create');
    throw new Error(userMessage);
  }
}


export interface CreateRestaurantData {
  name: string;
  address: string;
  phone: string;
  email?: string;
  description?: string;
  schedule?: unknown[];
  managerEmail?: string;
  managerFullname?: string;
  latitude?: number;
  longitude?: number;
}

export async function createRestaurantJSON(restaurantData: CreateRestaurantData): Promise<Restaurant> {
  try {
    const token = getAuthToken();

    if (!token) {
      throw new Error('Authentication required');
    }



    const response = await fetch(RESTAURANTS_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(restaurantData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erreur API:', response.status, errorText);
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();


    const restaurant = data.restaurant || data.data;

     if (data.managerCredentials) {
      restaurant.manager = {
        email: data.managerCredentials.email,
        password: data.managerCredentials.password
      };

      console.log('Identifiants du manager récupérés directement:' );
      return {
        ...restaurant,
        active: restaurant?.entity_status === 'ACTIVE',
        createdAt: restaurant?.created_at
      };
    }

    if (restaurant && restaurant.id && (restaurantData.managerEmail || restaurantData.managerFullname)) {
      try {
         const managerResponse = await fetch(`${RESTAURANTS_URL}/${restaurant.id}/manager`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (managerResponse.ok) {
          const managerData = await managerResponse.json();
          console.log('Identifiants du manager récupérés (JSON):' );

          if (managerData.data) {
            restaurant.manager = managerData.data;
          }
        }
      } catch (managerError) {
        console.error('Erreur lors de la récupération des identifiants du manager (JSON):', managerError);
       }
    }

    return {
      ...restaurant,
      active: restaurant?.entity_status === 'ACTIVE',
      createdAt: restaurant?.created_at
    };
  } catch (error) {
    console.error('Erreur lors de la création du restaurant (JSON):', error);
    const userMessage = validateRestaurantError(error, 'create');
    throw new Error(userMessage);
  }
}

export async function updateRestaurant(id: string, formData: FormData): Promise<Restaurant> {
  try {
    const token = getAuthToken();

    if (!token) {
      throw new Error('Authentication required');
    }

     const scheduleStr = formData.get('schedule');
    if (scheduleStr && typeof scheduleStr === 'string') {
       formData.delete('schedule');

      try {
        const scheduleData = JSON.parse(scheduleStr);

         if (Array.isArray(scheduleData)) {
           const formattedSchedule = scheduleData.map(item => {
             if (typeof item === 'object' && Object.keys(item).length === 1) {
              return item;
            }


            return item;
          });

           formData.set('schedule', JSON.stringify(formattedSchedule));
        } else {

        }
      } catch (error) {
        console.error('Erreur lors du parsing du schedule:', error);
      }
    }

    


    const response = await fetch(`${RESTAURANTS_URL}/${id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`
       },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(` Erreur ${response.status}:`, errorText);
      throw new Error(`Erreur: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const restaurant = data.data || data;

    return {
      ...restaurant,
      active: restaurant?.entity_status === 'ACTIVE',
      createdAt: restaurant?.created_at
    };
  } catch (error) {
    console.error(` Erreur:`, error);
    const userMessage = validateRestaurantError(error, 'update');
    throw new Error(userMessage);
  }
}

/**
 * Met à jour le statut actif/inactif d'un restaurant
 */
export async function updateRestaurantStatus(id: string, active: boolean): Promise<Restaurant> {
  try {
    const token = getAuthToken();

    if (!token) {
      throw new Error('Authentication required');
    }

     const response = await fetch(`${RESTAURANTS_URL}/${id}/activateDeactivate`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ active })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    const restaurant = data.data;
    return {
      ...restaurant,
      active: restaurant?.entity_status === 'ACTIVE',
      createdAt: restaurant?.created_at
    };
  } catch (error) {
    const userMessage = validateRestaurantError(error, 'activate');
    throw new Error(userMessage);
  }
}

/**
 * Supprime un restaurant
 */
export async function deleteRestaurant(id: string): Promise<void> {
  try {
    const token = getAuthToken();

    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${RESTAURANTS_URL}/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error(`Erreur lors de la suppression du restaurant ${id}:`, error);
    const userMessage = validateRestaurantError(error, 'delete');
    throw new Error(userMessage);
  }
}

/**
 * Récupère le manager d'un restaurant
 */
export interface RestaurantManager {
  id: string;
  fullname: string;
  email: string;
  password?: string;
}

export async function getRestaurantManager(id: string): Promise<RestaurantManager> {
  try {
    const token = getAuthToken();

    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${RESTAURANTS_URL}/${id}/manager`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();


     if (data && typeof data === 'object' && data.fullname) {
      return data;
    }

     if (data && data.data) {
      return data.data;
    }

    throw new Error('Format de réponse API inattendu pour le manager');
  } catch (error) {
    throw error;
  }
}


export interface RestaurantUser {
  id: string;
  fullname: string;
  email: string;
  role: string;
  entity_status: string;
  created_at: string;
  updated_at: string;
}

export async function getRestaurantUsers(id: string): Promise<RestaurantUser[]> {
  try {
    const token = getAuthToken();

    if (!token) {
      throw new Error('Authentication required');
    }

    const url = `${RESTAURANTS_URL}/${id}/users`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // L'API retourne directement un tableau, pas un objet avec data
    if (Array.isArray(data)) {
      return data;
    } else if (data.data && Array.isArray(data.data)) {
      return data.data;
    } else {
      return [];
    }
  } catch (error) {
    throw error;
  }
}
