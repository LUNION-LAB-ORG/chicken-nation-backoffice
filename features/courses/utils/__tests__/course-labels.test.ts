// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';

import { COURSE_STATUT_LABELS, DELIVERY_STATUT_LABELS, dureeCourse } from '../course-labels';

/** Tableau des courses (conception du 24/10, 10.1) : libellés et colonne « Durée ». */

const MAINTENANT = new Date('2026-10-24T12:40:00Z');

describe('libellés connus des équipes, ceux d’avant', () => {
  test('statuts de course et de livraison', () => {
    expect(COURSE_STATUT_LABELS.PENDING_ASSIGNMENT).toBe("En attente d'affectation");
    expect(COURSE_STATUT_LABELS.ACCEPTED).toBe('Acceptée');
    expect(COURSE_STATUT_LABELS.EXPIRED).toBe('Expirée');
    expect(DELIVERY_STATUT_LABELS.PENDING).toBe('En attente');
    expect(DELIVERY_STATUT_LABELS.ARRIVED).toBe('Arrivé');
  });
});

describe('durée d’une course', () => {
  test('terminée : du départ à la fin', () => {
    expect(
      dureeCourse(
        { statut: 'COMPLETED', picked_up_at: '2026-10-24T11:00:00Z', completed_at: '2026-10-24T11:31:40Z' },
        MAINTENANT,
      ),
    ).toEqual({ texte: '31 min', enRetard: false });
    expect(
      dureeCourse(
        { statut: 'COMPLETED', picked_up_at: '2026-10-24T10:00:00Z', completed_at: '2026-10-24T11:05:00Z' },
        MAINTENANT,
      ).texte,
    ).toBe('1 h 05');
  });

  test('en livraison : temps écoulé, « En retard » signalé par le serveur', () => {
    expect(dureeCourse({ statut: 'IN_DELIVERY', picked_up_at: '2026-10-24T12:28:00Z' }, MAINTENANT)).toEqual({
      texte: '12 min',
      enRetard: false,
    });
    expect(
      dureeCourse(
        { statut: 'IN_DELIVERY', picked_up_at: '2026-10-24T12:28:00Z', delay_alerted_at: '2026-10-24T12:39:00Z' },
        MAINTENANT,
      ),
    ).toEqual({ texte: '12 min', enRetard: true });
  });

  test('pas encore partie, ou annulée : vide', () => {
    expect(dureeCourse({ statut: 'AT_RESTAURANT', picked_up_at: null }, MAINTENANT)).toEqual({
      texte: '',
      enRetard: false,
    });
    expect(dureeCourse({ statut: 'CANCELLED', picked_up_at: '2026-10-24T12:00:00Z' }, MAINTENANT).texte).toBe('');
  });
});
