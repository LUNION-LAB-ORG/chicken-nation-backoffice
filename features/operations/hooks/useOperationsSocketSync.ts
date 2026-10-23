import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

import { useSocket } from '../../websocket/hooks/useSocket';
import { operationsKeyQuery, useInvalidateOperationsQuery } from '../queries/index.query';
import {
  avisDeCourse,
  indexerCommandes,
  type CommandeOperations,
  type CourseEvenement,
} from '../utils/suivi-course';
import { useAvisCoursesStore } from './use-avis-courses';

/**
 * Synchronise la page Opérations en temps réel.
 *
 * Écoute 2 groupes d'events :
 *  - `order:*` → la commande change de statut (cuisine → prête → récupérée…)
 *  - `course:*` → la course évolue (offer, acceptation, statut, completion, cancel)
 *
 * Tout event déclenche une invalidation du cache `operations` + `order` + `courses`.
 *
 * Planificateur v2 : `course:statut:changed` part aussi vers la salle du
 * restaurant et le siège à la création d'une course (le code s'affiche tout
 * de suite), à chaque ajout, fusion, retenue et départ. Pour une fusion ou un
 * ajout, l'avis (« Courses CRS-A et CRS-B fusionnées : même trajet ») est
 * calculé AVANT le rechargement, à partir de la liste encore affichée : c'est
 * elle qui dit d'où venaient les commandes.
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
  'course:delivery:statut:changed',
  'course:completed',
  'course:cancelled',
  'course:refresh',
] as const;

const ALL_EVENTS = [...ORDER_EVENTS, ...COURSE_EVENTS];

const STATUT_CHANGED = 'course:statut:changed';

interface StatutChangedPayload {
  course?: CourseEvenement | null;
  reason?: string | null;
}

export const useOperationsSocketSync = () => {
  const socket = useSocket();
  const invalidate = useInvalidateOperationsQuery();
  const queryClient = useQueryClient();
  const ajouterAvis = useAvisCoursesStore((s) => s.ajouter);

  useEffect(() => {
    if (!socket) return;

    const onStatutChanged = (payload?: StatutChangedPayload) => {
      try {
        const listes = queryClient
          .getQueriesData<CommandeOperations[]>({ queryKey: operationsKeyQuery('active') })
          .map(([, data]) => data);
        const avis = avisDeCourse(payload?.reason, payload?.course, indexerCommandes(listes), new Date());
        if (avis) {
          ajouterAvis(avis);
          toast(avis.texte, { duration: 6000 });
        }
      } catch {
        // Un avis manqué ne doit jamais empêcher le rechargement.
      }
      void invalidate();
    };

    ALL_EVENTS.forEach((event) => socket.on(event, invalidate));
    socket.on(STATUT_CHANGED, onStatutChanged);
    return () => {
      ALL_EVENTS.forEach((event) => socket.off(event, invalidate));
      socket.off(STATUT_CHANGED, onStatutChanged);
    };
  }, [socket, invalidate, queryClient, ajouterAvis]);
};
