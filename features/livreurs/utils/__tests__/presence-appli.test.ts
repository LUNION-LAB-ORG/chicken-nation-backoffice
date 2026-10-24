// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  COULEURS_ETAT,
  COULEURS_PRESENCE,
  FILTRES_CARTE,
  LIBELLE_APPLI_ARRIERE_PLAN,
  LIBELLE_APPLI_FERMEE,
  LIBELLE_APPLI_NON_CONNECTEE,
  NOM_ETAT,
  ORDRE_ETATS,
  RAISON_APPLI_ARRIERE_PLAN,
  RAISON_APPLI_FERMEE,
  RAISON_APPLI_NON_CONNECTEE,
  REFUS_APPLI_FERMEE,
  appliActiveDe,
  appliVueADe,
  choixAffectation,
  comparerPourAffectation,
  correspondAuFiltre,
  etatLivreur,
  etatLivreurAffiche,
  libellePresence,
  presenceAppli,
  rangEtat,
  vueIlYa,
} from '../disponibilite';
import { appliDuLivreur } from '../../../operations/utils/suivi-course';

/**
 * Demande du 24/10 : « l'appli doit être active même s'il sort de l'appli
 * pour que tout fonctionne en permanence, c'est lorsqu'il ferme la fenêtre
 * que ça ne doit pas passer ».
 *
 * Le serveur dit pour chaque livreur `appli_active` (connexion temps réel OU
 * signal depuis moins de `deliverer.appli_fermee_apres_s` secondes) et
 * `appli_vue_a` (dernier signal), et ne propose plus d'offre à une appli
 * fermée (état `APPLI_FERMEE`, refus 409 « L'appli de ce livreur est
 * fermée. »). Le backoffice montre, partout où l'état d'un livreur paraît :
 *  - « Appli fermée » (gris, « vue il y a 6 min ») ;
 *  - « En arrière-plan » : appli active sans connexion, offres par notification ;
 *  - « Appli non connectée » seulement pour un serveur qui ne dit pas si
 *    l'appli tourne encore.
 *
 * Heures d'Abidjan = UTC.
 */

const A = (hhmm, jour = '2026-10-24') => new Date(`${jour}T${hhmm}:00Z`);
const MAINTENANT = A('12:40');
const COURSE = 'course-ouverte';

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

/** Livreur que le serveur classe « Appli fermée ». */
const appliFermee = (champs = {}) =>
  dispo({
    etat: 'APPLI_FERMEE',
    libelle: 'Appli fermée',
    peut_recevoir_offre: false,
    message_refus: "L'appli de ce livreur est fermée.",
    ...champs,
  });

describe('« vue il y a 6 min »', () => {
  test('minutes, heure du jour, autre jour', () => {
    expect(vueIlYa('2026-10-24T12:34:00Z', MAINTENANT)).toBe('vue il y a 6 min');
    expect(vueIlYa('2026-10-24T12:39:01Z', MAINTENANT)).toBe("vue à l'instant");
    expect(vueIlYa('2026-10-24T11:41:00Z', MAINTENANT)).toBe('vue il y a 59 min');
    expect(vueIlYa('2026-10-24T09:05:00Z', MAINTENANT)).toBe('vue à 9 h 05');
    expect(vueIlYa('2026-10-23T21:30:00Z', MAINTENANT)).toBe('vue le 23/10 à 21 h 30');
  });

  test("horloge du poste en retard sur le serveur : « à l'instant », jamais une durée négative", () => {
    expect(vueIlYa('2026-10-24T12:43:00Z', MAINTENANT)).toBe("vue à l'instant");
  });

  test('inconnue ou illisible : rien', () => {
    expect(vueIlYa(null, MAINTENANT)).toBeNull();
    expect(vueIlYa(undefined, MAINTENANT)).toBeNull();
    expect(vueIlYa('pas une date', MAINTENANT)).toBeNull();
  });
});

describe('appli du livreur à signaler', () => {
  test('appli fermée : gris, avec le dernier signal', () => {
    const p = presenceAppli(
      { appli_active: false, appli_connectee: false, appli_vue_a: '2026-10-24T12:34:00Z' },
      'DISPONIBLE',
      MAINTENANT,
    );
    expect(p).toEqual({
      cas: 'FERMEE',
      libelle: 'Appli fermée',
      vue: 'vue il y a 6 min',
      raison: RAISON_APPLI_FERMEE,
    });
    expect(libellePresence(p)).toBe('Appli fermée · vue il y a 6 min');
    expect(COULEURS_PRESENCE.FERMEE.texte).toBe('#475569');
  });

  test('appli active sans connexion temps réel : « En arrière-plan », offres par notification', () => {
    const p = presenceAppli({ appli_active: true, appli_connectee: false }, 'DISPONIBLE', MAINTENANT);
    expect(p).toEqual({
      cas: 'ARRIERE_PLAN',
      libelle: 'En arrière-plan',
      vue: null,
      raison: RAISON_APPLI_ARRIERE_PLAN,
    });
    expect(p.raison).toContain('par notification');
    expect(libellePresence(p)).toBe('En arrière-plan');
  });

  test('« En arrière-plan » remplace « Appli non connectée » quand le serveur dit que l’appli tourne', () => {
    expect(presenceAppli({ appli_connectee: false }, 'DISPONIBLE', MAINTENANT).cas).toBe('NON_CONNECTEE');
    expect(presenceAppli({ appli_connectee: false, appli_active: null }, 'DISPONIBLE', MAINTENANT).cas).toBe(
      'NON_CONNECTEE',
    );
    expect(presenceAppli({ appli_connectee: false, appli_active: true }, 'DISPONIBLE', MAINTENANT).cas).toBe(
      'ARRIERE_PLAN',
    );
  });

  test('connexion temps réel ouverte : rien à dire', () => {
    expect(presenceAppli({ appli_active: true, appli_connectee: true }, 'DISPONIBLE', MAINTENANT)).toBeNull();
    expect(presenceAppli({ appli_active: true }, 'DISPONIBLE', MAINTENANT)).toBeNull();
  });

  test('appli fermée même si la connexion est inconnue (null)', () => {
    expect(presenceAppli({ appli_active: false, appli_connectee: null }, 'EN_COURSE', MAINTENANT).cas).toBe('FERMEE');
  });

  test('en course, appli fermée : signalée (sa position n’arrive plus)', () => {
    expect(presenceAppli({ appli_active: false, appli_connectee: false }, 'EN_COURSE', MAINTENANT).cas).toBe('FERMEE');
    expect(presenceAppli({ appli_active: true, appli_connectee: false }, 'OFFRE_EN_ATTENTE', MAINTENANT).cas).toBe(
      'ARRIERE_PLAN',
    );
  });

  test('en pause, hors service ou inactif : appli fermée attendue, rien', () => {
    for (const etat of ['EN_PAUSE', 'PAUSE_AUTO', 'HORS_SERVICE', 'INACTIF', null, undefined]) {
      expect(presenceAppli({ appli_active: false, appli_connectee: false }, etat, MAINTENANT)).toBeNull();
    }
  });

  test('état « Appli fermée » du serveur : l’heure s’ajoute, même sans `appli_active`', () => {
    expect(presenceAppli({ appli_vue_a: '2026-10-24T12:30:00Z' }, 'APPLI_FERMEE', MAINTENANT)).toMatchObject({
      cas: 'FERMEE',
      vue: 'vue il y a 10 min',
    });
    expect(presenceAppli({}, 'APPLI_FERMEE', MAINTENANT)).toMatchObject({ cas: 'FERMEE', vue: null });
  });

  test('champs lus à côté de `disponibilite` ou dedans', () => {
    const dedans = { disponibilite: { appli_active: false, appli_vue_a: '2026-10-24T12:34:00Z' } };
    expect(appliActiveDe(dedans)).toBe(false);
    expect(appliVueADe(dedans)).toBe('2026-10-24T12:34:00Z');
    expect(presenceAppli(dedans, 'DISPONIBLE', MAINTENANT)).toMatchObject({ cas: 'FERMEE', vue: 'vue il y a 6 min' });
    const aCote = { appli_active: true, appli_vue_a: '2026-10-24T12:39:00Z', disponibilite: { appli_active: false } };
    expect(appliActiveDe(aCote)).toBe(true);
    expect(appliActiveDe({})).toBeUndefined();
    expect(appliVueADe({})).toBeNull();
  });
});

describe('état « Appli fermée »', () => {
  test('nom, couleur grise, rangé avant « Hors service »', () => {
    expect(NOM_ETAT.APPLI_FERMEE).toBe('Appli fermée');
    expect(LIBELLE_APPLI_FERMEE).toBe('Appli fermée');
    expect(COULEURS_ETAT.APPLI_FERMEE).toEqual({ couleur: '#64748B', fond: '#E2E8F0', texte: '#334155' });
    expect(ORDRE_ETATS.indexOf('APPLI_FERMEE')).toBe(ORDRE_ETATS.indexOf('HORS_SERVICE') - 1);
    expect(rangEtat('APPLI_FERMEE')).toBeGreaterThan(rangEtat('DISPONIBLE'));
  });

  test('textes du serveur gardés tels quels', () => {
    expect(etatLivreur(appliFermee(), MAINTENANT)).toEqual({
      etat: 'APPLI_FERMEE',
      libelle: 'Appli fermée',
      peutRecevoirOffre: false,
      raison: "L'appli de ce livreur est fermée.",
    });
  });

  test('disponible pour le serveur mais appli fermée : refus, avec le texte du 409', () => {
    expect(REFUS_APPLI_FERMEE).toBe("L'appli de ce livreur est fermée.");
    expect(etatLivreur(dispo(), MAINTENANT, false)).toEqual({
      etat: 'APPLI_FERMEE',
      libelle: 'Appli fermée',
      peutRecevoirOffre: false,
      raison: REFUS_APPLI_FERMEE,
    });
    // Appli active ou inconnue : rien ne change.
    expect(etatLivreur(dispo(), MAINTENANT, true).etat).toBe('DISPONIBLE');
    expect(etatLivreur(dispo(), MAINTENANT, null).etat).toBe('DISPONIBLE');
    expect(etatLivreur(dispo(), MAINTENANT).etat).toBe('DISPONIBLE');
    // Champ porté par `disponibilite` elle-même.
    expect(etatLivreur(dispo({ appli_active: false }), MAINTENANT).etat).toBe('APPLI_FERMEE');
  });

  test('fin de pause d’un livreur dont l’appli est fermée : « Appli fermée », pas « Disponible »', () => {
    const pause = dispo({
      etat: 'EN_PAUSE',
      libelle: "En pause jusqu'à 12 h 30",
      peut_recevoir_offre: false,
      message_refus: "Ce livreur est en pause jusqu'à 12 h 30.",
      en_pause: true,
      pause_until: '2026-10-24T12:30:00Z',
    });
    expect(etatLivreur(pause, MAINTENANT, false).etat).toBe('APPLI_FERMEE');
    expect(etatLivreur(pause, MAINTENANT, true).etat).toBe('DISPONIBLE');
    // La pause encore en cours passe avant.
    expect(etatLivreur(pause, A('12:20'), false).etat).toBe('EN_PAUSE');
  });

  test('en course ou hors service : l’état du serveur reste, l’appli se lit à part', () => {
    expect(etatLivreur(dispo({ etat: 'EN_COURSE', libelle: 'En course', peut_recevoir_offre: false }), MAINTENANT, false).etat).toBe(
      'EN_COURSE',
    );
    expect(
      etatLivreur(dispo({ etat: 'HORS_SERVICE', libelle: 'Hors service', peut_recevoir_offre: false, en_service: false }), MAINTENANT, false)
        .etat,
    ).toBe('HORS_SERVICE');
  });

  test('liste et carte : `appli_active` à côté de `disponibilite`', () => {
    expect(etatLivreurAffiche({ disponibilite: dispo(), appli_active: false }, MAINTENANT).etat).toBe('APPLI_FERMEE');
    expect(etatLivreurAffiche({ disponibilite: dispo(), appli_active: true }, MAINTENANT).etat).toBe('DISPONIBLE');
    expect(etatLivreurAffiche({ disponibilite: appliFermee() }, MAINTENANT).libelle).toBe('Appli fermée');
  });

  test('carte : un filtre « Appli fermée », à part de « Hors service »', () => {
    expect(FILTRES_CARTE.map((f) => f.libelle)).toEqual([
      'Tous',
      'Disponibles',
      'En course',
      'En pause',
      'Appli fermée',
      'Hors service',
    ]);
    expect(correspondAuFiltre('APPLI_FERMEE', 'APPLI_FERMEE')).toBe(true);
    expect(correspondAuFiltre('APPLI_FERMEE', 'HORS_SERVICE')).toBe(false);
    expect(correspondAuFiltre('APPLI_FERMEE', 'DISPONIBLE')).toBe(false);
    expect(correspondAuFiltre('APPLI_FERMEE', 'TOUS')).toBe(true);
  });
});

describe('fenêtre « Forcer l’affectation »', () => {
  // Même calcul que la fenêtre.
  const ligne = (livreur, nom = 'Koffi') => {
    const choix = choixAffectation(livreur.disponibilite, COURSE, MAINTENANT, appliActiveDe(livreur));
    const presence = presenceAppli(livreur, choix.etat, MAINTENANT);
    return {
      nom,
      choix,
      presence: choix.selectionnable || choix.etat === 'APPLI_FERMEE' ? presence : null,
    };
  };

  test('appli fermée : grisé, refus du serveur tel quel, heure du dernier signal', () => {
    const l = ligne({
      disponibilite: appliFermee(),
      appli_active: false,
      appli_connectee: false,
      appli_vue_a: '2026-10-24T12:34:00Z',
    });
    expect(l.choix).toEqual({
      etat: 'APPLI_FERMEE',
      libelle: 'Appli fermée',
      selectionnable: false,
      raison: "L'appli de ce livreur est fermée.",
      renvoi: false,
    });
    expect(l.presence.vue).toBe('vue il y a 6 min');
  });

  test('en arrière-plan : reste sélectionnable, l’admin sait que l’offre part par notification', () => {
    const l = ligne({ disponibilite: dispo(), appli_active: true, appli_connectee: false });
    expect(l.choix.selectionnable).toBe(true);
    expect(l.presence).toMatchObject({ cas: 'ARRIERE_PLAN', libelle: LIBELLE_APPLI_ARRIERE_PLAN });
  });

  test('connecté : sélectionnable, rien à dire', () => {
    const l = ligne({ disponibilite: dispo(), appli_active: true, appli_connectee: true });
    expect(l.choix.selectionnable).toBe(true);
    expect(l.presence).toBeNull();
  });

  test('renvoi de l’offre de cette course à une appli fermée : grisé, comme le serveur (409)', () => {
    const offre = dispo({
      etat: 'OFFRE_EN_ATTENTE',
      libelle: 'Offre en attente',
      peut_recevoir_offre: false,
      message_refus: 'Ce livreur a déjà une offre en attente de réponse.',
      offre_en_attente: true,
      offre_course_id: COURSE,
    });
    expect(ligne({ disponibilite: offre, appli_active: false }).choix).toEqual({
      etat: 'APPLI_FERMEE',
      libelle: 'Appli fermée',
      selectionnable: false,
      raison: REFUS_APPLI_FERMEE,
      renvoi: false,
    });
    // « Hors service » passe avant, dans l'ordre du serveur.
    expect(ligne({ disponibilite: { ...offre, en_service: false }, appli_active: false }).choix.etat).toBe('HORS_SERVICE');
    // Appli active : le renvoi reste permis.
    expect(ligne({ disponibilite: offre, appli_active: true, appli_connectee: false }).choix).toMatchObject({
      selectionnable: true,
      renvoi: true,
    });
  });

  test('grisé pour une autre raison : pas de ligne d’appli en plus', () => {
    const l = ligne({
      disponibilite: dispo({ etat: 'EN_COURSE', libelle: 'En course', peut_recevoir_offre: false, en_course: true }),
      appli_active: false,
    });
    expect(l.choix.selectionnable).toBe(false);
    expect(l.presence).toBeNull();
  });

  test('tri : ceux qu’on peut choisir, puis l’appli fermée avant les hors service', () => {
    const lignes = [
      ligne({ disponibilite: dispo({ etat: 'HORS_SERVICE', libelle: 'Hors service', peut_recevoir_offre: false, en_service: false }) }, 'Awa'),
      ligne({ disponibilite: appliFermee(), appli_active: false }, 'Bakary'),
      ligne({ disponibilite: dispo(), appli_active: true, appli_connectee: false }, 'Chantal'),
    ];
    expect(lignes.sort(comparerPourAffectation).map((l) => l.nom)).toEqual(['Chantal', 'Bakary', 'Awa']);
  });
});

describe('écran Opérations : appli du livreur d’une course', () => {
  const course = (champs = {}, livreur = {}) => ({
    id: 'c1',
    statut: 'IN_DELIVERY',
    deliverer_id: 'd1',
    deliverer: { id: 'd1', first_name: 'Koffi', ...livreur },
    ...champs,
  });

  test('appli fermée pendant la course : « Appli fermée · vue il y a 6 min »', () => {
    const p = appliDuLivreur(course({}, { appli_active: false, appli_vue_a: '2026-10-24T12:34:00Z' }), MAINTENANT);
    expect(libellePresence(p)).toBe('Appli fermée · vue il y a 6 min');
    for (const statut of ['ACCEPTED', 'AT_RESTAURANT']) {
      expect(appliDuLivreur(course({ statut }, { appli_active: false }), MAINTENANT).cas).toBe('FERMEE');
    }
  });

  test('en arrière-plan pendant la livraison', () => {
    expect(appliDuLivreur(course({}, { appli_active: true, appli_connectee: false }), MAINTENANT).cas).toBe('ARRIERE_PLAN');
  });

  test('rien : serveur sans ces champs, course sans livreur, terminée ou annulée', () => {
    expect(appliDuLivreur(course(), MAINTENANT)).toBeNull();
    expect(appliDuLivreur(course({ deliverer_id: null }, { appli_active: false }), MAINTENANT)).toBeNull();
    expect(appliDuLivreur(course({ deliverer: null }), MAINTENANT)).toBeNull();
    for (const statut of ['PENDING_ASSIGNMENT', 'COMPLETED', 'CANCELLED', 'EXPIRED']) {
      expect(appliDuLivreur(course({ statut }, { appli_active: false }), MAINTENANT)).toBeNull();
    }
  });
});

describe('textes visibles', () => {
  test('français simple, sans tiret cadratin ni valeur d’énumération brute', () => {
    const textes = [
      LIBELLE_APPLI_FERMEE,
      LIBELLE_APPLI_ARRIERE_PLAN,
      LIBELLE_APPLI_NON_CONNECTEE,
      RAISON_APPLI_FERMEE,
      RAISON_APPLI_ARRIERE_PLAN,
      RAISON_APPLI_NON_CONNECTEE,
      REFUS_APPLI_FERMEE,
      ...Object.values(NOM_ETAT),
      ...FILTRES_CARTE.map((f) => f.libelle),
      etatLivreur(dispo(), MAINTENANT, false).raison,
      vueIlYa('2026-10-23T21:30:00Z', MAINTENANT),
    ];
    for (const texte of textes) {
      expect(texte).not.toMatch(/[—–]/);
      expect(texte).not.toMatch(/[A-Z]{2,}_[A-Z]/);
      expect(texte).not.toMatch(/\b(background|offline|online|socket)\b/i);
    }
    expect(ORDRE_ETATS).toHaveLength(Object.keys(NOM_ETAT).length);
    expect(Object.keys(COULEURS_ETAT).sort()).toEqual([...ORDRE_ETATS].sort());
  });
});

/**
 * Fidèle au serveur (serveur db9a87c), quand ses sources sont là : ordre de
 * la règle (appli fermée après hors service), libellé et refus (409).
 */
const regle = join(import.meta.dir, '../../../../../backend/src/modules/deliverers/helpers/disponibilite.rules.ts');
describe.skipIf(!existsSync(regle))('« Appli fermée », fidèle au serveur', () => {
  const source = existsSync(regle) ? readFileSync(regle, 'utf8') : '';

  test('motif dit juste après « hors service », comme `etatLivreur` et la fenêtre', () => {
    const motifs = [...source.matchAll(/return \{ ok: false, motif: '([A-Z_]+)' \}/g)].map((m) => m[1]);
    expect(motifs.slice(-2)).toEqual(['HORS_SERVICE', 'APPLI_FERMEE']);
  });

  test('libellé et refus du serveur, mot pour mot', () => {
    expect(source).toContain(`APPLI_FERMEE: '${NOM_ETAT.APPLI_FERMEE}'`);
    expect(source).toContain(`return "${REFUS_APPLI_FERMEE}";`);
  });

  test('`appli_active` et `appli_vue_a` portés par `disponibilite`', () => {
    // Règle coupée (réglage à 0) : le serveur peut dire null, lu ici « Appli non connectée ».
    expect(source).toMatch(/appli_active: (\w+ \? )?l\.appli_active( : null)?/);
    expect(source).toMatch(/appli_vue_a: l\.appli_vue_a \?\? null/);
  });
});
