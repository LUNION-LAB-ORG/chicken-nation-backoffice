// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';

import { situationCourse, texteSignal } from '../textes-signaux';

/**
 * Phrases des alertes de la livraison (conception du 24/10, 9.2 et 10.1),
 * une par clé du serveur (`tableau-livraison.rules.ts`), avec les mots de la
 * section 3.3.
 */

const ANGRE = 'resto-angre';
const MAINTENANT = new Date('2026-10-24T12:40:00Z');

const signal = (partiel) => ({
  gravite: 'rouge',
  restaurant_id: ANGRE,
  depuis: null,
  minutes: null,
  course: null,
  livreur: null,
  commandes: [],
  ...partiel,
});

const course = (statut = 'PENDING_ASSIGNMENT', expiree = false) => ({
  id: 'c1',
  reference: 'CRS-241024-0043',
  statut,
  expiree,
});

describe('texteSignal : L1 et L2 de chaque alerte', () => {
  test('tournée en retard', () => {
    const s = signal({
      cle: 'TOURNEE_EN_RETARD',
      minutes: 12,
      course: course('IN_DELIVERY'),
      livreur: { id: 'l1', prenom: 'Koffi' },
    });
    expect(texteSignal(s, { restaurant: 'Angré' })).toEqual({
      titre: 'Koffi : tournée en retard de 12 min',
      detail: 'Angré · CRS-241024-0043',
    });
  });

  test('sans livreur en recherche, puis expirée', () => {
    const enRecherche = signal({
      cle: 'SANS_LIVREUR',
      gravite: 'ambre',
      minutes: 9,
      course: course(),
      commandes: ['ORD-1', 'ORD-2'],
    });
    expect(texteSignal(enRecherche, { restaurant: 'Marcory' })).toEqual({
      titre: "CRS-241024-0043 : en attente d'affectation depuis 9 min",
      detail: 'Marcory · 2 commandes',
    });
    const expiree = signal({ cle: 'SANS_LIVREUR', course: course('EXPIRED', true), commandes: ['ORD-1'] });
    expect(texteSignal(expiree, { restaurant: 'Marcory' })).toEqual({
      titre: 'CRS-241024-0043 : aucun livreur trouvé',
      detail: 'Marcory · 1 commande',
    });
  });

  test('parti sans une commande', () => {
    const s = signal({
      cle: 'PARTI_SANS_SAC',
      course: course('IN_DELIVERY'),
      livreur: { id: 'l1', prenom: 'Koffi' },
      commandes: ['ORD-4822'],
    });
    expect(texteSignal(s, { restaurant: 'Angré' })).toEqual({
      titre: 'Koffi est parti sans ORD-4822',
      detail: 'Angré',
    });
  });

  test('course annulée à relancer', () => {
    const s = signal({
      cle: 'COURSE_ANNULEE_A_RELANCER',
      course: { ...course('CANCELLED'), reference: 'CRS-241024-0031' },
      commandes: ['ORD-4790'],
    });
    expect(texteSignal(s, { restaurant: 'Angré' }).titre).toBe('CRS-241024-0031 annulée, ORD-4790 à relancer');
  });

  test('attente au restaurant', () => {
    const s = signal({
      cle: 'ATTENTE_AU_RESTAURANT',
      gravite: 'ambre',
      minutes: 16,
      course: course('AT_RESTAURANT'),
      livreur: { id: 'l1', prenom: 'Koffi' },
    });
    expect(texteSignal(s, { restaurant: 'Angré' })).toEqual({
      titre: 'Koffi attend au restaurant depuis 16 min',
      detail: 'Angré · CRS-241024-0043',
    });
  });

  test("appli fermée pendant une course : l'heure du dernier signe de vie en L2", () => {
    const s = signal({
      cle: 'APPLI_FERMEE_EN_COURSE',
      gravite: 'ambre',
      course: course('IN_DELIVERY'),
      livreur: { id: 'l2', prenom: 'Moussa' },
      appli_vue_a: '2026-10-24T12:34:00Z',
    });
    expect(texteSignal(s, { restaurant: 'Plateau', maintenant: MAINTENANT })).toEqual({
      titre: 'Moussa : appli fermée pendant une course',
      detail: 'Plateau · vue il y a 6 min',
    });
  });

  test('position perdue', () => {
    const s = signal({
      cle: 'POSITION_PERDUE_EN_COURSE',
      gravite: 'ambre',
      minutes: 8,
      course: { ...course('IN_DELIVERY'), reference: 'CRS-241024-0044' },
      livreur: { id: 'l2', prenom: 'Moussa' },
    });
    expect(texteSignal(s, { restaurant: 'Plateau' })).toEqual({
      titre: 'Moussa : plus de position depuis 8 min',
      detail: 'Plateau · CRS-241024-0044',
    });
  });

  test('à encaisser : durée au-delà d’une heure en « 1 h 05 »', () => {
    const s = signal({
      cle: 'A_ENCAISSER',
      gravite: 'ambre',
      minutes: 65,
      livreur: { id: 'l1', prenom: 'Koffi' },
      commandes: ['ORD-1', 'ORD-2'],
    });
    expect(texteSignal(s, { restaurant: 'Angré' }).titre).toBe('Koffi : 2 commandes à encaisser depuis 1 h 05');
  });

  test('prévu pas en service, matin et soir', () => {
    const matin = signal({ cle: 'PREVU_PAS_EN_SERVICE', gravite: 'ambre', livreur: { id: 'l3', prenom: 'Ibrahim' }, creneau: 'MORNING' });
    expect(texteSignal(matin, { restaurant: 'Riviera' })).toEqual({
      titre: 'Ibrahim : prévu ce matin, pas en service',
      detail: 'Riviera',
    });
    const soir = { ...matin, creneau: 'EVENING' };
    expect(texteSignal(soir).titre).toBe('Ibrahim : prévu ce soir, pas en service');
  });

  test('un seul restaurant affiché : son nom part de L2', () => {
    const s = signal({
      cle: 'TOURNEE_EN_RETARD',
      minutes: 12,
      course: course('IN_DELIVERY'),
      livreur: { id: 'l1', prenom: 'Koffi' },
    });
    expect(texteSignal(s).detail).toBe('CRS-241024-0043');
    const parti = signal({ cle: 'PARTI_SANS_SAC', livreur: { id: 'l1', prenom: 'Koffi' }, commandes: ['ORD-1'] });
    expect(texteSignal(parti).detail).toBe('');
  });

  test('sans prénom ni durée : phrase complète, rien d’inventé', () => {
    const s = signal({ cle: 'ATTENTE_AU_RESTAURANT', course: course('AT_RESTAURANT') });
    expect(texteSignal(s).titre).toBe('Le livreur attend au restaurant');
    const r = signal({ cle: 'TOURNEE_EN_RETARD', course: course('IN_DELIVERY') });
    expect(texteSignal(r).titre).toBe('Livreur : tournée en retard');
  });

  test('plusieurs commandes : « ORD-1, ORD-2 et ORD-3 »', () => {
    const s = signal({
      cle: 'PARTI_SANS_SAC',
      livreur: { id: 'l1', prenom: 'Koffi' },
      commandes: ['ORD-1', 'ORD-2', 'ORD-3'],
    });
    expect(texteSignal(s).titre).toBe('Koffi est parti sans ORD-1, ORD-2 et ORD-3');
  });

  test('alerte inconnue de cet écran : texte neutre', () => {
    expect(texteSignal(signal({ cle: 'NOUVELLE_ALERTE', course: course() })).titre).toBe('CRS-241024-0043 : à vérifier');
  });

  test('aucune phrase ne porte de tiret long', () => {
    const cles = [
      'TOURNEE_EN_RETARD',
      'SANS_LIVREUR',
      'PARTI_SANS_SAC',
      'COURSE_ANNULEE_A_RELANCER',
      'ATTENTE_AU_RESTAURANT',
      'APPLI_FERMEE_EN_COURSE',
      'POSITION_PERDUE_EN_COURSE',
      'A_ENCAISSER',
      'PREVU_PAS_EN_SERVICE',
    ];
    for (const cle of cles) {
      const t = texteSignal(signal({ cle, course: course(), livreur: { id: 'l', prenom: 'Awa' }, minutes: 3 }), {
        restaurant: 'Angré',
        maintenant: MAINTENANT,
      });
      expect(`${t.titre} ${t.detail}`).not.toMatch(/[—–]/);
    }
  });
});

describe('situationCourse : la phrase d’« À traiter », sans la référence', () => {
  test('sans livreur', () => {
    expect(situationCourse(signal({ cle: 'SANS_LIVREUR', minutes: 9, course: course() }))).toBe(
      "En attente d'affectation depuis 9 min",
    );
    expect(situationCourse(signal({ cle: 'SANS_LIVREUR', course: course('EXPIRED', true) }))).toBe(
      'Aucun livreur trouvé',
    );
  });

  test('tournée en retard', () => {
    const s = signal({
      cle: 'TOURNEE_EN_RETARD',
      minutes: 12,
      course: course('IN_DELIVERY'),
      livreur: { id: 'l1', prenom: 'Koffi' },
    });
    expect(situationCourse(s)).toBe('Koffi · en retard de 12 min');
  });

  test('annulée à relancer, parti sans sac, attente', () => {
    expect(
      situationCourse(signal({ cle: 'COURSE_ANNULEE_A_RELANCER', course: course('CANCELLED'), commandes: ['ORD-4790'] })),
    ).toBe('Annulée, ORD-4790 à relancer');
    expect(
      situationCourse(
        signal({ cle: 'PARTI_SANS_SAC', course: course('IN_DELIVERY'), livreur: { id: 'l', prenom: 'Koffi' }, commandes: ['ORD-4822'] }),
      ),
    ).toBe('Koffi est parti sans ORD-4822');
    expect(
      situationCourse(
        signal({ cle: 'ATTENTE_AU_RESTAURANT', minutes: 16, course: course('AT_RESTAURANT'), livreur: { id: 'l', prenom: 'Koffi' } }),
      ),
    ).toBe('Koffi attend au restaurant depuis 16 min');
  });
});
