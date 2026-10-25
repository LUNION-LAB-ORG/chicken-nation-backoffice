// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';

import {
  alertesEnDirect,
  cibleDuSignal,
  groupesEnDirect,
  heureUtile,
  libelleVoirPlus,
  ligneEnDirect,
  personneEnService,
  placeCourte,
  positionValable,
  sectionDuLivreur,
  texteCourseCarte,
  texteDernierePosition,
  texteFinTournee,
  textesArrets,
} from '../groupes-en-direct';

/**
 * En direct (conception du 24/10, section 9) : sections des livreurs, détail
 * et heure de chaque ligne, ordre des alertes, toucher d'une alerte, textes
 * de la fenêtre de la carte. Heures d'Abidjan (UTC).
 */

const ISO = (hhmm: string, jour = '2026-10-24') => `${jour}T${hhmm}:00.000Z`;
const A = (hhmm: string) => new Date(ISO(hhmm));
const MAINTENANT = A('12:30');

const RESTO = { id: 'r1', name: 'Angré', latitude: 5.4, longitude: -3.98 };

function dispo(etat, extra = {}) {
  return {
    etat,
    libelle: '',
    peut_recevoir_offre: etat === 'DISPONIBLE',
    message_refus: null,
    en_pause: etat === 'EN_PAUSE',
    en_pause_auto: etat === 'PAUSE_AUTO',
    pause_until: null,
    auto_pause_until: null,
    en_service: etat !== 'HORS_SERVICE',
    en_course: etat === 'EN_COURSE',
    offre_en_attente: etat === 'OFFRE_EN_ATTENTE',
    offre_course_id: null,
    appli_active: true,
    ...extra,
  };
}

function livreur(id, etat, { disponibilite = {}, ...extra } = {}) {
  return {
    id,
    first_name: id,
    last_name: null,
    image: null,
    type_vehicule: 'MOTO',
    restaurant: RESTO,
    location: { lat: 5.4, lng: -3.98 },
    location_at: ISO('12:29'),
    location_fresh: true,
    speed_kmh: null,
    heading_deg: null,
    availability: 'available',
    queue_rank: null,
    rang_file: null,
    pause_until: null,
    auto_pause_until: null,
    disponibilite: dispo(etat, disponibilite),
    appli_connectee: true,
    active_course: null,
    ...extra,
  };
}

const course = (statut, extra = {}) => ({
  id: `c-${statut}`,
  reference: 'CRS-241024-0040',
  statut,
  assigned_at: ISO('12:00'),
  deliveries: [],
  ...extra,
});

const livraison = (n, statut, ref = `ORD-${n}`) => ({
  id: `d${n}`,
  statut,
  sequence_order: n,
  order_reference: ref,
  address: null,
});

const UN = { maintenant: MAINTENANT, unSeulRestaurant: true };
const TOUS = { maintenant: MAINTENANT, unSeulRestaurant: false };

describe('sectionDuLivreur', () => {
  test('la course passe avant la pastille', () => {
    expect(sectionDuLivreur('EN_COURSE', { statut: 'AT_RESTAURANT' })).toBe('AU_RESTAURANT');
    expect(sectionDuLivreur('EN_COURSE', { statut: 'ACCEPTED' })).toBe('EN_COURSE');
    expect(sectionDuLivreur('EN_PAUSE', { statut: 'IN_DELIVERY' })).toBe('EN_COURSE');
  });

  test('sans course : son état', () => {
    expect(sectionDuLivreur('EN_COURSE', null)).toBe('EN_COURSE');
    expect(sectionDuLivreur('DISPONIBLE', null)).toBe('DISPONIBLES');
    expect(sectionDuLivreur('OFFRE_EN_ATTENTE', null)).toBe('DISPONIBLES');
    expect(sectionDuLivreur('EN_PAUSE', null)).toBe('EN_PAUSE');
    expect(sectionDuLivreur('PAUSE_AUTO', null)).toBe('EN_PAUSE');
    expect(sectionDuLivreur('APPLI_FERMEE', null)).toBe('APPLI_FERMEE');
    expect(sectionDuLivreur('HORS_SERVICE', null)).toBe('HORS_SERVICE');
    expect(sectionDuLivreur('INACTIF', null)).toBe('HORS_SERVICE');
  });

  test('une course finie ou en recherche ne compte pas', () => {
    expect(sectionDuLivreur('DISPONIBLE', { statut: 'PENDING_ASSIGNMENT' })).toBe('DISPONIBLES');
    expect(sectionDuLivreur('HORS_SERVICE', { statut: 'COMPLETED' })).toBe('HORS_SERVICE');
  });
});

describe('positionValable', () => {
  test('lat, lng ou latitude, longitude, chaînes comprises', () => {
    expect(positionValable({ lat: 5.3, lng: -4 })).toEqual({ lat: 5.3, lng: -4 });
    expect(positionValable({ latitude: '5.3', longitude: '-4' })).toEqual({ lat: 5.3, lng: -4 });
  });

  test('rien de lisible : null', () => {
    expect(positionValable(null)).toBeNull();
    expect(positionValable({ lat: null, lng: null })).toBeNull();
    expect(positionValable({ lat: 0, lng: 0 })).toBeNull();
    expect(positionValable({ lat: 95, lng: 0 })).toBeNull();
    expect(positionValable({ lat: 'a', lng: 2 })).toBeNull();
  });
});

describe('ligneEnDirect : L2', () => {
  test('tournée partie : référence et avancement', () => {
    const l = livreur('Awa', 'EN_COURSE', {
      active_course: course('IN_DELIVERY', {
        deliveries: [livraison(1, 'DELIVERED'), livraison(2, 'DELIVERED'), livraison(3, 'IN_ROUTE')],
      }),
    });
    expect(ligneEnDirect(l, UN).detail).toBe('CRS-241024-0040 · 2 sur 3 livrées');
  });

  test('en route vers le restaurant', () => {
    const l = livreur('Awa', 'EN_COURSE', { active_course: course('ACCEPTED') });
    expect(ligneEnDirect(l, UN).detail).toBe('CRS-241024-0040 · en route vers le restaurant');
  });

  test('au restaurant depuis 6 min ; sans heure d’arrivée (serveur ancien), « Au restaurant »', () => {
    const avec = livreur('Ibrahim', 'EN_COURSE', {
      active_course: course('AT_RESTAURANT', { at_restaurant_at: ISO('12:24') }),
    });
    expect(ligneEnDirect(avec, UN)).toMatchObject({ section: 'AU_RESTAURANT', detail: 'Au restaurant depuis 6 min' });
    const sans = livreur('Ibrahim', 'EN_COURSE', { active_course: course('AT_RESTAURANT') });
    expect(ligneEnDirect(sans, UN).detail).toBe('Au restaurant');
  });

  test('disponible : place dans la file ; offre en attente : ligne vide', () => {
    expect(ligneEnDirect(livreur('Moussa', 'DISPONIBLE', { rang_file: 1 }), UN).detail).toBe('Rang FIFO #1');
    expect(ligneEnDirect(livreur('Moussa', 'DISPONIBLE', { rang_file: 2 }), UN).detail).toBe('Rang FIFO #2');
    expect(ligneEnDirect(livreur('Moussa', 'OFFRE_EN_ATTENTE', { rang_file: null }), UN).detail).toBe('');
  });

  test('serveur ancien sans rang_file : queue_rank sur un seul restaurant, rien sur « Tous »', () => {
    const ancien = livreur('Moussa', 'DISPONIBLE', { queue_rank: 3 });
    delete ancien.rang_file;
    expect(ligneEnDirect(ancien, UN).detail).toBe('Rang FIFO #3');
    expect(ligneEnDirect(ancien, TOUS).detail).toBe('Angré');
  });

  test('en pause : jusqu’à ; pause sans fin : rien', () => {
    const pause = livreur('Koffi', 'EN_PAUSE', { disponibilite: { pause_until: ISO('14:32') } });
    expect(ligneEnDirect(pause, UN).detail).toBe("Jusqu'à 14 h 32");
    const auto = livreur('Koffi', 'PAUSE_AUTO', { disponibilite: { auto_pause_until: ISO('12:45') } });
    expect(ligneEnDirect(auto, UN).detail).toBe("Jusqu'à 12 h 45");
    const sansFin = livreur('Koffi', 'EN_PAUSE', { disponibilite: { pause_until: '2099-12-31T23:59:59.000Z' } });
    expect(ligneEnDirect(sansFin, UN).detail).toBe('');
  });

  test('appli fermée : vue il y a', () => {
    const l = livreur('Yao', 'APPLI_FERMEE', { appli_vue_a: ISO('12:24'), disponibilite: { appli_active: false } });
    expect(ligneEnDirect(l, UN).detail).toBe('Vue il y a 6 min');
  });

  test('sur « Tous » : le restaurant en tête', () => {
    const l = livreur('Moussa', 'DISPONIBLE', { rang_file: 1 });
    expect(ligneEnDirect(l, TOUS).detail).toBe('Angré · Rang FIFO #1');
    expect(ligneEnDirect(livreur('Zié', 'HORS_SERVICE'), TOUS).detail).toBe('Angré');
    expect(ligneEnDirect(livreur('Zié', 'HORS_SERVICE'), UN).detail).toBe('');
  });

  test('sur « Tous » : le nom entier du restaurant, comme avant', () => {
    const l = livreur('Moussa', 'DISPONIBLE', { rang_file: 1, restaurant: { ...RESTO, name: 'CHICKEN NATION ANGRÉ' } });
    expect(ligneEnDirect(l, TOUS).detail).toBe('CHICKEN NATION ANGRÉ · Rang FIFO #1');
  });

  test('en course sans position récente : « position ancienne » à la fin', () => {
    const l = livreur('Awa', 'EN_COURSE', { location_fresh: false, active_course: course('ACCEPTED') });
    expect(ligneEnDirect(l, TOUS).detail).toBe('Angré · CRS-241024-0040 · en route vers le restaurant · position ancienne');
    const dispo = livreur('Moussa', 'DISPONIBLE', { location_fresh: false, rang_file: 1 });
    expect(ligneEnDirect(dispo, UN).detail).toBe('Rang FIFO #1');
  });

  test('injoignable : avec les applis fermées, comme le bandeau', () => {
    const l = livreur('Zié', 'DISPONIBLE');
    l.disponibilite.etat = 'INJOIGNABLE';
    l.disponibilite.libelle = 'Injoignable';
    expect(ligneEnDirect(l, UN)).toMatchObject({ etat: 'APPLI_FERMEE', section: 'APPLI_FERMEE', libelleEtat: 'Injoignable' });
  });

  test('autre état inconnu d’un serveur plus récent : hors service', () => {
    const l = livreur('Zié', 'DISPONIBLE');
    l.disponibilite.etat = 'ETAT_NOUVEAU';
    expect(ligneEnDirect(l, UN)).toMatchObject({ etat: 'HORS_SERVICE', section: 'HORS_SERVICE' });
  });
});

describe('heureUtile', () => {
  test('tournée partie : fin prévue', () => {
    const c = course('IN_DELIVERY', { fin_prevue: ISO('13:05'), en_retard: false, retard_min: null });
    expect(heureUtile(c, null, null, MAINTENANT)).toMatchObject({ texte: '13 h 05', retard: false, titre: 'Fin vers 13 h 05' });
  });

  test('tournée en retard : « +12 min » en rouge', () => {
    const c = course('IN_DELIVERY', { fin_prevue: ISO('12:18'), en_retard: true, retard_min: 12 });
    expect(heureUtile(c, null, null, MAINTENANT)).toMatchObject({
      texte: '+12 min',
      retard: true,
      titre: 'En retard de 12 min',
    });
  });

  test('serveur ancien sans fin prévue : rien', () => {
    expect(heureUtile(course('IN_DELIVERY'), null, null, MAINTENANT)).toBeNull();
  });

  test('vers le restaurant : arrivée estimée par la position', () => {
    const h = heureUtile(
      course('ACCEPTED'),
      { lat: 5.38, lng: -3.98, ts: ISO('12:29') },
      { lat: 5.4, lng: -3.98 },
      MAINTENANT,
    );
    expect(h.retard).toBe(false);
    expect(h.texte).toMatch(/^12 h [3-5]\d$/);
    expect(h.titre).toBe(`Arrivée vers ${h.texte}`);
  });

  test('vers le restaurant sans position ni restaurant : rien', () => {
    expect(heureUtile(course('ACCEPTED'), null, { lat: 5.4, lng: -3.98 }, MAINTENANT)).toBeNull();
    expect(heureUtile(course('ACCEPTED'), { lat: 5.38, lng: -3.98, ts: ISO('12:29') }, null, MAINTENANT)).toBeNull();
  });

  test('coordonnées du restaurant prises dans la liste quand le serveur ne les donne pas', () => {
    const l = livreur('Awa', 'EN_COURSE', {
      restaurant: { id: 'r1', name: 'Angré' },
      location: { lat: 5.38, lng: -3.98 },
      active_course: course('ACCEPTED'),
    });
    expect(ligneEnDirect(l, UN).heure).toBeNull();
    const avecListe = ligneEnDirect(l, { ...UN, coordonneesRestaurants: new Map([['r1', { lat: 5.4, lng: -3.98 }]]) });
    expect(avecListe.heure?.texte).toMatch(/^12 h [3-5]\d$/);
  });
});

describe('groupesEnDirect', () => {
  test('sections dans l’ordre, vides absentes', () => {
    const sections = groupesEnDirect(
      [
        livreur('Zié', 'HORS_SERVICE'),
        livreur('Moussa', 'DISPONIBLE', { rang_file: 1 }),
        livreur('Awa', 'EN_COURSE', { active_course: course('IN_DELIVERY') }),
        livreur('Ibrahim', 'EN_COURSE', { active_course: course('AT_RESTAURANT') }),
      ],
      UN,
    );
    expect(sections.map((s) => [s.titre, s.lignes.length])).toEqual([
      ['En course', 1],
      ['Au restaurant', 1],
      ['Disponibles', 1],
      ['Hors service', 1],
    ]);
  });

  test('en course : fin la plus proche d’abord, puis ceux qui vont au restaurant', () => {
    const sections = groupesEnDirect(
      [
        livreur('Vers', 'EN_COURSE', { active_course: course('ACCEPTED') }),
        livreur('Tard', 'EN_COURSE', { active_course: course('IN_DELIVERY', { fin_prevue: ISO('13:20') }) }),
        livreur('Retard', 'EN_COURSE', {
          active_course: course('IN_DELIVERY', { fin_prevue: ISO('12:10'), en_retard: true, retard_min: 20 }),
        }),
        livreur('Tot', 'EN_COURSE', { active_course: course('IN_DELIVERY', { fin_prevue: ISO('12:50') }) }),
      ],
      UN,
    );
    expect(sections[0].lignes.map((l) => l.nom)).toEqual(['Retard', 'Tot', 'Tard', 'Vers']);
  });

  test('disponibles : ordre de la file, puis les offres en attente', () => {
    const sections = groupesEnDirect(
      [
        livreur('Offre', 'OFFRE_EN_ATTENTE'),
        livreur('Deux', 'DISPONIBLE', { rang_file: 2 }),
        livreur('Sans', 'DISPONIBLE', { rang_file: null }),
        livreur('Un', 'DISPONIBLE', { rang_file: 1 }),
      ],
      UN,
    );
    expect(sections[0].lignes.map((l) => l.nom)).toEqual(['Un', 'Deux', 'Sans', 'Offre']);
  });

  test('au restaurant : celui qui attend depuis le plus longtemps d’abord', () => {
    const sections = groupesEnDirect(
      [
        livreur('Recent', 'EN_COURSE', { active_course: course('AT_RESTAURANT', { at_restaurant_at: ISO('12:28') }) }),
        livreur('Ancien', 'EN_COURSE', { active_course: course('AT_RESTAURANT', { at_restaurant_at: ISO('12:10') }) }),
      ],
      UN,
    );
    expect(sections[0].lignes.map((l) => l.nom)).toEqual(['Ancien', 'Recent']);
  });

  test('en pause : retour le plus tôt d’abord, pause sans fin en dernier', () => {
    const sections = groupesEnDirect(
      [
        livreur('SansFin', 'EN_PAUSE', { disponibilite: { pause_until: '2099-12-31T23:59:59.000Z' } }),
        livreur('Tard', 'EN_PAUSE', { disponibilite: { pause_until: ISO('14:00') } }),
        livreur('Tot', 'PAUSE_AUTO', { disponibilite: { auto_pause_until: ISO('12:40') } }),
      ],
      UN,
    );
    expect(sections[0].lignes.map((l) => l.nom)).toEqual(['Tot', 'Tard', 'SansFin']);
  });

  test('pause finie : le livreur change de section avec le temps', () => {
    const l = livreur('Koffi', 'EN_PAUSE', { disponibilite: { pause_until: ISO('12:20') } });
    expect(ligneEnDirect(l, UN).section).toBe('DISPONIBLES');
  });

  test('personne en service', () => {
    expect(personneEnService(groupesEnDirect([livreur('Zié', 'HORS_SERVICE')], UN))).toBe(true);
    expect(personneEnService(groupesEnDirect([], UN))).toBe(true);
    expect(personneEnService(groupesEnDirect([livreur('Moussa', 'DISPONIBLE')], UN))).toBe(false);
  });

  test('position : connue même ancienne, récente seulement si le serveur le dit', () => {
    const ancienne = ligneEnDirect(livreur('Awa', 'DISPONIBLE', { location_fresh: false }), UN);
    expect(ancienne).toMatchObject({ position: { lat: 5.4, lng: -3.98 }, positionRecente: false });
    const sans = ligneEnDirect(livreur('Awa', 'DISPONIBLE', { location: null }), UN);
    expect(sans).toMatchObject({ position: null, positionRecente: false });
  });
});

describe('« À surveiller »', () => {
  const signal = (cle, gravite, restaurant_id, depuis, extra = {}) => ({
    cle,
    gravite,
    restaurant_id,
    depuis,
    minutes: null,
    course: null,
    livreur: null,
    commandes: [],
    ...extra,
  });

  test('rouges d’abord, puis la plus ancienne, sans heure en dernier', () => {
    const tries = alertesEnDirect(
      [
        signal('A_ENCAISSER', 'ambre', 'r1', ISO('11:00')),
        signal('PREVU_PAS_EN_SERVICE', 'ambre', 'r1', null),
        signal('TOURNEE_EN_RETARD', 'rouge', 'r1', ISO('12:20')),
        signal('SANS_LIVREUR', 'rouge', 'r2', ISO('12:00')),
        signal('ATTENTE_AU_RESTAURANT', 'ambre', 'r2', ISO('12:10')),
      ],
      null,
    );
    expect(tries.map((s) => s.cle)).toEqual([
      'SANS_LIVREUR',
      'TOURNEE_EN_RETARD',
      'A_ENCAISSER',
      'ATTENTE_AU_RESTAURANT',
      'PREVU_PAS_EN_SERVICE',
    ]);
  });

  test('restaurant choisi : ses alertes seulement', () => {
    const tries = alertesEnDirect(
      [signal('SANS_LIVREUR', 'rouge', 'r2', ISO('12:00')), signal('A_ENCAISSER', 'ambre', 'r1', ISO('11:00'))],
      'r1',
    );
    expect(tries.map((s) => s.restaurant_id)).toEqual(['r1']);
  });

  test('voir plus', () => {
    expect(libelleVoirPlus(5, false)).toBeNull();
    expect(libelleVoirPlus(6, false)).toBe("Voir l'autre");
    expect(libelleVoirPlus(8, false)).toBe('Voir les 3 autres');
    expect(libelleVoirPlus(8, true)).toBe('Réduire');
  });

  test('toucher : le livreur s’il est dans la liste, sinon la course, sinon sa fiche', () => {
    const presents = new Set(['l1']);
    const c = { id: 'c1', reference: 'CRS-1', statut: 'IN_DELIVERY', expiree: false };
    expect(cibleDuSignal(signal('TOURNEE_EN_RETARD', 'rouge', 'r1', null, { livreur: { id: 'l1', prenom: 'Koffi' }, course: c }), presents)).toEqual({ type: 'livreur', id: 'l1' });
    expect(cibleDuSignal(signal('TOURNEE_EN_RETARD', 'rouge', 'r1', null, { livreur: { id: 'l2', prenom: 'Awa' }, course: c }), presents)).toEqual({ type: 'course', id: 'c1' });
    expect(cibleDuSignal(signal('SANS_LIVREUR', 'rouge', 'r1', null, { course: c }), presents)).toEqual({ type: 'course', id: 'c1' });
    expect(cibleDuSignal(signal('A_ENCAISSER', 'ambre', 'r1', null, { livreur: { id: 'l2', prenom: 'Awa' } }), presents)).toEqual({ type: 'fiche', id: 'l2' });
    expect(cibleDuSignal(signal('A_ENCAISSER', 'ambre', 'r1', null), presents)).toBeNull();
  });
});

describe('fenêtre du livreur', () => {
  test('rang FIFO, comme la Carte live', () => {
    expect(placeCourte(1)).toBe('#1');
    expect(placeCourte(2)).toBe('#2');
    expect(placeCourte(null)).toBeNull();
    expect(placeCourte(0)).toBeNull();
  });

  test('course active et code retrait', () => {
    expect(texteCourseCarte({ reference: 'CRS-241024-0042', pickup_code: '614' })).toBe('#CRS-241024-0042 · Code retrait 614');
    expect(texteCourseCarte({ reference: 'CRS-241024-0042' })).toBe('#CRS-241024-0042');
  });

  test('un arrêt par livraison, dans l’ordre de la tournée', () => {
    expect(
      textesArrets([livraison(2, 'IN_ROUTE', 'ORD-4819'), livraison(1, 'DELIVERED', 'ORD-4818'), livraison(3, 'FAILED', null)]),
    ).toEqual(['Arrêt 1 · ORD-4818 · Livrée', 'Arrêt 2 · ORD-4819 · En route', 'Arrêt 3 · Échec']);
  });

  test('fin de tournée', () => {
    expect(texteFinTournee(course('IN_DELIVERY', { fin_prevue: ISO('13:05') }))).toEqual({ texte: 'Fin vers 13 h 05', retard: false });
    expect(texteFinTournee(course('IN_DELIVERY', { en_retard: true, retard_min: 12 }))).toEqual({
      texte: 'En retard de 12 min',
      retard: true,
    });
    expect(texteFinTournee(course('ACCEPTED', { fin_prevue: ISO('13:05') }))).toBeNull();
    expect(texteFinTournee(course('IN_DELIVERY'))).toBeNull();
  });

  test('dernier GPS', () => {
    expect(texteDernierePosition('2026-10-24T12:40:33.000Z', MAINTENANT)).toBe('Dernier GPS : 12:40:33');
    expect(texteDernierePosition(ISO('12:40', '2026-10-23'), MAINTENANT)).toBe('Dernier GPS : 23/10 12:40:00');
    expect(texteDernierePosition(null, MAINTENANT)).toBeNull();
  });
});

describe('livreur en appel avec le call center (serveur du 24/10)', () => {
  test('rangé dans « Disponibles », pastille « En appel »', () => {
    expect(sectionDuLivreur('EN_APPEL', null)).toBe('DISPONIBLES');
    const l = livreur('Koffi', 'EN_APPEL', { disponibilite: { libelle: 'En appel', en_service: true } });
    expect(ligneEnDirect(l, UN)).toMatchObject({ etat: 'EN_APPEL', section: 'DISPONIBLES', libelleEtat: 'En appel', detail: '' });
  });

  test('après les disponibles et les offres en attente, comme au serveur', () => {
    const sections = groupesEnDirect(
      [
        livreur('Appel', 'EN_APPEL', { disponibilite: { libelle: 'En appel' } }),
        livreur('Offre', 'OFFRE_EN_ATTENTE'),
        livreur('Un', 'DISPONIBLE', { rang_file: 1 }),
      ],
      UN,
    );
    expect(sections.map((s) => [s.titre, s.lignes.map((l) => l.nom)])).toEqual([['Disponibles', ['Un', 'Offre', 'Appel']]]);
  });
});
