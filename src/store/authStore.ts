"use client";

import { create } from 'zustand';
import { AuthState, LoginCredentials } from '@/types/auth';
import { login as apiLogin, refreshToken as apiRefreshToken, logout as apiLogout } from '@/services/authService';
import { getCookie, setCookie, deleteCookie } from '@/utils/cookieHelpers';
import { useDashboardStore } from '@/store/dashboardStore';
import { User } from '@/services';

interface AuthStore extends Omit<AuthState, 'refreshToken'> {
  refreshToken: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
  setUser: (user: User) => void;
  hydrate: () => void;
}

// Fonctions utilitaires pour gérer les cookies d'authentification
const saveAuthToCookies = (authData: { accessToken: string | null; refreshToken: string | null; user: User | null; isAuthenticated: boolean }) => {
  const expires = new Date();
  expires.setDate(expires.getDate() + 7); // 7 jours

  if (authData.accessToken) {
    setCookie('chicken-nation-token', authData.accessToken, { expires });
  }
  if (authData.refreshToken) {
    setCookie('chicken-nation-refresh-token', authData.refreshToken, { expires });
  }
  if (authData.user) {
    setCookie('chicken-nation-user', JSON.stringify(authData.user), { expires });
  }
  setCookie('chicken-nation-auth', authData.isAuthenticated.toString(), { expires });
};

const loadAuthFromCookies = () => {
  const accessToken = getCookie('chicken-nation-token');
  const refreshToken = getCookie('chicken-nation-refresh-token');
  const userCookie = getCookie('chicken-nation-user');
  const isAuthenticatedCookie = getCookie('chicken-nation-auth');

  let user: User | null = null;
  if (userCookie) {
    try {
      user = JSON.parse(userCookie);
    } catch {
      user = null;
    }
  }

  return {
    accessToken,
    refreshToken,
    user,
    isAuthenticated: isAuthenticatedCookie === 'true'
  };
};

const clearAuthCookies = () => {
  deleteCookie('chicken-nation-token');
  deleteCookie('chicken-nation-refresh-token');
  deleteCookie('chicken-nation-user');
  deleteCookie('chicken-nation-auth');
};

export function debugCookieStorage() {
  if (typeof document === 'undefined') return 'Non disponible (SSR)';

  try {
    const authData = loadAuthFromCookies();
    return {
      accessToken: authData.accessToken ? 'Présent' : 'Absent',
      refreshToken: authData.refreshToken ? 'Présent' : 'Absent',
      isAuthenticated: authData.isAuthenticated,
      user: authData.user ? 'Présent' : 'Absent',
      raw: authData
    };
  } catch (error) {
    // ✅ SÉCURITÉ: Ne pas exposer les détails d'erreur en production
    if (process.env.NODE_ENV === 'development') {
      return `Erreur: ${error instanceof Error ? error.message : String(error)}`;
    }
    return 'Erreur lors de la lecture des cookies';
  }
}

export const useAuthStore = create<AuthStore>()((set, get) => {
  // ✅ Initialiser avec les données des cookies au démarrage
  let initialAuth: { user: User | null; accessToken: string | null; refreshToken: string | null; isAuthenticated: boolean } = {
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false
  };

  // ✅ Charger immédiatement côté client
  if (typeof document !== 'undefined') {
    initialAuth = loadAuthFromCookies();
    console.log('🔄 [AuthStore] Chargement initial des cookies:', { 
      isAuthenticated: initialAuth.isAuthenticated,
      hasUser: !!initialAuth.user,
      hasToken: !!initialAuth.accessToken 
    });
  }

  const store = {
    user: initialAuth.user,
    accessToken: initialAuth.accessToken,
    refreshToken: initialAuth.refreshToken,
    isAuthenticated: initialAuth.isAuthenticated,
    isLoading: false,
    error: null,

    // ✅ Méthode pour forcer la réhydratation côté client
    hydrate: () => {
      if (typeof document !== 'undefined') {
        const authData = loadAuthFromCookies();
        console.log('🔄 [AuthStore] Réhydratation forcée:', { 
          isAuthenticated: authData.isAuthenticated,
          hasUser: !!authData.user,
          hasToken: !!authData.accessToken 
        });
        set({
          user: authData.user,
          accessToken: authData.accessToken,
          refreshToken: authData.refreshToken,
          isAuthenticated: authData.isAuthenticated,
        });
      }
    },

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });
        try {
           const data = await apiLogin(credentials);
          
          
           const accessToken = data.token || data.accessToken;
          
           
           let userToSet: User | null = null;
           if (data.user) { 
             userToSet = data.user as User; 
           } else {
           
             userToSet = {
               id: data.id,
               email: data.email,
               fullname: data.fullname,
               role: data.role,
               type: data.type,
               phone: (data as unknown as Record<string, unknown>).phone as string || undefined,
               address: (data as unknown as Record<string, unknown>).address as string || undefined,
               image: (data as unknown as Record<string, unknown>).image as string || undefined,
               restaurant_id: data.restaurant_id || undefined,
               restaurant: undefined,
               entity_status: (data as unknown as Record<string, unknown>).entity_status as string || undefined,
               created_at: (data as unknown as Record<string, unknown>).created_at as string || undefined,
               updated_at: (data as unknown as Record<string, unknown>).updated_at as string || undefined,
               password_is_updated: (data as unknown as Record<string, unknown>).password_is_updated !== undefined ? (data as unknown as Record<string, unknown>).password_is_updated as boolean : undefined,
               // Add any other fields from your User interface that might be in 'data'
             } as User;
           }

          const authData = {
            user: userToSet,
            accessToken: accessToken || null,
            refreshToken: data.refreshToken || null,
            isAuthenticated: true
          };

          // ✅ Sauvegarder dans les cookies
          saveAuthToCookies(authData);

          set({
            ...authData,
            isLoading: false,
          });
          
        } catch (error) {
          // ✅ SÉCURITÉ: Message d'erreur sécurisé
          const userMessage = error instanceof Error && error.message.includes('401')
            ? 'Email ou mot de passe incorrect'
            : 'Erreur de connexion. Veuillez réessayer.';

          set({
            isLoading: false,
            error: userMessage,
            isAuthenticated: false,
          });
          throw error;
        }
      },

      logout: async () => {
        try {
           await apiLogout();
        } finally {
          // ✅ Nettoyer les cookies
          clearAuthCookies();

          // ✅ Nettoyer le dashboard store (selectedRestaurantId, etc.)
          const dashboardStore = useDashboardStore.getState();
          dashboardStore.setSelectedRestaurantId(null);
          dashboardStore.setActiveTab('dashboard');

          console.log('🧹 [AuthStore] Cache dashboard nettoyé lors de la déconnexion');

          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            error: null,
          });
        }
      },

      refreshAccessToken: async () => {
        const currentRefreshToken = get().refreshToken;
        if (!currentRefreshToken) return false;

        try {
           const data = await apiRefreshToken(currentRefreshToken);
           const accessToken = data.token || data.accessToken;

           // ✅ Mettre à jour le token dans les cookies
           if (accessToken) {
             const expires = new Date();
             expires.setDate(expires.getDate() + 7);
             setCookie('chicken-nation-token', accessToken, { expires });
           }

          set({ accessToken });
          return true;
        } catch {
           await get().logout();
          return false;
        }
      },

      setUser: (user: User) => {
        // ✅ Mettre à jour l'utilisateur dans les cookies aussi
        if (user) {
          const expires = new Date();
          expires.setDate(expires.getDate() + 7);
          setCookie('chicken-nation-user', JSON.stringify(user), { expires });
        }
        set({ user });
      },
    };

  return store;
});
 
export function getAuthToken(): string | null {
  if (typeof document === 'undefined') return null;

  try {
    return getCookie('chicken-nation-token');
  } catch {
    return null;
  }
}

 
export function isUserAuthenticated(): boolean {
  if (typeof document === 'undefined') return false;

  try {
    const isAuth = getCookie('chicken-nation-auth');
    return isAuth === 'true';
  } catch {
    return false;
  }
}
