// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';
import { cumulPaiements, estRefuse, peutConfirmer, resteAEncaisser } from '../encaissement-livreur';

/**
 * Paiements de trop (18/11) : le livreur déclarait 8 000, la caisse encaissait
 * les mêmes 8 000, et la confirmation doublait le paiement. Mêmes règles que
 * le serveur (`encaissement.helper.ts`).
 */

const recu = (amount) => ({ status: 'SUCCESS', amount });
const declare = (amount) => ({ status: 'PENDING', amount });

describe('encaissement du livreur', () => {
  test('sépare le reçu du déclaré, sans compter les refus', () => {
    const refuse = { status: 'FAILED', amount: 9000, failure_code: 'REFUSE_PAR_LE_RESTAURANT' };
    expect(cumulPaiements([recu(3000), declare(2000), refuse])).toEqual({ recu: 3000, enAttente: 2000 });
  });

  test('reste à encaisser : le prix moins le reçu moins le déclaré, jamais négatif', () => {
    expect(resteAEncaisser(10000, [])).toBe(10000);
    expect(resteAEncaisser(10000, [recu(4000)])).toBe(6000);
    expect(resteAEncaisser(10000, [declare(10000)])).toBe(0);
    expect(resteAEncaisser(10000, [recu(10000), declare(10000)])).toBe(0);
  });

  test('confirmer seulement sans dépasser le prix', () => {
    expect(peutConfirmer(10000, [declare(10000)], declare(10000))).toBe(true);
    expect(peutConfirmer(10000, [recu(10000), declare(10000)], declare(10000))).toBe(false);
    expect(peutConfirmer(10000, [recu(4000), declare(6000)], declare(6000))).toBe(true);
    expect(peutConfirmer(10000, [recu(4000), declare(8000)], declare(8000))).toBe(false);
  });

  test("reconnaît une déclaration refusée, à la main ou d'office", () => {
    expect(estRefuse({ status: 'FAILED', amount: 1, failure_code: 'REFUSE_PAR_LE_RESTAURANT' })).toBe(true);
    expect(estRefuse({ status: 'FAILED', amount: 1, failure_code: 'REFUSE_PAYEE_EN_LIGNE' })).toBe(true);
    expect(estRefuse({ status: 'FAILED', amount: 1, failure_code: 'Z-25' })).toBe(false);
    expect(estRefuse({ status: 'SUCCESS', amount: 1, failure_code: 'REFUSE_PAR_LE_RESTAURANT' })).toBe(false);
  });
});
