import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { toast } from 'react-hot-toast';

import { getCourseById } from '../services/course.service';
import { courseKeyQuery } from './index.query';

export const courseDetailQueryOption = (id: string) => ({
  queryKey: courseKeyQuery('detail', id),
  queryFn: async () => getCourseById(id),
  keepPreviousData: true,
  staleTime: 30 * 1000,
  enabled: !!id,
});

/** Hook : détail d'une course (+ tentatives d'affectation). */
export const useCourseDetailQuery = (id: string) => {
  const result = useQuery(courseDetailQueryOption(id));

  React.useEffect(() => {
    if (result.isError || result.error) {
      toast.error(result.error?.message ?? 'Erreur lors du chargement de la course');
    }
  }, [result.isError, result.error]);

  return result;
};
