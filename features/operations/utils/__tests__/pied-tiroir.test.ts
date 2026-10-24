// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';

import { piedDuTiroir } from '../pied-tiroir';

/**
 * Relecture du 24/10 : un compte de suivi des livraisons (LIVRAISON_OPS,
 * lecture seule) ouvrait une commande prête ou récupérée d'une course interne
 * et ne voyait ni le livreur et son état, ni la retenue, ni l'ajout, ni le
 * code : tout le pied du tiroir était caché faute du droit de changer le
 * statut. Il garde ce suivi, jamais les boutons.
 */
describe('pied du tiroir', () => {
  const interne = (status) => ({ type: 'DELIVERY', delivery_service: 'CHICKEN_NATION', status });

  test('rôle qui change le statut : les boutons, comme avant', () => {
    for (const status of ['ACCEPTED', 'IN_PROGRESS', 'READY', 'PICKED_UP', 'COMPLETED']) {
      expect(piedDuTiroir(interne(status), true)).toBe('ACTIONS');
    }
    expect(piedDuTiroir({ type: 'PICKUP', status: 'READY' }, true)).toBe('ACTIONS');
  });

  test('rôle de consultation : le suivi de la course prête ou récupérée', () => {
    expect(piedDuTiroir(interne('READY'), false)).toBe('SUIVI');
    expect(piedDuTiroir(interne('PICKED_UP'), false)).toBe('SUIVI');
  });

  test('rôle de consultation : rien ailleurs (boutons de préparation, Turbo, retrait au comptoir)', () => {
    for (const status of ['ACCEPTED', 'IN_PROGRESS', 'COLLECTED', 'COMPLETED', 'CANCELLED']) {
      expect(piedDuTiroir(interne(status), false)).toBeNull();
    }
    expect(piedDuTiroir({ type: 'DELIVERY', delivery_service: 'TURBO', status: 'READY' }, false)).toBeNull();
    expect(piedDuTiroir({ type: 'PICKUP', delivery_service: null, status: 'READY' }, false)).toBeNull();
    expect(piedDuTiroir(null, false)).toBeNull();
  });
});
