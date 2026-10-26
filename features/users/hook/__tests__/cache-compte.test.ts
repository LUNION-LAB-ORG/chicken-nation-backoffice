/* eslint-disable @typescript-eslint/ban-ts-comment -- tests bun : leurs types ne sont pas installés dans le backoffice. */
// @ts-nocheck
import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import { QueryObserver } from '@tanstack/react-query';

/**
 * Cache des requêtes et changement de compte (26/10). Le cache vit autant que
 * l'onglet, et la déconnexion revient à l'accueil sans recharger la page : sur
 * un poste partagé du siège, le compte suivant voyait la réponse gardée pour
 * le précédent (par exemple le code de retrait du client, que seuls
 * l'administrateur et le call center reçoivent), le temps de la relecture.
 */

mock.module('../../services/auth.service', () => ({
  login: async () => ({
    token: 'jeton-suivi',
    refreshToken: 'renouvellement-suivi',
    permissions: { modules: {} },
    id: 'compte-suivi',
    role: 'LIVRAISON_OPS',
  }),
  logout: async () => {},
  refreshToken: async () => ({}),
}));
mock.module('../../../../src/services/api', () => ({ api: {} }));
mock.module('../../../../src/store/dashboardStore', () => ({
  useDashboardStore: { getState: () => ({ setSelectedRestaurantId() {}, setActiveTab() {} }) },
}));

const { useAuthStore } = await import('../authStore');
const { queryClient } = await import('../../../../src/providers/query-client');

const TIROIR = ['commande-livraison', 'o1'];
const ECRAN = ['commandes', 'page-1'];

let arreterEcran: (() => void) | null = null;

/** Une réponse que plus rien n'affiche (tiroir fermé) et une encore à l'écran. */
function remplirLeCache() {
  queryClient.setQueryData(TIROIR, { code_client: '4821' });
  queryClient.setQueryData(ECRAN, { data: [] });
  const observateur = new QueryObserver(queryClient, { queryKey: ECRAN, queryFn: async () => ({ data: [] }), staleTime: Infinity });
  arreterEcran = observateur.subscribe(() => {});
}

beforeEach(() => queryClient.clear());
afterEach(() => {
  arreterEcran?.();
  arreterEcran = null;
});

describe('Cache des requêtes au changement de compte', () => {
  test('connexion : rien de ce que le compte précédent a lu ne reste', async () => {
    remplirLeCache();
    await useAuthStore.getState().login({ email: 'suivi@exemple.ci', password: 'essai' });
    expect(queryClient.getQueryData(TIROIR)).toBeUndefined();
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  test("déconnexion : ce qui n'est plus à l'écran part tout de suite, le reste à la connexion suivante", async () => {
    remplirLeCache();
    await useAuthStore.getState().logout();
    expect(queryClient.getQueryData(TIROIR)).toBeUndefined();
    // Encore affiché le temps de quitter l'écran : pas relu sans session.
    expect(queryClient.getQueryData(ECRAN)).toEqual({ data: [] });
    expect(useAuthStore.getState().isAuthenticated).toBe(false);

    await useAuthStore.getState().login({ email: 'suivi@exemple.ci', password: 'essai' });
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  });
});
