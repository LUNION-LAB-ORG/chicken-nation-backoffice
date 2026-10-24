// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';

import {
  commandesAuRestaurantDeLaCourse,
  groupesRetenusSansCommandePrete,
  groupOrdersForOperations,
  ordonnerGroupesPretes,
} from '../group-orders';

/**
 * Colonne « Prêtes » de l'écran Commandes (demande du 24/10 au soir) : le
 * groupe d'une course liste ses commandes encore au restaurant, une course
 * retenue sans commande prête garde son en-tête, et l'ordre suit ce que la
 * caissière doit faire d'abord. Heures d'Abidjan = UTC.
 */

const A = (hhmm) => new Date(`2026-10-24T${hhmm}:00Z`);
const ISO = (hhmm) => A(hhmm).toISOString();

const RESTO = { latitude: 5.286, longitude: -3.9737 };

const course = (id, champs = {}) => ({
  id,
  reference: `CRS-${id}`,
  pickup_code: '614',
  statut: 'ACCEPTED',
  deliverer_id: `liv-${id}`,
  deliverer: { id: `liv-${id}`, first_name: id },
  ...champs,
});

const cmd = (id, status, courseChamps, champs = {}) => ({
  id,
  reference: `ORD-${id}`,
  status,
  created_at: ISO('12:00'),
  ready_at: status === 'READY' ? ISO('12:20') : null,
  delivery_service: 'CHICKEN_NATION',
  restaurant: { name: 'Angré', ...RESTO },
  delivery: courseChamps === null ? null : { id: `d-${id}`, statut: 'PENDING', course: courseChamps },
  ...champs,
});

describe('groupe d’une course', () => {
  test('ses commandes encore au restaurant : prêtes d’abord, puis en cuisine ; pas les remises ni les annulées', () => {
    const k = course('k');
    const commandes = [
      cmd('b', 'IN_PROGRESS', k),
      cmd('a', 'READY', k),
      cmd('c', 'PICKED_UP', k),
      cmd('x', 'READY', course('autre')),
      { ...cmd('z', 'READY', k), delivery: { id: 'd-z', statut: 'CANCELLED', course: k } },
    ];
    expect(commandesAuRestaurantDeLaCourse('k', commandes).map((o) => o.id)).toEqual(['a', 'b']);
  });

  test('chaque groupe porte sa course', () => {
    const k = course('k');
    const { pretesGroupes } = groupOrdersForOperations([cmd('a', 'READY', k), cmd('s', 'READY', null)]);
    expect(pretesGroupes.map((g) => [g.courseId, g.course?.id ?? null])).toEqual([
      ['k', 'k'],
      [null, null],
    ]);
  });

  test('course retenue sans commande prête : un groupe en-tête seul, tant que la retenue court', () => {
    const retenue = course('r', {
      statut: 'IN_DELIVERY',
      picked_up_at: ISO('12:30'),
      retenue_jusqua: ISO('12:44'),
      commandes_attendues: [{ order_id: 'b', reference: 'ORD-b', prete_vers: ISO('12:41') }],
    });
    const commandes = [cmd('a', 'PICKED_UP', retenue), cmd('b', 'IN_PROGRESS', retenue)];
    const groupes = groupesRetenusSansCommandePrete(commandes, [], A('12:35'));
    expect(groupes).toHaveLength(1);
    expect(groupes[0]).toMatchObject({ key: 'course-r', courseId: 'r', orders: [] });
    expect(groupesRetenusSansCommandePrete(commandes, [], A('12:45'))).toEqual([]);
    // Déjà un groupe (une commande prête) : rien de plus.
    expect(groupesRetenusSansCommandePrete(commandes, [{ courseId: 'r' }], A('12:35'))).toEqual([]);
  });
});

describe('ordre de la colonne « Prêtes »', () => {
  test('au restaurant, en route (arrivée la plus proche d’abord), recherche, Turbo, puis sans course', () => {
    const groupe = (c, ...orders) => ({ key: c ? `course-${c.id}` : `solo-${orders[0].id}`, courseId: c?.id ?? null, course: c, deliveryService: 'CHICKEN_NATION', orders });
    const auRestaurant = course('comptoir', { statut: 'AT_RESTAURANT' });
    const loin = course('loin', { arrivee_estimee: ISO('12:50') });
    const proche = course('proche', { arrivee_estimee: ISO('12:38') });
    const recherche = course('recherche', { statut: 'PENDING_ASSIGNMENT', deliverer_id: null, deliverer: null });
    const turbo = course('turbo', { statut: 'PENDING_ASSIGNMENT', deliverer_id: null, deliverer: null, turbo_escalated_at: ISO('12:10') });
    const groupes = [
      groupe(null, cmd('seule', 'READY', null)),
      groupe(turbo, cmd('t', 'READY', turbo)),
      groupe(recherche, cmd('r', 'READY', recherche)),
      groupe(loin, cmd('l', 'READY', loin)),
      groupe(auRestaurant, cmd('c', 'READY', auRestaurant)),
      groupe(proche, cmd('p', 'READY', proche)),
    ];
    const commandes = groupes.flatMap((g) => g.orders);
    expect(ordonnerGroupesPretes(groupes, { maintenant: A('12:30'), commandes }).map((g) => g.key)).toEqual([
      'course-comptoir',
      'course-proche',
      'course-loin',
      'course-recherche',
      'course-turbo',
      'solo-seule',
    ]);
  });

  test('à égalité, la commande prête depuis le plus longtemps d’abord', () => {
    const k1 = course('k1', { statut: 'AT_RESTAURANT' });
    const k2 = course('k2', { statut: 'AT_RESTAURANT' });
    const groupes = [
      { key: 'course-k1', courseId: 'k1', course: k1, orders: [cmd('a', 'READY', k1, { ready_at: ISO('12:25') })] },
      { key: 'course-k2', courseId: 'k2', course: k2, orders: [cmd('b', 'READY', k2, { ready_at: ISO('12:05') })] },
    ];
    expect(ordonnerGroupesPretes(groupes, { maintenant: A('12:30'), commandes: groupes.flatMap((g) => g.orders) }).map((g) => g.key)).toEqual([
      'course-k2',
      'course-k1',
    ]);
  });
});
