// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';

import { LIBELLE_CLASSEMENT, LIBELLE_FILE_SCORE, PAS_CLASSE, rangLisible, texteClassement } from '../classement';

/**
 * Fiche du livreur, « Rang dans la file » : le classement par score et la
 * place dans la file sont deux rangs différents, avec deux mots différents
 * (conception 3.3 : « Classement » sur la fiche, « Place dans la file » ;
 * plus de « #3 », « File FIFO » ni « ranking »).
 */
describe('classement de la fiche', () => {
  test('« Classement » « 3e sur 5 », jamais « #3 »', () => {
    expect(LIBELLE_CLASSEMENT).toBe('Classement');
    expect(texteClassement(3, 5)).toBe('3e sur 5');
    expect(texteClassement(1, 1)).toBe('1er sur 1');
    expect(texteClassement(3, 5)).not.toContain('#');
  });

  test('rang en mots : « 1er », « 2e »', () => {
    expect(rangLisible(1)).toBe('1er');
    expect(rangLisible(2)).toBe('2e');
  });

  test('ni « FIFO » ni « ranking »', () => {
    expect(LIBELLE_FILE_SCORE).toBe('File');
    expect(PAS_CLASSE).toBe('Pas classé en ce moment');
  });
});
