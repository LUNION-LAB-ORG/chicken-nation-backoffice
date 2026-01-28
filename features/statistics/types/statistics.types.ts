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
  deliveryStats?: DeliveryStatsData;
}

export interface RevenueData {
  name: string;
  value: number;
}

export interface WeeklyOrdersData {
  name: string;
  value: number;
}

// ==========================================
// 1. NOUVELLES INTERFACES POUR LA LIVRAISON
// ==========================================

export interface DeliveryFeeBreakdown {
  label: string;                  // ex: "Gratuit", "500 FCFA"
  feeAmount: number | null;       // null si "Autres"
  orderCount: number;
  revenueGenerated: string;       // ex: "150 000 XOF"
  deliveryFeesCollected: number;
  percentage: number;
}

export interface DeliveryStatsData {
  totalDeliveryFees: number;
  totalDeliveryRevenue: number;
  breakdown: DeliveryFeeBreakdown[];
}

// ==========================================
// 2. MISE À JOUR DE LA RÉPONSE API
// ==========================================

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
  // ✅ AJOUT ICI : Les stats de livraison
  deliveryStats: DeliveryStatsData;
}

// Interface pour les paramètres de requête
export interface DashboardStatsParams {
  restaurantId?: string;
  startDate?: string;
  endDate?: string;
  period?: 'today' | 'week' | 'month' | 'lastMonth' | 'year';
  dateRange?: string;
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