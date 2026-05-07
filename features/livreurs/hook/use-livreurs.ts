import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

import {
  assignRestaurantToLivreur,
  forceActivateLivreur,
  getAllLivreurs,
  getLivreurById,
  reactivateLivreur,
  rejectLivreur,
  softDeleteLivreur,
  suspendLivreur,
  validateLivreur,
} from '../services/livreur.service';
import type {
  AssignRestaurantPayload,
  LivreursQueryFilters,
  RejectLivreurPayload,
  SuspendLivreurPayload,
} from '../types/livreur.types';

// ---- Query Key Factory ----
export const livreursKeys = {
  all: () => ['livreurs'] as const,
  list: (filters?: LivreursQueryFilters) => ['livreurs', 'list', filters] as const,
  detail: (id: string) => ['livreurs', 'detail', id] as const,
};

// ============================================================
// Queries
// ============================================================

export const useLivreursList = (filters: LivreursQueryFilters = {}, enabled = true) =>
  useQuery({
    queryKey: livreursKeys.list(filters),
    queryFn: () => getAllLivreurs(filters),
    enabled,
    staleTime: 30 * 1000, // 30s — liste admin, on préfère des données fraîches
    gcTime: 5 * 60 * 1000,
  });

export const useLivreurDetail = (id: string | null, enabled = true) =>
  useQuery({
    queryKey: livreursKeys.detail(id ?? ''),
    queryFn: () => getLivreurById(id!),
    enabled: enabled && !!id,
    staleTime: 30 * 1000,
  });

// ============================================================
// Mutations — pattern : mutation + toast + invalidation
// ============================================================

/** Hook interne : factorise invalidation des listes + détail après mutation */
const useInvalidateLivreurs = () => {
  const qc = useQueryClient();
  return (id?: string) => {
    qc.invalidateQueries({ queryKey: livreursKeys.all() });
    if (id) qc.invalidateQueries({ queryKey: livreursKeys.detail(id) });
  };
};

export const useValidateLivreur = () => {
  const invalidate = useInvalidateLivreurs();
  return useMutation({
    mutationFn: (id: string) => validateLivreur(id),
    onSuccess: (_data, id) => {
      invalidate(id);
      toast.success('Livreur validé avec succès');
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useRejectLivreur = () => {
  const invalidate = useInvalidateLivreurs();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RejectLivreurPayload }) =>
      rejectLivreur(id, payload),
    onSuccess: (_data, vars) => {
      invalidate(vars.id);
      toast.success('Livreur refusé');
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useSuspendLivreur = () => {
  const invalidate = useInvalidateLivreurs();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SuspendLivreurPayload }) =>
      suspendLivreur(id, payload),
    onSuccess: (_data, vars) => {
      invalidate(vars.id);
      toast.success('Livreur suspendu');
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useReactivateLivreur = () => {
  const invalidate = useInvalidateLivreurs();
  return useMutation({
    mutationFn: (id: string) => reactivateLivreur(id),
    onSuccess: (_data, id) => {
      invalidate(id);
      toast.success('Livreur réactivé');
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useForceActivateLivreur = () => {
  const invalidate = useInvalidateLivreurs();
  return useMutation({
    mutationFn: (id: string) => forceActivateLivreur(id),
    onSuccess: (_data, id) => {
      invalidate(id);
      toast.success('Livreur activé (sans documents)');
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useAssignRestaurant = () => {
  const invalidate = useInvalidateLivreurs();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AssignRestaurantPayload }) =>
      assignRestaurantToLivreur(id, payload),
    onSuccess: (_data, vars) => {
      invalidate(vars.id);
      toast.success('Restaurant affecté au livreur');
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useDeleteLivreur = () => {
  const invalidate = useInvalidateLivreurs();
  return useMutation({
    mutationFn: (id: string) => softDeleteLivreur(id),
    onSuccess: () => {
      invalidate();
      toast.success('Livreur supprimé');
    },
    onError: (e: Error) => toast.error(e.message),
  });
};
