// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';

import { LIBELLE_CLASSEMENT, LIBELLE_FILE_SCORE, PAS_CLASSE, rangLisible } from '../classement';

/**
 * Fiche du livreur, « Scoring & File d'attente » : les mots d'avant le
 * 24/10, que les équipes connaissent (demande du client du 25/10).
 */
describe('classement de la fiche', () => {
  test('« Position dans la file », rang en « #3 »', () => {
    expect(LIBELLE_CLASSEMENT).toBe('Position dans la file');
    expect(rangLisible(1)).toBe('#1');
    expect(rangLisible(3)).toBe('#3');
  });

  test('« File FIFO », « Pas dans le ranking actuel »', () => {
    expect(LIBELLE_FILE_SCORE).toBe('File FIFO');
    expect(PAS_CLASSE).toBe('Pas dans le ranking actuel');
  });
});
