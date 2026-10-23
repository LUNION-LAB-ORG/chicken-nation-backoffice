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
import { abonnerOperations } from '../utils/synchro-operations';
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
 *
 * Reconnexion du socket : la liste est relue (les événements émis pendant la
 * coupure sont perdus). Liste des événements : `utils/synchro-operations.ts`.
 */

interface StatutChangedPayload {
  course?: CourseEvenement | null;
  reason?: string | null;
  /** Fusion : références des courses absorbées (serveur du 23/10). */
  fusion?: { absorbees?: string[] | null } | null;
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
        const avis = avisDeCourse(
          payload?.reason,
          payload?.course,
          indexerCommandes(listes),
          new Date(),
          payload?.fusion?.absorbees ?? [],
        );
        if (avis) {
          ajouterAvis(avis);
          toast(avis.texte, { duration: 6000 });
        }
      } catch {
        // Un avis manqué ne doit jamais empêcher le rechargement.
      }
      void invalidate();
    };

    return abonnerOperations<StatutChangedPayload>(socket, {
      recharger: () => void invalidate(),
      surStatutCourse: onStatutChanged,
    });
  }, [socket, invalidate, queryClient, ajouterAvis]);
};
