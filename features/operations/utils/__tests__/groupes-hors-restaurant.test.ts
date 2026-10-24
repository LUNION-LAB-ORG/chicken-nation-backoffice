// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';

import { cleGroupe, groupesHorsRestaurant, initiales, ligneHors } from '../groupes-hors-restaurant';

/**
 * Demande du 24/10 au soir : les commandes hors restaurant groupées comme au
 * restaurant, mais par livreur, « pour avoir la traçabilité du livreur qui
 * traite les commandes ». Heures d'Abidjan = UTC.
 */

const A = (hhmm) => new Date(`2026-10-24T${hhmm}:00Z`);
const ISO = (hhmm) => A(hhmm).toISOString();

const KOFFI = { id: 'liv-1', first_name: 'Koffi', last_name: 'Yao' };
const AWA = { id: 'liv-2', first_name: 'Awa', last_name: 'Koné' };

const course = (champs = {}) => ({
  id: 'k1',
  reference: 'CRS-1',
  pickup_code: '614',
  statut: 'IN_DELIVERY',
  deliverer_id: KOFFI.id,
  deliverer: KOFFI,
  picked_up_at: ISO('12:30'),
  parti_at: ISO('12:45'),
  motif_depart: 'BOUTON',
  ...champs,
});

const enRoute = (id, rang, statutLivraison, champsCourse = {}, champs = {}) => ({
  id,
  reference: `ORD-${id}`,
  status: 'PICKED_UP',
  type: 'DELIVERY',
  delivery_service: 'CHICKEN_NATION',
  amount: 8000,
  paied: false,
  payment_method: 'OFFLINE',
  restaurant: { name: 'Angré' },
  delivery: { id: `d-${id}`, statut: statutLivraison, sequence_order: rang, course: course(champsCourse) },
  ...champs,
});

const livree = (id, rang, champsCourse = {}, champs = {}) => ({
  ...enRoute(id, rang, 'DELIVERED', champsCourse),
  status: 'COLLECTED',
  collected_at: ISO('12:52'),
  delivery: { id: `d-${id}`, statut: 'DELIVERED', sequence_order: rang, delivered_at: ISO('12:52'), course: course(champsCourse) },
  ...champs,
});

const TOURNEE = { total: 3, livrees: 1, fin_prevue: ISO('13:05'), en_retard: false, retard_min: null };

describe('clé du groupe', () => {
  test('livreur Chicken Nation, Turbo (identifiant, nom, course), sinon « Sans livreur »', () => {
    expect(cleGroupe(enRoute('1', 1, 'IN_ROUTE'))).toBe('livreur-liv-1');
    const turbo = (livraison, champs = {}) =>
      cleGroupe({
        id: 't',
        reference: 'ORD-T',
        status: 'PICKED_UP',
        type: 'DELIVERY',
        delivery_service: 'TURBO',
        delivery: { id: 'dt', statut: 'IN_ROUTE', course: course({ deliverer_id: null, deliverer: null, turbo_escalated_at: ISO('12:00') }), ...livraison },
        ...champs,
      });
    expect(turbo({ turbo_courier_id: 'TB-9', turbo_courier_name: 'Moussa' })).toBe('turbo-TB-9');
    expect(turbo({ turbo_courier_name: 'Moussa' })).toBe('turbo-moussa');
    expect(turbo({})).toBe('turbo-k1');
    expect(cleGroupe({ id: 'x', reference: 'ORD-X', status: 'PICKED_UP', type: 'DELIVERY', delivery_service: 'TURBO', delivery: null })).toBe(
      'turbo-commande-x',
    );
    expect(cleGroupe({ id: 'p', reference: 'ORD-P', status: 'COLLECTED', type: 'PICKUP', delivery: null })).toBe('sans-livreur');
  });

  test('initiales de l’avatar', () => {
    expect(initiales(KOFFI)).toBe('KY');
    expect(initiales({ first_name: 'koffi' })).toBe('K');
    expect(initiales(null)).toBe('?');
  });
});

describe('un livreur et sa tournée', () => {
  const commandes = [
    enRoute('4820', 3, 'PENDING', { tournee: TOURNEE }),
    livree('4818', 1, { tournee: TOURNEE }),
    enRoute('4819', 2, 'IN_ROUTE', { tournee: TOURNEE }),
  ];

  test('un seul groupe, lignes par arrêt puis l’argent à rapporter', () => {
    const [g, ...autres] = groupesHorsRestaurant(commandes, { maintenant: A('12:55') });
    expect(autres).toHaveLength(0);
    expect(g.titre).toBe('Koffi Yao');
    expect(g.initiales).toBe('KY');
    expect(g.etatAvatar).toBe('EN_COURSE');
    expect(g.lignes.map((l) => `${l.reference} ${l.detail.texte}`)).toEqual([
      'ORD-4819 Arrêt 2 · En route',
      'ORD-4820 Arrêt 3 · À livrer',
      'ORD-4818 Arrêt 1 · Livrée 12 h 52',
    ]);
    expect(g.lignes[2].encaisser).toMatchObject({ bouton: 'Encaisser 8.000 F', texte: 'À encaisser 8.000 F', enRetard: false });
    expect(g.lignes[0].encaisser).toBeNull();
  });

  test('en-tête : « Fin vers 13 h 05 », « 1 sur 3 livrée » ; restaurant seulement sur « Tous »', () => {
    const [g] = groupesHorsRestaurant(commandes, { maintenant: A('12:55') });
    expect(g.droite).toEqual({ texte: 'Fin vers 13 h 05', ton: 'gris' });
    expect(g.ligne2.map((m) => m.texte)).toEqual(['1 sur 3 livrée']);
    const [tous] = groupesHorsRestaurant(commandes, { maintenant: A('12:55'), avecRestaurant: true });
    expect(tous.ligne2.map((m) => m.texte)).toEqual(['Angré', '1 sur 3 livrée']);
  });

  test('en retard : « En retard de 12 min » en rouge, à la place de la fin prévue', () => {
    const t = { ...TOURNEE, en_retard: true, retard_min: 12 };
    const [g] = groupesHorsRestaurant([enRoute('1', 1, 'IN_ROUTE', { tournee: t })], { maintenant: A('13:17') });
    expect(g.droite).toEqual({ texte: 'En retard de 12 min', ton: 'rouge' });
    const [sansMinutes] = groupesHorsRestaurant([enRoute('1', 1, 'IN_ROUTE', { tournee: { ...t, retard_min: null } })], {
      maintenant: A('13:17'),
    });
    expect(sansMinutes.droite.texte).toBe('En retard');
  });

  test('serveur plus ancien, sans tournée : « Parti à 12 h 45 » et l’arrêt de chaque ligne', () => {
    const [g] = groupesHorsRestaurant([enRoute('1', 2, 'IN_ROUTE')], { maintenant: A('12:55') });
    expect(g.droite).toEqual({ texte: 'Parti à 12 h 45', ton: 'gris' });
    expect(g.ligne2).toEqual([]);
    expect(g.lignes[0].detail.texte).toBe('Arrêt 2 · En route');
  });

  test('appli fermée : « appli fermée » en gris sur la seconde ligne, avatar couleur appli fermée', () => {
    const ferme = { ...KOFFI, appli_active: false, appli_vue_a: ISO('12:49'), appli_connectee: false };
    const [g] = groupesHorsRestaurant([enRoute('1', 1, 'IN_ROUTE', { deliverer: ferme, tournee: TOURNEE })], {
      maintenant: A('12:55'),
    });
    expect(g.ligne2.map((m) => m.texte)).toEqual(['1 sur 3 livrée', 'appli fermée']);
    expect(g.ligne2[1].ton).toBe('gris');
    expect(g.etatAvatar).toBe('APPLI_FERMEE');
  });

  test('parti sans un sac : « Parti sans ORD-4822 » en rouge', () => {
    const dehors = enRoute('4821', 1, 'IN_ROUTE');
    const resteAuComptoir = {
      id: '4822',
      reference: 'ORD-4822',
      status: 'READY',
      delivery: { id: 'd-4822', statut: 'PENDING', course: course() },
    };
    const [g] = groupesHorsRestaurant([dehors], { maintenant: A('12:55'), toutes: [dehors, resteAuComptoir] });
    expect(g.ligne2).toContainEqual({ texte: 'Parti sans ORD-4822', ton: 'rouge' });
  });

  test('échec et chez le client', () => {
    const [g] = groupesHorsRestaurant([enRoute('1', 1, 'FAILED'), enRoute('2', 2, 'ARRIVED')], { maintenant: A('12:55') });
    expect(g.lignes.map((l) => [l.detail.texte, l.detail.ton, l.icone])).toEqual([
      ['Arrêt 1 · Échec', 'rouge', 'echec'],
      ['Arrêt 2 · Chez le client', 'bleu', 'chez_le_client'],
    ]);
  });
});

describe('argent à rapporter', () => {
  test('il ne reste que de l’argent : « Tout est livré », total quand il y a deux lignes', () => {
    const fini = { statut: 'COMPLETED', tournee: { total: 2, livrees: 2, fin_prevue: null, en_retard: false, retard_min: null } };
    const [g] = groupesHorsRestaurant([livree('1', 1, fini), livree('2', 2, fini, { amount: 7500 })], { maintenant: A('13:00') });
    expect(g.droite).toEqual({ texte: 'Tout est livré', ton: 'vert' });
    expect(g.ligne2).toEqual([{ texte: 'À encaisser 15.500 F', ton: 'ambre' }]);
    expect(g.etatAvatar).toBe('HORS_SERVICE');
  });

  test('au-delà d’une heure : rouge, avec « À encaisser depuis 1 h 05 »', () => {
    const [g] = groupesHorsRestaurant([livree('1', 1, { statut: 'COMPLETED' })], { maintenant: A('13:57') });
    expect(g.lignes[0].encaisser).toMatchObject({ enRetard: true, titre: 'À encaisser depuis 1 h 05' });
  });

  test('payée en ligne pas encore reçue : « Non payée », rien à encaisser', () => {
    const l = ligneHors(livree('1', 1, { statut: 'COMPLETED' }, { payment_method: 'ONLINE' }), false, A('13:00'));
    expect(l.encaisser).toBeNull();
    expect(l.nonPayee).toBe(true);
  });

  test('une commande d’une course finie rejoint le livreur qui roule pour une autre course', () => {
    const ancienne = livree('1', 1, { id: 'k0', statut: 'COMPLETED' });
    const actuelle = enRoute('2', 1, 'IN_ROUTE', { id: 'k2', picked_up_at: ISO('12:50'), tournee: { ...TOURNEE, total: 1, livrees: 0 } });
    const groupes = groupesHorsRestaurant([ancienne, actuelle], { maintenant: A('12:55') });
    expect(groupes).toHaveLength(1);
    expect(groupes[0].course.id).toBe('k2');
    expect(groupes[0].lignes.map((l) => l.reference)).toEqual(['ORD-2', 'ORD-1']);
  });
});

describe('Turbo, « Sans livreur » et ordre des groupes', () => {
  test('Turbo : « Turbo · Moussa », « Confiée à Turbo »', () => {
    const t = {
      ...enRoute('t1', 1, 'IN_ROUTE', { deliverer_id: null, deliverer: null, turbo_escalated_at: ISO('12:00') }),
      delivery_service: 'TURBO',
    };
    t.delivery = { ...t.delivery, turbo_courier_name: 'Moussa' };
    const [g] = groupesHorsRestaurant([t], { maintenant: A('12:55') });
    expect(g.genre).toBe('turbo');
    expect(g.titre).toBe('Turbo · Moussa');
    expect(g.droite).toEqual({ texte: 'Confiée à Turbo', ton: 'violet' });
  });

  test('« Sans livreur » : le type de commande, encaissement possible', () => {
    const emportee = { id: 'p', reference: 'ORD-4830', status: 'PICKED_UP', type: 'PICKUP', amount: 3000, paied: false, payment_method: 'OFFLINE', delivery: null };
    const [g] = groupesHorsRestaurant([emportee], { maintenant: A('12:55') });
    expect(g.titre).toBe('Sans livreur');
    expect(g.droite).toBeNull();
    expect(g.lignes[0].detail.texte).toBe('À récupérer');
    expect(g.lignes[0].encaisser.bouton).toBe('Encaisser 3.000 F');
  });

  test('en retard d’abord (le plus en retard en tête), puis par fin prévue, puis l’argent, puis « Sans livreur »', () => {
    const retard = (min) => ({ total: 1, livrees: 0, fin_prevue: ISO('12:40'), en_retard: true, retard_min: min });
    const groupes = groupesHorsRestaurant(
      [
        { id: 'p', reference: 'ORD-P', status: 'COLLECTED', type: 'PICKUP', paied: false, payment_method: 'OFFLINE', delivery: null },
        livree('a', 1, { id: 'ka', deliverer_id: 'liv-a', deliverer: { first_name: 'Ali' }, statut: 'COMPLETED' }),
        enRoute('b', 1, 'IN_ROUTE', { id: 'kb', deliverer_id: 'liv-b', deliverer: { first_name: 'Bintou' }, tournee: { ...TOURNEE, fin_prevue: ISO('13:20') } }),
        enRoute('c', 1, 'IN_ROUTE', { id: 'kc', deliverer_id: 'liv-c', deliverer: { first_name: 'Cyril' }, tournee: retard(5) }),
        enRoute('d', 1, 'IN_ROUTE', { id: 'kd', deliverer_id: 'liv-d', deliverer: { first_name: 'Diane' }, tournee: { ...TOURNEE, fin_prevue: ISO('13:00') } }),
        enRoute('e', 1, 'IN_ROUTE', { id: 'ke', deliverer_id: 'liv-e', deliverer: AWA, tournee: retard(20) }),
      ],
      { maintenant: A('13:00') },
    );
    expect(groupes.map((g) => g.titre)).toEqual(['Awa Koné', 'Cyril', 'Diane', 'Bintou', 'Ali', 'Sans livreur']);
  });

  test('aucun tiret cadratin', () => {
    const groupes = groupesHorsRestaurant([enRoute('1', 1, 'IN_ROUTE', { tournee: TOURNEE }), livree('2', 2)], { maintenant: A('12:55') });
    const textes = groupes.flatMap((g) => [g.titre, g.droite?.texte ?? '', ...g.ligne2.map((m) => m.texte), ...g.lignes.map((l) => l.detail.texte)]);
    for (const t of textes) expect(t).not.toContain('—');
  });
});
