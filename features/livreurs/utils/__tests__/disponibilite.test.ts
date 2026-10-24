// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';

import {
  COULEURS_ETAT,
  NOM_ETAT,
  ORDRE_ETATS,
  choixAffectation,
  comparerPourAffectation,
  correspondAuFiltre,
  etatLivreur,
  estPauseSansFin,
  etatLivreurAffiche,
  heureLisible,
} from '../disponibilite';

/**
 * Demande du 22/10 : un livreur en pause ne doit plus recevoir de commande.
 * Le serveur refuse désormais l'affectation forcée d'un livreur en pause, en
 * pause automatique, en course, avec une offre en attente ou hors service.
 * La fenêtre « Forcer l'affectation » et la carte montrent cet état, avec les
 * textes du serveur, et le tiennent à jour quand une pause finit.
 *
 * Heures d'Abidjan = UTC.
 */

const COURSE = 'course-ouverte';
const AUTRE_COURSE = 'autre-course';
const A = (hhmm, jour = '2026-10-22') => new Date(`${jour}T${hhmm}:00Z`);
const PAUSE_SANS_FIN = '2099-12-31T23:59:59.000Z';

/** `disponibilite` telle que le serveur la renvoie (`disponibiliteLivreur`). */
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

const enPauseJusqua1432 = (champs = {}) =>
  dispo({
    etat: 'EN_PAUSE',
    libelle: "En pause jusqu'à 14 h 32",
    peut_recevoir_offre: false,
    message_refus: "Ce livreur est en pause jusqu'à 14 h 32.",
    en_pause: true,
    pause_until: '2026-10-22T14:32:00.000Z',
    // La pause sort de la file (serveur : `mettreEnPause`).
    en_service: false,
    ...champs,
  });

describe('état du livreur : les textes du serveur, tels quels', () => {
  test('disponible', () => {
    expect(etatLivreur(dispo(), A('14:00'))).toEqual({
      etat: 'DISPONIBLE',
      libelle: 'Disponible',
      peutRecevoirOffre: true,
      raison: null,
    });
  });

  test('en pause jusqu’à 14 h 32 : libellé et refus du serveur', () => {
    expect(etatLivreur(enPauseJusqua1432(), A('14:10'))).toEqual({
      etat: 'EN_PAUSE',
      libelle: "En pause jusqu'à 14 h 32",
      peutRecevoirOffre: false,
      raison: "Ce livreur est en pause jusqu'à 14 h 32.",
    });
  });

  test('hors service, en course, offre en attente : le refus du serveur', () => {
    const horsService = dispo({
      etat: 'HORS_SERVICE',
      libelle: 'Hors service',
      peut_recevoir_offre: false,
      message_refus: "Ce livreur est hors service : il n'a pas repris le travail dans l'appli.",
      en_service: false,
    });
    expect(etatLivreur(horsService, A('14:00')).raison).toBe(
      "Ce livreur est hors service : il n'a pas repris le travail dans l'appli.",
    );
    const enCourse = dispo({
      etat: 'EN_COURSE',
      libelle: 'En course',
      peut_recevoir_offre: false,
      message_refus: 'Ce livreur a déjà une course en cours.',
      en_course: true,
    });
    expect(etatLivreur(enCourse, A('14:00'))).toMatchObject({ etat: 'EN_COURSE', libelle: 'En course' });
  });
});

describe('état du livreur : une pause qui finit pendant que la fenêtre est ouverte', () => {
  test('fin de pause, il n’a pas touché Reprendre : hors service', () => {
    expect(etatLivreur(enPauseJusqua1432(), A('14:33'))).toEqual({
      etat: 'HORS_SERVICE',
      libelle: 'Hors service',
      peutRecevoirOffre: false,
      raison: "Ce livreur est hors service : il n'a pas repris le travail dans l'appli.",
    });
  });

  test('à 14 h 32 pile, la pause est finie (fin strictement future, comme le serveur)', () => {
    expect(etatLivreur(enPauseJusqua1432(), A('14:32')).etat).toBe('HORS_SERVICE');
    expect(etatLivreur(enPauseJusqua1432(), new Date('2026-10-22T14:31:59Z')).etat).toBe('EN_PAUSE');
  });

  test('fin de pause, encore dans la file : disponible', () => {
    expect(etatLivreur(enPauseJusqua1432({ en_service: true }), A('14:40'))).toEqual({
      etat: 'DISPONIBLE',
      libelle: 'Disponible',
      peutRecevoirOffre: true,
      raison: null,
    });
  });

  test('fin de pause, la pause automatique court encore : son heure de fin', () => {
    const d = enPauseJusqua1432({ en_pause_auto: true, auto_pause_until: '2026-10-22T15:05:00.000Z' });
    expect(etatLivreur(d, A('14:40'))).toEqual({
      etat: 'PAUSE_AUTO',
      libelle: "Pause automatique jusqu'à 15 h 05",
      peutRecevoirOffre: false,
      raison: "Ce livreur est en pause automatique jusqu'à 15 h 05.",
    });
  });

  test('fin de la pause automatique : en course, puis offre en attente, puis hors service', () => {
    const pauseAuto = (champs) =>
      dispo({
        etat: 'PAUSE_AUTO',
        libelle: "Pause automatique jusqu'à 14 h 32",
        peut_recevoir_offre: false,
        message_refus: "Ce livreur est en pause automatique jusqu'à 14 h 32.",
        en_pause_auto: true,
        auto_pause_until: '2026-10-22T14:32:00.000Z',
        ...champs,
      });
    expect(etatLivreur(pauseAuto({}), A('14:35')).etat).toBe('DISPONIBLE');
    expect(etatLivreur(pauseAuto({ en_course: true }), A('14:35')).etat).toBe('EN_COURSE');
    expect(etatLivreur(pauseAuto({ offre_en_attente: true }), A('14:35')).etat).toBe('OFFRE_EN_ATTENTE');
    expect(etatLivreur(pauseAuto({ en_service: false }), A('14:35'))).toMatchObject({
      etat: 'HORS_SERVICE',
      peutRecevoirOffre: false,
    });
  });

  test('pause jusqu’à Reprendre (31/12/2099) : jamais finie, sans heure', () => {
    const d = enPauseJusqua1432({
      libelle: 'En pause',
      message_refus: 'Ce livreur est en pause.',
      pause_until: PAUSE_SANS_FIN,
    });
    expect(etatLivreur(d, A('23:59'))).toMatchObject({ etat: 'EN_PAUSE', libelle: 'En pause' });
  });

  test('fiche du livreur : une pause sans fin se reconnaît (pas « termine dans 73 ans »)', () => {
    expect(estPauseSansFin(PAUSE_SANS_FIN)).toBe(true);
    expect(estPauseSansFin('2026-10-22T14:32:00.000Z')).toBe(false);
    expect(estPauseSansFin(null)).toBe(false);
    expect(estPauseSansFin('pas une date')).toBe(false);
  });

  test('poste dont l’horloge retarde : jamais ramené vers une pause que le serveur dit finie', () => {
    const d = dispo({
      etat: 'HORS_SERVICE',
      libelle: 'Hors service',
      peut_recevoir_offre: false,
      message_refus: "Ce livreur est hors service : il n'a pas repris le travail dans l'appli.",
      pause_until: '2026-10-22T14:32:00.000Z',
      en_service: false,
    });
    expect(etatLivreur(d, A('14:20')).etat).toBe('HORS_SERVICE');
  });
});

describe('heures, comme le serveur', () => {
  test('même jour : « 9 h 05 »', () => {
    expect(heureLisible(A('09:05'), A('08:00'))).toBe('9 h 05');
  });

  test('autre jour : « le 23/10 à 8 h 05 »', () => {
    expect(heureLisible(A('08:05', '2026-10-23'), A('22:00'))).toBe('le 23/10 à 8 h 05');
    const d = enPauseJusqua1432({ pause_until: '2026-10-23T08:05:00.000Z', en_pause_auto: true });
    // Texte reconstruit (fin de la pause manuelle) : même forme que le serveur.
    const apres = etatLivreurAffiche(
      { availability: 'paused', pause_until: '2026-10-23T08:05:00.000Z' },
      A('22:00'),
    );
    expect(apres.libelle).toBe("En pause jusqu'au 23/10 à 8 h 05");
    expect(apres.raison).toBe("Ce livreur est en pause jusqu'au 23/10 à 8 h 05.");
    expect(etatLivreur(d, A('22:00')).etat).toBe('EN_PAUSE');
  });
});

describe('fenêtre « Forcer l’affectation »', () => {
  test('disponible : sélectionnable', () => {
    expect(choixAffectation(dispo(), COURSE, A('14:00'))).toEqual({
      etat: 'DISPONIBLE',
      libelle: 'Disponible',
      selectionnable: true,
      raison: null,
      renvoi: false,
    });
  });

  test('en pause : grisé, avec le refus que le serveur renverrait', () => {
    expect(choixAffectation(enPauseJusqua1432(), COURSE, A('14:00'))).toEqual({
      etat: 'EN_PAUSE',
      libelle: "En pause jusqu'à 14 h 32",
      selectionnable: false,
      raison: "Ce livreur est en pause jusqu'à 14 h 32.",
      renvoi: false,
    });
  });

  const offreEnAttente = (courseId, champs = {}) =>
    dispo({
      etat: 'OFFRE_EN_ATTENTE',
      libelle: 'Offre en attente',
      peut_recevoir_offre: false,
      message_refus: 'Ce livreur a déjà une offre en attente de réponse.',
      offre_en_attente: true,
      offre_course_id: courseId,
      ...champs,
    });

  test('offre en attente sur CETTE course : sélectionnable, le serveur la renvoie', () => {
    expect(choixAffectation(offreEnAttente(COURSE), COURSE, A('14:00'))).toEqual({
      etat: 'OFFRE_EN_ATTENTE',
      libelle: 'Offre en attente sur cette course',
      selectionnable: true,
      raison: null,
      renvoi: true,
    });
  });

  test('offre en attente sur une autre course : grisé', () => {
    expect(choixAffectation(offreEnAttente(AUTRE_COURSE), COURSE, A('14:00'))).toMatchObject({
      selectionnable: false,
      raison: 'Ce livreur a déjà une offre en attente de réponse.',
      renvoi: false,
    });
  });

  test('offre sur cette course mais hors service : grisé (ordre du serveur)', () => {
    expect(choixAffectation(offreEnAttente(COURSE, { en_service: false }), COURSE, A('14:00'))).toMatchObject({
      etat: 'HORS_SERVICE',
      selectionnable: false,
      raison: "Ce livreur est hors service : il n'a pas repris le travail dans l'appli.",
    });
  });

  test('pause finie fenêtre ouverte, toujours dans la file : redevient sélectionnable', () => {
    expect(choixAffectation(enPauseJusqua1432({ en_service: true }), COURSE, A('14:33')).selectionnable).toBe(true);
  });

  test('serveur plus ancien (sans état) : sélectionnable comme avant, le serveur tranche', () => {
    expect(choixAffectation(undefined, COURSE, A('14:00'))).toEqual({
      etat: null,
      libelle: null,
      selectionnable: true,
      raison: null,
      renvoi: false,
    });
  });

  test('tri : ceux qu’on peut choisir, puis par état, puis par nom', () => {
    const ligne = (nom, d) => ({ nom, choix: choixAffectation(d, COURSE, A('14:00')) });
    const lignes = [
      ligne('Yao', dispo({ etat: 'HORS_SERVICE', libelle: 'Hors service', peut_recevoir_offre: false, en_service: false })),
      ligne('Awa', enPauseJusqua1432()),
      ligne('Koffi', dispo()),
      ligne('Bamba', offreEnAttente(COURSE)),
      ligne('Adama', dispo()),
      ligne('Éric', dispo({ etat: 'EN_COURSE', libelle: 'En course', peut_recevoir_offre: false, en_course: true })),
    ];
    expect(lignes.sort(comparerPourAffectation).map((l) => l.nom)).toEqual([
      'Adama',
      'Koffi',
      'Bamba',
      'Éric',
      'Awa',
      'Yao',
    ]);
  });
});

describe('carte et liste des livreurs', () => {
  test('état du serveur d’abord', () => {
    expect(
      etatLivreurAffiche({ disponibilite: enPauseJusqua1432(), availability: 'in_course' }, A('14:00')),
    ).toMatchObject({ etat: 'EN_PAUSE', libelle: "En pause jusqu'à 14 h 32" });
  });

  test('serveur plus ancien : `availability`, en français', () => {
    const t = A('14:00');
    expect(etatLivreurAffiche({ availability: 'available' }, t).libelle).toBe('Disponible');
    expect(etatLivreurAffiche({ availability: 'in_course' }, t).libelle).toBe('En course');
    expect(etatLivreurAffiche({ availability: 'paused', pause_until: '2026-10-22T14:32:00Z' }, t).libelle).toBe(
      "En pause jusqu'à 14 h 32",
    );
    expect(
      etatLivreurAffiche({ availability: 'auto_paused', auto_pause_until: '2026-10-22T14:45:00Z' }, t).libelle,
    ).toBe("Pause automatique jusqu'à 14 h 45");
    expect(etatLivreurAffiche({ availability: 'offline' }, t).libelle).toBe('Hors service');
    expect(etatLivreurAffiche({ availability: 'inconnu' }, t)).toMatchObject({
      etat: 'HORS_SERVICE',
      peutRecevoirOffre: false,
    });
  });

  test('rien à lire : null (la liste affiche le statut du compte)', () => {
    expect(etatLivreurAffiche({}, A('14:00'))).toBeNull();
  });

  test('filtres : « En pause » regroupe les deux pauses, « Hors service » les inactifs', () => {
    expect(correspondAuFiltre('EN_PAUSE', 'EN_PAUSE')).toBe(true);
    expect(correspondAuFiltre('PAUSE_AUTO', 'EN_PAUSE')).toBe(true);
    expect(correspondAuFiltre('OFFRE_EN_ATTENTE', 'DISPONIBLE')).toBe(true);
    expect(correspondAuFiltre('INACTIF', 'HORS_SERVICE')).toBe(true);
    expect(correspondAuFiltre('EN_COURSE', 'DISPONIBLE')).toBe(false);
    expect(correspondAuFiltre('HORS_SERVICE', 'TOUS')).toBe(true);
  });
});

describe('textes visibles', () => {
  test('français, sans tiret cadratin ni valeur d’énumération brute', () => {
    const t = A('14:00');
    const textes = [...Object.values(NOM_ETAT)];
    for (const availability of ['available', 'in_course', 'paused', 'auto_paused', 'offline']) {
      const e = etatLivreurAffiche(
        { availability, pause_until: '2026-10-22T14:32:00Z', auto_pause_until: '2026-10-22T14:45:00Z' },
        t,
      );
      textes.push(e.libelle, e.raison ?? '');
    }
    textes.push(choixAffectation(dispo({ etat: 'OFFRE_EN_ATTENTE', offre_en_attente: true, offre_course_id: COURSE }), COURSE, t).libelle);
    for (const texte of textes) {
      expect(texte).not.toContain('—');
      expect(texte).not.toMatch(/[A-Z]{2,}_[A-Z]/);
      expect(texte).not.toMatch(/\b(available|paused|offline|auto-pause)\b/i);
    }
    expect(ORDRE_ETATS).toHaveLength(Object.keys(NOM_ETAT).length);
  });
});

describe('état que ce backoffice ne connaît pas (serveur déployé avant lui)', () => {
  test('« hors service » avec le texte du serveur : la liste et la carte ont leurs couleurs', () => {
    const d = dispo({
      etat: 'NOUVEL_ETAT',
      libelle: 'Nouvel état',
      peut_recevoir_offre: true,
      message_refus: 'Raison du serveur.',
    });
    const affiche = etatLivreur(d, A('14:00'));
    expect(affiche).toEqual({
      etat: 'HORS_SERVICE',
      libelle: 'Nouvel état',
      peutRecevoirOffre: false,
      raison: 'Raison du serveur.',
    });
    expect(COULEURS_ETAT[affiche.etat].texte).toBeTruthy();
    expect(etatLivreurAffiche({ disponibilite: d }, A('14:00'))?.etat).toBe('HORS_SERVICE');
    // Sans libellé : le nom de l'état, jamais la valeur brute.
    expect(etatLivreur(dispo({ etat: 'NOUVEL_ETAT', libelle: '' }), A('14:00')).libelle).toBe('Hors service');
  });

  test('« Appli fermée », connu de ce backoffice : inchangé', () => {
    const d = dispo({ etat: 'APPLI_FERMEE', libelle: 'Appli fermée', peut_recevoir_offre: false });
    expect(etatLivreur(d, A('14:00')).etat).toBe('APPLI_FERMEE');
  });
});
