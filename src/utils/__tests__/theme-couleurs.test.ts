// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
  aConvertir,
  convertir,
  RE_COULEUR_THEME,
  sombrePourFond,
  sombrePourTexte,
  SURFACE,
} from '../../../scripts/theme-sombre/regles.mjs';

/**
 * Thème sombre complet : toute couleur écrite dans le code a sa valeur
 * sombre. Si ce test échoue, lancer `node scripts/theme-sombre/convertir.mjs`
 * (voir src/app/theme.css).
 */

const RACINE = join(import.meta.dir, '..', '..', '..');
const fichiers = [];
const parcourir = (dossier) => {
  for (const nom of readdirSync(dossier)) {
    const chemin = join(dossier, nom);
    // Les tests gardent leurs exemples de classes tels quels.
    if (nom === 'node_modules' || nom === '__tests__' || nom.startsWith('.')) continue;
    if (statSync(chemin).isDirectory()) parcourir(chemin);
    else if (/\.(tsx?|jsx?)$/.test(nom)) fichiers.push(chemin);
  }
};
['src', 'features'].forEach((d) => parcourir(join(RACINE, d)));
const themeCss = readFileSync(join(RACINE, 'src/app/theme.css'), 'utf8');

describe('thème sombre : le code', () => {
  test('aucune couleur à convertir (codes couleur, text-white, fonds gris foncés)', () => {
    const restants = fichiers
      .filter((f) => convertir(readFileSync(f, 'utf8')).texte !== readFileSync(f, 'utf8'))
      .map((f) => f.slice(RACINE.length + 1));
    expect(restants).toEqual([]);
  });

  test('chaque couleur du thème utilisée a sa valeur claire et sa valeur sombre', () => {
    const utilisees = new Set();
    for (const f of fichiers) for (const m of readFileSync(f, 'utf8').matchAll(RE_COULEUR_THEME)) utilisees.add(m[1]);
    const [theme, sombre] = themeCss.split('html.dark {');
    const manquantes = [...utilisees].filter((nom) => !theme.includes(`--color-${nom}:`) || !sombre.includes(`--color-${nom}:`));
    expect(manquantes).toEqual([]);
    expect(utilisees.size).toBeGreaterThan(50);
  });

  test('le thème est branché : variante dark par classe, fond des cartes, texte blanc fixe', () => {
    expect(themeCss).toContain('@custom-variant dark (&:where(.dark, .dark *));');
    expect(themeCss).toContain(`--color-white: ${SURFACE};`);
    expect(themeCss).toContain('--color-blanc: #ffffff;');
    expect(readFileSync(join(RACINE, 'src/app/globals.css'), 'utf8')).toContain('@import "./theme.css";');
  });
});

describe('thème sombre : les règles', () => {
  const avant = [
    'bg-[#F4F4F5] hover:bg-[#F4F4F5]/60 text-[#595959] text-white text-white/80 text-black',
    'text-[#F17922] bg-[#F17922] text-[#9796A1] bg-[#18181B]',
    'hover:bg-red-700 bg-gray-900 hover:bg-gray-800 bg-gray-900/85 dark:bg-gray-900',
  ].join(' ');

  test('conversion attendue', () => {
    expect(convertir(avant).texte).toBe(
      [
        'bg-hex-f4f4f5 hover:bg-hex-f4f4f5/60 text-hex-595959 text-blanc text-blanc/80 text-noir',
        // Orange de la marque, texte gris clair, fond foncé : inchangés.
        'text-[#F17922] bg-[#F17922] text-[#9796A1] bg-[#18181B]',
        'hover:bg-red-700 dark:hover:bg-red-500 bg-gray-900 dark:bg-[#0e1014] hover:bg-gray-800 dark:hover:bg-[#2a2f38] bg-gray-900/85 dark:bg-[#0e1014]/85 dark:bg-gray-900',
      ].join(' '),
    );
  });

  test('relancer la conversion ne change plus rien', () => {
    const une = convertir(avant).texte;
    expect(convertir(une).texte).toBe(une);
  });

  test('fond clair : sombre, teinte gardée ; texte foncé : éclairci', () => {
    expect(aConvertir('bg', 'F4F4F5')).toBe(true);
    expect(aConvertir('text', 'F4F4F5')).toBe(false);
    expect(aConvertir('text', '595959')).toBe(true);
    expect(aConvertir('bg', '595959')).toBe(false);
    expect(sombrePourFond('ffffff')).toBe(SURFACE);
    expect(sombrePourFond('f4f4f5')).toBe('#23272f');
    // Teinte orange claire : fond orange sombre.
    const orange = sombrePourFond('fff6e9');
    expect(parseInt(orange.slice(1, 3), 16)).toBeGreaterThan(parseInt(orange.slice(5, 7), 16));
    expect(parseInt(sombrePourTexte('18181b').slice(1, 3), 16)).toBeGreaterThan(220);
  });
});
