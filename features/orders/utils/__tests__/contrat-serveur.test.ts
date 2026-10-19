// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, mock, test } from 'bun:test';

/**
 * Contrat avec le serveur pour le paiement à la livraison sur le site : la
 * réponse RÉELLE de `GET /orders/relances` (contrat-serveur.exemple.ts, copie
 * de backend/src/modules/order/contrat-paiement-livraison.spec.ts) passe par
 * les règles de l'écran, et `POST /orders/relances/:orderId/annuler` part à
 * la route et avec le corps que le serveur attend.
 */

// Client HTTP factice : on lit la route et le corps envoyés.
const appels = [];
let reponse = { ok: true };
mock.module('@/services/api', () => ({
  api: {
    post: async (chemin, corps) => {
      appels.push({ chemin, corps });
      if (reponse instanceof Error) throw reponse;
      return reponse;
    },
    get: async () => ({}),
  },
}));

const { REPONSE_RELANCES } = await import('./contrat-serveur.exemple');
const { actionsRelance, repriseALaLivraison } = await import('../relance-actions');
const { texteBandeau, textePaiementEnLigne } = await import('../relance');
const { relanceAPI } = await import('../../apis/relance.api');
const { ignorerRelanceSchema } = await import('../../schemas/ignorer-relance.schema');

const maintenant = Date.parse(REPONSE_RELANCES.maintenant);
const [yao, awa, ble] = REPONSE_RELANCES.groupes;

describe('contrat serveur : GET /orders/relances', () => {
  test('ordre du serveur : les commandes à confirmer avant le panier en ligne', () => {
    expect(REPONSE_RELANCES.groupes.map((g) => [g.tete.reference, g.a_confirmer])).toEqual([
      ['ORD-261019-00003', true],
      ['ORD-261019-00002', true],
      ['ORD-261019-00005', false],
    ]);
  });

  test('boutons : « Annuler la commande » à la place d’« Ignorer » sur une commande à confirmer', () => {
    for (const estAdmin of [false, true]) {
      expect(actionsRelance(yao, { estAdmin })).toEqual(['prendre', 'annuler', 'ouvrir']);
      expect(actionsRelance(awa, { estAdmin })).toEqual(['prendre', 'annuler', 'ouvrir']);
      expect(actionsRelance(ble, { estAdmin })).toEqual(['prendre', 'ignorer', 'ouvrir']);
    }
  });

  test('pastille « À la livraison » : la tête à confirmer, pas le panier de l’application du même client', () => {
    expect(awa.tete.paiement_a_la_livraison).toBe(true);
    expect(awa.autres.map((b) => b.paiement_a_la_livraison)).toEqual([false]);
    expect(ble.tete.paiement_a_la_livraison).toBe(false);
  });

  test('reprise : « Le client confirme sa commande ? » pour une commande à confirmer seulement', () => {
    expect([yao, awa, ble].map(repriseALaLivraison)).toEqual([true, true, false]);
  });

  test('doublon possible : la commande suivante du client, avec son heure', () => {
    expect(yao.signaux.commande_suivante).toEqual({
      reference: 'ORD-261019-00004',
      created_at: '2026-10-19T11:30:00.000Z',
    });
    expect(awa.signaux.commande_suivante).toBeNull();
  });

  test('paiement en ligne en cours : le panier de l’application d’Awa, jusqu’à la fin du délai', () => {
    expect(awa.signaux.paiement_en_ligne_en_cours).toEqual({
      reference: 'ORD-261019-00001',
      jusqua: '2026-10-19T12:01:00.000Z',
    });
    expect(textePaiementEnLigne(awa, maintenant)).toContain('ORD-261019-00001');
    expect([yao, ble].map((g) => g.signaux.paiement_en_ligne_en_cours)).toEqual([null, null]);
    // La liste se relit à la fin du délai pour retirer le signal.
    expect(REPONSE_RELANCES.prochaine_echeance).toBe('2026-10-19T12:01:00.000Z');
  });

  test('notification du système : « dont 2 à confirmer »', () => {
    const t = texteBandeau(REPONSE_RELANCES.groupes, maintenant);
    expect(t).toStartWith('3 commandes à relancer, la plus ancienne');
    expect(t).toContain('dont 2 à confirmer');
  });

  test('compteur du serveur : groupes dont la tête est à confirmer', () => {
    expect(REPONSE_RELANCES.compteurs.a_confirmer).toBe(
      REPONSE_RELANCES.groupes.filter((g) => g.a_confirmer).length,
    );
  });
});

describe('contrat serveur : POST /orders/relances/:orderId/annuler', () => {
  test('route et corps : raison de la liste seule, ou « Autre » avec son texte', async () => {
    appels.length = 0;
    reponse = { ok: true };
    const simple = ignorerRelanceSchema.parse({ raison_code: 'CLIENT_INJOIGNABLE', raison_texte: 'oublié' });
    const autre = ignorerRelanceSchema.parse({ raison_code: 'AUTRE', raison_texte: ' Adresse hors zone ' });

    expect(await relanceAPI.annuler(awa.cle, simple)).toEqual({ ok: true });
    await relanceAPI.annuler(awa.cle, autre);

    expect(appels).toEqual([
      {
        chemin: '/orders/relances/a0000000-0000-4000-8000-000000000002/annuler',
        corps: { raison_code: 'CLIENT_INJOIGNABLE' },
      },
      {
        chemin: '/orders/relances/a0000000-0000-4000-8000-000000000002/annuler',
        corps: { raison_code: 'AUTRE', raison_texte: 'Adresse hors zone' },
      },
    ]);
  });

  test('404 du serveur : « Commande introuvable. » ; 409 : son message tel quel', async () => {
    reponse = Object.assign(new Error('Ressource non trouvée.'), { status: 404 });
    await expect(relanceAPI.annuler(awa.cle, { raison_code: 'DOUBLON' })).rejects.toMatchObject({
      message: 'Commande introuvable.',
      status: 404,
    });

    const conflit = 'Cette commande vient de changer : actualisez la liste.';
    reponse = Object.assign(new Error(conflit), { status: 409 });
    await expect(relanceAPI.annuler(awa.cle, { raison_code: 'DOUBLON' })).rejects.toMatchObject({
      message: conflit,
      status: 409,
    });
  });
});
