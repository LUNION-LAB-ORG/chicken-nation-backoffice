import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

import { changerLivreurCourse } from '../services/course.service';
import { useInvalidateCourseQuery } from './index.query';

/**
 * Menu « Livreur » d'une carte du kanban (10/11) : la course passe au livreur
 * choisi, d'office. Message du serveur ; courses, livreurs et tableau relus.
 */
export const useChangerLivreurMutation = () => {
  const invalidate = useInvalidateCourseQuery();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, delivererId }: { courseId: string; delivererId: string }) =>
      changerLivreurCourse(courseId, delivererId),
    onSuccess: async (r) => {
      toast.success(r.message);
      void queryClient.invalidateQueries({ queryKey: ['livreurs'] });
      void queryClient.invalidateQueries({ queryKey: ['deliverers'] });
      await invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
};
