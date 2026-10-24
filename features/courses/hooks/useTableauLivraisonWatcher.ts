'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useDroitsLivraison } from '../../livreurs/hook/use-droits-livraison';
import { useSocket } from '../../websocket/hooks/useSocket';
import { courseEventsWebsocket } from '../constantes/courseEventsWebsocket';
import { TABLEAU_LIVRAISON_CLE, useTableauLivraisonQuery } from '../queries/tableau-livraison.query';
import { estRouteAbsente } from '../utils/tableau-livraison';

/** Une rafale d'évènements (affectation, statut, livraison) ne relit qu'une fois. */
const REGROUPEMENT_MS = 1_500;

/**
 * Guetteur global du tableau de la livraison, monté une fois avec les
 * notifications (`useNotificationBootstrap`), pour l'admin et le suivi des
 * livraisons (`voirLivraison`) : la pastille du menu reste à jour sur tous
 * les écrans.
 *
 *  - relit toutes les 20 s (seul pilote de ces comptes) ;
 *  - relit après chaque évènement d'une course reçu en temps réel.
 *
 * Rien pour les autres comptes : le bandeau et la ligne Livreurs pilotent
 * eux-mêmes quand ils sont à l'écran. Rien non plus tant que le serveur n'a
 * pas la route (404).
 */
export const useTableauLivraisonWatcher = () => {
  const { voirLivraison } = useDroitsLivraison();
  const socket = useSocket();
  const queryClient = useQueryClient();

  const { error } = useTableauLivraisonQuery({ pilote: true, actif: voirLivraison });
  const routeAbsente = estRouteAbsente(error);

  useEffect(() => {
    if (!socket || !voirLivraison || routeAbsente) return;
    let minuterie: ReturnType<typeof setTimeout> | null = null;
    const relire = () => {
      if (minuterie) return;
      minuterie = setTimeout(() => {
        minuterie = null;
        void queryClient.invalidateQueries({ queryKey: TABLEAU_LIVRAISON_CLE });
      }, REGROUPEMENT_MS);
    };
    courseEventsWebsocket.forEach((evenement) => socket.on(evenement, relire));
    return () => {
      courseEventsWebsocket.forEach((evenement) => socket.off(evenement, relire));
      if (minuterie) clearTimeout(minuterie);
    };
  }, [socket, voirLivraison, routeAbsente, queryClient]);
};
