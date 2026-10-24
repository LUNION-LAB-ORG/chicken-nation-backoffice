'use client';

import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '../../users/hook/authStore';
import { useDroitsLivraison } from '../../livreurs/hook/use-droits-livraison';
import { getTableauLivraison } from '../services/tableau-livraison.service';
import { estRouteAbsente, nombreAlertesRouges, peutLireTableau } from '../utils/tableau-livraison';

/**
 * Tableau de la livraison (`GET /livraison/tableau`), une seule clé pour tout
 * l'écran : bandeau des restaurants, ligne Livreurs de Commandes, « À
 * surveiller », « À traiter » et pastille du menu lisent le même cache.
 *
 * Le compte connecté est dans la clé : le serveur répond selon son périmètre,
 * et un autre compte ouvert dans le même onglet ne voit jamais le tableau du
 * précédent. Relire `TABLEAU_LIVRAISON_CLE` relit tous les comptes.
 */
export const TABLEAU_LIVRAISON_CLE = ['livraison', 'tableau'] as const;

const RELECTURE_MS = 20_000;

/**
 * `pilote` : relit toutes les 20 s et au retour sur la fenêtre. Un seul
 * pilote par compte suffit : chaque abonné à intervalle relirait pour son
 * compte. Le guetteur global (`useTableauLivraisonWatcher`) pilote pour
 * l'admin et le suivi des livraisons ; le bandeau et la ligne Livreurs
 * pilotent pour les comptes de restaurant, que le guetteur ne suit pas.
 *
 * Serveur sans la route (404) : ni nouvel essai ni relecture (minuterie,
 * retour sur la fenêtre, nouvel écran), le bloc reste caché jusqu'au
 * prochain chargement de la page.
 */
export const useTableauLivraisonQuery = (options: { pilote?: boolean; actif?: boolean } = {}) => {
  const membre = useAuthStore((s) => s.user);
  const habilite = peutLireTableau(membre);
  const { pilote = false, actif = true } = options;
  return useQuery({
    queryKey: [...TABLEAU_LIVRAISON_CLE, membre?.id ?? ''],
    queryFn: getTableauLivraison,
    enabled: habilite && actif,
    staleTime: 10_000,
    refetchInterval: (query) => (pilote && !estRouteAbsente(query.state.error) ? RELECTURE_MS : false),
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: (query) => pilote && !estRouteAbsente(query.state.error),
    refetchOnMount: (query) => !estRouteAbsente(query.state.error),
    retry: (essais, erreur) => !estRouteAbsente(erreur) && essais < 2,
  });
};

/**
 * Pastille rouge du groupe Livraison et d'« En direct » : alertes rouges de
 * tout le périmètre, pour qui voit la livraison (`voirLivraison`) ; zéro
 * sinon, et zéro tant que le serveur n'a pas la route. Lecture du cache,
 * sans minuterie : le guetteur global relit.
 */
export const useNombreAlertesRouges = (): number => {
  const { voirLivraison } = useDroitsLivraison();
  const { data } = useTableauLivraisonQuery({ actif: voirLivraison });
  return voirLivraison ? nombreAlertesRouges(data) : 0;
};
