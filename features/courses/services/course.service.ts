import { api } from '@/services/api';
import { getHumanReadableError } from '@/utils/errorMessages';

import type {
  CancelCoursePayload,
  Course,
  CoursesListResponse,
  CoursesQueryFilters,
  CourseWithAttempts,
  ForceAssignPayload,
  ICourseStats,
  ICourseStatsFilters,
} from '../types/course.types';

const ENDPOINT = '/courses';

const buildQueryString = (filters: CoursesQueryFilters): string => {
  const params = new URLSearchParams();
  if (filters.statut) params.append('statut', filters.statut);
  if (filters.restaurant_id) params.append('restaurant_id', filters.restaurant_id);
  if (filters.deliverer_id) params.append('deliverer_id', filters.deliverer_id);
  if (filters.search) params.append('search', filters.search);
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.page) params.append('page', String(filters.page));
  if (filters.limit) params.append('limit', String(filters.limit));
  const qs = params.toString();
  return qs ? `?${qs}` : '';
};

const safeCall = async <T>(fn: () => Promise<T>): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    throw new Error(getHumanReadableError(error));
  }
};

// ============================================================
// LECTURE
// ============================================================

export const getAllCourses = (filters: CoursesQueryFilters = {}) =>
  safeCall(() => api.get<CoursesListResponse>(`${ENDPOINT}${buildQueryString(filters)}`, true));

export const getCourseById = (id: string) =>
  safeCall(() => api.get<CourseWithAttempts>(`${ENDPOINT}/${id}`, true));

/** Stats agrégées pour la page Courses (KPI + daily breakdown + distribution) */
export const getCourseStats = (filters: ICourseStatsFilters = {}) => {
  const params = new URLSearchParams();
  if (filters.restaurant_id) params.append('restaurant_id', filters.restaurant_id);
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  const qs = params.toString();
  return safeCall(() => api.get<ICourseStats>(`${ENDPOINT}/stats${qs ? `?${qs}` : ''}`, true));
};

// ============================================================
// MUTATIONS ADMIN
// ============================================================

/** Force l'affectation d'un livreur précis (override admin) */
export const forceAssignCourse = (id: string, payload: ForceAssignPayload) =>
  safeCall(() =>
    api.patch<{ success: boolean; message: string }>(`${ENDPOINT}/${id}/force-assign`, payload, true),
  );

/** Annulation d'une course par l'admin */
export const cancelCourseAdmin = (id: string, payload: CancelCoursePayload) =>
  safeCall(() => api.patch<Course>(`${ENDPOINT}/${id}/cancel`, payload, true));

/** Relance une course EXPIRED : reset tentatives + recherche nouveau livreur */
export const retryExpiredCourse = (id: string) =>
  safeCall(() =>
    api.patch<{ success: boolean; message: string }>(`${ENDPOINT}/${id}/retry`, {}, true),
  );
