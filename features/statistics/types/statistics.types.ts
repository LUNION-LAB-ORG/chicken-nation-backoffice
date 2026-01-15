
// Types pour les statistiques du dashboard
export interface DashboardStats {
  revenue: {
    value: string;
    objective: string;
    percentage: number;
  };
  menusSold: {
    value: string;
    objective: string;
    percentage: number;
  };
  orders: {
    value: string;
  };
  clients: {
    value: string;
  };
}

export interface RevenueData {
  name: string;
  value: number;
}

export interface WeeklyOrdersData {
  name: string;
  value: number;
}

export interface ApiDashboardResponse {
  stats: {
    revenue: {
      title: string;
      value: string;
      unit: string;
      badgeText: string;
      badgeColor: string;
      iconImage: string;
    };
    menusSold: {
      title: string;
      value: string;
      badgeText: string;
      badgeColor: string;
      iconImage: string;
    };
    totalOrders: {
      title: string;
      value: string;
      badgeText: string;
      badgeColor: string;
      iconImage: string;
    };
    totalCustomers: {
      title: string;
      value: string;
      badgeText: string;
      badgeColor: string;
      iconImage: string;
    };
  };
  revenue: {
    dailyData: {
      total: string;
      trend: {
        percentage: string;
        comparedTo: string;
        isPositive: boolean;
      };
    };
  };
  weeklyOrders: {
    dateRanges: string[];
    currentRange: string;
    dailyOrders: Array<{
      day: string;
      count: number;
    }>;
  };
  bestSellingMenus: Array<{
    id?: string;
    name?: string;
    count?: number;
    image?: string;
    percentage?: number;
  }>;
  dailySales: {
    title: string;
    subtitle: string;
    categories: Array<{
      label: string;
      value: string;
      color: string;
      percentage: number;
    }>;
  };
}

// Interface pour les paramètres de requête
export interface DashboardStatsParams {
  restaurantId?: string;
  startDate?: string;
  endDate?: string;
  period?: 'today' | 'week' | 'month' | 'lastMonth' | 'year';
  dateRange?: string; // ✅ Ajouter le paramètre dateRange
}

export interface BestSalesItem {
  id: string;
  name: string;
  count: number;
  image: string;
  percentage: number;
  interestedPercentage: string;
}

export interface DailySalesData {
  label: string;
  value: string;
  color: string;
  percentage: number;
}
