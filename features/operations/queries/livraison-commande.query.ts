import { useQuery } from '@tanstack/react-query';

// ⚠️ Import RELATIF entre features : `@/` pointe sur src/, `features/` est à la racine.
import { orderKeyQuery } from '../../orders/queries/index.query';
import { getLivraisonCommande } from '../services/operations-service';
import { lireLivraison, livraisonTerminee, type LivraisonCommande } from '../utils/suivi-livraison';
import { RELECTURE_OPERATIONS_MS } from '../utils/synchro-operations';

/**
 * Suivi de la livraison d'une commande (section « Livraison » du tiroir).
 *
 *  - Clé rangée sous `order` : chaque événement de commande ou de course
 *    reçu par l'écran Opérations (`useOperationsSocketSync`) invalide déjà
 *    `['order']`, le suivi suit donc en direct sans écouteur de plus.
 *  - Relu toutes les 20 s tant que la livraison n'est pas finie (position et
 *    offres n'arrivent pas toutes par le socket), plus du tout ensuite.
 *  - Serveur pas encore à jour (route inconnue, 404) : `null`, la section ne
 *    s'affiche pas, sans message d'erreur.
 */
export const useLivraisonCommandeQuery = (orderId: string | null | undefined, actif: boolean) =>
  useQuery<LivraisonCommande | null>({
    queryKey: orderKeyQuery('livraison', orderId ?? null),
    queryFn: async () => {
      try {
        return lireLivraison(await getLivraisonCommande(orderId as string));
      } catch (erreur) {
        if ((erreur as { status?: unknown } | null)?.status === 404) return null;
        throw erreur;
      }
    },
    enabled: actif && !!orderId,
    staleTime: 10 * 1000,
    retry: 1,
    refetchOnWindowFocus: true,
    refetchInterval: (query) => (livraisonTerminee(query.state.data) ? false : RELECTURE_OPERATIONS_MS),
  });
