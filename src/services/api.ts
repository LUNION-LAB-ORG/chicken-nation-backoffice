import { SecureApiConfig } from '@/utils/apiKeySecurity';

const API_BASE_URL = SecureApiConfig.getApiUrl();
const API_PREFIX = '/api/v1';

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  method: RequestMethod;
  headers?: Record<string, string>;
  body?: string | FormData;
}


function getTokenFromCookies(): string | null {
  if (typeof document === 'undefined') return null;

  try {
    const cookies = document.cookie.split(';');

    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'chicken-nation-token') {
        return decodeURIComponent(value);
      }
    }

    return null;
  } catch {
    return null;
  }
}


function getRefreshTokenFromCookies(): string | null {
  if (typeof document === 'undefined') return null;

  try {
    const cookies = document.cookie.split(';');

    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'chicken-nation-refresh-token') {
        return decodeURIComponent(value);
      }
    }

    return null;
  } catch {
    return null;
  }
}


function updateAccessTokenInCookies(newToken: string): boolean {
  if (typeof document === 'undefined') return false;

  try {
    // Définir le cookie avec une expiration de 7 jours
    const expires = new Date();
    expires.setDate(expires.getDate() + 7);

    const cookieString = `chicken-nation-token=${encodeURIComponent(newToken)}; expires=${expires.toUTCString()}; path=/; secure=${process.env.NODE_ENV === 'production'}; samesite=lax`;
    document.cookie = cookieString;

    return true;
  } catch (error) {
    console.error('Erreur lors de la mise à jour du token:', error);
    return false;
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshTokenFromCookies();
  if (!refreshToken) return null;

  try {
    const url = `${API_BASE_URL}${API_PREFIX}/auth/refresh-token?type=USER`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${refreshToken}`,
      },
    });

    if (!response.ok) {
      console.error('Échec du rafraîchissement du token:', response.status);
      return null;
    }

    const data = await response.json();
    const newToken = data.token || data.accessToken;

    if (newToken) {
      updateAccessTokenInCookies(newToken);
      return newToken;
    }

    return null;
  } catch (error) {
    console.error('Erreur lors du rafraîchissement du token:', error);
    return null;
  }
}


export async function apiRequest<T>(
  endpoint: string,
  method: RequestMethod = 'GET',
  data?: unknown,
  requiresAuth: boolean = true
): Promise<T> {
  const url = `${API_BASE_URL}${API_PREFIX}${endpoint}`;

  const options: RequestOptions = {
    method,
    headers: {
      'Accept': 'application/json',
    }
  };

  if (requiresAuth) {
    const token = getTokenFromCookies();
    console.log('🔍 [API] Token récupéré des cookies:', token ? `"${token.substring(0, 20)}..."` : 'null');
    
    if (token) {
      // Vérifier si le token contient déjà le préfixe "Bearer "
      const authHeader = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      console.log('🔍 [API] Header Authorization généré:', authHeader.substring(0, 20) + '...');
      
      options.headers = {
        ...options.headers,
        'Authorization': authHeader
      };
    } else {
      console.warn('⚠️ [API] Aucun token trouvé dans les cookies');
    }
  }

  if (data) {
    if (data instanceof FormData) {
      options.body = data;
    } else {
      options.headers = {
        ...options.headers,
        'Content-Type': 'application/json'
      };
      options.body = JSON.stringify(data);
    }
  }

  try {
    // Effectuer la requête
    const response = await fetch(url, options as RequestInit);

    // Si la réponse est OK, retourner les données
    if (response.ok) {
      // Vérifier si la réponse est vide
      const text = await response.text();
      if (!text) {
        return {} as T;
      }

      // Sinon, parser le JSON
      const data = JSON.parse(text);
      return data as T;
    }

    if (response.status === 401 && requiresAuth) {
      try {
        const newToken = await refreshAccessToken();
        if (newToken) {
          return await apiRequest<T>(endpoint, method, data, requiresAuth);
        }
        throw new Error('Session expirée, veuillez vous reconnecter.');
      } catch {
        // Ne pas rediriger automatiquement, laisser le composant gérer l'erreur
        throw new Error('Session expirée, veuillez vous reconnecter.');
      }
    }

    // ✅ SÉCURITÉ: Messages d'erreur sécurisés selon le statut
    let errorMessage: string;

    // Pour debug: récupérer le message d'erreur du serveur pour les 400
    if (response.status === 400) {
      try {
        const errorText = await response.text();
        console.error('❌ [API] Erreur 400 détaillée:', errorText);
        const errorData = JSON.parse(errorText);
        console.error('❌ [API] Erreur 400 JSON:', errorData);
        errorMessage = errorData.message || errorData.error || 'Requête invalide (400)';
      } catch {
        errorMessage = 'Requête invalide (400)';
      }
    } else {
      switch (response.status) {
        case 401:
          errorMessage = 'Session expirée. Veuillez vous reconnecter.';
          break;
        case 403:
          errorMessage = 'Accès non autorisé.';
          break;
        case 404:
          errorMessage = 'Ressource non trouvée.';
          break;
        case 429:
          errorMessage = 'Trop de requêtes. Veuillez patienter.';
          break;
        case 500:
        case 502:
        case 503:
          errorMessage = 'Erreur temporaire du serveur. Réessayez plus tard.';
          break;
        default:
          errorMessage = 'Une erreur est survenue. Veuillez réessayer.';
      }
    }

    throw new Error(errorMessage);
  } catch (error) {
    // Gérer les erreurs de réseau ou autres
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Une erreur inconnue est survenue');
  }
}



export const api = {
  get: <T>(endpoint: string, requiresAuth: boolean = true): Promise<T> =>
    apiRequest<T>(endpoint, 'GET', undefined, requiresAuth),

  post: <T>(endpoint: string, data: unknown, requiresAuth: boolean = true): Promise<T> =>
    apiRequest<T>(endpoint, 'POST', data, requiresAuth),

  put: <T>(endpoint: string, data: unknown, requiresAuth: boolean = true): Promise<T> =>
    apiRequest<T>(endpoint, 'PUT', data, requiresAuth),

  patch: <T>(endpoint: string, data: unknown, requiresAuth: boolean = true): Promise<T> =>
    apiRequest<T>(endpoint, 'PATCH', data, requiresAuth),

  delete: <T>(endpoint: string, requiresAuth: boolean = true): Promise<T> =>
    apiRequest<T>(endpoint, 'DELETE', undefined, requiresAuth),
};
