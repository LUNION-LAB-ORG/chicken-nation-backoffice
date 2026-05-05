import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

import { validatePickup } from '../services/operations-service';
import { useInvalidateOperationsQuery } from './index.query';

/**
 * Mutation caissière : valide la récupération d'une course par le livreur.
 * Cascade backend : Course → IN_DELIVERY, Orders → PICKED_UP, timestamps propagés.
 */
export const useValidatePickupMutation = () => {
  const invalidate = useInvalidateOperationsQuery();

  return useMutation({
    mutationFn: (pickup_code: string) => validatePickup(pickup_code),
    onSuccess: async () => {
      await invalidate();
      toast.success('Course validée — le livreur peut partir en livraison');
    },
    onError: (e: Error) => toast.error(e.message),
  });
};
