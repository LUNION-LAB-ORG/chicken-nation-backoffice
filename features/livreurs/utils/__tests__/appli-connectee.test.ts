// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';

import {
  LIBELLE_APPLI_NON_CONNECTEE,
  RAISON_APPLI_NON_CONNECTEE,
  choixAffectation,
  presenceAppli,
} from '../disponibilite';

/**
 * Incident du 22/10 : « le livreur est bel et bien connecté mais il ne reçoit
 * pas les offres ». « Disponible » et la position viennent des requêtes de
 * l'appli ; sa connexion temps réel, elle, peut être coupée. Le serveur dit
 * maintenant s'il la voit (`appli_connectee`), et le backoffice l'affiche là
 * où l'admin décide : « Forcer l'affectation » et la carte.
 *
 * Depuis le 24/10, le serveur dit aussi si l'appli tourne encore
 * (`appli_active`) : « En arrière-plan » ou « Appli fermée »
 * (presence-appli.test.ts). « Appli non connectée » reste le texte d'un
 * serveur qui ne le dit pas : c'est ce que ce fichier vérifie.
 */

const dispo = (champs = {}) => ({
  etat: 'DISPONIBLE',
  libelle: 'Disponible',
  peut_recevoir_offre: true,
  message_refus: null,
  en_pause: false,
  en_pause_auto: false,
  pause_until: null,
  auto_pause_until: null,
  en_service: true,
  en_course: false,
  offre_en_attente: false,
  offre_course_id: null,
  ...champs,
});

const MAINTENANT = new Date('2026-10-23T10:00:00Z');

/** « Appli non connectée » : serveur sans `appli_active`. */
const appliNonConnectee = (appliConnectee, etat) =>
  presenceAppli({ appli_connectee: appliConnectee }, etat, MAINTENANT)?.cas === 'NON_CONNECTEE';

describe('appli non connectée (serveur sans `appli_active`)', () => {
  test('livreur en service sans connexion : signalé', () => {
    expect(appliNonConnectee(false, 'DISPONIBLE')).toBe(true);
    expect(appliNonConnectee(false, 'OFFRE_EN_ATTENTE')).toBe(true);
    expect(appliNonConnectee(false, 'EN_COURSE')).toBe(true);
  });

  test('connecté, inconnu (null) ou serveur ancien (absent) : rien', () => {
    expect(presenceAppli({ appli_connectee: true }, 'DISPONIBLE', MAINTENANT)).toBeNull();
    expect(presenceAppli({ appli_connectee: null }, 'DISPONIBLE', MAINTENANT)).toBeNull();
    expect(presenceAppli({}, 'DISPONIBLE', MAINTENANT)).toBeNull();
  });

  test('en pause, hors service ou inactif : appli fermée attendue, rien', () => {
    for (const etat of ['EN_PAUSE', 'PAUSE_AUTO', 'HORS_SERVICE', 'INACTIF', null, undefined]) {
      expect(presenceAppli({ appli_connectee: false }, etat, MAINTENANT)).toBeNull();
    }
  });

  test('libellé et explication du 23/10, inchangés', () => {
    expect(presenceAppli({ appli_connectee: false }, 'DISPONIBLE', MAINTENANT)).toEqual({
      cas: 'NON_CONNECTEE',
      libelle: LIBELLE_APPLI_NON_CONNECTEE,
      vue: null,
      raison: RAISON_APPLI_NON_CONNECTEE,
    });
  });
});

describe('fenêtre « Forcer l\'affectation »', () => {
  // Même calcul que la fenêtre : seulement pour un livreur qu'on peut choisir.
  const ligne = (livreur, courseId = 'course-1') => {
    const choix = choixAffectation(livreur.disponibilite, courseId, MAINTENANT);
    return { choix, sansAppli: choix.selectionnable && appliNonConnectee(livreur.appli_connectee, choix.etat) };
  };

  test('disponible sans appli connectée : reste sélectionnable, signalé', () => {
    const l = ligne({ disponibilite: dispo(), appli_connectee: false });
    expect(l.choix.selectionnable).toBe(true);
    expect(l.sansAppli).toBe(true);
  });

  test('renvoi de l\'offre sur cette course sans appli connectée : signalé', () => {
    const l = ligne({
      disponibilite: dispo({
        etat: 'OFFRE_EN_ATTENTE',
        libelle: 'Offre en attente',
        peut_recevoir_offre: false,
        message_refus: 'Ce livreur a déjà une offre en attente.',
        offre_en_attente: true,
        offre_course_id: 'course-1',
      }),
      appli_connectee: false,
    });
    expect(l.choix.renvoi).toBe(true);
    expect(l.sansAppli).toBe(true);
  });

  test('grisé (en course ailleurs) : la raison du serveur suffit, pas de second message', () => {
    const l = ligne({
      disponibilite: dispo({
        etat: 'EN_COURSE',
        libelle: 'En course',
        peut_recevoir_offre: false,
        message_refus: 'Ce livreur est déjà en course.',
        en_course: true,
      }),
      appli_connectee: false,
    });
    expect(l.choix.selectionnable).toBe(false);
    expect(l.sansAppli).toBe(false);
  });

  test('serveur plus ancien (ni état ni présence) : rien de signalé', () => {
    expect(ligne({}).sansAppli).toBe(false);
  });
});

describe('textes', () => {
  test('français simple, sans tiret cadratin', () => {
    expect(LIBELLE_APPLI_NON_CONNECTEE).toBe('Appli non connectée');
    expect(RAISON_APPLI_NON_CONNECTEE).toContain('par notification');
    expect(`${LIBELLE_APPLI_NON_CONNECTEE}${RAISON_APPLI_NON_CONNECTEE}`).not.toMatch(/[\u2014\u2013]/);
  });
});
