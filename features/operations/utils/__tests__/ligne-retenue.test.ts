// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';

import { ligneDepart, ligneRetenue } from '../ligne-retenue';

/**
 * Demande du 24/10 : sur la carte d'une course, la retenue tient en une ligne
 * courte, la commande à préparer en priorité et son heure. Ni le livreur, ni le
 * code (déjà sur la carte). Demande du 27/10 : l'attente du livreur avant son
 * départ en seconde ligne, « Départ au plus tard 12 h 44 ». Heures d'Abidjan = UTC.
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

  test('retenue « trajet long » du serveur : dite en tête de ligne', () => {
    const longue = [{ order_id: 'oB', reference: 'ORD-B', prete_vers: ISO('12:55'), motif: 'TRAJET_LONG' }];
    expect(ligneRetenue(course({ retenue_jusqua: ISO('12:55'), commandes_attendues: longue }), A('12:35'))).toBe(
      'Trajet long : attendre ORD-B, prête vers 12 h 55',
    );
  });

  test('heure déjà passée : traitée comme inconnue', () => {
    expect(ligneRetenue(course(), A('12:41'))).toBe('Attendre ORD-B');
    expect(ligneRetenue(course(), A('12:42'))).toBe('Attendre ORD-B');
    const deux = [
      { order_id: 'oB', reference: 'ORD-B', prete_vers: ISO('12:30') },
      { order_id: 'oC', reference: 'ORD-C', prete_vers: ISO('12:43') },
    ];
    expect(ligneRetenue(course({ commandes_attendues: deux }), A('12:35'))).toBe('Attendre ORD-B et ORD-C');
  });

  test('montant donné par le serveur (27/10) : sans effet sur la ligne', () => {
    const avecMontant = [{ order_id: 'oB', reference: 'ORD-B', prete_vers: ISO('12:41'), montant: 7000 }];
    expect(ligneRetenue(course({ commandes_attendues: avecMontant }), A('12:35'))).toBe(
      'Attendre ORD-B, prête vers 12 h 41',
    );
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

describe('départ au plus tard, seconde ligne de la retenue (27/10)', () => {
  test("l'échéance de la retenue, les mots de la carte en cuisine", () => {
    expect(ligneDepart(course(), A('12:35'))).toBe('Départ au plus tard 12 h 44');
  });

  test('la même dans tous les cas : heure inconnue, passée, plusieurs, trajet long', () => {
    expect(ligneDepart(course({ commandes_attendues: [{ order_id: 'oB', reference: 'ORD-B' }] }), A('12:35'))).toBe(
      'Départ au plus tard 12 h 44',
    );
    expect(ligneDepart(course(), A('12:42'))).toBe('Départ au plus tard 12 h 44');
    const deux = [
      { order_id: 'oB', reference: 'ORD-B', prete_vers: ISO('12:41') },
      { order_id: 'oC', reference: 'ORD-C', prete_vers: ISO('12:43') },
    ];
    expect(ligneDepart(course({ commandes_attendues: deux }), A('12:35'))).toBe('Départ au plus tard 12 h 44');
    const longue = [{ order_id: 'oB', reference: 'ORD-B', prete_vers: ISO('12:55'), motif: 'TRAJET_LONG' }];
    expect(ligneDepart(course({ retenue_jusqua: ISO('12:55'), commandes_attendues: longue }), A('12:35'))).toBe(
      'Départ au plus tard 12 h 55',
    );
  });

  test('heure sur deux chiffres de minutes, ni code, ni livreur, ni tiret cadratin', () => {
    const texte = ligneDepart(course({ retenue_jusqua: ISO('09:05') }), A('09:00'));
    expect(texte).toBe('Départ au plus tard 9 h 05');
    expect(texte).not.toContain('614');
    expect(texte).not.toContain('Andy');
    expect(texte).not.toContain('—');
  });

  test('pas de retenue en cours : rien, comme la première ligne', () => {
    const cas = [
      [course(), A('12:44')],
      [course(), A('12:50')],
      [course({ commandes_attendues: [] }), A('12:35')],
      [course({ commandes_attendues: null }), A('12:35')],
      [course({ commandes_attendues: 'pas du json' }), A('12:35')],
      [course({ commandes_attendues: [{ montant: 7000 }, null, 3] }), A('12:35')],
      [course({ retenue_jusqua: null }), A('12:35')],
      [course({ retenue_jusqua: 'pas une date' }), A('12:35')],
      [course({ statut: 'IN_DELIVERY', parti_at: ISO('12:36') }), A('12:37')],
      [course({ turbo_escalated_at: ISO('12:30') }), A('12:35')],
      [course({ statut: 'COMPLETED' }), A('12:35')],
      [course({ retenue_jusqua: undefined, commandes_attendues: undefined }), A('12:35')],
    ];
    for (const [k, t] of cas) {
      expect(ligneDepart(k, t)).toBeNull();
      expect(ligneRetenue(k, t)).toBeNull();
    }
  });

  test('chaîne JSON écrite par le serveur : lue comme le tableau', () => {
    const json = JSON.stringify([{ order_id: 'oB', reference: 'ORD-B', prete_vers: ISO('12:41'), montant: 7000 }]);
    const k = course({ commandes_attendues: json });
    expect(ligneRetenue(k, A('12:35'))).toBe('Attendre ORD-B, prête vers 12 h 41');
    expect(ligneDepart(k, A('12:35'))).toBe('Départ au plus tard 12 h 44');
  });
});
