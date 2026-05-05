import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

import { retryExpiredCourse } from '../services/course.service';
import { useInvalidateCourseQuery } from './index.query';

/**
 * Relance une course EXPIRED :
 *  - Reset toutes les tentatives d'affectation précédentes
 *  - Remet refusal_count à 0
 *  - Repasse en PENDING_ASSIGNMENT
 *  - Relance la recherche de livreur (tous les livreurs du resto redeviennent candidats)
 */
export const useCourseRetryMutation = () => {
  const invalidate = useInvalidateCourseQuery();

  return useMutation({
    mutationFn: (id: string) => retryExpiredCourse(id),
    onSuccess: async () => {
      await invalidate();
      toast.success('Course relancée — recherche de livreur en cours');
    },
    onError: (e: Error) => toast.error(e.message),
  });
};
