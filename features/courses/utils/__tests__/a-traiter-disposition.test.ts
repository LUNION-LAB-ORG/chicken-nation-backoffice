// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * « À traiter », seul depuis le 10/11, dans la colonne de 380 px de la Carte
 * live. Les gestes de l'ancien bloc de Courses passent sous la phrase, avec
 * leur nom, et vont à la ligne quand ils ne tiennent pas : rien ne sort du
 * cadre. Le toucher de la ligne et les gestes sont des boutons séparés
 * (jamais un bouton dans un bouton). Lu dans la source.
 */

const liste = readFileSync(join(import.meta.dir, '../../../livreurs/components/ListeAlertes.tsx'), 'utf8');
const ecran = readFileSync(join(import.meta.dir, '../../../../src/components/gestion/EnDirect/index.tsx'), 'utf8');
const courses = readFileSync(join(import.meta.dir, '../../../../src/components/gestion/Courses/index.tsx'), 'utf8');

describe('« À traiter » unique', () => {
  test('nommé « À traiter » sur la Carte live, plus de bloc sur Courses', () => {
    expect(liste).toContain('À traiter');
    expect(liste).not.toContain('À surveiller');
    expect(courses).not.toContain('<ATraiter');
  });

  test('gestes sous la phrase, avec leur nom, qui vont à la ligne', () => {
    expect(liste).toContain('<div className="mt-1.5 flex flex-wrap gap-1.5 pl-4">');
    expect(liste).toContain('{libelle}');
    // La ligne et ses gestes : deux boutons frères, pas imbriqués.
    expect(liste).toMatch(/<\/button>\s*\{boutons\.length > 0 && \(/);
  });

  test('« Forcer l’affectation » ouvre la même fenêtre que Courses, montée sur la Carte live', () => {
    expect(ecran).toContain('<ForceAssignModal isOpen course={courseChoisie} />');
    expect(ecran).toContain('gestes={gestes}');
  });

  test('« Les fermer » : administrateur seulement, avec une question avant', () => {
    expect(ecran).toContain('peutFermer: membre?.role === "ADMIN"');
    expect(liste).toContain('confirmationCoursesAnciennes(nombre)');
  });
});
