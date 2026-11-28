// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
/**
 * Délai avant l'appel d'une relance : 1 min 30 depuis le 28/11 (3 min avant).
 * Le serveur le règle à la demi-minute ; l'écran ne doit jamais lire « 1.5 min ».
 */
import { describe, expect, test } from 'bun:test';
import { REGLES_PAR_DEFAUT } from '../../constantes/relance.constante';
import { delaiLisible, reglesDe } from '../relance';

describe('délai des relances', () => {
  test('se lit en minutes et secondes', () => {
    expect(delaiLisible(1.5)).toBe('1 min 30');
    expect(delaiLisible(2.5)).toBe('2 min 30');
    expect(delaiLisible(3)).toBe('3 min');
    expect(delaiLisible(1)).toBe('1 min');
    expect(delaiLisible(0.5)).toBe('30 s');
  });

  test('sans réponse du serveur : le défaut, 1 min 30', () => {
    expect(REGLES_PAR_DEFAUT.delai_minutes).toBe(1.5);
    expect(delaiLisible(reglesDe(null).delai_minutes)).toBe('1 min 30');
  });

  test('le délai reçu du serveur prime sur le défaut', () => {
    const regles = reglesDe({ regles: { delai_minutes: 3, duree_prise_minutes: 10, rappel_minutes: 5, fenetre_heures: 3 } });
    expect(delaiLisible(regles.delai_minutes)).toBe('3 min');
  });
});
