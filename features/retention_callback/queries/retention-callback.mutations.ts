import { useMutation, useQueryClient } from '@tanstack/react-query';
import { retentionCallbackAPI } from '../apis/retention-callback.api';
import { retentionReasonAPI } from '../apis/retention-callback-reasons.api';
import { retentionKeys } from './index.query';
import type {
  ICreateRetentionCallbackDTO,
  IUpdateRetentionCallbackDTO,
  ICreateReasonDTO,
  IUpdateReasonDTO,
} from '../types/retention-callback.types';

// === CALLBACK MUTATIONS ===

export const useCreateRetentionCallbackMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ICreateRetentionCallbackDTO) => retentionCallbackAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: retentionKeys.all() });
    },
  });
};

export const useUpdateRetentionCallbackMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: IUpdateRetentionCallbackDTO }) =>
      retentionCallbackAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: retentionKeys.all() });
    },
  });
};

export const useDeleteRetentionCallbackMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => retentionCallbackAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: retentionKeys.all() });
    },
  });
};

// === REASON MUTATIONS ===

export const useCreateReasonMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ICreateReasonDTO) => retentionReasonAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: retentionKeys.reasons() });
    },
  });
};

export const useUpdateReasonMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: IUpdateReasonDTO }) =>
      retentionReasonAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: retentionKeys.reasons() });
    },
  });
};

export const useDeleteReasonMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => retentionReasonAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: retentionKeys.reasons() });
    },
  });
};

export const useReorderReasonsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => retentionReasonAPI.reorder(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: retentionKeys.reasons() });
    },
  });
};
