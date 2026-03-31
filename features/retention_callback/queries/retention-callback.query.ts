import { useQuery } from '@tanstack/react-query';
import { retentionCallbackAPI } from '../apis/retention-callback.api';
import { retentionKeys } from './index.query';
import type { IRetentionCallbackFilters } from '../types/retention-callback.types';

export const useRetentionCallbackListQuery = (filters: IRetentionCallbackFilters = {}, enabled = true) =>
  useQuery({
    queryKey: retentionKeys.list(filters),
    queryFn: () => retentionCallbackAPI.getAll(filters),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });

export const useRetentionCallbackDueQuery = (enabled = true) =>
  useQuery({
    queryKey: retentionKeys.due(),
    queryFn: () => retentionCallbackAPI.getDue(),
    enabled,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
  });

export const useRetentionCallbackDetailQuery = (id: string, enabled = true) =>
  useQuery({
    queryKey: retentionKeys.detail(id),
    queryFn: () => retentionCallbackAPI.getOne(id),
    enabled: !!id && enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });

export const useRetentionCallbackByCustomerQuery = (customerId: string, enabled = true) =>
  useQuery({
    queryKey: retentionKeys.customer(customerId),
    queryFn: () => retentionCallbackAPI.getByCustomer(customerId),
    enabled: !!customerId && enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });
