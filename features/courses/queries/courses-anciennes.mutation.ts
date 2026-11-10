import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

import { fermerCoursesAnciennes } from '../services/course.service';
import { useInvalidateCourseQuery } from './index.query';

/**
 * « Les fermer » (10/11) : courses restées ouvertes d'une journée passée.
 * Le message vient du serveur (« 38 courses fermées. 2 gardées : … »).
 */
export const useFermerCoursesAnciennesMutation = () => {
  const invalidate = useInvalidateCourseQuery();
  return useMutation({
    mutationFn: (restaurantId: string | null) => fermerCoursesAnciennes(restaurantId),
    onSuccess: async (r) => {
      toast.success(r.message);
      await invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
};
