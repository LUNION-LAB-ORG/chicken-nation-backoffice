// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Paramètres > Livraison (banc du 23/10, captures 1280 px) : l'onglet
 * affichait 21 tirets cadratins et des valeurs techniques (« Course
 * ACCEPTED », « passe en EXPIRED », « last_login_at DESC », « Shadow mode »,
 * « queue FIFO »). Les textes visibles de l'onglet (titres, descriptions,
 * libellés, aides, choix) sont relus dans la source.
 */
const source = readFileSync(join(import.meta.dir, '../DeliverySettings.tsx'), 'utf8');
const textes = [...source.matchAll(/\b(title|description|label|hint):\s*\n?\s*"([^"]*)"/g)].map((m) => m[2]);

describe('Paramètres > Livraison : textes visibles', () => {
  test('les textes sont bien lus dans la source', () => {
    expect(textes.length).toBeGreaterThan(60);
    expect(textes).toContain("Durée d'une offre de course (secondes)");
  });

  test('aucun tiret cadratin', () => {
    expect(textes.filter((t) => t.includes('—'))).toEqual([]);
  });

  test('aucune valeur technique (statut brut, nom de colonne, tâche)', () => {
    const interdits = /\b(ACCEPTED|AT_RESTAURANT|EXPIRED|PENDING_ASSIGNMENT|ASSIGNED|CONFIRMED|PRESENT|OFF|FIFO|last_login_at|max_slots|DESC|Shadow|scoring|fallback|queue|cron|toggle)\b/;
    expect(textes.filter((t) => interdits.test(t))).toEqual([]);
  });
});
