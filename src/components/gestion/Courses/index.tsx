'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef } from 'react';
import { toast } from 'react-hot-toast';

import { useDashboardStore } from '@/store/dashboardStore';

import { BandeauRestaurants } from '../../../../features/courses/components/BandeauRestaurants';
import { CoursesHeader } from '../../../../features/courses/components/CoursesHeader';
import { CourseDetails } from '../../../../features/courses/components/detail-course';
import { CoursesFilters } from '../../../../features/courses/components/filtrage/CoursesFilters';
import { CoursesTable } from '../../../../features/courses/components/list-courses';
import { TableauEnDirect } from '../../../../features/courses/components/en-direct/TableauEnDirect';
import { OngletsCourses } from '../../../../features/courses/components/OngletsCourses';
import { CancelCourseModal } from '../../../../features/courses/components/modals/CancelCourseModal';
import { ForceAssignModal } from '../../../../features/courses/components/modals/ForceAssignModal';
import { useCoursesSocketSync } from '../../../../features/courses/hooks/useCoursesSocketSync';
import { courseDetailQueryOption } from '../../../../features/courses/queries/course-detail.query';
import { useCourseListQuery } from '../../../../features/courses/queries/course-list.query';
import { useCoursesEnDirectQuery } from '../../../../features/courses/queries/courses-en-direct.query';
import { useTableauLivraisonQuery } from '../../../../features/courses/queries/tableau-livraison.query';
import EnDirect from '../EnDirect';
import {
  CLE_RESTAURANT_DU_LIVREUR,
  filtresListeCourses,
  livreurChoisiValable,
} from '../../../../features/courses/utils/filtres-courses';

/**
 * Page Courses (backoffice admin) — vue 100 % opérationnelle.
 *
 * Depuis le 10/11, le seul écran de suivi des livraisons, en trois vues sous
 * le bandeau des restaurants (qui sert de filtre) :
 *  - « En direct » : le kanban des courses de la journée (À affecter, Vers le
 *    restaurant, Au restaurant, En livraison, Terminées), le livreur changé
 *    d'un menu sur la carte ;
 *  - « Carte » : l'ancienne Carte live, avec « À traiter » et ses gestes ;
 *  - « Historique » : filtres et tableau.
 * La vue est mémorisée ; un ancien lien « Carte live » ouvre la vue Carte. Les gestes
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
  const setFilter = useDashboardStore((s) => s.setFilter);
  const queryClient = useQueryClient();
  const onglet = useDashboardStore((s) => s.ongletCourses);
  const setOnglet = useDashboardStore((s) => s.setOngletCourses);
  const activeTab = useDashboardStore((s) => s.activeTab);
  const setActiveTab = useDashboardStore((s) => s.setActiveTab);

  // Ancien onglet « Carte live » mémorisé ou demandé : la vue Carte de Courses.
  useEffect(() => {
    if (activeTab !== 'en_direct') return;
    setOnglet('carte');
    setActiveTab('courses');
  }, [activeTab, setOnglet, setActiveTab]);

  // Nombres des onglets : mêmes lectures (même cache) que le kanban et le bandeau.
  const enDirectQuery = useCoursesEnDirectQuery(selectedRestaurantId);
  const { data: tableau } = useTableauLivraisonQuery();
  const enCours = enDirectQuery.data ? enDirectQuery.data.courses.filter((c) => c.colonne !== 'TERMINEE').length : null;
  const alertes = useMemo(
    () =>
      (tableau?.signaux ?? []).filter(
        (s) => s.gravite === 'rouge' && (!selectedRestaurantId || s.restaurant_id === selectedRestaurantId),
      ).length,
    [tableau, selectedRestaurantId],
  );

  // Un autre restaurant choisi dans le bandeau : retour à la première page.
  const restaurantPrecedent = useRef(selectedRestaurantId);
  useEffect(() => {
    if (restaurantPrecedent.current === selectedRestaurantId) return;
    restaurantPrecedent.current = selectedRestaurantId;
    setPagination('courses', 1, pagination.limit);
  }, [selectedRestaurantId, pagination.limit, setPagination]);

  // Livreur choisi pour un autre restaurant du bandeau : il ne filtre plus.
  const livreurCaduc = !!filters?.deliverer_id && !livreurChoisiValable(filters, selectedRestaurantId);
  useEffect(() => {
    if (!livreurCaduc) return;
    setFilter('courses', 'deliverer_id', undefined);
    setFilter('courses', CLE_RESTAURANT_DU_LIVREUR, undefined);
  }, [livreurCaduc, setFilter]);

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

  // Le tableau de l'historique n'est lu que dans sa vue.
  const listQuery = useCourseListQuery(
    filtresListeCourses(filters, selectedRestaurantId, pagination.page, pagination.limit),
    onglet === 'historique',
  );

  return (
    <div className="flex-1 p-4 space-y-4">
      <CoursesHeader avecRecherche={onglet === 'historique'} />

      {view === 'list' && (
        <>
          <BandeauRestaurants />
          <OngletsCourses onglet={onglet} onChange={setOnglet} enCours={enCours} alertes={alertes} />
          {onglet === 'en_direct' && <TableauEnDirect onVoirHistorique={() => setOnglet('historique')} />}
          {onglet === 'carte' && <EnDirect integre />}
          {onglet === 'historique' && (
            <>
              <CoursesFilters />
              <CoursesTable
                courses={listQuery.data}
                isLoading={listQuery.isLoading}
                error={listQuery.error as Error | null}
              />
            </>
          )}
        </>
      )}

      {view === 'view' && selectedItem && <CourseDetails selectedItem={selectedItem} />}

      {modals?.force_assign && selectedItem && <ForceAssignModal isOpen course={selectedItem} />}
      {modals?.cancel && selectedItem && <CancelCourseModal isOpen course={selectedItem} />}
    </div>
  );
}
