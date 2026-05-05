import { useEffect } from 'react';

import { useSocket } from '../../websocket/hooks/useSocket';
import { useInvalidateOperationsQuery } from '../queries/index.query';

/**
 * Synchronise la page Opérations en temps réel.
 *
 * Écoute 2 groupes d'events :
 *  - `order:*` → la commande change de statut (cuisine → prête → récupérée…)
 *  - `course:*` → la course évolue (offer, acceptation, statut, completion, cancel)
 *
 * Tout event déclenche une invalidation du cache `operations` + `order` + `courses`.
 */
const ORDER_EVENTS = [
  'order:created',
  'order:updated',
  'order:statusUpdated',
  'order:deleted',
  'order:refresh',
] as const;

const COURSE_EVENTS = [
  'course:assigned',
  'course:statut:changed',
  'course:delivery:statut:changed',
  'course:completed',
  'course:cancelled',
  'course:refresh',
] as const;

const ALL_EVENTS = [...ORDER_EVENTS, ...COURSE_EVENTS];

export const useOperationsSocketSync = () => {
  const socket = useSocket();
  const invalidate = useInvalidateOperationsQuery();

  useEffect(() => {
    if (!socket) return;
    ALL_EVENTS.forEach((event) => socket.on(event, invalidate));
    return () => {
      ALL_EVENTS.forEach((event) => socket.off(event, invalidate));
    };
  }, [socket, invalidate]);
};
