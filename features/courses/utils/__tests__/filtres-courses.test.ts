// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';

import { filtresCoursesActifs, filtresListeCourses, livreurChoisiValable } from '../filtres-courses';

/**
 * Filtres de Courses (relecture du 25/10) : la liste « Livreur » n'avait
 * aucun effet (le livreur n'était jamais envoyé au serveur) et la liste
 * « Restaurant » contredisait le bandeau, qui est le seul filtre de
 * restaurant de l'écran.
 */

describe('requête de la liste des courses', () => {
  test('le livreur choisi est envoyé au serveur', () => {
    const f = filtresListeCourses({ deliverer_id: 'liv-koffi', restaurant_du_livreur: 'angre' }, 'angre', 1, 10);
    expect(f.deliverer_id).toBe('liv-koffi');
    expect(f.restaurant_id).toBe('angre');
  });

  test('le restaurant est celui du bandeau, jamais un ancien choix de la barre de filtres', () => {
    const f = filtresListeCourses({ restaurant_id: 'cocody' }, 'angre', 1, 10);
    expect(f.restaurant_id).toBe('angre');
    expect(filtresListeCourses({ restaurant_id: 'cocody' }, null, 1, 10).restaurant_id).toBeUndefined();
  });

  test('un livreur choisi pour un autre restaurant ne filtre plus', () => {
    const filtres = { deliverer_id: 'liv-koffi', restaurant_du_livreur: 'angre' };
    expect(livreurChoisiValable(filtres, 'cocody')).toBe(false);
    expect(filtresListeCourses(filtres, 'cocody', 1, 10).deliverer_id).toBeUndefined();
    expect(livreurChoisiValable(filtres, null)).toBe(false);
  });

  test('livreur choisi avec « Tous les restaurants »', () => {
    const filtres = { deliverer_id: 'liv-koffi', restaurant_du_livreur: null };
    expect(livreurChoisiValable(filtres, null)).toBe(true);
    expect(filtresListeCourses(filtres, null, 2, 20)).toEqual({
      restaurant_id: undefined,
      deliverer_id: 'liv-koffi',
      page: 2,
      limit: 20,
      search: undefined,
      statut: undefined,
      startDate: undefined,
      endDate: undefined,
    });
  });

  test('statut, recherche et dates passent tels quels', () => {
    const f = filtresListeCourses(
      { statut: 'COMPLETED', search: 'CMD-12', startDate: '2026-10-01', endDate: '2026-10-25' },
      null,
      1,
      10,
    );
    expect(f.statut).toBe('COMPLETED');
    expect(f.search).toBe('CMD-12');
    expect(f.startDate).toBe('2026-10-01');
    expect(f.endDate).toBe('2026-10-25');
  });
});

describe('« Réinitialiser »', () => {
  test('montré pour un filtre qui agit', () => {
    expect(filtresCoursesActifs({ statut: 'COMPLETED' }, null)).toBe(true);
    expect(filtresCoursesActifs({ deliverer_id: 'liv-koffi', restaurant_du_livreur: 'angre' }, 'angre')).toBe(true);
    expect(filtresCoursesActifs({ startDate: '2026-10-01' }, null)).toBe(true);
  });

  test('pas pour un ancien restaurant gardé ni pour un livreur qui ne filtre plus', () => {
    expect(filtresCoursesActifs({ restaurant_id: 'cocody' }, null)).toBe(false);
    expect(filtresCoursesActifs({ deliverer_id: 'liv-koffi', restaurant_du_livreur: 'angre' }, 'cocody')).toBe(false);
    expect(filtresCoursesActifs({}, 'angre')).toBe(false);
    expect(filtresCoursesActifs(undefined, null)).toBe(false);
  });
});
