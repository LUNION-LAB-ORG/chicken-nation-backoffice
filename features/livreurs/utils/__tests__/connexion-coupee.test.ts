// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';

import {
  COULEURS_ETAT,
  COULEURS_PRESENCE,
  FILTRES_CARTE,
  LIBELLE_APPLI_COUPEE,
  NOM_ETAT,
  ORDRE_ETATS,
  REFUS_CONNEXION_COUPEE,
  REFUS_INJOIGNABLE,
  appliEtatDe,
  choixAffectation,
  correspondAuFiltre,
  depuisLisible,
  etatConnu,
  etatLivreur,
  etatLivreurAffiche,
  libellePresence,
  presenceAppli,
  raisonConnexionCoupee,
} from '../disponibilite';
import { TITRES_SECTIONS, etatEnDirect, ligneEnDirect, sectionDuLivreur } from '../groupes-en-direct';
import { detailEtatDuJour } from '../livreurs-du-jour';
import { appliDuLivreur } from '../../../operations/utils/suivi-course';
import { appliLivreurLivraison, lireLivraison } from '../../../operations/utils/suivi-livraison';
import { TOUS_LES_REGLAGES } from '../../../courses/utils/reglages-regroupement';

const def = (cle) => TOUS_LES_REGLAGES.find((r) => r.cle === cle);

/**
 * Retour du client du 25/10 : « L'appli livreur n'est pas fermée [...] mais
 * au niveau du backoffice, c'est affiché l'appli fermée. Je ne sais pas si
 * c'est parce que l'écran de l'appareil s'est verrouillé ou si c'est la
 * connexion qui est interrompue ».
 *
 * Conception du 25/10 (`.banc-test-crm/appli-fermee-correction.md`) : le
 * serveur garde la raison de la fin du socket et dit, pour chaque livreur,
 * `appli_etat` : `ACTIVE`, `FERMEE` (l'appli a fermé elle-même son socket,
 * rien ensuite), `COUPURE` (tout autre silence de 180 s), ou null (règle
 * coupée). Nouvel état `CONNEXION_COUPEE` (« Connexion coupée »).
 *
 * Au backoffice : « Appli fermée » seulement sur la preuve du serveur ; tout
 * autre silence, et tout doute (serveur plus ancien), « Connexion coupée ».
 * « Injoignable » a son nom et sa place, jamais « Appli fermée ».
 *
 * Heure d'Abidjan = UTC. 17 h 35 : la course de la capture est en route.
 */

const T = new Date('2026-10-25T17:35:00Z');
const ISO = (hhmm, jour = '2026-10-25') => `${jour}T${hhmm}:00.000Z`;
const COURSE = 'course-ouverte';

/** `disponibilite` telle que le serveur corrigé la renvoie. */
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
  appli_active: true,
  appli_etat: 'ACTIVE',
  appli_vue_a: ISO('17:34'),
  ...champs,
});

const coupee = (champs = {}) =>
  dispo({
    etat: 'CONNEXION_COUPEE',
    libelle: 'Connexion coupée',
    peut_recevoir_offre: false,
    message_refus: 'La connexion de ce livreur est coupée : son appli ne répond plus.',
    appli_active: false,
    appli_etat: 'COUPURE',
    appli_vue_a: ISO('17:31'),
    ...champs,
  });

const fermee = (champs = {}) =>
  dispo({
    etat: 'APPLI_FERMEE',
    libelle: 'Appli fermée',
    peut_recevoir_offre: false,
    message_refus: "L'appli de ce livreur est fermée.",
    appli_active: false,
    appli_etat: 'FERMEE',
    appli_vue_a: ISO('17:32'),
    ...champs,
  });

/** Un livreur de `GET /deliverers/live-locations` : champs de l'appli à côté de `disponibilite`. */
const live = (disponibilite, extra = {}) => ({
  id: 'liv-1',
  first_name: 'Koffi',
  last_name: null,
  restaurant: { id: 'r1', name: 'Angré' },
  location: { lat: 5.4, lng: -3.98 },
  location_at: disponibilite.appli_vue_a,
  location_fresh: true,
  queue_rank: null,
  rang_file: null,
  disponibilite,
  appli_active: disponibilite.appli_active,
  appli_etat: disponibilite.appli_etat,
  appli_vue_a: disponibilite.appli_vue_a,
  appli_connectee: false,
  active_course: null,
  ...extra,
});

/** Ce que les écrans affichent pour ce livreur (badge, ligne d'appli, section d'En direct, filtre). */
function ecrans(l, maintenant = T) {
  const affiche = etatLivreurAffiche(l, maintenant);
  const presence = presenceAppli(l, affiche?.etat, maintenant);
  const { etat } = etatEnDirect(l, maintenant);
  return {
    badge: affiche?.libelle ?? null,
    etat: affiche?.etat ?? null,
    ligneAppli: presence ? libellePresence(presence) : null,
    section: TITRES_SECTIONS[sectionDuLivreur(etat, l.active_course)],
    filtre: FILTRES_CARTE.find((f) => f.cle !== 'TOUS' && correspondAuFiltre(etat, f.cle))?.libelle ?? null,
  };
}

const enCourse = { id: 'c1', reference: 'CRS-1', statut: 'IN_DELIVERY', deliveries: [] };

describe('scénarios de la conception (tableau du § 6)', () => {
  test('écran verrouillé 10 min, Android d’origine : rien à signaler, ou « En arrière-plan »', () => {
    expect(ecrans(live(dispo(), { appli_connectee: true }))).toMatchObject({ badge: 'Disponible', ligneAppli: null });
    expect(ecrans(live(dispo()))).toMatchObject({ badge: 'Disponible', ligneAppli: 'En arrière-plan', section: 'Disponibles' });
  });

  test('autre appli 10 min (WhatsApp) : comme l’écran verrouillé', () => {
    const l = live(dispo({ etat: 'EN_COURSE', libelle: 'En course', peut_recevoir_offre: false, en_course: true }), {
      active_course: enCourse,
    });
    expect(ecrans(l)).toMatchObject({ badge: 'En course', ligneAppli: 'En arrière-plan', section: 'En course' });
  });

  test('écran verrouillé, téléphone qui gèle ou tue l’appli : « Connexion coupée · depuis 4 min »', () => {
    expect(ecrans(live(coupee()))).toEqual({
      badge: 'Connexion coupée',
      etat: 'CONNEXION_COUPEE',
      ligneAppli: 'Connexion coupée · depuis 4 min',
      section: 'Connexion coupée',
      filtre: 'Connexion coupée',
    });
  });

  test('réseau coupé 2 min : au pire « Connexion coupée », jamais « Appli fermée »', () => {
    const l = live(coupee({ appli_vue_a: ISO('17:32') }));
    expect(ecrans(l).ligneAppli).toBe('Connexion coupée · depuis 3 min');
    expect(JSON.stringify(ecrans(l))).not.toContain('Appli fermée');
  });

  test('réseau coupé 10 min en course : « Connexion coupée · depuis 17 h 31 » passé une heure', () => {
    const dCourse = coupee({ etat: 'EN_COURSE', libelle: 'En course', message_refus: null, en_course: true });
    const l = live(dCourse, { active_course: enCourse });
    expect(ecrans(l, new Date(ISO('17:41')))).toMatchObject({
      badge: 'En course',
      ligneAppli: 'Connexion coupée · depuis 10 min',
      section: 'En course',
    });
    expect(ecrans(l, new Date(ISO('18:40'))).ligneAppli).toBe('Connexion coupée · depuis 17 h 31');
  });

  test('appli glissée hors des récentes (fermeture prouvée) : « Appli fermée · vue il y a 3 min »', () => {
    expect(ecrans(live(fermee()))).toEqual({
      badge: 'Appli fermée',
      etat: 'APPLI_FERMEE',
      ligneAppli: 'Appli fermée · vue il y a 3 min',
      section: 'Appli fermée',
      filtre: 'Appli fermée',
    });
  });

  test('téléphone redémarré, Redis muet, présence illisible : le serveur dit COUPURE, l’écran aussi', () => {
    const l = live(coupee({ appli_vue_a: ISO('17:45') }), { appli_connectee: null });
    expect(ecrans(l, new Date(ISO('19:00'))).ligneAppli).toBe('Connexion coupée · depuis 17 h 45');
  });

  test('injoignable (signal récent, ni socket ni jeton) : « Injoignable », section « Connexion coupée », jamais « Appli fermée »', () => {
    const d = dispo({
      etat: 'INJOIGNABLE',
      libelle: 'Injoignable',
      peut_recevoir_offre: false,
      message_refus: 'Ce livreur est injoignable : ni appli connectée, ni notifications.',
      appli_vue_a: ISO('17:34'),
    });
    expect(ecrans(live(d))).toEqual({
      badge: 'Injoignable',
      etat: 'INJOIGNABLE',
      ligneAppli: null,
      section: 'Connexion coupée',
      filtre: 'Connexion coupée',
    });
  });

  test('repro du 25/10 : coupure de 240 s et fermeture de 240 s ne donnent plus le même affichage', () => {
    const vue = ISO('17:31');
    const enCourseAvec = (appli_etat) =>
      live(
        dispo({
          etat: 'EN_COURSE',
          libelle: 'En course',
          peut_recevoir_offre: false,
          en_course: true,
          appli_active: false,
          appli_etat,
          appli_vue_a: vue,
        }),
        { active_course: enCourse },
      );
    const c = ecrans(enCourseAvec('COUPURE'));
    const f = ecrans(enCourseAvec('FERMEE'));
    expect(c).not.toEqual(f);
    expect(c.ligneAppli).toBe('Connexion coupée · depuis 4 min');
    expect(f.ligneAppli).toBe('Appli fermée · vue il y a 4 min');
  });
});

describe('« Appli fermée » seulement sur la preuve du serveur', () => {
  test('serveur plus ancien (sans `appli_etat`), `appli_active` faux : « Connexion coupée », jamais « Appli fermée »', () => {
    const p = presenceAppli({ appli_active: false, appli_connectee: false, appli_vue_a: ISO('17:31') }, 'EN_COURSE', T);
    expect(p.cas).toBe('COUPURE');
    expect(libellePresence(p)).toBe('Connexion coupée · depuis 4 min');
    expect(presenceAppli({ appli_active: false, appli_connectee: null }, 'DISPONIBLE', T).cas).toBe('COUPURE');
  });

  test('`appli_active` vrai : jamais « Appli fermée » ni « Connexion coupée »', () => {
    for (const appli_etat of ['FERMEE', 'COUPURE', 'ACTIVE', null, undefined]) {
      for (const appli_connectee of [true, false, null]) {
        const p = presenceAppli({ appli_active: true, appli_etat, appli_connectee }, 'DISPONIBLE', T);
        expect(['FERMEE', 'COUPURE']).not.toContain(p?.cas);
      }
    }
  });

  test('état du serveur : « Appli fermée » et « Connexion coupée » gardent l’heure', () => {
    expect(libellePresence(presenceAppli({ appli_vue_a: ISO('17:31') }, 'APPLI_FERMEE', T))).toBe(
      'Appli fermée · vue il y a 4 min',
    );
    expect(libellePresence(presenceAppli({ appli_vue_a: ISO('17:31') }, 'CONNEXION_COUPEE', T))).toBe(
      'Connexion coupée · depuis 4 min',
    );
    expect(presenceAppli({}, 'CONNEXION_COUPEE', T)).toMatchObject({ cas: 'COUPURE', vue: null });
  });

  test('en pause, hors service, inactif, injoignable : rien sur l’appli', () => {
    for (const etat of ['EN_PAUSE', 'PAUSE_AUTO', 'HORS_SERVICE', 'INACTIF', 'INJOIGNABLE']) {
      expect(presenceAppli({ appli_active: false, appli_etat: 'COUPURE' }, etat, T)).toBeNull();
    }
  });

  test('`appli_etat` lu à côté de `disponibilite` ou dedans', () => {
    expect(appliEtatDe({ appli_etat: 'FERMEE' })).toBe('FERMEE');
    expect(appliEtatDe({ disponibilite: { appli_etat: 'COUPURE' } })).toBe('COUPURE');
    expect(appliEtatDe({})).toBeUndefined();
    const dedans = { disponibilite: { appli_active: false, appli_etat: 'FERMEE', appli_vue_a: ISO('17:31') } };
    expect(presenceAppli(dedans, 'DISPONIBLE', T).cas).toBe('FERMEE');
  });
});

describe('état du livreur et « Forcer l’affectation »', () => {
  test('disponible pour le serveur mais appli silencieuse : « Connexion coupée », sauf fermeture prouvée', () => {
    expect(etatLivreur(dispo({ appli_active: false, appli_etat: 'COUPURE' }), T)).toEqual({
      etat: 'CONNEXION_COUPEE',
      libelle: 'Connexion coupée',
      peutRecevoirOffre: false,
      raison: REFUS_CONNEXION_COUPEE,
    });
    expect(etatLivreur(dispo({ appli_active: false, appli_etat: 'FERMEE' }), T).etat).toBe('APPLI_FERMEE');
    // Serveur plus ancien : sans preuve, jamais « Appli fermée ».
    expect(etatLivreur(dispo({ appli_active: false, appli_etat: undefined }), T).etat).toBe('CONNEXION_COUPEE');
    expect(etatLivreurAffiche({ disponibilite: dispo(), appli_active: false }, T).etat).toBe('CONNEXION_COUPEE');
    expect(etatLivreurAffiche({ disponibilite: dispo(), appli_active: false, appli_etat: 'FERMEE' }, T).etat).toBe(
      'APPLI_FERMEE',
    );
  });

  test('fin de pause d’un livreur dont la connexion est coupée : « Connexion coupée »', () => {
    const pause = coupee({
      etat: 'EN_PAUSE',
      libelle: "En pause jusqu'à 17 h 30",
      message_refus: "Ce livreur est en pause jusqu'à 17 h 30.",
      en_pause: true,
      pause_until: ISO('17:30'),
    });
    expect(etatLivreur(pause, T).etat).toBe('CONNEXION_COUPEE');
  });

  test('« Injoignable » : état connu, son nom, sa couleur, son refus', () => {
    expect(etatConnu('INJOIGNABLE')).toBe('INJOIGNABLE');
    expect(etatConnu('CONNEXION_COUPEE')).toBe('CONNEXION_COUPEE');
    const d = dispo({ etat: 'INJOIGNABLE', libelle: '', peut_recevoir_offre: false, message_refus: null });
    expect(etatLivreur(d, T)).toEqual({
      etat: 'INJOIGNABLE',
      libelle: 'Injoignable',
      peutRecevoirOffre: false,
      raison: REFUS_INJOIGNABLE,
    });
  });

  test('fenêtre : connexion coupée grisée avec le refus du serveur ; renvoi de l’offre refusé de même', () => {
    expect(choixAffectation(coupee(), COURSE, T)).toEqual({
      etat: 'CONNEXION_COUPEE',
      libelle: 'Connexion coupée',
      selectionnable: false,
      raison: 'La connexion de ce livreur est coupée : son appli ne répond plus.',
      renvoi: false,
    });
    const offre = dispo({
      etat: 'OFFRE_EN_ATTENTE',
      libelle: 'Offre en attente',
      peut_recevoir_offre: false,
      offre_en_attente: true,
      offre_course_id: COURSE,
    });
    expect(choixAffectation(offre, COURSE, T, false, 'COUPURE')).toMatchObject({
      etat: 'CONNEXION_COUPEE',
      selectionnable: false,
      raison: REFUS_CONNEXION_COUPEE,
    });
    expect(choixAffectation(offre, COURSE, T, false, 'FERMEE').etat).toBe('APPLI_FERMEE');
    expect(choixAffectation(offre, COURSE, T, false).etat).toBe('CONNEXION_COUPEE');
  });
});

describe('noms, couleurs, rangement', () => {
  test('« Connexion coupée » et « Injoignable » : ambre, juste avant « Appli fermée »', () => {
    expect(NOM_ETAT.CONNEXION_COUPEE).toBe('Connexion coupée');
    expect(NOM_ETAT.INJOIGNABLE).toBe('Injoignable');
    expect(LIBELLE_APPLI_COUPEE).toBe('Connexion coupée');
    for (const etat of ['CONNEXION_COUPEE', 'INJOIGNABLE']) {
      expect(COULEURS_ETAT[etat]).toMatchObject({ texte: '#B45309', fond: '#FFFBEB' });
    }
    expect(COULEURS_PRESENCE.COUPURE).toMatchObject({ texte: '#B45309', fond: '#FFFBEB' });
    const i = ORDRE_ETATS.indexOf('APPLI_FERMEE');
    expect(ORDRE_ETATS.slice(i - 2, i + 1)).toEqual(['CONNEXION_COUPEE', 'INJOIGNABLE', 'APPLI_FERMEE']);
  });

  test('carte : puce « Connexion coupée » (coupure et injoignable) ; « Appli fermée » ne garde que les fermées', () => {
    expect(FILTRES_CARTE.map((f) => f.libelle)).toEqual([
      'Tous',
      'Disponibles',
      'En course',
      'En pause',
      'Connexion coupée',
      'Appli fermée',
      'Hors service',
    ]);
    expect(correspondAuFiltre('CONNEXION_COUPEE', 'CONNEXION_COUPEE')).toBe(true);
    expect(correspondAuFiltre('INJOIGNABLE', 'CONNEXION_COUPEE')).toBe(true);
    expect(correspondAuFiltre('INJOIGNABLE', 'APPLI_FERMEE')).toBe(false);
    expect(correspondAuFiltre('CONNEXION_COUPEE', 'APPLI_FERMEE')).toBe(false);
    expect(correspondAuFiltre('APPLI_FERMEE', 'APPLI_FERMEE')).toBe(true);
  });

  test('« depuis 4 min », « depuis 17 h 31 », « depuis le 24/10 à 17 h 31 »', () => {
    expect(depuisLisible(ISO('17:31'), T)).toBe('depuis 4 min');
    expect(depuisLisible(ISO('16:36'), T)).toBe('depuis 59 min');
    expect(depuisLisible(ISO('16:31'), T)).toBe('depuis 16 h 31');
    expect(depuisLisible(ISO('17:31', '2026-10-24'), T)).toBe('depuis le 24/10 à 17 h 31');
    expect(depuisLisible(ISO('17:34'), new Date('2026-10-25T17:34:40Z'))).toBe("depuis moins d'1 min");
    // Horloge du poste en retard : jamais une durée négative.
    expect(depuisLisible(ISO('17:40'), T)).toBe("depuis moins d'1 min");
    expect(depuisLisible(null, T)).toBeNull();
  });

  test('raison : l’heure du dernier signe de vie, les deux causes, aucune offre', () => {
    expect(raisonConnexionCoupee(ISO('17:31'), T)).toBe(
      "Plus de nouvelles de son appli depuis 17 h 31 : réseau coupé, ou téléphone qui bloque l'appli. Aucune offre jusqu'à son retour.",
    );
    expect(raisonConnexionCoupee(null, T)).toBe(
      "Plus de nouvelles de son appli : réseau coupé, ou téléphone qui bloque l'appli. Aucune offre jusqu'à son retour.",
    );
  });

  test('textes en français simple, sans tiret cadratin ni valeur technique', () => {
    const textes = [
      LIBELLE_APPLI_COUPEE,
      REFUS_CONNEXION_COUPEE,
      REFUS_INJOIGNABLE,
      raisonConnexionCoupee(ISO('17:31'), T),
      ...Object.values(NOM_ETAT),
      ...Object.values(TITRES_SECTIONS),
      ...FILTRES_CARTE.map((f) => f.libelle),
      def('deliverer.appli_fermee_apres_s').aide,
    ];
    for (const texte of textes) {
      expect(texte).not.toMatch(/[—–]/);
      expect(texte).not.toMatch(/[A-Z]{2,}_[A-Z]|[a-z]+_[a-z]+/);
      expect(texte).not.toMatch(/\b(background|offline|online|socket|ping|timeout)\b/i);
    }
  });
});

describe('En direct et « Aujourd’hui »', () => {
  test('section « Connexion coupée » juste avant « Appli fermée », ligne « Depuis 4 min »', () => {
    const titres = Object.values(TITRES_SECTIONS);
    expect(titres.indexOf('Connexion coupée')).toBe(titres.indexOf('Appli fermée') - 1);
    const ligne = ligneEnDirect(live(coupee()), { maintenant: T, unSeulRestaurant: true });
    expect(ligne).toMatchObject({ etat: 'CONNEXION_COUPEE', section: 'CONNEXION_COUPEE', detail: 'Depuis 4 min' });
  });

  test('injoignable dans la section : l’heure du dernier signe de vie', () => {
    const d = dispo({ etat: 'INJOIGNABLE', libelle: 'Injoignable', peut_recevoir_offre: false });
    const ligne = ligneEnDirect(live(d), { maintenant: T, unSeulRestaurant: true });
    expect(ligne).toMatchObject({ etat: 'INJOIGNABLE', section: 'CONNEXION_COUPEE', detail: 'Vue il y a 1 min' });
  });

  test('« Aujourd’hui » : « depuis 4 min » pour une coupure, « vue il y a 1 min » pour un injoignable', () => {
    expect(detailEtatDuJour('CONNEXION_COUPEE', { appli_vue_a: ISO('17:31'), rang: null }, T).texte).toBe('depuis 4 min');
    expect(detailEtatDuJour('INJOIGNABLE', { appli_vue_a: ISO('17:34'), rang: null }, T).texte).toBe('vue il y a 1 min');
  });
});

describe('écran Commandes et tiroir de la commande', () => {
  test('groupe de la course : « Connexion coupée · depuis 4 min » ou « Appli fermée · vue il y a 4 min »', () => {
    const course = (deliverer) => ({ id: 'c1', statut: 'IN_DELIVERY', deliverer_id: 'd1', deliverer: { id: 'd1', ...deliverer } });
    const vue = ISO('17:31');
    expect(libellePresence(appliDuLivreur(course({ appli_active: false, appli_etat: 'COUPURE', appli_vue_a: vue }), T))).toBe(
      'Connexion coupée · depuis 4 min',
    );
    expect(libellePresence(appliDuLivreur(course({ appli_active: false, appli_etat: 'FERMEE', appli_vue_a: vue }), T))).toBe(
      'Appli fermée · vue il y a 4 min',
    );
    // Serveur plus ancien : sans preuve.
    expect(appliDuLivreur(course({ appli_active: false, appli_vue_a: vue }), T).cas).toBe('COUPURE');
  });

  test('tiroir, section Livraison : `appli_etat` lu et transmis', () => {
    const tiroir = (livreur) =>
      lireLivraison({
        service: 'CHICKEN_NATION',
        course: { id: 'c1', reference: 'CRS-1', statut: 'IN_DELIVERY' },
        livreur: { id: 'liv-1', nom: 'Koffi', telephone: null, etat: 'vers_client', ...livreur },
        tournee: [],
        etapes: [{ cle: 'acceptee', heure: ISO('17:24') }],
        durees: {},
      });
    const vue = ISO('17:31');
    const coupure = tiroir({ appli_active: false, appli_etat: 'COUPURE', appli_vue_a: vue, appli_connectee: false });
    expect(coupure.livreur.appli_etat).toBe('COUPURE');
    expect(libellePresence(appliLivreurLivraison(coupure, T))).toBe('Connexion coupée · depuis 4 min');
    const ferme = tiroir({ appli_active: false, appli_etat: 'FERMEE', appli_vue_a: vue, appli_connectee: false });
    expect(libellePresence(appliLivreurLivraison(ferme, T))).toBe('Appli fermée · vue il y a 4 min');
    // Valeur inconnue : ignorée, sans preuve donc coupure.
    const inconnue = tiroir({ appli_active: false, appli_etat: 'AUTRE', appli_vue_a: vue, appli_connectee: false });
    expect(inconnue.livreur.appli_etat).toBeUndefined();
    expect(appliLivreurLivraison(inconnue, T).cas).toBe('COUPURE');
    expect(tiroir({ appli_etat: null }).livreur.appli_etat).toBeNull();
  });
});
