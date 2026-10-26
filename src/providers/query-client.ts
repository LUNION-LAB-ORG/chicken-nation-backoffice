import { QueryClient } from '@tanstack/react-query';

/**
 * Cache des requêtes du back office : un seul pour tout l'onglet. Il survit à
 * la déconnexion, qui revient à l'accueil sans recharger la page.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // 30 secondes
      gcTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Connexion d'un compte : rien de ce que le compte précédent a lu ne reste.
 * Sans cela, sur un poste partagé, le compte suivant voyait pendant quelques
 * secondes la réponse gardée pour l'autre (par exemple le code de retrait du
 * client, que seuls l'administrateur et le call center reçoivent), le temps
 * que la relecture revienne.
 */
export function viderLeCacheALaConnexion(): void {
  queryClient.clear();
}

/**
 * Déconnexion : ce qui n'est plus à l'écran part tout de suite. Ce qui l'est
 * encore part à la connexion suivante : le retirer ici relancerait ces
 * lectures sans session, le temps de quitter l'écran.
 */
export function viderLeCacheALaDeconnexion(): void {
  queryClient.removeQueries({ type: 'inactive' });
}
