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
import { messageChangement, messageValidation } from '../utils/rattachement';

// ---- Query Key Factory ----
export const livreursKeys = {
  all: () => ['livreurs'] as const,
  list: (filters?: LivreursQueryFilters) => ['livreurs', 'list', filters] as const,
  detail: (id: string) => ['livreurs', 'detail', id] as const,
};

// ============================================================
// Queries
// ============================================================

export const useLivreursList = (
  filters: LivreursQueryFilters = {},
  enabled = true,
  // Fenêtre « Forcer l'affectation » : état des livreurs relu à l'ouverture et tant qu'elle reste ouverte.
  options: { staleTime?: number; refetchInterval?: number } = {},
) =>
  useQuery({
    queryKey: livreursKeys.list(filters),
    queryFn: () => getAllLivreurs(filters),
    enabled,
    staleTime: options.staleTime ?? 30 * 1000, // 30s — liste admin, on préfère des données fraîches
    refetchInterval: options.refetchInterval,
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
  return (id?: string, plannings = false) => {
    qc.invalidateQueries({ queryKey: livreursKeys.all() });
    if (id) qc.invalidateQueries({ queryKey: livreursKeys.detail(id) });
    // Validation et changement de restaurant déplacent le livreur dans les plannings (09/11).
    if (plannings) qc.invalidateQueries({ queryKey: ['schedule'] });
  };
};

/**
 * Validation, activation, changement de restaurant (09/11) : le livreur, le
 * restaurant choisi et les noms pour le message (« ajouté au planning de ZONE 4 »).
 * Un identifiant seul : le geste d'avant, sans restaurant choisi.
 */
export interface GesteRattachement {
  id: string;
  restaurantId?: string;
  nomRestaurant?: string | null;
}

const enGeste = (v: string | GesteRattachement): GesteRattachement => (typeof v === 'string' ? { id: v } : v);

export const useValidateLivreur = () => {
  const invalidate = useInvalidateLivreurs();
  return useMutation({
    mutationFn: (v: string | GesteRattachement) => validateLivreur(enGeste(v).id, enGeste(v).restaurantId),
    onSuccess: (data, v) => {
      invalidate(enGeste(v).id, true);
      toast.success(messageValidation(data?.plannings, enGeste(v).nomRestaurant ?? data?.restaurant?.name));
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
    mutationFn: (v: string | GesteRattachement) => forceActivateLivreur(enGeste(v).id, enGeste(v).restaurantId),
    onSuccess: (data, v) => {
      invalidate(enGeste(v).id, true);
      toast.success(
        messageValidation(data?.plannings, enGeste(v).nomRestaurant ?? data?.restaurant?.name, 'Livreur activé (sans documents)'),
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useAssignRestaurant = () => {
  const invalidate = useInvalidateLivreurs();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: AssignRestaurantPayload;
      /** Noms pour le message : « retiré du planning de FAYA, ajouté à celui de ZONE 4 ». */
      ancienNom?: string | null;
      nouveauNom?: string | null;
    }) => assignRestaurantToLivreur(id, payload),
    onSuccess: (data, vars) => {
      invalidate(vars.id, true);
      toast.success(messageChangement(data?.plannings, vars.ancienNom, vars.nouveauNom ?? data?.restaurant?.name));
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
