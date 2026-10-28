import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

// ⚠️ Import RELATIF entre features : `@/` pointe sur src/, `features/` est à la racine.
import { useInvalidateOperationsQuery } from '../../operations/queries/index.query';
import { relancerLivraisonCommande } from '../services/course.service';
import { texteLivraisonRelancee } from '../utils/relance-livraison';
import { TABLEAU_LIVRAISON_CLE } from './tableau-livraison.query';

/**
 * « Relancer la livraison » d'une livraison annulée par le livreur (demande
 * du 28/10) : la même livraison repart avec le même livreur, sans passage au
 * restaurant. Un toucher, aucune fenêtre de confirmation.
 *
 * Réussite (et rejeu, `deja: true`) : « Livraison relancée : ORD-123 avec
 * Koffi », suivi de « , par notification » si l'appli du livreur n'est pas
 * connectée. Refus : le texte du serveur. Dans les deux cas, relecture de la
 * liste des Opérations, du détail et du suivi de la commande (`['order']`),
 * des courses (`['courses']`) et du tableau de la livraison (alerte « a
 * annulé » qui tombe), comme « Sac rapporté ».
 */
export const useRelanceLivraisonMutation = () => {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateOperationsQuery();
  const relire = () => {
    void invalidate();
    void queryClient.invalidateQueries({ queryKey: TABLEAU_LIVRAISON_CLE });
  };

  return useMutation({
    mutationFn: ({ orderId }: { orderId: string; reference?: string | null }) => relancerLivraisonCommande(orderId),
    onSuccess: (reponse, { reference }) => {
      toast.success(texteLivraisonRelancee(reponse, reference));
      relire();
    },
    onError: (e: Error) => {
      toast.error(e.message);
      relire();
    },
  });
};
