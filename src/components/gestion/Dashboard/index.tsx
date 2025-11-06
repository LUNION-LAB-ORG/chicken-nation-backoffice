"use client"
import React, { useEffect, useState } from 'react';
import './Dashboard.css';
import RevenueChart from './RevenueChart';
import DashboardHeader from './DashboardHeader';
import { GenericStatCard } from './GenericStatCard';
import WeeklyOrdersChart from './WeeklyOrdersChart';
import BestSalesChart from './BestSalesChart';
import DailySales from './DailySales';
import { useDashboardStore } from '@/store/dashboardStore';
import { useAuthStore } from '@/store/authStore';
import { getAllRestaurants, Restaurant } from '@/services/restaurantService';
import {
  getGlobalDashboardStats,
  getRestaurantDashboardStats,
  getRevenueData,
  DashboardStats,
  RevenueData
} from '@/services/dashboardService';
import { useDashboardNavigation } from '@/hooks/useDashboardNavigation';
import { useAuthCleanup } from '@/hooks/useAuthCleanup';

const Dashboard = () => {
  const { setActiveTab, selectedRestaurantId, selectedPeriod } = useDashboardStore();
  const { user } = useAuthStore();
  const { canReturnToGlobalDashboard, navigateToGlobalDashboard } = useDashboardNavigation();

  // ✅ Nettoyer les caches lors des changements d'auth
  useAuthCleanup();

  const [currentRestaurant, setCurrentRestaurant] = useState<Restaurant | null>(null);

  // États pour les vraies données
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [revenueChartData, setRevenueChartData] = useState<RevenueData[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Déterminer le type d'utilisateur et le mode d'affichage
  const isSuperAdmin = user?.role === 'ADMIN';
  const isRestaurantManager = user?.role === 'MANAGER';
  const isViewingSpecificRestaurant = selectedRestaurantId !== null;

  // Déterminer le mode d'affichage actuel
  const displayMode = isSuperAdmin && isViewingSpecificRestaurant
    ? 'admin-viewing-restaurant'
    : isSuperAdmin
    ? 'admin-global'
    : 'manager-restaurant';
 
  // Fonctions pour naviguer vers les différentes sections
  const handleMenusSoldClick = () => {
    setActiveTab('menus'); // Rediriger vers la section menus
  };

  const handleOrdersClick = () => {
    setActiveTab('orders'); // Rediriger vers la section commandes
  };

  const handleClientsClick = () => {
    setActiveTab('clients'); // Rediriger vers la section clients
  };

  // Charger les informations du restaurant
  useEffect(() => {
    const loadRestaurantInfo = async () => {
      if (isRestaurantManager || isViewingSpecificRestaurant) {
        try {
          const restaurants = await getAllRestaurants();

          if (isViewingSpecificRestaurant && selectedRestaurantId) {
            // Super admin regardant un restaurant spécifique
            const restaurant = restaurants.find(r => r.id === selectedRestaurantId);
            setCurrentRestaurant(restaurant || null);
          } else if (isRestaurantManager) {
            // ✅ Manager - utiliser son restaurant assigné
            if (user?.restaurant_id) {
              const assignedRestaurant = restaurants.find(r => r.id === user.restaurant_id);
              if (assignedRestaurant) {
                setCurrentRestaurant(assignedRestaurant);
           
              } else {
              
                setCurrentRestaurant(null);
              }
            } else {
            
              setCurrentRestaurant(null);
            }
          }
        } catch (error) {
          console.error('Erreur lors du chargement du restaurant:', error);
          setCurrentRestaurant(null);
        }
      } else {
         
        setCurrentRestaurant(null);
      }
    };

    void loadRestaurantInfo();
  }, [isRestaurantManager, isViewingSpecificRestaurant, selectedRestaurantId, user?.restaurant_id]);

  // Charger les statistiques du dashboard
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return;

      setIsLoadingStats(true);
      try {
        let stats: DashboardStats;
        let revenueData: RevenueData[];

        if (displayMode === 'admin-global') {
          // Super admin - vue globale avec période
          stats = await getGlobalDashboardStats(selectedPeriod);
          revenueData = await getRevenueData(undefined, selectedPeriod);
        } else if (displayMode === 'admin-viewing-restaurant' && currentRestaurant?.id) {
          // Super admin regardant un restaurant spécifique avec période
          stats = await getRestaurantDashboardStats(currentRestaurant.id, selectedPeriod);
          revenueData = await getRevenueData(currentRestaurant.id, selectedPeriod);
        } else if (displayMode === 'manager-restaurant' && currentRestaurant?.id) {
          // Manager de restaurant avec période
          stats = await getRestaurantDashboardStats(currentRestaurant.id, selectedPeriod);
          revenueData = await getRevenueData(currentRestaurant.id, selectedPeriod);
        } else {
          return; // Attendre que les données soient chargées
        }

        setDashboardStats(stats);
        setRevenueChartData(revenueData);
      } catch (error) {
        console.error('Erreur lors du chargement des stats:', error);
        // En cas d'erreur, utiliser les données par défaut
        setDashboardStats(null);
        setRevenueChartData([]);
      } finally {
        setIsLoadingStats(false);
      }
    };

    loadDashboardData();
  }, [user, isSuperAdmin, isRestaurantManager, currentRestaurant, displayMode, selectedPeriod]); // ✅ Ajouter selectedPeriod

  // Utiliser uniquement les vraies données - pas de fallback
  const getDisplayData = () => {
    if (dashboardStats) {
      return {
        stats: dashboardStats,
        revenue: revenueChartData
      };
    }

    // Données vides pendant le chargement
    return {
      stats: {
        revenue: { value: "0", objective: "Chargement...", percentage: 0 },
        menusSold: { value: "0", objective: "Chargement...", percentage: 0 },
        orders: { value: "0" },
        clients: { value: "0" }
      },
      revenue: []
    };
  };

  const { stats: statsData, revenue: revenueData } = getDisplayData();

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className='-mt-10'>
        <DashboardHeader
          currentView="list"
          onCreateMenu={() => setActiveTab('menus')}
        />
      </div>

      {/* Bouton de retour au dashboard global pour super admin */}
      {canReturnToGlobalDashboard() && (
        <div className="mb-4">
          <button
            type="button"
            onClick={navigateToGlobalDashboard}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-orange-100 hover:bg-orange-200 text-gray-500 rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="orange" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour au tableau de bord global
          </button>
        </div>
      )}

      {/* Indicateur de chargement */}
      {isLoadingStats && (
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">
            {displayMode === 'admin-global'
              ? "Chargement des statistiques globales..."
              : "Chargement des statistiques du restaurant..."}
          </div>
        </div>
      )}

      <div className="dashboard-container">
        <div className="grid lg:grid-cols-4 lg:gap-10 md:grid-cols-2 grid-cols-1 gap-6">
          <GenericStatCard
            title=""
            value={statsData.revenue.value}
            unit="xof"
            badgeText={displayMode === 'admin-global' ? "Revenu mensuel total" : "Revenu mensuel restaurant"}
            badgeColor="#EA4335"
            objective={{
              value: statsData.revenue.objective,
              percentage: statsData.revenue.percentage
            }}
          />
          <GenericStatCard
            title=""
            value={statsData.menusSold.value}
            badgeText="Plats vendus"
            badgeColor="#F17922"
            objective={{
              value: statsData.menusSold.objective,
              percentage: statsData.menusSold.percentage
            }}
            onClick={handleMenusSoldClick}
          />
          <GenericStatCard
            title=""
            value={statsData.orders.value}
            badgeText={displayMode === 'admin-global' ? "Total de commandes" : "Commandes restaurant"}
            badgeColor="#4FCB71"
            onClick={handleOrdersClick}
          />
          <GenericStatCard
            title=""
            value={statsData.clients.value}
            badgeText={displayMode === 'admin-global' ? "Nombre de clients" : "Clients restaurant"}
            badgeColor="#007AFF"
            onClick={handleClientsClick}
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-10 mt-3 grid-cols-1">
          <RevenueChart data={revenueData} restaurantId={currentRestaurant?.id} period={selectedPeriod} />
          <WeeklyOrdersChart restaurantId={currentRestaurant?.id} period={selectedPeriod} />
        </div>
        <div className="grid grid-cols-1 mt-3">
          <BestSalesChart
            title="Résumé des menus les plus vendus"
            restaurantId={currentRestaurant?.id}
            period={selectedPeriod}
          />
        </div>
        <div className="lg:grid grid-cols-2 mt-2">
          <DailySales restaurantId={currentRestaurant?.id} period={selectedPeriod} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;