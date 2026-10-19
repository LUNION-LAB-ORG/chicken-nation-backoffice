// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { OPTIONS_SOURCE, parametresSource } from '../filtre-source';
import { libelleCanal } from '../canal-commande';
// La règle du serveur, lue telle quelle.
import {
  SOURCES_COMMANDE,
  sourceDeCommande,
} from '../../../../../backend/src/modules/order/helpers/canal-commande.rules';

/**
 * Filtre « source » des commandes (demande du 19/10 : ajouter « Site web »).
 * Le choix de l'écran devient `source` (lu par le serveur) et `auto` (pour un
 * serveur qui ne connaît pas encore `source`).
 */

describe('filtre « source » : les options', () => {
  test('« Site web » ajouté, les trois libellés d’avant inchangés', () => {
    expect(OPTIONS_SOURCE.map((o) => [o.id, o.label, o.icon])).toEqual([
      ['', 'Toutes les sources', '🌐'],
      ['auto', 'Par application', '📱'],
      ['site', 'Site web', '💻'],
      ['mannuel', 'Par téléphone', '☎️'],
    ]);
  });

  test('une icône par option', () => {
    expect(new Set(OPTIONS_SOURCE.map((o) => o.icon)).size).toBe(OPTIONS_SOURCE.length);
  });
});

describe('filtre « source » : option → paramètres du serveur', () => {
  test('« Toutes les sources » : aucun paramètre', () => {
    expect(parametresSource('')).toEqual({});
    expect(parametresSource(undefined)).toEqual({});
    expect(parametresSource(null)).toEqual({});
  });

  test('« Par application » : source=appli, et auto=true comme avant', () => {
    expect(parametresSource('auto')).toEqual({ auto: true, source: 'appli' });
  });

  test('« Site web » : source=site, et auto=true pour un serveur plus ancien', () => {
    expect(parametresSource('site')).toEqual({ auto: true, source: 'site' });
  });

  test('« Par téléphone » : source=telephone, et auto=false comme avant', () => {
    expect(parametresSource('mannuel')).toEqual({ auto: false, source: 'telephone' });
  });

  test('valeur inconnue : aucun filtre', () => {
    expect(parametresSource('web')).toEqual({});
    expect(parametresSource('toString')).toEqual({});
    expect(parametresSource(true)).toEqual({});
  });

  test('chaque appel rend un objet neuf (pas de partage de la table)', () => {
    const a = parametresSource('site');
    a.auto = false;
    expect(parametresSource('site')).toEqual({ auto: true, source: 'site' });
  });

  test('chaque `source` envoyé est une valeur que le serveur accepte', () => {
    for (const option of OPTIONS_SOURCE) {
      const { source } = parametresSource(option.id);
      if (source) expect(SOURCES_COMMANDE).toContain(source);
    }
  });
});

describe('filtre « source » : jumeau du libellé affiché', () => {
  const CANAUX = ['APP', 'WEB', 'CALL_CENTER', 'RESTAURANT', null, undefined];
  const LIBELLE_DE_L_OPTION = { 'Site web': 'Site web', 'Par application': 'Appli', 'Par téléphone': 'Manuel' };

  test('le serveur range chaque commande sous l’option qui porte son libellé', () => {
    for (const channel of CANAUX) {
      for (const auto of [true, false, null]) {
        // Seule exception : vente au comptoir marquée `auto` (aucun écran ne
        // la crée) ; affichée « Manuel », comptée « Par application », comme
        // dans les statistiques (canalDeCommande).
        if (channel === 'RESTAURANT' && auto === true) continue;
        const source = sourceDeCommande({ channel, auto });
        const option = OPTIONS_SOURCE.find((o) => parametresSource(o.id).source === source);
        expect({ channel, auto, libelle: LIBELLE_DE_L_OPTION[option.label] }).toEqual({
          channel,
          auto,
          libelle: libelleCanal({ channel, auto }),
        });
      }
    }
  });
});

describe('filtre « source » : la liste, les exports et Opérations lisent la même traduction', () => {
  const lire = (chemin) => readFileSync(join(import.meta.dir, '../../../..', chemin), 'utf8');

  test.each([
    ['features/orders/components/ExportDropdown.tsx', 4],
    ['src/components/gestion/Operations/index.tsx', 1],
  ])('%s', (chemin, appels) => {
    const code = lire(chemin);
    expect(code.split('...parametresSource(filters?.source)').length - 1).toBe(appels);
    expect(code).not.toContain('source === "auto"');
  });

  test('le filtre affiche les options partagées', () => {
    expect(lire('features/orders/components/filtrage/OrderFilters.tsx')).toContain('= OPTIONS_SOURCE;');
  });
});
