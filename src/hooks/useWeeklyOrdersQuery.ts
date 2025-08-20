import { useQuery } from '@tanstack/react-query';
import { getWeeklyOrdersData } from '@/services/dashboardService';

interface UseWeeklyOrdersQueryProps {
  restaurantId?: string;
  dateRange?: string;
  period?: 'today' | 'week' | 'month' | 'lastMonth' | 'year';
  enabled?: boolean;
}

export const useWeeklyOrdersQuery = ({
  restaurantId,
  dateRange,
  period = 'week',
  enabled = true
}: UseWeeklyOrdersQueryProps) => {
  return useQuery({
    queryKey: ['weekly-orders', restaurantId, dateRange, period],
    queryFn: () => getWeeklyOrdersData(restaurantId, dateRange),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
};
