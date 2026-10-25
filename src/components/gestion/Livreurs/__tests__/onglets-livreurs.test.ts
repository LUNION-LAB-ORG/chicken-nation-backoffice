// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Onglets de « Liste des livreurs » sur un téléphone (relecture du 25/10) :
 * la rangée portait `w-fit` seul, donc la largeur de ses cinq onglets
 * (environ 500 px). `overflow-x-auto` ne défilait jamais, la rangée sortait
 * de l'écran et toute la page défilait de côté. Bornée à la largeur de
 * l'écran, elle défile en elle-même ; les onglets ne se tassent pas.
 */
const source = readFileSync(join(import.meta.dir, '../LivreursTabs.tsx'), 'utf8');
const classes = (debut) => {
  const i = source.indexOf(debut);
  expect(i).toBeGreaterThan(-1);
  const guillemet = source.indexOf('className=', i) + 'className='.length;
  const fin = source.indexOf(source[guillemet] === '{' ? '`' : '"', guillemet + 2);
  return source.slice(guillemet, fin).split(/\s+/);
};

describe('rangée des onglets des livreurs', () => {
  test('bornée à la largeur de l’écran, elle défile en elle-même', () => {
    const rangee = classes('<div');
    expect(rangee).toContain('max-w-full');
    expect(rangee).toContain('overflow-x-auto');
  });

  test('les onglets gardent leur largeur', () => {
    expect(classes('<button')).toContain('shrink-0');
  });
});
