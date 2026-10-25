import type { CourseStatut, CoursesQueryFilters } from '../types/course.types';

/**
 * Filtres de la liste des courses (relecture du 25/10).
 *
 *  - Le restaurant est celui du bandeau (`selectedRestaurantId`). Un ancien
 *    `filters.restaurant_id`, gardé dans le navigateur depuis la barre de
 *    filtres d'avant, ne compte plus.
 *  - Le livreur choisi compte pour le restaurant du bandeau où il a été
 *    choisi (`restaurant_du_livreur`, null pour « Tous les restaurants »).
 *    Un autre restaurant dans le bandeau, sur n'importe quel écran, le rend
 *    caduc, comme le faisait l'ancienne liste « Restaurant ».
 */

type Filtres = Record<string, unknown> | undefined;

export const CLE_RESTAURANT_DU_LIVREUR = 'restaurant_du_livreur';

export function livreurChoisiValable(filters: Filtres, selectedRestaurantId: string | null): boolean {
  if (!filters?.deliverer_id) return false;
  return ((filters[CLE_RESTAURANT_DU_LIVREUR] as string | null | undefined) ?? null) === (selectedRestaurantId ?? null);
}

export function filtresListeCourses(
  filters: Filtres,
  selectedRestaurantId: string | null,
  page: number,
  limit: number,
): CoursesQueryFilters {
  return {
    restaurant_id: selectedRestaurantId ?? undefined,
    deliverer_id: livreurChoisiValable(filters, selectedRestaurantId) ? (filters?.deliverer_id as string) : undefined,
    page,
    limit,
    search: (filters?.search as string | undefined) || undefined,
    statut: (filters?.statut as CourseStatut | undefined) || undefined,
    startDate: (filters?.startDate as string | undefined) || undefined,
    endDate: (filters?.endDate as string | undefined) || undefined,
  };
}

/** « Réinitialiser » : seulement pour un filtre qui agit sur la liste. */
export function filtresCoursesActifs(filters: Filtres, selectedRestaurantId: string | null): boolean {
  return !!(
    filters?.statut ||
    livreurChoisiValable(filters, selectedRestaurantId) ||
    filters?.startDate ||
    filters?.endDate
  );
}
