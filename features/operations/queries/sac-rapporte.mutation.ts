import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

// ⚠️ Import RELATIF entre features : `@/` pointe sur src/, `features/` est à la racine.
import { TABLEAU_LIVRAISON_CLE } from '../../courses/queries/tableau-livraison.query';
import { sacRapporte } from '../services/operations-service';
import { texteSacRapporte } from '../utils/sac-a-rapporter';
import { useInvalidateOperationsQuery } from './index.query';

/**
 * « Sac rapporté » (demande du 28/10) : la commande dont le livreur a annulé
 * la livraison redevient prête, le planificateur la reprend dans une
 * nouvelle course. Un toucher, aucune fenêtre de confirmation.
 *
 * Réussite (et rejeu, `deja: true`) : « Sac rapporté : ORD-123 de nouveau
 * prête ». Refus : le texte du serveur. Dans les deux cas, relecture de la
 * liste des Opérations, du détail et du suivi de la commande (`['order']`),
 * de la fiche de la course (`['courses']`) et du tableau de la livraison
 * (alerte « a annulé » qui tombe).
 */
export const useSacRapporteMutation = () => {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateOperationsQuery();
  const relire = () => {
    void invalidate();
    void queryClient.invalidateQueries({ queryKey: TABLEAU_LIVRAISON_CLE });
  };

  return useMutation({
    mutationFn: ({ orderId }: { orderId: string; reference?: string | null }) => sacRapporte(orderId),
    onSuccess: (reponse, { reference }) => {
      toast.success(texteSacRapporte(reponse?.reference ?? reference));
      relire();
    },
    onError: (e: Error) => {
      toast.error(e.message);
      relire();
    },
  });
};
