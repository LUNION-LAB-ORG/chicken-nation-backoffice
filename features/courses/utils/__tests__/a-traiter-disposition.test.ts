// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * « À traiter » de Courses sur petit écran : la ligne était une rangée de
 * 48 px à largeurs fixes, et seule la situation rétrécissait. Sur téléphone
 * avec deux gestes, la situation tombait à 0 px et les boutons sortaient du
 * cadre. La ligne suit maintenant la largeur du bloc (requête de conteneur) :
 * une rangée à partir de 56rem, sinon référence et situation en haut,
 * restaurant et gestes dessous, gestes en icône seule sous 36rem. Lu dans
 * la source ; les largeurs sont vérifiées au navigateur avec la feuille de
 * style construite.
 */

const source = readFileSync(join(import.meta.dir, '../../components/ATraiter.tsx'), 'utf8');

describe('ligne d’« À traiter »', () => {
  test('le bloc est un conteneur, la ligne passe sur deux rangées quand il est étroit', () => {
    expect(source).toMatch(/<section className="@container /);
    expect(source).toMatch(/<li[\s\S]*?className="flex cursor-pointer flex-col[^"]*@4xl:flex-row/);
  });

  test('gestes en icône seule quand le bloc est étroit, nom dans `title` et `aria-label`', () => {
    expect(source).toContain('title={LIBELLES[action]}');
    expect(source).toContain('aria-label={LIBELLES[action]}');
    expect(source).toContain('<span className="hidden @xl:inline">{LIBELLES[action]}</span>');
  });
});
