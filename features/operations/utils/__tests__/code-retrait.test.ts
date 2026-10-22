// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { afterAll, beforeEach, describe, expect, test } from 'bun:test';

import { estCompteDeRestaurant, restaurantPourCodeRetrait, restaurantPourValidation } from '../code-retrait';

/**
 * Incident du 22/10 : le même code de retrait existait dans un autre
 * restaurant. L'aperçu (`GET /courses/operations/by-pickup-code/:code`) et la
 * validation (`POST /courses/operations/validate-pickup`) partent avec le
 * restaurant (`restaurant_id`), selon le contrat du 22/10.
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
globalThis.fetch = async (url, options = {}) => {
  appels.push({
    url: String(url),
    methode: options.method,
    corps: typeof options.body === 'string' ? JSON.parse(options.body) : undefined,
  });
  const texte = typeof reponse.corps === 'string' ? reponse.corps : JSON.stringify(reponse.corps);
  return new Response(texte, { status: reponse.status });
};
// Le journal de `apiRequest` (jeton absent hors navigateur) n'a rien à faire ici.
const consoleDOrigine = { log: console.log, warn: console.warn, error: console.error };
console.log = () => {};
console.warn = () => {};
console.error = () => {};

afterAll(() => {
  globalThis.fetch = fetchDOrigine;
  Object.assign(console, consoleDOrigine);
});

const { getCourseByPickupCode, validatePickup, markOrderPaidCash, getActiveOperationsOrders } =
  await import('../../services/operations-service');

beforeEach(() => {
  appels.length = 0;
  reponse = { status: 200, corps: { id: 'course-1' } };
});

describe('restaurant où chercher le code', () => {
  const caissiere = { type: 'RESTAURANT', role: 'CAISSIER', restaurant_id: RESTO_A };
  const manager = { type: 'RESTAURANT', role: 'MANAGER', restaurant_id: RESTO_A };

  test('caissière ou manager : son restaurant, même si un autre est resté choisi', () => {
    expect(restaurantPourCodeRetrait(caissiere, null)).toBe(RESTO_A);
    expect(restaurantPourCodeRetrait(caissiere, RESTO_B)).toBe(RESTO_A);
    expect(restaurantPourCodeRetrait(manager, RESTO_B)).toBe(RESTO_A);
  });

  test('rôle de point de vente : compte de restaurant même avec un type incohérent, comme le serveur', () => {
    expect(restaurantPourCodeRetrait({ type: 'BACKOFFICE', role: 'CUISINE', restaurant_id: RESTO_A }, RESTO_B)).toBe(
      RESTO_A,
    );
    expect(estCompteDeRestaurant({ type: 'BACKOFFICE', role: 'ASSISTANT_MANAGER' })).toBe(true);
    expect(estCompteDeRestaurant({ type: 'RESTAURANT', role: 'ADMIN' })).toBe(true);
  });

  test('ADMIN ou centre d’appels sans restaurant : celui choisi dans Opérations', () => {
    expect(restaurantPourCodeRetrait({ type: 'BACKOFFICE', role: 'ADMIN', restaurant_id: null }, RESTO_B)).toBe(
      RESTO_B,
    );
    expect(restaurantPourCodeRetrait({ type: 'BACKOFFICE', role: 'CALL_CENTER', restaurant_id: '' }, RESTO_B)).toBe(
      RESTO_B,
    );
    expect(restaurantPourCodeRetrait({}, RESTO_B)).toBe(RESTO_B);
  });

  test('compte du siège qui garde un restaurant dans sa fiche : le choix d’Opérations, que le serveur suit', () => {
    const admin = { type: 'BACKOFFICE', role: 'ADMIN', restaurant_id: RESTO_A };
    expect(estCompteDeRestaurant(admin)).toBe(false);
    expect(restaurantPourCodeRetrait(admin, RESTO_B)).toBe(RESTO_B);
    expect(restaurantPourCodeRetrait(admin, null)).toBeUndefined();
  });

  test('compte de restaurant sans restaurant (fiche incomplète) : le choix, que le serveur refusera', () => {
    expect(restaurantPourCodeRetrait({ type: 'RESTAURANT', role: 'CAISSIER', restaurant_id: null }, RESTO_B)).toBe(
      RESTO_B,
    );
  });

  test('« Tous les restaurants » ou utilisateur pas encore chargé : rien', () => {
    expect(restaurantPourCodeRetrait({ type: 'BACKOFFICE', role: 'ADMIN', restaurant_id: null }, null)).toBeUndefined();
    expect(restaurantPourCodeRetrait(null, null)).toBeUndefined();
    expect(restaurantPourCodeRetrait(undefined, undefined)).toBeUndefined();
    expect(estCompteDeRestaurant(null)).toBe(false);
  });

  test('validation : le restaurant de la recherche, sinon celui de la course affichée', () => {
    expect(restaurantPourValidation(RESTO_A, { restaurant_id: RESTO_B })).toBe(RESTO_A);
    expect(restaurantPourValidation(undefined, { restaurant_id: RESTO_B })).toBe(RESTO_B);
    expect(restaurantPourValidation(undefined, {})).toBeUndefined();
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
