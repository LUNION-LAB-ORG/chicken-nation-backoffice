// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { TYPES_POINTS_CREDITES, getIsUsedBadge, statutDisponibilite } from '../loyalty.utils';

// Types de lignes, lus tels quels dans le schéma du serveur : un type ajouté
// là-bas doit être classé ici (crédit ou sortie de points).
const backend = join(import.meta.dir, '../../../../../backend');
const schema = readFileSync(join(backend, 'prisma/schema.prisma'), 'utf8');
const TYPES_SERVEUR = schema
  .match(/enum LoyaltyPointType \{([^}]*)\}/)[1]
  .split('\n')
  .map((ligne) => ligne.replace(/\/\/.*$/, '').trim())
  .filter(Boolean);

// Les lignes que le serveur consomme lors d'un retrait.
const regles = readFileSync(join(backend, 'src/modules/fidelity/helpers/points-commande.rules.ts'), 'utf8');
const DEPENSABLES_SERVEUR = [
  ...regles.match(/TYPES_POINTS_DEPENSABLES[^=]*=\s*\[([^\]]*)\]/)[1].matchAll(/LoyaltyPointType\.(\w+)/g),
].map((m) => m[1]);

const ligne = (champs) => ({ type: 'EARNED', points: 100, points_used: 0, ...champs });
const texte = (point) => {
  const badge = getIsUsedBadge(point);
  return badge === null ? null : renderToStaticMarkup(badge).replace(/<[^>]+>/g, '');
};

describe('statut de disponibilité d’une ligne de points', () => {
  test('les crédits sont ceux que le serveur consomme', () => {
    expect(DEPENSABLES_SERVEUR).toEqual(['EARNED', 'BONUS', 'REFUNDED']);
    expect([...TYPES_POINTS_CREDITES].sort()).toEqual([...DEPENSABLES_SERVEUR].sort());
    for (const type of TYPES_POINTS_CREDITES) expect(TYPES_SERVEUR).toContain(type);
  });

  test('ligne jamais entamée : « Disponible » (et non plus « Partiel »)', () => {
    for (const type of TYPES_POINTS_CREDITES) {
      expect(statutDisponibilite(ligne({ type }))).toBe('DISPONIBLE');
      expect(statutDisponibilite(ligne({ type, is_used: 'NO' }))).toBe('DISPONIBLE');
      expect(texte(ligne({ type, is_used: 'NO' }))).toBe('Disponible');
    }
  });

  test('ligne entamée sans être épuisée : « Partiel »', () => {
    expect(statutDisponibilite(ligne({ points_used: 40 }))).toBe('PARTIEL');
    expect(statutDisponibilite(ligne({ points_used: 40, is_used: 'PARTIAL' }))).toBe('PARTIEL');
    expect(statutDisponibilite(ligne({ type: 'BONUS', points_used: 0.5 }))).toBe('PARTIEL');
    expect(texte(ligne({ points_used: 40, is_used: 'PARTIAL' }))).toBe('Partiel');
  });

  test('ligne épuisée : « Utilisé »', () => {
    expect(statutDisponibilite(ligne({ points_used: 100 }))).toBe('UTILISE');
    expect(statutDisponibilite(ligne({ points_used: 100, is_used: 'YES' }))).toBe('UTILISE');
    expect(texte(ligne({ points_used: 100, is_used: 'YES' }))).toBe('Utilisé');
  });

  test('ligne close par le serveur sans tout consommer (points rendus expirés) : « Utilisé »', () => {
    const rendusExpires = ligne({ type: 'REFUNDED', points_used: 30, is_used: 'YES' });
    expect(statutDisponibilite(rendusExpires)).toBe('UTILISE');
    expect(statutDisponibilite(ligne({ type: 'REFUNDED', is_used: 'YES' }))).toBe('UTILISE');
  });

  test('sortie de points (REDEEMED, EXPIRED) : aucun statut', () => {
    const sorties = TYPES_SERVEUR.filter((type) => !TYPES_POINTS_CREDITES.includes(type));
    expect(sorties.sort()).toEqual(['EXPIRED', 'REDEEMED']);
    for (const type of sorties) {
      // Un retrait est enregistré épuisé ; un gain annulé passe EXPIRED sans
      // toucher à points_used : dans les deux cas, pas de badge.
      expect(statutDisponibilite(ligne({ type, points_used: 100, is_used: 'YES' }))).toBeNull();
      expect(statutDisponibilite(ligne({ type, points_used: 0, is_used: 'YES' }))).toBeNull();
      expect(getIsUsedBadge(ligne({ type, points_used: 0, is_used: 'YES' }))).toBeNull();
    }
  });
});
