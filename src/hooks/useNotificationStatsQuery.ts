import { useQuery } from '@tanstack/react-query';
import { NotificationAPI } from '@/services/notificationService';

interface UseNotificationStatsQueryProps {
  userId: string;
  enabled?: boolean;
}

export const useNotificationStatsQuery = ({ userId, enabled = true }: UseNotificationStatsQueryProps) => {
  return useQuery({
    queryKey: ['notification-stats', userId],
    queryFn: () => NotificationAPI.getNotificationStats(userId),
    enabled,
    staleTime: 30000, // 30 secondes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};
