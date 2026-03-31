import { useQuery } from '@tanstack/react-query';
import { retentionReasonAPI } from '../apis/retention-callback-reasons.api';
import { retentionKeys } from './index.query';

export const useRetentionReasonsQuery = (enabled = true) =>
  useQuery({
    queryKey: retentionKeys.reasons(),
    queryFn: () => retentionReasonAPI.getAll(),
    enabled,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 2,
  });
