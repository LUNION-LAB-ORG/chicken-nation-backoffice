import { useQuery } from '@tanstack/react-query';

import { getActiveOperationsOrders } from '../services/operations-service';
import { RELECTURE_OPERATIONS_MS } from '../utils/synchro-operations';
import { operationsKeyQuery } from './index.query';

/**
 * Liste des commandes actives pour la page Opérations.
 * Temps réel via `useOperationsSocketSync` (invalide cette query à chaque event pertinent).
 * Relue aussi toutes les 20 s, page visible : les offres aux livreurs
 * (proposée, refusée, expirée) n'arrivent pas au restaurant ni au siège.
 *
 * Erreur : pas de message flottant, relu toutes les 20 s ; l'écran le dit
 * lui-même (« Commandes indisponibles. », ou « Connexion perdue, nouvel
 * essai en cours » au-dessus des cartes déjà là).
 */
export const useOperationsActiveQuery = (restaurantId?: string) =>
  useQuery({
    queryKey: operationsKeyQuery('active', restaurantId),
    queryFn: () => getActiveOperationsOrders(restaurantId),
    staleTime: 10 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: RELECTURE_OPERATIONS_MS,
  });
