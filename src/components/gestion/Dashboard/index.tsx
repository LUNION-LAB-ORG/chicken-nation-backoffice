"use client";
import { useAuthCleanup } from "@/hooks/useAuthCleanup";
import {
  getDashboardStats,
  getRevenueData,
} from "../../../../features/statistics/services/statistics.service";
import { useDashboardStore } from "@/store/dashboardStore";
import { useEffect, useState } from "react";
import {
  DashboardStats,
  RevenueData,
} from "../../../../features/statistics/types/statistics.types";
import { useAuthStore } from "../../../../features/users/hook/authStore";
import DailySales from "./DailySales";
import DeliveryStats from "./DeliveryStats"; // ✅ Import du nouveau composant
import "./Dashboard.css";
import DashboardHeader from "./DashboardHeader";
import { GenericStatCard } from "./GenericStatCard";
import RevenueChart from "./RevenueChart";
import WeeklyOrdersChart from "./WeeklyOrdersChart";
import RestaurantTabs from "../../../../features/orders/components/filtrage/RestaurantTabs";
import { UserType } from "../../../../features/users/types/user.types";
// import BestSalesChart from "./BestSalesChart";

const Dashboard = () => {
  const { setActiveTab, selectedRestaurantId, selectedPeriod } =
    useDashboardStore();
  const { user } = useAuthStore();

  useAuthCleanup();

  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(
    null,
  );
  const [revenueChartData, setRevenueChartData] = useState<RevenueData[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return;

      setIsLoadingStats(true);
      try {
        let stats: DashboardStats;
        let revenueData: RevenueData[];

        if (!selectedRestaurantId) {
          stats = await getDashboardStats(undefined, selectedPeriod);
          revenueData = await getRevenueData(undefined, selectedPeriod);
        } else {
          stats = await getDashboardStats(selectedRestaurantId, selectedPeriod);
          revenueData = await getRevenueData(
            selectedRestaurantId,
            selectedPeriod,
          );
        }

        setDashboardStats(stats);
        setRevenueChartData(revenueData);
      } catch (error) {
        console.error(error);
        setDashboardStats(null);
        setRevenueChartData([]);
      } finally {
        setIsLoadingStats(false);
      }
    };

    loadDashboardData();
  }, [user, selectedRestaurantId, selectedPeriod]);

  const getDisplayData = () => {
    if (dashboardStats) {
      return {
        stats: dashboardStats,
        revenue: revenueChartData,
      };
    }

    // Données vides par défaut
    return {
      stats: {
        revenue: { value: "0", objective: "Chargement...", percentage: 0 },
        menusSold: { value: "0", objective: "Chargement...", percentage: 0 },
        orders: { value: "0" },
        clients: { value: "0" },
        deliveryStats: undefined, // ✅ Initialisé
      },
      revenue: [],
    };
  };

  const { stats: statsData, revenue: revenueData } = getDisplayData();

  return (
    <div className="flex-1 overflow-auto p-4 custom-scrollbar pb-20">
      <div className="-mt-10">
        <DashboardHeader
          currentView="list"
          onCreateMenu={() => setActiveTab("menus")}
        />
      </div>
      <RestaurantTabs showAllTab={user && user.type === UserType.BACKOFFICE} />

      {isLoadingStats && (
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">
            {selectedRestaurantId
              ? "Chargement des statistiques du restaurant..."
              : "Chargement des statistiques globales..."}
          </div>
        </div>
      )}

      <div className="dashboard-container space-y-6">
        {/* --- LIGNE 1 : CARDS --- */}
        <div className="grid lg:grid-cols-4 lg:gap-10 md:grid-cols-2 grid-cols-1 gap-6">
          <GenericStatCard
            title=""
            value={statsData.revenue.value}
            unit="xof"
            badgeText={
              selectedRestaurantId
                ? "Revenu mensuel restaurant"
                : "Revenu mensuel total"
            }
            badgeColor="#EA4335"
            objective={{
              value: statsData.revenue.objective,
              percentage: statsData.revenue.percentage,
            }}
          />
          <GenericStatCard
            title=""
            value={statsData.menusSold.value}
            badgeText="Plats vendus"
            badgeColor="#F17922"
            objective={{
              value: statsData.menusSold.objective,
              percentage: statsData.menusSold.percentage,
            }}
            onClick={() => setActiveTab("menus")}
          />
          <GenericStatCard
            title=""
            value={statsData.orders.value}
            badgeText={
              selectedRestaurantId
                ? "Commandes restaurant"
                : "Total de commandes"
            }
            badgeColor="#4FCB71"
            onClick={() => setActiveTab("orders")}
          />
          <GenericStatCard
            title=""
            value={statsData.clients.value}
            badgeText={
              selectedRestaurantId ? "Nombre de clients" : "Clients total"
            }
            badgeColor="#007AFF"
            onClick={() => setActiveTab("clients")}
          />
        </div>

        {/* --- LIGNE 2 : GRAPHIQUES --- */}
        <div className="grid lg:grid-cols-2 gap-10 grid-cols-1">
          <RevenueChart
            data={revenueData}
            restaurantId={selectedRestaurantId}
            period={selectedPeriod}
          />
          <WeeklyOrdersChart
            restaurantId={selectedRestaurantId}
            period={selectedPeriod}
          />
        </div>
        {/* <div className="grid grid-cols-1 mt-3">
          <BestSalesChart
            title="Résumé des menus les plus vendus"
            restaurantId={selectedRestaurantId}
            period={selectedPeriod}
          />
        </div> */}
        {/* --- LIGNE 3 : DÉTAILS VENTES & LIVRAISON (Cote à cote) --- */}
        <div className="grid lg:grid-cols-2 gap-10 grid-cols-1">
          <DailySales
            restaurantId={selectedRestaurantId}
            period={selectedPeriod}
          />
          {/* ✅ Ajout du composant DeliveryStats ici */}
          <DeliveryStats
            data={statsData.deliveryStats}
            isLoading={isLoadingStats}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
