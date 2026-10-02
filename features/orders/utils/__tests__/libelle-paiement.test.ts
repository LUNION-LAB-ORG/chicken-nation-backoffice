// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';
import { libellePaiement } from '../libelle-paiement';

describe('libellePaiement', () => {
  test('paiement en ligne (application ou site) : « En ligne »', () => {
    expect(libellePaiement('Appli')).toBe('En ligne');
  });
  test('paiement au restaurant : inchangé', () => {
    expect(libellePaiement('Restaurant')).toBe('Restaurant');
  });
  test('valeur absente : vide', () => {
    expect(libellePaiement(undefined)).toBe('');
    expect(libellePaiement(null)).toBe('');
  });
});
