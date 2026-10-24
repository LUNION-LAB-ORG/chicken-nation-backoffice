// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';

import { grillePlanning, texteCreneau } from '../grille-planning';

/** Grille du planning (conception du 24/10, 10.3). */

const livreur = (id, first_name, last_name = null) => ({
  id,
  first_name,
  last_name,
  phone: '',
  image: null,
  type_vehicule: null,
});

const affectation = (deliverer, status = 'ASSIGNED', refusal_reason = null) => ({
  id: `${deliverer.id}-${status}`,
  status,
  confirmed_at: null,
  refused_at: null,
  refusal_reason,
  deliverer,
});

const KOFFI = livreur('k', 'Koffi', 'Yao');
const ALI = livreur('a', 'Ali', 'Traoré');

const base = {
  id: 'p',
  restaurant_id: 'r',
  period_start: '2026-10-26T00:00:00.000Z',
  period_end: '2026-10-28T00:00:00.000Z',
  status: 'SENT',
  confirmed_count: 0,
  sent_at: null,
  confirmed_at: null,
  archived_at: null,
  created_at: '',
  updated_at: '',
  restaurant: { id: 'r', name: 'Angré', address: null },
  shifts: [
    {
      id: 's1',
      date: '2026-10-26T00:00:00.000Z',
      type: 'MORNING',
      start_time: '09:00',
      end_time: '15:00',
      max_slots: 3,
      assignments: [affectation(KOFFI, 'CONFIRMED')],
    },
    {
      id: 's2',
      date: '2026-10-26T00:00:00.000Z',
      type: 'EVENING',
      start_time: '15:00',
      end_time: '23:00',
      max_slots: 3,
      assignments: [affectation(KOFFI, 'REFUSED', 'malade')],
    },
  ],
};

describe('grillePlanning', () => {
  test('serveur du 24/10 : toutes les lignes, même un livreur qui n’a que des repos', () => {
    const g = grillePlanning({
      ...base,
      livreurs: [
        { id: 'a', first_name: 'Ali', last_name: 'Traoré', image: null },
        { id: 'k', first_name: 'Koffi', last_name: 'Yao', image: null },
      ],
      repos: [{ deliverer_id: 'a', date: '2026-10-27T00:00:00.000Z', source: 'MANUAL_DELIVERER' }],
      regles: { jours_sans_repos: ['friday'] },
    });
    expect(g.serveurAJour).toBe(true);
    expect(g.livreurs.map((l) => l.first_name)).toEqual(['Ali', 'Koffi']);
    expect(g.repos('a', '2026-10-27')).toBe('MANUAL_DELIVERER');
    expect(g.repos('a', '2026-10-26')).toBeUndefined();
  });

  test('serveur ancien : les livreurs des affectations, triés par prénom, sans repos', () => {
    const plan = {
      ...base,
      shifts: [
        ...base.shifts,
        {
          id: 's3',
          date: '2026-10-27T00:00:00.000Z',
          type: 'MORNING',
          start_time: '09:00',
          end_time: '15:00',
          max_slots: 3,
          assignments: [affectation(ALI)],
        },
      ],
    };
    const g = grillePlanning(plan);
    expect(g.serveurAJour).toBe(false);
    expect(g.livreurs.map((l) => l.id)).toEqual(['a', 'k']);
    expect(g.repos('a', '2026-10-28')).toBeUndefined();
  });

  test('chaque jour de la période a sa colonne, même sans créneau', () => {
    expect(grillePlanning(base).jours).toEqual(['2026-10-26', '2026-10-27', '2026-10-28']);
  });

  test('affectations par livreur, jour et créneau ; horaires lus dans les créneaux', () => {
    const g = grillePlanning(base);
    expect(g.affectation('k', '2026-10-26', 'MORNING').status).toBe('CONFIRMED');
    expect(g.affectation('k', '2026-10-26', 'EVENING').status).toBe('REFUSED');
    expect(g.affectation('k', '2026-10-27', 'MORNING')).toBeUndefined();
    expect(g.horaires).toEqual({ MORNING: '09:00 à 15:00', EVENING: '15:00 à 23:00' });
  });
});

describe('texteCreneau', () => {
  test('réponse du livreur, motif du refus au survol', () => {
    expect(texteCreneau('MORNING', { status: 'ASSIGNED', refusal_reason: null })).toBe('Matin : En attente');
    expect(texteCreneau('EVENING', { status: 'CONFIRMED', refusal_reason: null })).toBe('Soir : Confirmé');
    expect(texteCreneau('EVENING', { status: 'REFUSED', refusal_reason: ' malade ' })).toBe('Soir : Refusé : malade');
    expect(texteCreneau('MORNING', { status: 'REFUSED', refusal_reason: '' })).toBe('Matin : Refusé');
  });
});
