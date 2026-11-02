/* eslint-disable @typescript-eslint/ban-ts-comment -- tests bun : leurs types ne sont pas installés dans le backoffice. */
// @ts-nocheck
import { describe, expect, test } from 'bun:test';

import { useDashboardStore } from '../dashboardStore';

/**
 * Cloche d'un retour privé (« Client pas content », « Avis en retard ») :
 * Notes et avis s'ouvre sur l'onglet « Retours privés », fiche de l'avis.
 * Les autres filtres du module (ceux de la liste) sont gardés.
 */
describe('ouvrir un avis depuis la cloche', () => {
  test('onglet Notes et avis, vue Retours privés, fiche de cet avis', () => {
    useDashboardStore.getState().setFilter('reviews', 'retours', { statut: 'NOUVEAU' });
    useDashboardStore.getState().openAvis('avis-1');
    const s = useDashboardStore.getState();
    expect(s.activeTab).toBe('reviews');
    expect(s.reviews.filters.vue).toBe('retours');
    expect(s.reviews.filters.retours).toEqual({ statut: 'NOUVEAU' });
    expect(s.reviews.view).toBe('view');
    expect(s.reviews.selectedItem).toBe('avis-1');
  });
});
