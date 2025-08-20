"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

interface JwtPayload {
  exp: number;
  iat?: number;
  sub?: string;
  role?: string;
  [key: string]: unknown;
}

 const decodeJwt = (token: string): JwtPayload => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT token:', error);
    return { exp: 0 };
  }
};


export const useAuth = () => {
  const router = useRouter();
  const {
    user,
    accessToken,
    // refreshToken, // Non utilisé actuellement
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    refreshAccessToken
  } = useAuthStore();

  // Vérifier si le token est expiré
  const isTokenExpired = (token: string | null): boolean => {
    if (!token) return true;

    try {
      const decoded = decodeJwt(token);
      const currentTime = Date.now() / 1000;

      return decoded.exp < currentTime;
    } catch (error) {
      console.error('Error decoding token:', error);
      return true;
    }
  };

  // Rafraîchir le token avant qu'il n'expire
  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    try {
      const decoded = decodeJwt(accessToken);
      const expiresIn = decoded.exp - Date.now() / 1000;

      // Rafraîchir le token 5 minutes avant son expiration
      const timeoutId = setTimeout(async () => {
        const success = await refreshAccessToken();
        if (!success) {
          // Rediriger vers la page de connexion en cas d'échec
          router.push('/');
        }
      }, (expiresIn - 300) * 1000);

      return () => clearTimeout(timeoutId);
    } catch (error) {
      console.error('Error setting up token refresh:', error);
    }
  }, [accessToken, isAuthenticated, refreshAccessToken, router]);

  // Vérifier l'authentification au chargement de la page
  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated) return;

      if (isTokenExpired(accessToken)) {
        // Tenter de rafraîchir le token s'il est expiré
        const success = await refreshAccessToken();
        if (!success) {
          // Rediriger vers la page de connexion en cas d'échec
          router.push('/');
        }
      }
    };

    checkAuth();
  }, [accessToken, isAuthenticated, refreshAccessToken, router]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
     isTokenExpired,
    refreshAccessToken,
  };
};

export default useAuth;
