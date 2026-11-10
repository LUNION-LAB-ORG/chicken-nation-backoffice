import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

import { debloquerLivreur } from '../services/livreur.service';

/**
 * « Débloquer » (10/11) : pause automatique levée par le siège. Le message
 * vient du serveur. Listes des livreurs, carte, fiche (scoring) et tableau de
 * la livraison relus : le livreur repasse « Disponible » partout.
 */
export const useDebloquerLivreurMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (livreurId: string) => debloquerLivreur(livreurId),
    onSuccess: async (r) => {
      if (r.debloque) toast.success(r.message);
      else toast(r.message);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['livreurs'] }),
        queryClient.invalidateQueries({ queryKey: ['deliverers'] }),
        queryClient.invalidateQueries({ queryKey: ['livraison'] }),
      ]);
    },
    onError: (e: Error) => toast.error(e.message),
  });
};
