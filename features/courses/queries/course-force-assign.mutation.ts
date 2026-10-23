import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

import { livreursKeys } from '../../livreurs/hook/use-livreurs';
import { forceAssignCourse } from '../services/course.service';
import type { ForceAssignPayload } from '../types/course.types';
import { useInvalidateCourseQuery } from './index.query';

/**
 * Force l'affectation d'un livreur précis à une course (override admin).
 * Le backend envoie l'offer au livreur — il doit encore accepter (statut=PENDING_ASSIGNMENT).
 *
 * Le serveur refuse (409) un livreur en pause, en pause automatique, en
 * course, avec une offre en attente ou hors service, et une course qui ne
 * cherche plus de livreur. Son refus est affiché tel quel dans la fenêtre
 * (`error.message`), et l'état des livreurs et de la course est relu.
 *
 * Offre partie vers un livreur dont l'appli n'est pas connectée en temps réel
 * (`appli_connectee` à false) : avertissement au lieu d'un succès, le livreur
 * ne la verra que par notification.
 */
export const useCourseForceAssignMutation = () => {
  const invalidate = useInvalidateCourseQuery();
  const queryClient = useQueryClient();

  const relireLivreurs = () => {
    queryClient.invalidateQueries({ queryKey: livreursKeys.all() });
    queryClient.invalidateQueries({ queryKey: ['deliverers', 'live-locations'] });
  };

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: ForceAssignPayload }) => {
      return forceAssignCourse(id, payload);
    },
    onSuccess: async (reponse) => {
      relireLivreurs();
      await invalidate();
      if (reponse?.appli_connectee === false) {
        toast(reponse.message, { icon: '⚠️', duration: 10000 });
        return;
      }
      // « Offre envoyée au livreur. » ou « Offre renvoyée au livreur. »
      toast.success(reponse?.message || 'Offre envoyée au livreur.');
    },
    onError: async () => {
      relireLivreurs();
      await invalidate();
    },
  });
};
