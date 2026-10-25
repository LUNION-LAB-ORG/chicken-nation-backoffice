// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { ID_BULLE_ERREUR_RESTAURANTS, bulleErreurRestaurants } from '../erreur-liste';

/**
 * Liste des restaurants en erreur (relecture du 25/10) : l'effet du crochet
 * dépendait de l'objet entier rendu par `useQuery`, nouveau à chaque rendu.
 * Sur En direct, qui se redessine à chaque position de livreur, une bulle
 * d'erreur s'ajoutait à chaque position reçue.
 */

const source = readFileSync(join(import.meta.dir, '../../queries/restaurant-list.query.ts'), 'utf8');

describe('erreur de la liste des restaurants', () => {
  test('une seule bulle : toujours le même identifiant', () => {
    const a = bulleErreurRestaurants(new Error('Délai dépassé'));
    const b = bulleErreurRestaurants(new Error('Délai dépassé'));
    expect(a.options.id).toBe(ID_BULLE_ERREUR_RESTAURANTS);
    expect(b.options.id).toBe(a.options.id);
    expect(a.message).toBe('Délai dépassé');
  });

  test('sans texte du serveur : un message simple', () => {
    expect(bulleErreurRestaurants(new Error('')).message).toBe('Impossible de charger les restaurants.');
    expect(bulleErreurRestaurants(null).message).toBe('Impossible de charger les restaurants.');
  });

  test("le crochet ne réagit qu'à une nouvelle erreur, pas à chaque rendu", () => {
    expect(source).not.toMatch(/\},\s*\[result\]\s*\)/);
    expect(source).toMatch(/\[result\.isError,\s*result\.error\]/);
    expect(source).toContain('bulleErreurRestaurants(');
  });
});
