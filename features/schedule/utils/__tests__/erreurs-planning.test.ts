// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { estPlanningEfface, estRouteAbsente, relectureDuDetail } from '../erreurs-planning';

/**
 * Planning supprimé ou refait ailleurs (« Modifier les dates » crée un
 * nouvel identifiant et efface l'ancien), relecture du 25/10 : l'écran
 * ouvert gardait l'ancien planning et tous ses gestes sous « Connexion
 * perdue, nouvel essai en cours », et relisait ce 404 toutes les 15 s.
 */

const erreur = (status, message) => Object.assign(new Error(message), { status });

describe('404 du planning ou route absente', () => {
  test('planning effacé : 404 avec le texte du serveur', () => {
    expect(estPlanningEfface(erreur(404, "Ce planning n'existe plus."))).toBe(true);
    expect(estPlanningEfface(erreur(404, 'Plan introuvable.'))).toBe(true);
    expect(estRouteAbsente(erreur(404, "Ce planning n'existe plus."))).toBe(false);
  });

  test('route absente (serveur pas à jour) : pas un planning effacé', () => {
    expect(estRouteAbsente(erreur(404, 'Cannot GET /api/v1/schedule/apercu'))).toBe(true);
    expect(estRouteAbsente(erreur(404, 'Ressource non trouvée.'))).toBe(true);
    expect(estPlanningEfface(erreur(404, 'Cannot GET /api/v1/schedule/apercu'))).toBe(false);
    expect(estPlanningEfface(erreur(404, 'Ressource non trouvée.'))).toBe(false);
  });

  test('autres erreurs : ni l’un ni l’autre', () => {
    for (const e of [erreur(500, 'Erreur serveur'), erreur(403, 'Pas votre restaurant'), new Error('Délai dépassé'), null]) {
      expect(estPlanningEfface(e)).toBe(false);
      expect(estRouteAbsente(e)).toBe(false);
    }
  });
});

describe('relecture du détail', () => {
  test('toutes les 15 s pour suivre les réponses des livreurs', () => {
    expect(relectureDuDetail(null)).toBe(15_000);
    expect(relectureDuDetail(erreur(500, 'Erreur serveur'))).toBe(15_000);
  });

  test("arrêtée quand le planning n'existe plus", () => {
    expect(relectureDuDetail(erreur(404, "Ce planning n'existe plus."))).toBe(false);
  });
});

describe("écran d'un planning qui n'existe plus", () => {
  const detail = readFileSync(join(import.meta.dir, '../../components/SchedulePlanDetail.tsx'), 'utf8');
  const requetes = readFileSync(join(import.meta.dir, '../../queries/schedule.query.ts'), 'utf8');

  test("l'ancien planning n'est plus montré, ni ses gestes", () => {
    const efface = detail.indexOf('if (efface) return <PlanningEfface />');
    expect(efface).toBeGreaterThan(-1);
    expect(efface).toBeLessThan(detail.indexOf('if (!plan || !grille)'));
  });

  test('la liste est relue pour montrer le nouveau planning', () => {
    expect(detail).toContain('invalidateQueries({ queryKey: ["schedule", "plans"] })');
  });

  test('détail et compteurs ne relisent plus le 404', () => {
    expect(requetes.match(/refetchInterval: \(query\) => relectureDuDetail\(query\.state\.error\)/g)).toHaveLength(2);
  });
});
