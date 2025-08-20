"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/types/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  logout: async () => {},
  refreshToken: async () => false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialiser l'u00e9tat d'authentification au chargement
  useEffect(() => {
    const initAuth = () => {
      try {
       
        setIsAuthenticated(false); // Valeur par défaut
        setUser(null); // Valeur par défaut
      } catch (error) {
        console.error('Erreur lors de l\'initialisation de l\'authentification:', error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Déconnexion
  const logout = async () => {
    try {
       setIsAuthenticated(false);
      setUser(null);
      router.push('/');
    } catch (error) {
      console.error('Erreur lors de la du00e9connexion:', error);
    }
  };

  // Rafraichissement du token
  const refreshToken = async (): Promise<boolean> => {
    try {
       const success = false;

      if (success) {
        const isAuth = false;
        const currentUser = null;

        setIsAuthenticated(isAuth);
        setUser(currentUser);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Erreur lors du rafraichissement du token:', error);
      return false;
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    logout,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
