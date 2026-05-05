import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

import { markOrderPaidCash } from '../services/operations-service';
import { useInvalidateOperationsQuery } from './index.query';

/**
 * Mutation caissière : encaisse le livreur pour une commande espèce (OFFLINE).
 * Cascade : Order.paied = true + paied_at + status → COMPLETED (si pas déjà).
 */
export const useMarkOrderPaidCashMutation = () => {
  const invalidate = useInvalidateOperationsQuery();

  return useMutation({
    mutationFn: ({ orderId, amount }: { orderId: string; amount?: number }) =>
      markOrderPaidCash(orderId, amount),
    onSuccess: async () => {
      await invalidate();
      toast.success('Encaissement enregistré — commande clôturée');
    },
    onError: (e: Error) => toast.error(e.message),
  });
};
