import { useEffect } from 'react';

import { useSocket } from '../../websocket/hooks/useSocket';
import { useInvalidateOperationsQuery } from '../queries/index.query';
import { abonnerOperations } from '../utils/synchro-operations';

/**
 * Synchronise la page Opérations en temps réel.
 *
 * Écoute 2 groupes d'events :
 *  - `order:*` → la commande change de statut (cuisine → prête → récupérée…)
 *  - `course:*` → la course évolue (offer, acceptation, statut, completion, cancel)
 *
 * Tout event déclenche une invalidation du cache `operations` + `order` + `courses`
 * (le suivi de livraison du tiroir, rangé sous `order`, suit donc lui aussi).
 *
 * Planificateur v2 : `course:statut:changed` part aussi vers la salle du
 * restaurant et le siège à la création d'une course (le code s'affiche tout
 * de suite), à chaque ajout, fusion, retenue et départ. Demande du 24/10
 * (« reste simple ») : plus d'avis « CMD-C ajoutée à la course de Koffi » ni
 * « Courses fusionnées », la liste relue montre déjà les commandes regroupées.
 *
 * Reconnexion du socket : la liste est relue (les événements émis pendant la
 * coupure sont perdus). Liste des événements : `utils/synchro-operations.ts`.
 */
export const useOperationsSocketSync = () => {
  const socket = useSocket();
  const invalidate = useInvalidateOperationsQuery();

  useEffect(() => {
    if (!socket) return;
    return abonnerOperations(socket, {
      recharger: () => void invalidate(),
      surStatutCourse: () => void invalidate(),
    });
  }, [socket, invalidate]);
};
