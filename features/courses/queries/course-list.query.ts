import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { toast } from 'react-hot-toast';

import { getAllCourses } from '../services/course.service';
import type { CoursesQueryFilters } from '../types/course.types';
import { courseKeyQuery } from './index.query';

export const courseListQueryOption = (filters?: CoursesQueryFilters, enabled = true) => ({
  queryKey: courseKeyQuery('list', filters),
  queryFn: async () => getAllCourses(filters),
  keepPreviousData: true,
  staleTime: 30 * 1000, // 30s — on préfère frais pour l'admin
  enabled,
});

/** Hook : liste des courses avec filtres (admin). Toast sur erreur. */
export const useCourseListQuery = (filters?: CoursesQueryFilters, enabled?: boolean) => {
  const result = useQuery(courseListQueryOption(filters, enabled));

  React.useEffect(() => {
    if (result.isError || result.error) {
      toast.error(result.error?.message ?? 'Erreur lors du chargement des courses');
    }
  }, [result.isError, result.error]);

  return result;
};
