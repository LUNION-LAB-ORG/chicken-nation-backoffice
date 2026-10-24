// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { afterAll, beforeEach, describe, expect, test } from 'bun:test';

import { estCompteDeRestaurant, peutConfirmerRecuperation } from '../code-retrait';
import { estRouteAbsente } from '../message-erreur';

/**
 * Demande du 24/10 au soir : plus de saisie du code. La caissière touche le
 * groupe de la course et confirme ; la course est lue et remise par son
 * identifiant. Tant que le serveur n'a pas ces routes (404 de route),
 * l'écran se replie sur les routes à code (incident du 22/10 : le code part
 * avec le restaurant de la course, `restaurant_id`).
 *
 * Le client HTTP est le VRAI (`src/services/api.ts`) : seul `fetch` est
 * factice. On lit donc l'adresse et le corps qui partent vraiment, et
 * l'erreur telle que l'écran la reçoit.
 */

const RESTO_A = '0b8f3a52-6a51-4d0e-9b0e-2b6f0f7a1a01';
const RESTO_B = '7c1d2e3f-4a5b-4c6d-8e7f-901a2b3c4d02';

process.env.NEXT_PUBLIC_API_URL = 'http://api.test';

const appels = [];
let reponse = { status: 200, corps: {} };
const fetchDOrigine = globalThis.fetch;
const fauxFetch = async (url, options = {}) => {
  appels.push({
    url: String(url),
    methode: options.method,
    corps: typeof options.body === 'string' ? JSON.parse(options.body) : undefined,
  });
  const texte = typeof reponse.corps === 'string' ? reponse.corps : JSON.stringify(reponse.corps);
  return new Response(texte, { status: reponse.status });
};
globalThis.fetch = fauxFetch;
// Le journal de `apiRequest` (jeton absent hors navigateur) n'a rien à faire ici.
const consoleDOrigine = { log: console.log, warn: console.warn, error: console.error };
console.log = () => {};
console.warn = () => {};
console.error = () => {};

afterAll(() => {
  globalThis.fetch = fetchDOrigine;
  Object.assign(console, consoleDOrigine);
});

const {
  getCourseByPickupCode,
  validatePickup,
  markOrderPaidCash,
  getActiveOperationsOrders,
  apercuCourse,
  confirmerRecuperation,
  apercuRecuperation,
  recupererCourse,
} = await import('../../services/operations-service');

beforeEach(() => {
  appels.length = 0;
  reponse = { status: 200, corps: { id: 'course-1' } };
});

describe('compte de restaurant', () => {
  test('rôle de point de vente : compte de restaurant même avec un type incohérent, comme le serveur', () => {
    expect(estCompteDeRestaurant({ type: 'BACKOFFICE', role: 'ASSISTANT_MANAGER' })).toBe(true);
    expect(estCompteDeRestaurant({ type: 'RESTAURANT', role: 'ADMIN' })).toBe(true);
    expect(estCompteDeRestaurant({ type: 'BACKOFFICE', role: 'ADMIN', restaurant_id: RESTO_A })).toBe(false);
    expect(estCompteDeRestaurant(null)).toBe(false);
  });
});

const ID_COURSE = '3f2a1b0c-9d8e-4f7a-8b6c-5d4e3f2a1b0c';
const COMMANDE_1 = '7b0c2f1e-3a4d-4e5f-8a9b-0c1d2e3f4a5b';

describe('récupération par la course : GET /courses/operations/:id et POST /courses/operations/:id/recuperation', () => {
  test('aperçu par l’identifiant de la course', async () => {
    await apercuCourse(ID_COURSE);
    expect(appels).toEqual([{ url: `http://api.test/api/v1/courses/operations/${ID_COURSE}`, methode: 'GET', corps: undefined }]);
  });

  test('confirmation : les commandes remises dans `order_ids`', async () => {
    await confirmerRecuperation(ID_COURSE, [COMMANDE_1]);
    expect(appels).toEqual([
      {
        url: `http://api.test/api/v1/courses/operations/${ID_COURSE}/recuperation`,
        methode: 'POST',
        corps: { order_ids: [COMMANDE_1] },
      },
    ]);
  });

  test('refus du serveur à jour : son texte, sans repli sur le code', async () => {
    reponse = { status: 404, corps: { statusCode: 404, message: 'Course introuvable.', error: 'Not Found' } };
    const erreur = await apercuRecuperation({ id: ID_COURSE, pickup_code: '614', restaurant_id: RESTO_A }).catch((e) => e);
    expect(erreur.message).toBe('Course introuvable.');
    expect(erreur.routeAbsente).toBeUndefined();
    expect(appels).toHaveLength(1);

    appels.length = 0;
    const texte = 'La course a changé : vérifiez les commandes et confirmez à nouveau.';
    reponse = { status: 409, corps: { statusCode: 409, message: texte, error: 'Conflict' } };
    const refus = await recupererCourse({ id: ID_COURSE, pickup_code: '614', restaurant_id: RESTO_A }, [COMMANDE_1]).catch((e) => e);
    expect(refus.message).toBe(texte);
    expect(refus.status).toBe(409);
    expect(appels).toHaveLength(1);
  });

  test('serveur pas encore à jour (404 de route) : repli sur les routes à code, avec le code et le restaurant de la course', async () => {
    const reponses = [
      { status: 404, corps: { statusCode: 404, message: `Cannot GET /api/v1/courses/operations/${ID_COURSE}`, error: 'Not Found' } },
      { status: 200, corps: { id: ID_COURSE } },
    ];
    globalThis.fetch = async (url, options = {}) => {
      appels.push({ url: String(url), methode: options.method, corps: options.body ? JSON.parse(options.body) : undefined });
      const r = reponses.shift() ?? { status: 200, corps: {} };
      return new Response(JSON.stringify(r.corps), { status: r.status });
    };
    try {
      const course = await apercuRecuperation({ id: ID_COURSE, pickup_code: '614', restaurant_id: RESTO_A });
      expect(course.id).toBe(ID_COURSE);
      expect(appels.map((a) => a.url)).toEqual([
        `http://api.test/api/v1/courses/operations/${ID_COURSE}`,
        `http://api.test/api/v1/courses/operations/by-pickup-code/614?restaurant_id=${RESTO_A}`,
      ]);

      appels.length = 0;
      reponses.push({ status: 404, corps: { statusCode: 404, message: `Cannot POST /api/v1/courses/operations/${ID_COURSE}/recuperation` } });
      reponses.push({ status: 200, corps: { id: ID_COURSE } });
      await recupererCourse({ id: ID_COURSE, pickup_code: '614', restaurant_id: RESTO_A }, [COMMANDE_1]);
      expect(appels.map((a) => [a.url, a.corps])).toEqual([
        [`http://api.test/api/v1/courses/operations/${ID_COURSE}/recuperation`, { order_ids: [COMMANDE_1] }],
        ['http://api.test/api/v1/courses/operations/validate-pickup', { pickup_code: '614', restaurant_id: RESTO_A }],
      ]);

      // Sans code connu : pas de repli possible, l'erreur reste.
      appels.length = 0;
      reponses.push({ status: 404, corps: '' });
      const erreur = await apercuRecuperation({ id: ID_COURSE, pickup_code: null }).catch((e) => e);
      expect(erreur.routeAbsente).toBe(true);
      expect(appels).toHaveLength(1);
    } finally {
      globalThis.fetch = fauxFetch;
    }
  });

  test('route absente : 404 sans refus lisible seulement', () => {
    expect(estRouteAbsente({ status: 404, messageServeur: 'Cannot GET /api/v1/courses/operations/x' })).toBe(true);
    expect(estRouteAbsente({ status: 404 })).toBe(true);
    expect(estRouteAbsente({ status: 404, messageServeur: 'Course introuvable.' })).toBe(false);
    expect(estRouteAbsente({ status: 409, messageServeur: 'Cannot GET /x' })).toBe(false);
    expect(estRouteAbsente(null)).toBe(false);
  });
});

describe('aperçu : GET /courses/operations/by-pickup-code/:code', () => {
  test('avec un restaurant : `restaurant_id` en paramètre', async () => {
    await getCourseByPickupCode('042', RESTO_A);
    expect(appels).toEqual([
      {
        url: `http://api.test/api/v1/courses/operations/by-pickup-code/042?restaurant_id=${RESTO_A}`,
        methode: 'GET',
        corps: undefined,
      },
    ]);
  });

  test('sans restaurant : aucun paramètre (le serveur prend celui du membre, ou tous)', async () => {
    await getCourseByPickupCode('042');
    expect(appels.map((a) => a.url)).toEqual(['http://api.test/api/v1/courses/operations/by-pickup-code/042']);
  });

  test('404 : le texte du serveur arrive à l’écran, pas « Ressource non trouvée. »', async () => {
    const texte =
      "Aucune course en cours avec ce code dans ce restaurant aujourd'hui. Vérifiez le code dicté par le livreur.";
    reponse = { status: 404, corps: { statusCode: 404, message: texte, error: 'Not Found' } };
    const erreur = await getCourseByPickupCode('042', RESTO_A).catch((e) => e);
    expect(erreur.message).toBe(texte);
    expect(erreur.status).toBe(404);
  });

  test('409 : code présent dans plusieurs restaurants', async () => {
    const texte = 'Ce code existe dans plusieurs restaurants : choisissez le restaurant.';
    reponse = { status: 409, corps: { statusCode: 409, message: texte, error: 'Conflict' } };
    const erreur = await getCourseByPickupCode('042').catch((e) => e);
    expect(erreur.message).toBe(texte);
    expect(erreur.status).toBe(409);
  });
});

describe('validation : POST /courses/operations/validate-pickup', () => {
  test('avec un restaurant : `restaurant_id` dans le corps', async () => {
    await validatePickup('042', RESTO_B);
    expect(appels).toEqual([
      {
        url: 'http://api.test/api/v1/courses/operations/validate-pickup',
        methode: 'POST',
        corps: { pickup_code: '042', restaurant_id: RESTO_B },
      },
    ]);
  });

  test('sans restaurant : `{ pickup_code }` seul, comme la caisse Sunmi', async () => {
    await validatePickup('042');
    expect(appels[0].corps).toStrictEqual({ pickup_code: '042' });
  });

  test('l’incident : commande pas prête, le texte du serveur à l’écran', async () => {
    const texte =
      'La commande ORD-261022-00042 est encore « En préparation » : marquez-la prête avant de la remettre.';
    reponse = { status: 400, corps: { statusCode: 400, message: texte, error: 'Bad Request' } };
    const erreur = await validatePickup('042', RESTO_A).catch((e) => e);
    expect(erreur.message).toBe(texte);
    expect(erreur.status).toBe(400);
  });

  test('403 : un autre restaurant que le sien', async () => {
    const texte = 'Vous ne pouvez valider que les courses de votre restaurant.';
    reponse = { status: 403, corps: { statusCode: 403, message: texte, error: 'Forbidden' } };
    expect((await validatePickup('042', RESTO_B).catch((e) => e)).message).toBe(texte);
  });

  test('403 de la garde des rôles : un repli lisible', async () => {
    reponse = { status: 403, corps: { statusCode: 403, message: 'Forbidden resource', error: 'Forbidden' } };
    expect((await validatePickup('042').catch((e) => e)).message).toBe('Accès non autorisé.');
  });

  test('500 sans texte utile : un repli lisible', async () => {
    reponse = { status: 500, corps: { statusCode: 500, message: 'Internal server error' } };
    expect((await validatePickup('042').catch((e) => e)).message).toBe(
      'Erreur temporaire du serveur. Réessayez plus tard.',
    );
  });

  test('page d’erreur du proxy (HTML) : un repli lisible', async () => {
    reponse = { status: 502, corps: '<html><body>502 Bad Gateway</body></html>' };
    expect((await validatePickup('042').catch((e) => e)).message).toBe(
      'Erreur temporaire du serveur. Réessayez plus tard.',
    );
  });
});

describe('les autres appels du module, inchangés', () => {
  test('commandes actives : même adresse', async () => {
    reponse = { status: 200, corps: [] };
    await getActiveOperationsOrders(RESTO_A);
    await getActiveOperationsOrders();
    expect(appels.map((a) => a.url)).toEqual([
      `http://api.test/api/v1/orders/operations/active?restaurantId=${RESTO_A}`,
      'http://api.test/api/v1/orders/operations/active',
    ]);
  });

  test('encaissement : même adresse et même corps, refus du serveur affiché', async () => {
    await markOrderPaidCash('cmd-1', 5000);
    await markOrderPaidCash('cmd-2');
    expect(appels.map((a) => [a.url, a.corps])).toEqual([
      ['http://api.test/api/v1/orders/cmd-1/mark-paid-cash', { amount: 5000 }],
      ['http://api.test/api/v1/orders/cmd-2/mark-paid-cash', {}],
    ]);

    reponse = { status: 400, corps: { statusCode: 400, message: 'Commande déjà payée' } };
    expect((await markOrderPaidCash('cmd-1').catch((e) => e)).message).toBe('Commande déjà payée');

    reponse = { status: 404, corps: { statusCode: 404, message: 'Commande introuvable' } };
    expect((await markOrderPaidCash('cmd-1').catch((e) => e)).message).toBe('Commande introuvable');
  });
});

describe('bouton « Confirmer la récupération » : les rôles admis par le serveur', () => {
  test('admin, manager, adjoint et caissière le voient', () => {
    for (const role of ['ADMIN', 'MANAGER', 'ASSISTANT_MANAGER', 'CAISSIER']) {
      expect(peutConfirmerRecuperation({ role })).toBe(true);
    }
  });

  test('les rôles refusés (403) ne le voient pas', () => {
    for (const role of ['CALL_CENTER', 'CUISINE', 'LIVRAISON_OPS', 'MARKETING', 'COMPTABLE', undefined]) {
      expect(peutConfirmerRecuperation({ role })).toBe(false);
    }
    expect(peutConfirmerRecuperation(null)).toBe(false);
  });
});
