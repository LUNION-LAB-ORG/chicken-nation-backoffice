import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useInvalidatePromoCodeQuery } from './index.query';
import {
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
  togglePromoCode,
} from '../services/promo-code.service';
import { CreatePromoCodeDto, UpdatePromoCodeDto } from '../types/promo-code.types';

// Créer un code promo
export const useCreatePromoCodeMutation = () => {
  const invalidate = useInvalidatePromoCodeQuery();

  return useMutation({
    mutationFn: (data: CreatePromoCodeDto) => createPromoCode(data),
    onSuccess: () => {
      invalidate('list');
      invalidate('stats');
      toast.success('Code promo créé avec succès');
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

// Mettre à jour un code promo
export const useUpdatePromoCodeMutation = () => {
  const invalidate = useInvalidatePromoCodeQuery();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePromoCodeDto }) =>
      updatePromoCode(id, data),
    onSuccess: (_, variables) => {
      invalidate('list');
      invalidate('detail', variables.id);
      invalidate('stats');
      toast.success('Code promo mis à jour avec succès');
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

// Supprimer un code promo
export const useDeletePromoCodeMutation = () => {
  const invalidate = useInvalidatePromoCodeQuery();

  return useMutation({
    mutationFn: (id: string) => deletePromoCode(id),
    onSuccess: () => {
      invalidate('list');
      invalidate('stats');
      toast.success('Code promo supprimé avec succès');
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

// Toggle actif/inactif
export const useTogglePromoCodeMutation = () => {
  const invalidate = useInvalidatePromoCodeQuery();

  return useMutation({
    mutationFn: (id: string) => togglePromoCode(id),
    onSuccess: () => {
      invalidate('list');
      invalidate('stats');
      toast.success('Statut du code promo mis à jour');
    },
    onError: (e: Error) => toast.error(e.message),
  });
};
