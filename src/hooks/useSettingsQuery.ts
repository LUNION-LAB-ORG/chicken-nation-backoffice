import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSettings, getSetting, updateSetting, deleteSetting, Setting } from '@/services/settings.service';
import { toast } from 'react-hot-toast';

export const settingsQueryKey = (prefix?: string) => ['settings', prefix ?? 'all'];

export const useSettingsQuery = (prefix?: string) => {
  return useQuery<Setting[]>({
    queryKey: settingsQueryKey(prefix),
    queryFn: () => getSettings(prefix),
    staleTime: 5 * 60 * 1000,
  });
};

export const useSettingQuery = (key: string) => {
  return useQuery({
    queryKey: ['settings', 'single', key],
    queryFn: () => getSetting(key),
    staleTime: 5 * 60 * 1000,
    enabled: !!key,
  });
};

export const useSettingMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, value, description }: { key: string; value: string; description?: string }) => {
      return updateSetting(key, value, description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Paramètre mis à jour');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la mise à jour');
    },
  });
};

export const useSettingDeleteMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (key: string) => {
      return deleteSetting(key);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Paramètre supprimé');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la suppression');
    },
  });
};
