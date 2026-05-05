import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

import { cancelCourseAdmin } from '../services/course.service';
import type { CancelCoursePayload } from '../types/course.types';
import { useInvalidateCourseQuery } from './index.query';

/** Annulation d'une course par l'admin (avec raison optionnelle). */
export const useCourseCancelMutation = () => {
  const invalidate = useInvalidateCourseQuery();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: CancelCoursePayload }) => {
      return cancelCourseAdmin(id, payload);
    },
    onSuccess: async () => {
      await invalidate();
      toast.success('Course annulée');
    },
    onError: (e: Error) => {
      toast.error(e.message);
    },
  });
};
