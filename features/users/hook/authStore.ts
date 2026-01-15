"use client";

import { create } from 'zustand';
import { login as apiLogin, refreshToken as apiRefreshToken, logout as apiLogout } from '../services/auth.service';
import { getCookie, setCookie, deleteCookie } from '@/utils/cookieHelpers';
import { useDashboardStore } from '@/store/dashboardStore';
import { Action, LoginCredentials, LoginResponse, Modules, RolePermissions } from '../types/auth.type';

interface AuthStore {
  user: LoginResponse;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  can: (module: Modules, action: Action) => boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
  setUser: (user: LoginResponse) => void;
  hydrate: () => void;
}

// Fonctions utilitaires pour gérer les cookies d'authentification
const saveAuthToCookies = (authData: { accessToken: string | null; refreshToken: string | null; user: LoginResponse | null; isAuthenticated: boolean }) => {
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

  let user: LoginResponse | null = null;
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
  let initialAuth: { user: LoginResponse | null; accessToken: string | null; refreshToken: string | null; isAuthenticated: boolean } = {
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false
  };

  // ✅ Charger immédiatement côté client
  if (typeof document !== 'undefined') {
    initialAuth = loadAuthFromCookies();
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
        set({
          user: authData.user,
          accessToken: authData.accessToken,
          refreshToken: authData.refreshToken,
          isAuthenticated: authData.isAuthenticated,
        });
      }
    },

    can: (module: Modules, action: Action) => {
      const { user, isAuthenticated } = get();

      // 1. Si pas d'user ou pas de permissions, refus par défaut
      if (!isAuthenticated || !user || !user.role) return false;

      // On récupère les permissions du rôle actuel
      const permissions = user.permissions;

      if (!permissions || !permissions.modules) return false;

      // 3. Vérification de l'exclusion
      if (permissions.exclusions?.includes(module)) return false;

      // 4. Vérification du module "ALL" (Super Admin)
      if (permissions.modules[Modules.ALL]?.includes(action)) return true;

      // 5. Vérification spécifique du module et de l'action
      const allowedActions = permissions.modules[module];
      return allowedActions?.includes(action) ?? false;
    },

    login: async (credentials: LoginCredentials) => {
      set({ isLoading: true, error: null });
      try {
        const data = await apiLogin(credentials);

        // On fusionne les permissions reçues dans l'objet utilisateur pour le stockage
        const { token, refreshToken, permissions, ...userData } = data;
        const userWithPermissions = { ...userData, permissions };

        const authData = {
          user: userWithPermissions as unknown as LoginResponse,
          accessToken: token,
          refreshToken: refreshToken,
          isAuthenticated: true
        };

        saveAuthToCookies(authData);
        set({ ...authData, isLoading: false });

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
        dashboardStore.setActiveTab(null);

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

    setUser: (user: LoginResponse) => {
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
