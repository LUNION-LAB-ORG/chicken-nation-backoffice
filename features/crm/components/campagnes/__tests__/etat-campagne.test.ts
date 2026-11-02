/* eslint-disable @typescript-eslint/ban-ts-comment -- tests bun : leurs types ne sont pas installés dans le backoffice. */
// @ts-nocheck
import { describe, expect, test } from 'bun:test';

import { basculerPiloteEquipe, choisirPilote, etatInitial, finEffacee, piloteDansEquipe } from '../etat-campagne';

/**
 * Formulaire de campagne (correction du 02/11) : le pilote fait partie de
 * l'équipe par défaut, « Après N jours » se garde en modification, et une date
 * de fin vidée s'efface.
 */

const campagne = (extra = {}) => ({
  id: 'camp-1',
  name: 'Relance',
  description: null,
  start_date: '2026-11-01T00:00:00.000Z',
  end_date: '2026-11-15T00:00:00.000Z',
  status: 'PLANIFIED',
  target_conversion_rate: null,
  target_contacts_count: null,
  registered_from: null,
  registered_to: null,
  segments: ['JAMAIS_COMMANDE'],
  distribution_mode: 'AUTOMATIQUE',
  started_at: null,
  completed_at: null,
  targeted_count: 0,
  created_at: '2026-10-30T00:00:00.000Z',
  lead_agent: { id: 'pilote', fullname: 'Pilote' },
  created_by: null,
  offer: null,
  assigned_agents: [{ agent: { id: 'awa', fullname: 'Awa', role: 'CALL_CENTER' } }],
  publics: [],
  ...extra,
});

describe('le pilote dans l’équipe', () => {
  test('nouvelle campagne : la case est cochée, et choisir le pilote le met dans l’équipe', () => {
    const f = etatInitial();
    expect(piloteDansEquipe(f)).toBe(true);
    const apres = { ...f, ...choisirPilote(f, 'pilote') };
    expect(apres.lead_agent_id).toBe('pilote');
    expect(apres.agent_ids).toEqual(['pilote']);
  });

  test('changer de pilote, case cochée : le nouveau remplace l’ancien', () => {
    const f = { ...etatInitial(), lead_agent_id: 'pilote', agent_ids: ['awa', 'pilote'] };
    const apres = { ...f, ...choisirPilote(f, 'kone') };
    expect(apres.agent_ids).toEqual(['awa', 'kone']);
    expect(piloteDansEquipe(apres)).toBe(true);
  });

  test('case décochée : le pilote n’entre pas dans l’équipe', () => {
    const f = etatInitial();
    const decoche = { ...f, ...basculerPiloteEquipe(f) };
    expect(piloteDansEquipe(decoche)).toBe(false);
    const apres = { ...decoche, ...choisirPilote(decoche, 'pilote') };
    expect(apres.agent_ids).toEqual([]);
    expect(piloteDansEquipe(apres)).toBe(false);
  });

  test('cocher puis décocher avec un pilote choisi : son id entre puis sort de l’équipe', () => {
    const f = { ...etatInitial(), lead_agent_id: 'pilote', agent_ids: ['awa'], pilote_dans_equipe: false };
    const coche = { ...f, ...basculerPiloteEquipe(f) };
    expect(coche.agent_ids).toEqual(['awa', 'pilote']);
    const decoche = { ...coche, ...basculerPiloteEquipe(coche) };
    expect(decoche.agent_ids).toEqual(['awa']);
  });

  test('modification : la case suit la présence du pilote dans l’équipe', () => {
    expect(piloteDansEquipe(etatInitial(campagne()))).toBe(false);
    const avec = campagne({ assigned_agents: [{ agent: { id: 'pilote', fullname: 'Pilote', role: 'CALL_CENTER' } }] });
    expect(piloteDansEquipe(etatInitial(avec))).toBe(true);
  });
});

describe('fin de la campagne', () => {
  test('« Après N jours » se garde à la modification', () => {
    const f = etatInitial(campagne({ duration_days: 7 }));
    expect(f.fin).toBe('duree');
    expect(f.duration_days).toBe('7');
    // Serveur plus ancien (pas de durée) : la date de fin, comme avant.
    const ancien = etatInitial(campagne());
    expect(ancien.fin).toBe('date');
    expect(ancien.end_date).toBe('2026-11-15');
  });

  test('date de fin vidée en modification : effacée ; à la création ou en durée : rien', () => {
    expect(finEffacee({ fin: 'date', end_date: '' }, true)).toBe(true);
    expect(finEffacee({ fin: 'date', end_date: '2026-11-15' }, true)).toBe(false);
    expect(finEffacee({ fin: 'date', end_date: '' }, false)).toBe(false);
    expect(finEffacee({ fin: 'duree', end_date: '' }, true)).toBe(false);
  });
});
