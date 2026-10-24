// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';

import { ligneRetenue } from '../ligne-retenue';

/**
 * Demande du 24/10 : sur la carte d'une course, la retenue tient en une ligne
 * courte, la commande à préparer en priorité et son heure. Ni l'heure limite
 * du départ, ni le livreur, ni le code (déjà sur la carte). Heures d'Abidjan = UTC.
 */

const A = (hhmm) => new Date(`2026-10-24T${hhmm}:00Z`);
const ISO = (hhmm) => A(hhmm).toISOString();

const course = (champs = {}) => ({
  id: 'k1',
  reference: 'CRS-A1',
  pickup_code: '614',
  statut: 'AT_RESTAURANT',
  deliverer_id: 'liv-1',
  deliverer: { id: 'liv-1', first_name: 'Andy' },
  retenue_jusqua: ISO('12:44'),
  commandes_attendues: [{ order_id: 'oB', reference: 'ORD-B', prete_vers: ISO('12:41') }],
  ...champs,
});

describe('retenue en une ligne courte', () => {
  test('une commande attendue : la référence et son heure, rien de plus', () => {
    expect(ligneRetenue(course(), A('12:35'))).toBe('Attendre ORD-B, prête vers 12 h 41');
  });

  test('heure inconnue : la référence seule', () => {
    expect(ligneRetenue(course({ commandes_attendues: [{ order_id: 'oB', reference: 'ORD-B' }] }), A('12:35'))).toBe(
      'Attendre ORD-B',
    );
  });

  test('plusieurs commandes : la plus tardive, seulement si chacune a son heure', () => {
    const deux = [
      { order_id: 'oB', reference: 'ORD-B', prete_vers: ISO('12:41') },
      { order_id: 'oC', reference: 'ORD-C', prete_vers: ISO('12:43') },
    ];
    expect(ligneRetenue(course({ commandes_attendues: deux }), A('12:35'))).toBe(
      'Attendre ORD-B et ORD-C, prêtes vers 12 h 43',
    );
    const uneSansHeure = [deux[0], { order_id: 'oC', reference: 'ORD-C' }];
    expect(ligneRetenue(course({ commandes_attendues: uneSansHeure }), A('12:35'))).toBe('Attendre ORD-B et ORD-C');
  });

  test('ni code, ni livreur, ni départ au plus tard, ni tiret cadratin', () => {
    const texte = ligneRetenue(course(), A('12:35'));
    expect(texte).not.toContain('614');
    expect(texte).not.toContain('Andy');
    expect(texte).not.toContain('départ');
    expect(texte).not.toContain('—');
  });

  test('pas de retenue en cours : rien', () => {
    expect(ligneRetenue(course(), A('12:44'))).toBeNull();
    expect(ligneRetenue(course({ commandes_attendues: [] }), A('12:35'))).toBeNull();
    expect(ligneRetenue(course({ statut: 'IN_DELIVERY', parti_at: ISO('12:36') }), A('12:37'))).toBeNull();
    expect(ligneRetenue(course({ retenue_jusqua: null }), A('12:35'))).toBeNull();
  });
});
