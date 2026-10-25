/* eslint-disable @typescript-eslint/ban-ts-comment -- tests bun : leurs types ne sont pas installés dans le backoffice. */
// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';

import { cleLivreur, courseDeLaPrete, courseDuLivreur, groupesHorsRestaurant, groupOrdersForOperations } from '../group-orders';

/**
 * Demande du 24/10 : « de la même manière que les commandes sont groupées au
 * restaurant, [elles] doivent être aussi groupées hors restaurant pour avoir
 * la traçabilité du livreur qui traite les commandes ».
 */

const ISO = (hhmm) => `2026-10-24T${hhmm}:00.000Z`;

function course(id, extra = {}) {
  return { id, reference: `CRS-${id}`, statut: 'IN_DELIVERY', deliverer_id: null, created_at: ISO('12:00'), ...extra };
}

function commande(id, status, laCourse, extra = {}) {
  return {
    id,
    reference: `ORD-${id}`,
    status,
    type: 'DELIVERY',
    delivery_service: 'CHICKEN_NATION',
    amount: 8000,
    delivery: laCourse ? { id: `d-${id}`, statut: 'IN_ROUTE', course: laCourse } : null,
    ...extra,
  };
}

const KOFFI = { deliverer_id: 'koffi', deliverer: { first_name: 'Koffi', last_name: 'Yao' } };
const AWA = { deliverer_id: 'awa', deliverer: { first_name: 'Awa', last_name: 'Koné' } };

describe('un groupe par livreur, comme les courses au restaurant', () => {
  test('les commandes d’un même livreur sont ensemble, à la place de la première, dans l’ordre d’arrivée', () => {
    const k1 = course('k1', { ...KOFFI, picked_up_at: ISO('12:40') });
    const a1 = course('a1', { ...AWA, picked_up_at: ISO('12:42') });
    const groupes = groupesHorsRestaurant([
      commande('1', 'PICKED_UP', k1),
      commande('2', 'PICKED_UP', a1),
      commande('3', 'PICKED_UP', k1),
      commande('4', 'PICKED_UP', null, { type: 'PICKUP' }),
    ]);
    expect(groupes.map((g) => g.key)).toEqual(['livreur-koffi', 'livreur-awa', 'solo-4']);
    expect(groupes[0].orders.map((o) => o.id)).toEqual(['1', '3']);
    expect(groupes[0].course?.id).toBe('k1');
    expect(groupes[2].course).toBeNull();
  });

  test('une commande livrée à encaisser d’une course finie reste avec son livreur ; en tête, la course en route', () => {
    const finie = course('k0', { ...KOFFI, statut: 'COMPLETED', picked_up_at: ISO('11:50') });
    const enRoute = course('k1', { ...KOFFI, picked_up_at: ISO('12:40') });
    const groupes = groupesHorsRestaurant([
      commande('0', 'COLLECTED', finie, { paied: false, payment_method: 'OFFLINE' }),
      commande('1', 'PICKED_UP', enRoute),
    ]);
    expect(groupes).toHaveLength(1);
    expect(groupes[0].orders.map((o) => o.id)).toEqual(['0', '1']);
    expect(groupes[0].course?.id).toBe('k1');
  });

  test('plus rien en route : la course la plus récente du livreur en tête', () => {
    const avant = course('k0', { ...KOFFI, statut: 'COMPLETED', picked_up_at: ISO('11:50') });
    const apres = course('k1', { ...KOFFI, statut: 'COMPLETED', picked_up_at: ISO('12:30') });
    expect(courseDuLivreur([commande('0', 'COLLECTED', avant), commande('1', 'COLLECTED', apres)])?.id).toBe('k1');
    expect(courseDuLivreur([commande('0', 'COLLECTED', null)])).toBeNull();
  });

  test('Turbo : le livreur donné par Turbo, sinon son nom, sinon la course', () => {
    const turbo = course('t1', { turbo_escalated_at: ISO('12:10') });
    const avecId = commande('1', 'PICKED_UP', turbo);
    avecId.delivery.turbo_courier_id = 'tc-9';
    const avecNom = commande('2', 'PICKED_UP', turbo);
    avecNom.delivery.turbo_courier_name = 'Moussa';
    expect(cleLivreur(avecId)).toBe('turbo-tc-9');
    expect(cleLivreur(avecNom)).toBe('turbo-moussa');
    expect(cleLivreur(commande('3', 'PICKED_UP', turbo))).toBe('turbo-t1');
  });

  test('sans livreur (à emporter, sur place, course sans livreur) : carte seule, comme avant', () => {
    expect(cleLivreur(commande('1', 'PICKED_UP', null, { type: 'TABLE' }))).toBeNull();
    expect(cleLivreur(commande('2', 'PICKED_UP', course('x')))).toBeNull();
    const groupes = groupesHorsRestaurant([commande('1', 'PICKED_UP', null), commande('2', 'COLLECTED', null)]);
    expect(groupes.map((g) => [g.key, g.orders.length])).toEqual([
      ['solo-1', 1],
      ['solo-2', 1],
    ]);
  });

  test('aucune commande perdue ni comptée deux fois', () => {
    const k1 = course('k1', KOFFI);
    const a1 = course('a1', AWA);
    const entree = [
      commande('1', 'PICKED_UP', k1),
      commande('2', 'COLLECTED', a1),
      commande('3', 'PICKED_UP', null),
      commande('4', 'PICKED_UP', k1),
    ];
    const ids = groupesHorsRestaurant(entree).flatMap((g) => g.orders.map((o) => o.id));
    expect(ids.sort()).toEqual(['1', '2', '3', '4']);
  });
});

/**
 * Commande prête dont la livraison ou la course est finie (correction du
 * 24/10, ef84889, remise le 25/10) : carte seule, jamais une ligne d'une
 * course qui ne viendra plus la chercher (le serveur refuserait « Confirmer
 * la récupération »).
 */
describe('commande prête dont la livraison ou la course est finie', () => {
  const prete = (id, laCourse, statutLivraison = 'PENDING') => ({
    ...commande(id, 'READY', laCourse),
    delivery: { id: `d-${id}`, statut: statutLivraison, course: laCourse },
  });

  test('course annulée : carte seule, la commande reste touchable', () => {
    const k = course('k', { ...KOFFI, statut: 'CANCELLED' });
    const { pretesGroupes } = groupOrdersForOperations([prete('a', k, 'CANCELLED')]);
    expect(pretesGroupes.map((g) => [g.key, g.courseId, g.orders.map((o) => o.id)])).toEqual([['solo-a', null, ['a']]]);
  });

  test('commande détachée d’une course partie : carte seule, pas une ligne de cette course', () => {
    const k = course('k', { ...KOFFI, statut: 'IN_DELIVERY', picked_up_at: ISO('12:30') });
    const { pretesGroupes } = groupOrdersForOperations([prete('a', k, 'CANCELLED'), prete('b', k)]);
    expect(pretesGroupes.map((g) => [g.key, g.orders.map((o) => o.id)])).toEqual([
      ['solo-a', ['a']],
      ['course-k', ['b']],
    ]);
  });

  test('course terminée : carte seule ; « Aucun livreur trouvé » garde son groupe', () => {
    const fini = course('f', { ...KOFFI, statut: 'COMPLETED' });
    const expiree = course('e', { statut: 'EXPIRED' });
    const { pretesGroupes } = groupOrdersForOperations([prete('a', fini), prete('b', expiree)]);
    expect(pretesGroupes.map((g) => g.key)).toEqual(['solo-a', 'course-e']);
    expect(courseDeLaPrete(prete('c', course('c', { ...KOFFI, statut: 'ACCEPTED' })))?.id).toBe('c');
  });
});
