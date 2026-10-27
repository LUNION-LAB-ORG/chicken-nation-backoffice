/* eslint-disable @typescript-eslint/ban-ts-comment -- tests bun : leurs types ne sont pas installés dans le backoffice. */
// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { ouvrirCommandeParReference } from '../ouvrir-commande';

/**
 * Livraison annulée par le livreur (27/10) : la commande reste en livraison,
 * c'est elle qu'on reprend (« Annuler la commande », menu ⋮ du tiroir).
 * L'alerte d'« À traiter » et la référence de la fiche d'une course y mènent
 * par le chemin de la cloche : page Commandes filtrée sur la référence.
 */

const lire = (chemin) => readFileSync(join(import.meta.dir, chemin), 'utf8');

describe('ouvrir une commande par sa référence', () => {
  test('page Commandes, recherche sur la référence, autres filtres remis à zéro', () => {
    const appels = [];
    ouvrirCommandeParReference('ORD-1', {
      setFilter: (section, cle, valeur) => appels.push(['filtre', section, cle, valeur]),
      setActiveTab: (onglet) => appels.push(['onglet', onglet]),
    });
    expect(appels).toEqual([
      ['filtre', 'orders', 'search', 'ORD-1'],
      ['filtre', 'orders', 'type', ''],
      ['filtre', 'orders', 'status', ''],
      ['filtre', 'orders', 'source', ''],
      ['onglet', 'orders'],
    ]);
  });

  test('même chemin que la cloche', () => {
    const cloche = lire('../../../../src/components/ui/NotificationDropdown.tsx');
    for (const cle of ['search', 'type', 'status', 'source']) expect(cloche).toContain(`setFilter("orders", "${cle}"`);
    expect(cloche).toContain('setActiveTab("orders")');
  });

  test('sans le droit de lire les commandes : rien à ouvrir, la référence reste du texte', () => {
    const crochet = lire('../../hooks/useOuvrirCommande.ts');
    expect(crochet).toContain('s.can(Modules.COMMANDES, Action.READ)');
    expect(crochet).toContain('return peutLire ? ouvrir : null;');
  });

  test('fiche d’une course : la référence de chaque commande y mène', () => {
    const liste = lire('../../../courses/components/detail-course/DeliveriesList.tsx');
    expect(liste).toContain('onClick={() => ouvrirCommande(delivery.order.reference)}');
    expect(liste).toContain('title="Voir le détail de la commande"');
  });

  test('« À traiter » : une livraison annulée pour une seule commande mène à elle, sinon la fiche de la course', () => {
    const ligne = lire('../../../courses/components/ATraiter.tsx');
    expect(ligne).toContain('const commande = ouvrirCommande ? commandeDuSignal(s) : null;');
    expect(ligne).toContain('commande && ouvrirCommande ? ouvrirCommande(commande) : openCourse(course.id)');
  });
});
