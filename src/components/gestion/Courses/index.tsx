'use client';

import { useDashboardStore } from '@/store/dashboardStore';

import { CoursesHeader } from '../../../../features/courses/components/CoursesHeader';
import { CourseDetails } from '../../../../features/courses/components/detail-course';
import { CoursesFilters } from '../../../../features/courses/components/filtrage/CoursesFilters';
import { CoursesTable } from '../../../../features/courses/components/list-courses';
import { CancelCourseModal } from '../../../../features/courses/components/modals/CancelCourseModal';
import { ForceAssignModal } from '../../../../features/courses/components/modals/ForceAssignModal';
import { useCoursesSocketSync } from '../../../../features/courses/hooks/useCoursesSocketSync';
import { useCourseListQuery } from '../../../../features/courses/queries/course-list.query';
import type { CourseStatut } from '../../../../features/courses/types/course.types';

/**
 * Page Courses (backoffice admin) — vue 100 % opérationnelle.
 *
 * Volontairement minimaliste : Header + Filtres + Table + Détail.
 * Les **statistiques** (KPI courses, breakdown journalier, répartition statuts)
 * ont été déplacées dans `/gestion/statistiques/livraison` pour deux raisons :
 *  1. Continuité métier : les stats courses prolongent les stats livraison
 *     (mêmes filtres période + restaurant, même contexte d'analyse).
 *  2. Performance : `getStats` backend fait 8 requêtes Prisma dont un findMany
 *     lourd → plus dans le chemin critique de la page Courses, qui doit
 *     s'afficher rapidement pour permettre l'affectation des courses en
 *     attente (statut PENDING_ASSIGNMENT) sans latence.
 *
 *  TTI : passe de "attente getStats (~1-3 s)" à "attente getList (~200-500 ms)".
 */
export default function Courses() {
  useCoursesSocketSync();

  const {
    courses: { view, selectedItem, filters, pagination, modals },
    selectedRestaurantId,
  } = useDashboardStore();

  const restaurantFilter = selectedRestaurantId ?? undefined;

  const listQuery = useCourseListQuery({
    restaurant_id: restaurantFilter,
    page: pagination.page,
    limit: pagination.limit,
    search: filters?.search as string,
    statut: filters?.statut as CourseStatut | undefined,
    startDate: filters?.startDate as string | undefined,
    endDate: filters?.endDate as string | undefined,
  });

  return (
    <div className="flex-1 p-4 space-y-4">
      <CoursesHeader />

      {view === 'list' && (
        <>
          <CoursesFilters />
          <CoursesTable
            courses={listQuery.data}
            isLoading={listQuery.isLoading}
            error={listQuery.error as Error | null}
          />
        </>
      )}

      {view === 'view' && selectedItem && <CourseDetails selectedItem={selectedItem} />}

      {modals?.force_assign && selectedItem && <ForceAssignModal isOpen course={selectedItem} />}
      {modals?.cancel && selectedItem && <CancelCourseModal isOpen course={selectedItem} />}
    </div>
  );
}
