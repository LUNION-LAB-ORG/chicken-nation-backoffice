// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { afterAll, beforeEach, describe, expect, test } from 'bun:test';

/**
 * Lot 1 du 22/10 : le serveur refuse l'affectation forcée d'un livreur en
 * pause, en course, déjà sollicité ou hors service, avec un 409 qui nomme la
 * raison. La fenêtre « Forcer l'affectation » doit montrer CE texte. Avant,
 * le module passait par `getHumanReadableError` (écrit pour les promotions)
 * et un 409 devenait « Une promotion avec ces caractéristiques existe déjà ».
 *
 * Le client HTTP est le VRAI (`src/services/api.ts`) : seul `fetch` est factice.
 */

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

const { forceAssignCourse, basculerCourseVersTurbo, cancelCourseAdmin } = await import('../course.service');

const COURSE = '3f2b1c0a-1111-4222-8333-444455556666';
const LIVREUR = '9a8b7c6d-1111-4222-8333-444455556666';

beforeEach(() => {
  appels.length = 0;
  reponse = { status: 200, corps: { success: true, message: 'Offre envoyée au livreur.' } };
});

const refus = async (promesse) => {
  try {
    await promesse;
  } catch (e) {
    return e;
  }
  throw new Error('aucun refus');
};

describe('affectation forcée : le refus du serveur, tel quel', () => {
  test('envoi : PATCH /courses/:id/force-assign avec le livreur, message du serveur rendu', async () => {
    const r = await forceAssignCourse(COURSE, { deliverer_id: LIVREUR });
    expect(appels[0].methode).toBe('PATCH');
    expect(appels[0].url).toContain(`/courses/${COURSE}/force-assign`);
    expect(appels[0].corps).toEqual({ deliverer_id: LIVREUR });
    expect(r.message).toBe('Offre envoyée au livreur.');
  });

  for (const texte of [
    "Ce livreur est en pause jusqu'à 14 h 32.",
    "Ce livreur est en pause automatique jusqu'au 23/10 à 8 h 05.",
    'Ce livreur a déjà une course en cours.',
    'Ce livreur a déjà une offre en attente de réponse.',
    "Ce livreur est hors service : il n'a pas repris le travail dans l'appli.",
    'Cette course ne cherche plus de livreur.',
    "L'offre n'a pas pu être envoyée : la course ou le livreur vient de changer. Réessayez.",
  ]) {
    test(`409 « ${texte} »`, async () => {
      reponse = { status: 409, corps: { statusCode: 409, message: texte, error: 'Conflict' } };
      const e = await refus(forceAssignCourse(COURSE, { deliverer_id: LIVREUR }));
      expect(e.message).toBe(texte);
      expect(e.status).toBe(409);
    });
  }

  test('404 : « Livreur non trouvé » (gardé par `apiRequest` à côté de son texte par défaut)', async () => {
    reponse = { status: 404, corps: { statusCode: 404, message: 'Livreur non trouvé' } };
    const e = await refus(forceAssignCourse(COURSE, { deliverer_id: LIVREUR }));
    expect(e.message).toBe('Livreur non trouvé');
    expect(e.status).toBe(404);
  });

  test('409 sans texte du serveur : un repli lisible, jamais le texte des promotions', async () => {
    reponse = { status: 409, corps: '' };
    const e = await refus(forceAssignCourse(COURSE, { deliverer_id: LIVREUR }));
    expect(e.message).toBe('Action impossible : la donnée a changé entre-temps.');
    expect(e.message).not.toContain('promotion');
  });
});

describe('autres actions sur une course : même règle', () => {
  test('bascule vers Turbo refusée : le texte du serveur', async () => {
    reponse = { status: 409, corps: { message: 'Cette course ne cherche plus de livreur.' } };
    const e = await refus(basculerCourseVersTurbo(COURSE));
    expect(e.message).toBe('Cette course ne cherche plus de livreur.');
  });

  test('annulation refusée (400) : le texte du serveur', async () => {
    reponse = { status: 400, corps: { message: 'Cette course est déjà terminée.' } };
    const e = await refus(cancelCourseAdmin(COURSE, { reason: 'Client injoignable' }));
    expect(e.message).toBe('Cette course est déjà terminée.');
  });
});
