// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';

import {
  actionsATraiter,
  dureeLisible,
  estRouteAbsente,
  etatAffichable,
  libelleAlertes,
  minutesDepuis,
  nombreAlertesRouges,
  peutLireTableau,
  piedCarte,
  signauxATraiter,
  signauxDuRestaurant,
  tonSansLivreur,
  totalDuReseau,
} from '../tableau-livraison';

/**
 * Tableau de la livraison à l'écran (conception du 24/10, sections 5, 8 et
 * 10.1) : bandeau, pastille du menu, « À traiter », serveur pas à jour.
 */

const restaurant = (partiel = {}) => ({
  id: 'angre',
  nom: 'Angré',
  livreurs: { disponibles: 3, en_course: 2, en_pause: 1, appli_fermee: 0, en_service: 6, prevus: null },
  sans_livreur: { courses: 0, plus_ancienne_depuis: null },
  jour: { livrees: 0, duree_moyenne_s: null },
  alertes: 0,
  liste: [],
  ...partiel,
});

const signal = (partiel) => ({
  gravite: 'ambre',
  restaurant_id: 'angre',
  depuis: null,
  minutes: null,
  course: { id: 'c1', reference: 'CRS-1', statut: 'PENDING_ASSIGNMENT', expiree: false },
  livreur: null,
  commandes: [],
  ...partiel,
});

describe('qui lit le tableau', () => {
  test('mêmes rôles que le serveur', () => {
    for (const role of ['ADMIN', 'LIVRAISON_OPS', 'MANAGER', 'ASSISTANT_MANAGER', 'CAISSIER']) {
      expect(peutLireTableau({ role })).toBe(true);
    }
    for (const role of ['CALL_CENTER', 'CUISINE', 'MARKETING', undefined]) {
      expect(peutLireTableau({ role })).toBe(false);
    }
    expect(peutLireTableau(null)).toBe(false);
  });

  test('route absente : 404 seulement', () => {
    expect(estRouteAbsente(Object.assign(new Error('Ressource non trouvée.'), { status: 404 }))).toBe(true);
    expect(estRouteAbsente(Object.assign(new Error('x'), { status: 500 }))).toBe(false);
    expect(estRouteAbsente(new Error('réseau'))).toBe(false);
    expect(estRouteAbsente(null)).toBe(false);
  });
});

describe('état affichable', () => {
  test("injoignable se lit « Appli fermée », inconnu « Hors service »", () => {
    expect(etatAffichable('INJOIGNABLE')).toBe('APPLI_FERMEE');
    expect(etatAffichable('ETAT_FUTUR')).toBe('HORS_SERVICE');
    expect(etatAffichable(null)).toBe('HORS_SERVICE');
    expect(etatAffichable('DISPONIBLE')).toBe('DISPONIBLE');
    expect(etatAffichable('PAUSE_AUTO')).toBe('PAUSE_AUTO');
  });
});

describe('durées', () => {
  test('« 9 min », « 1 h 05 »', () => {
    expect(dureeLisible(9)).toBe('9 min');
    expect(dureeLisible(65)).toBe('1 h 05');
    expect(dureeLisible(120)).toBe('2 h 00');
    expect(dureeLisible(-3)).toBe('0 min');
  });

  test('minutes depuis une date, jamais négatives', () => {
    const maintenant = new Date('2026-10-24T12:40:00Z');
    expect(minutesDepuis('2026-10-24T12:31:00Z', maintenant)).toBe(9);
    expect(minutesDepuis('2026-10-24T12:45:00Z', maintenant)).toBe(0);
    expect(minutesDepuis(null, maintenant)).toBe(null);
    expect(minutesDepuis('pas une date', maintenant)).toBe(null);
  });
});

describe('bandeau des restaurants', () => {
  test('« Tous les restaurants » : sommes et moyenne pondérée par les livrées', () => {
    const total = totalDuReseau([
      restaurant({
        jour: { livrees: 30, duree_moyenne_s: 30 * 60 },
        sans_livreur: { courses: 1, plus_ancienne_depuis: '2026-10-24T12:31:00Z' },
        alertes: 2,
        livreurs: { disponibles: 3, en_course: 2, en_pause: 1, appli_fermee: 0, en_service: 6, prevus: 7 },
      }),
      restaurant({
        id: 'marcory',
        nom: 'Marcory',
        jour: { livrees: 10, duree_moyenne_s: 40 * 60 },
        sans_livreur: { courses: 2, plus_ancienne_depuis: '2026-10-24T12:20:00Z' },
        alertes: 1,
        livreurs: { disponibles: 0, en_course: 1, en_pause: 0, appli_fermee: 1, en_service: 2, prevus: null },
      }),
    ]);
    expect(total.nom).toBe('Tous les restaurants');
    expect(total.livreurs).toEqual({
      disponibles: 3,
      en_course: 3,
      en_pause: 1,
      appli_fermee: 1,
      en_service: 8,
      prevus: 7,
    });
    expect(total.sans_livreur).toEqual({ courses: 3, plus_ancienne_depuis: '2026-10-24T12:20:00Z' });
    expect(total.jour.livrees).toBe(40);
    // (30 × 30 min + 10 × 40 min) / 40 = 32,5 min
    expect(total.jour.duree_moyenne_s).toBe(1950);
    expect(total.alertes).toBe(3);
  });

  test('sans planning nulle part : prévus inconnus ; sans livraison : pas de moyenne', () => {
    const total = totalDuReseau([restaurant(), restaurant({ id: 'b' })]);
    expect(total.livreurs.prevus).toBe(null);
    expect(total.jour.duree_moyenne_s).toBe(null);
  });

  test('pied de carte', () => {
    expect(piedCarte(restaurant())).toBe('Livrées 0');
    expect(
      piedCarte(
        restaurant({
          jour: { livrees: 38, duree_moyenne_s: 31 * 60 },
          livreurs: { disponibles: 3, en_course: 2, en_pause: 1, appli_fermee: 0, en_service: 4, prevus: 6 },
        }),
      ),
    ).toBe('Livrées 38 · 31 min en moyenne · 4 en service sur 6 prévus');
    expect(
      piedCarte(
        restaurant({ livreurs: { disponibles: 1, en_course: 0, en_pause: 0, appli_fermee: 0, en_service: 1, prevus: 1 } }),
      ),
    ).toBe('Livrées 0 · 1 en service sur 1 prévu');
  });

  test('alertes : « 1 alerte », « 3 alertes », rien à zéro', () => {
    expect(libelleAlertes(0)).toBe(null);
    expect(libelleAlertes(1)).toBe('1 alerte');
    expect(libelleAlertes(3)).toBe('3 alertes');
  });

  test('« Sans livreur » : gris à zéro, ambre dès une course, rouge sans disponible ou passé le seuil', () => {
    expect(tonSansLivreur(restaurant(), [], 'angre')).toBe('aucun');
    const une = restaurant({ sans_livreur: { courses: 1, plus_ancienne_depuis: '2026-10-24T12:31:00Z' } });
    expect(tonSansLivreur(une, [signal({ cle: 'SANS_LIVREUR' })], 'angre')).toBe('ambre');
    expect(tonSansLivreur(une, [signal({ cle: 'SANS_LIVREUR', gravite: 'rouge' })], 'angre')).toBe('rouge');
    // Rouge d'un autre restaurant : pas celui-ci ; sur « Tous », si.
    const ailleurs = [signal({ cle: 'SANS_LIVREUR', gravite: 'rouge', restaurant_id: 'marcory' })];
    expect(tonSansLivreur(une, ailleurs, 'angre')).toBe('ambre');
    expect(tonSansLivreur(une, ailleurs, null)).toBe('rouge');
    const sansDispo = restaurant({
      sans_livreur: { courses: 1, plus_ancienne_depuis: null },
      livreurs: { disponibles: 0, en_course: 2, en_pause: 0, appli_fermee: 0, en_service: 2, prevus: null },
    });
    expect(tonSansLivreur(sansDispo, [], 'angre')).toBe('rouge');
  });
});

describe('alertes', () => {
  const signaux = [
    signal({ cle: 'TOURNEE_EN_RETARD', gravite: 'rouge' }),
    signal({ cle: 'SANS_LIVREUR', restaurant_id: 'marcory' }),
    signal({ cle: 'PREVU_PAS_EN_SERVICE', course: null, livreur: { id: 'l1', prenom: 'Ibrahim' } }),
    signal({ cle: 'COURSE_ANNULEE_A_RELANCER', gravite: 'rouge', restaurant_id: 'marcory' }),
  ];

  test("pastille du menu : rouges de tout le périmètre, même si un restaurant est choisi", () => {
    expect(nombreAlertesRouges({ genere_a: '', restaurants: [], signaux })).toBe(2);
    expect(nombreAlertesRouges(undefined)).toBe(0);
  });

  test('alertes d’un restaurant, ordre du serveur gardé', () => {
    expect(signauxDuRestaurant(signaux, 'marcory').map((s) => s.cle)).toEqual([
      'SANS_LIVREUR',
      'COURSE_ANNULEE_A_RELANCER',
    ]);
    expect(signauxDuRestaurant(signaux, null)).toHaveLength(4);
  });

  test('« À traiter » : seulement les alertes qui portent une course', () => {
    expect(signauxATraiter(signaux, null).map((s) => s.cle)).toEqual([
      'TOURNEE_EN_RETARD',
      'SANS_LIVREUR',
      'COURSE_ANNULEE_A_RELANCER',
    ]);
    expect(signauxATraiter(signaux, 'angre').map((s) => s.cle)).toEqual(['TOURNEE_EN_RETARD']);
    const autres = ['APPLI_FERMEE_EN_COURSE', 'POSITION_PERDUE_EN_COURSE', 'A_ENCAISSER'].map((cle) => signal({ cle }));
    expect(signauxATraiter(autres, null)).toEqual([]);
  });

  test('gestes proposés', () => {
    expect(actionsATraiter(signal({ cle: 'SANS_LIVREUR' }))).toEqual(['FORCER', 'TURBO']);
    expect(
      actionsATraiter(signal({ cle: 'SANS_LIVREUR', course: { id: 'c', reference: 'R', statut: 'EXPIRED', expiree: true } })),
    ).toEqual(['RELANCER_RECHERCHE']);
    expect(
      actionsATraiter(signal({ cle: 'COURSE_ANNULEE_A_RELANCER', course: { id: 'c', reference: 'R', statut: 'CANCELLED', expiree: false } })),
    ).toEqual(['RELANCER_LIVRAISON']);
    expect(actionsATraiter(signal({ cle: 'TOURNEE_EN_RETARD' }))).toEqual([]);
    expect(actionsATraiter(signal({ cle: 'ATTENTE_AU_RESTAURANT' }))).toEqual([]);
    expect(actionsATraiter(signal({ cle: 'SANS_LIVREUR', course: null }))).toEqual([]);
  });
});

describe('état « En appel » du tableau (serveur du 24/10)', () => {
  test('connu de l’écran, jamais « Hors service »', () => {
    expect(etatAffichable('EN_APPEL')).toBe('EN_APPEL');
  });
});
