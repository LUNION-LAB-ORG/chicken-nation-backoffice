import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

import { forceAssignCourse } from '../services/course.service';
import type { ForceAssignPayload } from '../types/course.types';
import { useInvalidateCourseQuery } from './index.query';

/**
 * Force l'affectation d'un livreur précis à une course (override admin).
 * Le backend envoie l'offer au livreur — il doit encore accepter (statut=PENDING_ASSIGNMENT).
 */
export const useCourseForceAssignMutation = () => {
  const invalidate = useInvalidateCourseQuery();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: ForceAssignPayload }) => {
      return forceAssignCourse(id, payload);
    },
    onSuccess: async () => {
      await invalidate();
      toast.success('Offre envoyée au livreur');
    },
    onError: (e: Error) => {
      toast.error(e.message);
    },
  });
};
