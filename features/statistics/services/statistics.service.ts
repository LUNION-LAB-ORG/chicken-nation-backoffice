import { getPeriodDateRange } from '@/utils/dateUtils';
import {
  DashboardStatsParams,
  ApiDashboardResponse,
  DashboardStats,
  RevenueData,
  WeeklyOrdersData,
  BestSalesItem,
  DailySalesData
} from '../types/statistics.types';
import { api } from '../../../src/services/api';

// Fonction pour récupérer les vraies statistiques depuis l'API
export async function getApiDashboardStats(params: DashboardStatsParams = {}): Promise<ApiDashboardResponse> {
  try {
    const queryParams = new URLSearchParams();

    if (params.restaurantId) {
      queryParams.append('restaurantId', params.restaurantId);
    }

    // ✅ Gérer la conversion des périodes
    let finalPeriod = params.period;
    let startDate: string | undefined = params.startDate;
    let endDate: string | undefined = params.endDate;

    if (params.period) {
      const convertedParams = convertPeriodToApiParams(params.period);
      finalPeriod = convertedParams.period;

      if (convertedParams.startDate && !params.startDate) {
        startDate = convertedParams.startDate;
      }
      if (convertedParams.endDate && !params.endDate) {
        endDate = convertedParams.endDate;
      }
    }

    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    if (finalPeriod) queryParams.append('period', finalPeriod);

    const endpoint = `/statistics/dashboard${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    const response = await api.get<ApiDashboardResponse>(endpoint);

    return response;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des statistiques API:', error);
    throw error;
  }
}

// Fonction pour transformer les données API en format DashboardStats
export function transformApiDataToDashboardStats(apiData: ApiDashboardResponse): DashboardStats {
  try {
    // Les valeurs de l'API sont déjà formatées
    const revenueValue = apiData.stats.revenue.value || "0";
    const menusSoldValue = apiData.stats.menusSold.value || "0";
    let ordersValue = apiData.stats.totalOrders.value || "0";
    const clientsValue = apiData.stats.totalCustomers.value || "0";

    // Si les commandes sont à 0, essayer d'extraire depuis weeklyOrders
    if (ordersValue === "0" && apiData.weeklyOrders && apiData.weeklyOrders.dailyOrders) {
      const totalOrders = apiData.weeklyOrders.dailyOrders.reduce((sum, day) => sum + day.count, 0);
      if (totalOrders > 0) {
        ordersValue = totalOrders.toString();
      }
    }

    // Extraire les pourcentages depuis les badges
    const revenuePercentage = parseFloat(apiData.stats.revenue.badgeText.replace('%', '')) || 0;
    const menuPercentage = parseFloat(apiData.stats.menusSold.badgeText.replace('%', '')) || 0;

    // Calculs numériques pour les objectifs
    let revenueNumeric = parseInt(revenueValue.replace(/[^\d]/g, '')) || 0;
    const menuNumeric = parseInt(menusSoldValue.replace(/[^\d]/g, '')) || 0;

    // Fallback revenue depuis dailySales si nécessaire
    if (revenueNumeric === 0 && apiData.dailySales && apiData.dailySales.subtitle) {
      const dailySalesMatch = apiData.dailySales.subtitle.match(/(\d[\d\s]*)/);
      if (dailySalesMatch) {
        revenueNumeric = parseInt(dailySalesMatch[1].replace(/\s/g, '')) || 0;
      }
    }

    // Fallback revenue depuis les catégories
    if (revenueNumeric === 0 && apiData.dailySales?.categories?.length > 0) {
      let totalFromCategories = 0;
      apiData.dailySales.categories.forEach(category => {
        const categoryMatch = category.value.match(/(\d[\d\s]*)/);
        if (categoryMatch) {
          totalFromCategories += parseInt(categoryMatch[1].replace(/\s/g, '')) || 0;
        }
      });
      if (totalFromCategories > 0) {
        revenueNumeric = totalFromCategories;
      }
    }

    const revenueObjective = revenuePercentage > 0 ? Math.round(revenueNumeric / (revenuePercentage / 100)) : 25000000;
    const menuObjective = menuPercentage > 0 ? Math.round(menuNumeric / (menuPercentage / 100)) : 200;

    const finalResult: DashboardStats = {
      revenue: {
        value: revenueNumeric > 0 ? `${formatCurrency(revenueNumeric)}` : "0",
        objective: `Objectif : ${formatCurrency(revenueObjective)} xof`,
        percentage: Math.round(revenuePercentage)
      },
      menusSold: {
        value: menuNumeric > 0 ? `${menuNumeric} vendus` : "0 vendus",
        objective: `Reste : ${Math.max(0, menuObjective - menuNumeric)} à vendre`,
        percentage: Math.round(menuPercentage)
      },
      orders: {
        value: ordersValue !== "0" ? `${ordersValue} commandes` : "0 commandes"
      },
      clients: {
        value: clientsValue !== "0" ? `${clientsValue} clients` : "0 clients"
      },
      // ✅ AJOUT ICI : Mapper les statistiques de livraison
      deliveryStats: apiData.deliveryStats
    };

    return finalResult;
  } catch (error) {
    console.error('❌ Erreur lors de la transformation des données API:', error);
    throw error;
  }
}

// Calculer les statistiques globales
export async function getDashboardStats(restaurantId?: string, period: 'today' | 'week' | 'month' | 'lastMonth' | 'year' = 'month'): Promise<DashboardStats> {
  try {
    const apiData = await getApiDashboardStats({
      restaurantId,
      period
    });

    return transformApiDataToDashboardStats(apiData);
  } catch (apiError) {
    throw apiError;
  }
}

// Récupérer les données de revenus pour les graphiques
export async function getRevenueData(restaurantId?: string, period: 'today' | 'week' | 'month' | 'lastMonth' | 'year' = 'month'): Promise<RevenueData[]> {
  try {
    const apiData = await getApiDashboardStats({
      restaurantId,
      period
    });

    // ✅ CORRECTION : Mapper les données de revenu au lieu de renvoyer un tableau vide
    if (period === 'year' && apiData.revenue?.monthlyData) {
      return apiData.revenue.monthlyData;
    }

    // Pour today, week, month, on utilise dailyData (ou on adapte selon ce que le graph attend)
    // Ici je suppose que le graph attend un tableau simple, mais l'API renvoie une structure complexe pour dailyData
    // Si votre graph attend HourlyValue[], il faut mapper apiData.revenue.dailyData.hourlyValues
    if (period === 'today' && apiData.revenue?.dailyData?.hourlyValues) {
      // Adaptation possible selon le type RevenueData attendu par le graph
      return apiData.revenue.dailyData.hourlyValues.map(h => ({ name: h.hour, value: h.value }));
    }

    // Par défaut/fallback
    return [];

  } catch (err) {
    console.error('Erreur lors de la récupération des données de revenu:', err);
    throw err;
  }
}

// Récupérer les données des commandes hebdomadaires
export async function getWeeklyOrdersData(restaurantId?: string, dateRange?: string): Promise<WeeklyOrdersData[]> {
  try {
    let startDate: string | undefined, endDate: string | undefined;
    if (dateRange) {
      const [start, end] = dateRange.split('_');
      startDate = start;
      endDate = end;
    }

    const apiData = await getApiDashboardStats({
      restaurantId,
      period: 'week',
      startDate,
      endDate
    });

    if (apiData.weeklyOrders && apiData.weeklyOrders.dailyOrders) {
      return apiData.weeklyOrders.dailyOrders.map(dayData => ({
        name: dayData.day.charAt(0).toUpperCase() + dayData.day.slice(1),
        value: dayData.count
      }));
    }

    return [];
  } catch {
    return [];
  }
}

// Récupérer les données des meilleures ventes
export async function getBestSalesData(restaurantId?: string, period: 'today' | 'week' | 'month' | 'lastMonth' | 'year' = 'month'): Promise<BestSalesItem[]> {
  try {
    const apiData = await getApiDashboardStats({
      restaurantId,
      period
    });

    if (apiData.bestSellingMenus && apiData.bestSellingMenus.length > 0) {
      return apiData.bestSellingMenus.map((menu, index) => ({
        id: menu.id || `menu-${index}`,
        name: menu.name || `Menu ${index + 1}`,
        count: menu.count || 0,
        image: menu.image || '/images/food1.png',
        percentage: menu.percentage || 0,
        interestedPercentage: `${menu.percentage || 0}% des personnes intéressées`
      }));
    }

    return [];
  } catch {
    return [];
  }
}

// Récupérer les données des ventes journalières
export async function getDailySalesData(restaurantId?: string, period: 'today' | 'week' | 'month' | 'lastMonth' | 'year' = 'today'): Promise<DailySalesData[]> {
  try {
    const apiData = await getApiDashboardStats({
      restaurantId,
      period
    });

    if (apiData.dailySales && apiData.dailySales.categories) {
      return apiData.dailySales.categories.map(category => ({
        label: category.label,
        value: category.value,
        color: category.color,
        percentage: category.percentage
      }));
    }

    return [];
  } catch {
    return [];
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR').format(amount);
}

function convertPeriodToApiParams(period: 'today' | 'week' | 'month' | 'lastMonth' | 'year') {
  return getPeriodDateRange(period);
}