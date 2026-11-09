import { useQuery } from '@tanstack/react-query';

// ⚠️ Import RELATIF entre features : `@/` pointe sur src/, `features/` est à la racine.
import { getLivreursPourAffectation } from '../../courses/services/course.service';
import { livreursKeys } from '../../livreurs/hook/use-livreurs';

/**
 * Livreurs proposés dans « Affecter à un livreur »
 * (`GET /courses/commandes/:orderId/livreurs`) : ceux du restaurant de la
 * commande. État relu à l'ouverture et toutes les 15 s tant que la fenêtre est
 * ouverte. Clé sous `livreurs` : relue après chaque geste.
 */
export const useLivreursAffectationQuery = (orderId: string) =>
  useQuery({
    queryKey: [...livreursKeys.all(), 'affectation', orderId] as const,
    queryFn: () => getLivreursPourAffectation(orderId),
    staleTime: 0,
    refetchInterval: 15 * 1000,
  });
