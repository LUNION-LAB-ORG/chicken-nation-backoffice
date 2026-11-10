// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';

import { useDashboardStore } from '../dashboardStore';

/**
 * Ligne Livreurs de Commandes (conception du 24/10, 6.2) : toucher une
 * pastille ouvre En direct sur ce livreur, pas sa fiche dans Livreurs.
 * La demande est à part de celle de la fiche (`pendingLivreurId`), que
 * l'écran Livreurs consommerait à sa prochaine ouverture.
 */
describe('ouvrir la carte sur un livreur', () => {
  test('écran Courses, vue Carte (ex « Carte live », 10/11), livreur demandé, fiche de Livreurs pas touchée', () => {
    useDashboardStore.getState().setSectionView('courses', 'view');
    useDashboardStore.getState().openEnDirect('liv-koffi');
    const s = useDashboardStore.getState();
    expect(s.activeTab).toBe('courses');
    expect(s.ongletCourses).toBe('carte');
    expect(s.courses.view).toBe('list');
    expect(s.pendingEnDirectLivreurId).toBe('liv-koffi');
    expect(s.pendingLivreurId).toBeNull();
  });

  test('demande consommée une fois', () => {
    useDashboardStore.getState().clearPendingEnDirect();
    expect(useDashboardStore.getState().pendingEnDirectLivreurId).toBeNull();
  });
});
