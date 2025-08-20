import { useQuery } from '@tanstack/react-query';
import { getDailySalesData } from '@/services/dashboardService';

interface UseDailySalesQueryProps {
  restaurantId?: string;
  period?: 'today' | 'week' | 'month' | 'lastMonth' | 'year';
  enabled?: boolean;
}

export const useDailySalesQuery = ({ 
  restaurantId, 
  period = 'today',
  enabled = true 
}: UseDailySalesQueryProps) => {
  return useQuery({
    queryKey: ['daily-sales', restaurantId, period],
    queryFn: () => getDailySalesData(restaurantId, period),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
};
