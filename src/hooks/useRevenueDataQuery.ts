import { useQuery } from '@tanstack/react-query';
import { getApiDashboardStats } from '../../features/statistics/services/statistics.service';

interface UseRevenueDataQueryProps {
  restaurantId?: string;
  enabled?: boolean;
  period?: 'today' | 'week' | 'month' | 'lastMonth' | 'year';
}

export interface RevenueDataResponse {
  total: string;
  trend: {
    percentage: string;
    comparedTo: string;
    isPositive: boolean;
  };
}

export const useRevenueDataQuery = ({ 
  restaurantId, 
  enabled = true,
  period = 'month'
}: UseRevenueDataQueryProps) => {
  return useQuery({
    queryKey: ['revenue-data', restaurantId, period], // ✅ Inclure period dans la clé de cache
    queryFn: async () => {
      const apiData = await getApiDashboardStats({
        restaurantId,
        period // ✅ Passer la période à l'API
      });
      
      
      
      // Extraire les données de revenu journalier
      if (apiData.revenue?.dailyData) {
        return {
          total: apiData.revenue.dailyData.total,
          trend: apiData.revenue.dailyData.trend
        } as RevenueDataResponse;
      }
      
      // Fallback si pas de données
      return {
        total: "0 XOF",
        trend: {
          percentage: "0%",
          comparedTo: "hier",
          isPositive: true
        }
      } as RevenueDataResponse;
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
};
