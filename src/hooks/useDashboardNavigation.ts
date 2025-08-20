"use client"

import { useDashboardStore } from '@/store/dashboardStore';
import { useAuthStore } from '@/store/authStore';

/**
 * Hook personnalisé pour gérer la navigation vers les dashboards spécialisés
 */
export const useDashboardNavigation = () => {
  const { setActiveTab, setSelectedRestaurantId } = useDashboardStore();
  const { user } = useAuthStore();

  /**
   * Navigue vers le dashboard d'un restaurant spécifique
   * @param restaurantId - ID du restaurant
   */
  const navigateToRestaurantDashboard = (restaurantId: string) => {
    // Définir le restaurant sélectionné
    setSelectedRestaurantId(restaurantId);

    // Naviguer vers le dashboard
    setActiveTab('dashboard');
  };

  /**
   * Navigue vers le dashboard global (super admin)
   */
  const navigateToGlobalDashboard = () => {
    // Réinitialiser le restaurant sélectionné
    setSelectedRestaurantId(null);

    // Naviguer vers le dashboard
    setActiveTab('dashboard');
  };

  /**
   * Détermine si l'utilisateur peut voir le dashboard global
   */
  const canViewGlobalDashboard = () => {
    return user?.role === 'ADMIN';
  };

  /**
   * Détermine si l'utilisateur peut voir le dashboard d'un restaurant spécifique
   */
  const canViewRestaurantDashboard = () => {
    if (user?.role === 'ADMIN') {
      // Super admin peut voir tous les restaurants
      return true;
    }

    if (user?.role === 'MANAGER') {
      // Manager peut voir seulement son restaurant (pour l'instant tous)
      return true;
    }

    return false;
  };

  /**
   * Détermine si l'utilisateur est actuellement dans une vue restaurant spécifique
   */
  const isViewingSpecificRestaurant = () => {
    const { selectedRestaurantId } = useDashboardStore.getState();
    return selectedRestaurantId !== null;
  };

  /**
   * Détermine si l'utilisateur peut revenir au dashboard global
   */
  const canReturnToGlobalDashboard = () => {
    return user?.role === 'ADMIN' && isViewingSpecificRestaurant();
  };

  return {
    navigateToRestaurantDashboard,
    navigateToGlobalDashboard,
    canViewGlobalDashboard,
    canViewRestaurantDashboard,
    isViewingSpecificRestaurant,
    canReturnToGlobalDashboard,
  };
};
