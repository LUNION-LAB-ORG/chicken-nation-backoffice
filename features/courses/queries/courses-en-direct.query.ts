import { useQuery } from '@tanstack/react-query';

import { getCoursesEnDirect, getLivreursPourCourse } from '../services/course.service';
import { courseKeyQuery } from './index.query';

/**
 * Kanban « En direct » (10/11). Clé sous `courses` : relue par le temps réel
 * des courses (`useCoursesSocketSync`) et après chaque geste ; filet de 15 s.
 */
export const useCoursesEnDirectQuery = (restaurantId: string | null | undefined) =>
  useQuery({
    queryKey: courseKeyQuery('en-direct', restaurantId ?? 'tous'),
    queryFn: () => getCoursesEnDirect(restaurantId ?? null),
    refetchInterval: 15_000,
    staleTime: 5_000,
  });

/** Livreurs du menu « Livreur » d'une carte, lus à l'ouverture et toutes les 15 s tant qu'il est ouvert. */
export const useLivreursPourCourseQuery = (courseId: string, actif: boolean) =>
  useQuery({
    queryKey: ['livreurs', 'course', courseId] as const,
    queryFn: () => getLivreursPourCourse(courseId),
    enabled: actif,
    staleTime: 0,
    refetchInterval: actif ? 15_000 : false,
  });
