import { useQuery } from '@tanstack/react-query';

import { getCourseStats } from '../services/course.service';
import type { ICourseStatsFilters } from '../types/course.types';
import { courseKeyQuery } from './index.query';

/**
 * Stats agrégées pour la page Courses (KPI + daily + distribution).
 * Invalidé via useCoursesSocketSync à chaque event course:*.
 */
export const useCourseStatsQuery = (filters: ICourseStatsFilters = {}, enabled = true) =>
  useQuery({
    queryKey: courseKeyQuery('stats', filters),
    queryFn: () => getCourseStats(filters),
    enabled,
    staleTime: 30 * 1000,
    gcTime: 2 * 60 * 1000,
  });
