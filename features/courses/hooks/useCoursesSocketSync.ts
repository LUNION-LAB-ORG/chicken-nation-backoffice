import { useEffect } from 'react';

import { useSocket } from '../../websocket/hooks/useSocket';
import { courseEventsWebsocket } from '../constantes/courseEventsWebsocket';
import { useInvalidateCourseQuery } from '../queries/index.query';

/**
 * Écoute les events WebSocket du module course et invalide le cache TanStack Query.
 * À appeler dans le composant racine du module Courses (admin).
 *
 * Réagit à :
 *  - course:assigned (un livreur a accepté)
 *  - course:statut:changed (transition Course : ACCEPTED → AT_RESTAURANT → IN_DELIVERY)
 *  - course:delivery:statut:changed (transition Delivery)
 *  - course:completed / course:cancelled (terminaux)
 *  - course:refresh (générique)
 */
export const useCoursesSocketSync = () => {
  const socket = useSocket();
  const invalidate = useInvalidateCourseQuery();

  useEffect(() => {
    if (!socket) return;

    courseEventsWebsocket.forEach((event) => socket.on(event, invalidate));

    return () => {
      courseEventsWebsocket.forEach((event) => socket.off(event, invalidate));
    };
  }, [socket, invalidate]);
};
