// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';

import { remplissageDates } from '../remplissage-dates';

/**
 * « Modifier les dates » (relecture du 25/10) : la fenêtre reçoit le détail
 * du planning, relu toutes les 15 s, et chaque réponse d'un livreur en fait
 * un nouvel objet. Les champs étaient remplis à chaque nouvel objet, ce qui
 * effaçait la date saisie : un « Refaire le planning » refaisait alors le
 * planning sur les mêmes dates.
 */

const plan = (partiel = {}) => ({
  id: 'plan-angre',
  period_start: '2026-10-26T00:00:00.000Z',
  period_end: '2026-11-01T00:00:00.000Z',
  ...partiel,
});

describe('remplissage des dates', () => {
  test('fenêtre fermée : rien à remplir', () => {
    expect(remplissageDates(null, false, plan())).toEqual({ cle: null, remplir: false });
    expect(remplissageDates(null, true, null)).toEqual({ cle: null, remplir: false });
  });

  test("à l'ouverture : les dates du planning", () => {
    expect(remplissageDates(null, true, plan())).toEqual({ cle: 'plan-angre', remplir: true });
  });

  test('relecture du même planning, fenêtre ouverte : la saisie reste', () => {
    const relu = plan({ shifts: [{ id: 'confirme-par-koffi' }] });
    expect(remplissageDates('plan-angre', true, relu)).toEqual({ cle: 'plan-angre', remplir: false });
  });

  test('fermée puis rouverte : remplie de nouveau', () => {
    const fermee = remplissageDates('plan-angre', false, plan());
    expect(fermee).toEqual({ cle: null, remplir: false });
    expect(remplissageDates(fermee.cle, true, plan())).toEqual({ cle: 'plan-angre', remplir: true });
  });

  test('autre planning : rempli avec ses dates', () => {
    expect(remplissageDates('plan-angre', true, plan({ id: 'plan-cocody' }))).toEqual({
      cle: 'plan-cocody',
      remplir: true,
    });
  });
});
