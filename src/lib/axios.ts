import axios from 'axios';
import { getCookie } from '@/utils/cookieHelpers';

// Configuration de l'instance Axios principale
export const api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api/v1`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter automatiquement le token
api.interceptors.request.use(
  (config) => {
    const token = getCookie('chicken-nation-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer le refresh token automatiquement
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = getCookie('chicken-nation-refresh-token');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const refreshResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/refresh-token?type=USER`,
          {
            headers: {
              Authorization: `Bearer ${refreshToken}`,
            },
          }
        );

        const newToken = refreshResponse.data.token || refreshResponse.data.accessToken;
        
        if (newToken) {
          // Mettre à jour le cookie
          const expires = new Date();
          expires.setDate(expires.getDate() + 7);
          document.cookie = `chicken-nation-token=${encodeURIComponent(newToken)}; expires=${expires.toUTCString()}; path=/; secure=${process.env.NODE_ENV === 'production'}; samesite=lax`;
          
          // Relancer la requête originale avec le nouveau token
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Rediriger vers la page de login si le refresh échoue
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
