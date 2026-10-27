// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';

import { buildCourseTimeline } from '../build-course-timeline';

/**
 * Frise de la fiche d'une course. Demande du 27/10 : le livreur peut passer
 * un client (« Plus tard ») et y revenir ; la frise le dit à l'heure du report
 * (`Delivery.reportee_at`).
 */

const course = (deliveries) => ({
  id: 'c1',
  reference: 'CRS-1',
  statut: 'IN_DELIVERY',
  pickup_code: '614',
  created_at: '2026-10-27T11:30:00Z',
  picked_up_at: '2026-10-27T11:55:00Z',
  offer_attempts: [],
  deliveries,
});

describe('livraison reportée', () => {
  // A, B, C ; B reportée à 12 h 08 alors qu'elle était l'arrêt 2 : A, C, B.
  const deliveries = [
    { id: 'A', sequence_order: 1, in_route_at: '2026-10-27T12:00:00Z', delivered_at: '2026-10-27T12:05:00Z', order: { reference: 'CMD-A' } },
    { id: 'C', sequence_order: 2, in_route_at: '2026-10-27T12:08:00Z', order: { reference: 'CMD-C' } },
    {
      id: 'B',
      sequence_order: 3,
      statut: 'PENDING',
      in_route_at: '2026-10-27T12:05:00Z',
      arrived_at: null,
      reportee_at: '2026-10-27T12:08:00Z',
      order: { reference: 'CMD-B' },
    },
  ];

  test('« Livraison #3 reportée » à l\'heure du report, avec la commande', () => {
    const evenements = buildCourseTimeline(course(deliveries));
    const reportee = evenements.filter((e) => e.kind === 'delivery_reportee');
    expect(reportee).toEqual([
      { kind: 'delivery_reportee', at: '2026-10-27T12:08:00Z', title: 'Livraison #3 reportée', subtitle: 'CMD-B' },
    ]);
  });

  test('ordre chronologique : après le départ vers B, avant la suite', () => {
    const titres = buildCourseTimeline(course(deliveries)).map((e) => e.title);
    expect(titres.indexOf('Livraison #3 démarrée')).toBeLessThan(titres.indexOf('Livraison #3 reportée'));
    expect(titres.indexOf('Livraison #1 confirmée')).toBeLessThan(titres.indexOf('Livraison #3 reportée'));
  });

  test('serveur plus ancien ou livraison jamais reportée : aucun événement nouveau', () => {
    const sans = deliveries.map((d) => {
      const copie = { ...d };
      delete copie.reportee_at;
      return copie;
    });
    expect(buildCourseTimeline(course(sans)).some((e) => e.kind === 'delivery_reportee')).toBe(false);
    const nulle = deliveries.map((d) => ({ ...d, reportee_at: null }));
    expect(buildCourseTimeline(course(nulle)).some((e) => e.kind === 'delivery_reportee')).toBe(false);
  });

  test('heure illisible : pas d\'événement plutôt qu\'une date fausse', () => {
    const illisible = deliveries.map((d) => (d.id === 'B' ? { ...d, reportee_at: 'pas une date' } : d));
    expect(buildCourseTimeline(course(illisible)).some((e) => e.kind === 'delivery_reportee')).toBe(false);
  });

  test('aucun tiret cadratin', () => {
    for (const e of buildCourseTimeline(course(deliveries)).filter((x) => x.kind === 'delivery_reportee')) {
      expect(e.title).not.toContain('—');
      expect(e.subtitle ?? '').not.toContain('—');
    }
  });
});
