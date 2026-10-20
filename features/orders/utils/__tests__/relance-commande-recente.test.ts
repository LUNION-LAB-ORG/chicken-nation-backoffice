// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';
import { texteCommandeRecente } from '../relance';

/**
 * Pastille « commande récente » de « À relancer ». Recette du 20/10 : un
 * client du site qui recommandait voyait « A déjà payé ORD-261020-83416 »,
 * alors que cette commande confirmée se paie à la livraison.
 */

const maintenant = new Date(2026, 9, 20, 9, 0).getTime();
const ilYa12Min = new Date(maintenant - 12 * 60_000).toISOString();
const groupe = (commande_recente) => ({ signaux: { commande_recente } });

describe('pastille « commande récente »', () => {
  test('commande payée : « A déjà payé »', () => {
    expect(texteCommandeRecente(groupe({ reference: 'ORD-261020-83416', created_at: ilYa12Min, payee: true }), maintenant)).toBe(
      "A déjà payé ORD-261020-83416 il y a 12 min : vérifiez avant d'appeler",
    );
  });

  test('commande non payée (à la livraison, espèces) : « A déjà commandé », jamais « payé »', () => {
    const texte = texteCommandeRecente(groupe({ reference: 'ORD-261020-83416', created_at: ilYa12Min, payee: false }), maintenant);
    expect(texte).toBe("A déjà commandé ORD-261020-83416 il y a 12 min : vérifiez avant d'appeler");
    expect(texte).not.toMatch(/pay/);
  });

  test('serveur plus ancien, sans `payee` : on ne dit pas « payé »', () => {
    expect(texteCommandeRecente(groupe({ reference: 'ORD-1', created_at: ilYa12Min }), maintenant)).toMatch(/^A déjà commandé ORD-1 /);
  });

  test('pas de signal : rien', () => {
    expect(texteCommandeRecente(groupe(null), maintenant)).toBeNull();
    expect(texteCommandeRecente({ signaux: {} }, maintenant)).toBeNull();
  });
});
