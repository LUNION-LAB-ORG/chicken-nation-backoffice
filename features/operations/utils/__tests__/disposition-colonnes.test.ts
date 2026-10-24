// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Écran Commandes sur écran moyen (lg à xl) : Prêtes en haut à gauche, En
 * cuisine dessous, Hors restaurant à droite sur les deux rangées. Sans
 * gabarit de rangées, une colonne Hors restaurant plus haute que les deux
 * autres réunies agrandit les deux rangées automatiques à parts égales : un
 * trou blanc sous Prêtes repousse En cuisine. Avec `auto 1fr`, seule la
 * rangée flexible grandit (vérifié au navigateur avec la feuille de style
 * construite). Lu dans la source, comme la disposition ne se teste pas sans
 * navigateur.
 */

const source = readFileSync(join(import.meta.dir, '../../components/OperationsSections.tsx'), 'utf8');

const classesDe = (marqueur) => {
  const i = source.indexOf(marqueur);
  expect(i).toBeGreaterThan(-1);
  const debut = source.lastIndexOf('className=', i);
  return source.slice(debut, source.indexOf('\n', debut));
};

describe('grille des trois colonnes', () => {
  test('Hors restaurant sur deux rangées : la première rangée garde la hauteur de Prêtes', () => {
    const grille = classesDe('grid grid-cols-1 items-start gap-4 lg:grid-cols-2');
    expect(source).toContain('lg:row-span-2');
    expect(grille).toContain('lg:grid-rows-[auto_1fr]');
    // Grand écran : une seule rangée, plus de gabarit.
    expect(grille).toContain('xl:grid-rows-none');
  });
});
