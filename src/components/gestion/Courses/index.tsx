'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';

import { useDashboardStore } from '@/store/dashboardStore';

import { ATraiter } from '../../../../features/courses/components/ATraiter';
import { BandeauRestaurants } from '../../../../features/courses/components/BandeauRestaurants';
import { CoursesHeader } from '../../../../features/courses/components/CoursesHeader';
import { CourseDetails } from '../../../../features/courses/components/detail-course';
import { CoursesFilters } from '../../../../features/courses/components/filtrage/CoursesFilters';
import { CoursesTable } from '../../../../features/courses/components/list-courses';
import { CancelCourseModal } from '../../../../features/courses/components/modals/CancelCourseModal';
import { ForceAssignModal } from '../../../../features/courses/components/modals/ForceAssignModal';
import { useCoursesSocketSync } from '../../../../features/courses/hooks/useCoursesSocketSync';
import { courseDetailQueryOption } from '../../../../features/courses/queries/course-detail.query';
import { useCourseListQuery } from '../../../../features/courses/queries/course-list.query';
import type { CourseStatut } from '../../../../features/courses/types/course.types';

/**
 * Page Courses (backoffice admin) — vue 100 % opérationnelle.
 *
 * Bandeau des restaurants (qui sert de filtre), « À traiter » (alertes du
 * serveur qui portent une course), filtres, tableau, fiche. Les gestes
 * (forcer, relancer, Turbo, annuler) ne sont montrés qu'à qui pilote les
 * courses ; le suivi des livraisons lit seulement.
 *
 * Les **statistiques** (KPI courses, breakdown journalier, répartition statuts)
 * vivent dans `/gestion/statistiques/livraison` : `getStats` fait 8 requêtes
 * lourdes, hors du chemin de cette page qui doit s'afficher vite.
 *
 * Une course s'ouvre aussi depuis un autre écran (« Voir la course » du
 * tiroir d'une commande, alerte d'En direct, ligne « À traiter ») par
 * `openCourse` du tableau de bord (`pendingCourseId`).
 */
export default function Courses() {
  useCoursesSocketSync();

  const {
    courses: { view, selectedItem, filters, pagination, modals },
    selectedRestaurantId,
  } = useDashboardStore();
  const pendingCourseId = useDashboardStore((s) => s.pendingCourseId);
  const clearPendingCourse = useDashboardStore((s) => s.clearPendingCourse);
  const setSelectedItem = useDashboardStore((s) => s.setSelectedItem);
  const setSectionView = useDashboardStore((s) => s.setSectionView);
  const setPagination = useDashboardStore((s) => s.setPagination);
  const queryClient = useQueryClient();

  const restaurantFilter = selectedRestaurantId ?? undefined;

  // Un autre restaurant choisi dans le bandeau : retour à la première page.
  const restaurantPrecedent = useRef(selectedRestaurantId);
  useEffect(() => {
    if (restaurantPrecedent.current === selectedRestaurantId) return;
    restaurantPrecedent.current = selectedRestaurantId;
    setPagination('courses', 1, pagination.limit);
  }, [selectedRestaurantId, pagination.limit, setPagination]);

  // Course demandée par un autre écran : lue, puis sa fiche s'ouvre.
  useEffect(() => {
    if (!pendingCourseId) return;
    let annule = false;
    queryClient
      .fetchQuery(courseDetailQueryOption(pendingCourseId))
      .then((course) => {
        if (annule) return;
        setSelectedItem('courses', course);
        setSectionView('courses', 'view');
        clearPendingCourse();
      })
      .catch((e: Error) => {
        if (annule) return;
        toast.error(e.message);
        clearPendingCourse();
      });
    return () => {
      annule = true;
    };
  }, [pendingCourseId, queryClient, setSelectedItem, setSectionView, clearPendingCourse]);

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
          <BandeauRestaurants />
          <ATraiter />
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
