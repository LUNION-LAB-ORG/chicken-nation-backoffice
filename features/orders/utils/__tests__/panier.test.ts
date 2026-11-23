// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';
import { supplementsNommes, texteDistance, texteDuree, texteTrajet } from '../panier';

/** Panneau du panier : trajet de livraison et suppléments nommés. */

describe('panier : trajet de livraison', () => {
  test('distance et durée par la route', () => {
    expect(texteTrajet({ distanceMetres: 12430, dureeSecondes: 1490 })).toBe('12,4 km · 25 min de trajet');
    expect(texteTrajet({ distanceMetres: 850, dureeSecondes: 20 })).toBe('850 m · 1 min de trajet');
  });

  test('sans durée : la distance seule', () => {
    expect(texteTrajet({ distanceMetres: 6800 })).toBe('6,8 km');
  });

  test('sans itinéraire : la distance des frais, sinon rien', () => {
    expect(texteTrajet({ distanceFraisKm: 3.04 })).toBe('3,0 km');
    expect(texteTrajet({ distanceMetres: 0, distanceFraisKm: 2.5 })).toBe('2,5 km');
    expect(texteTrajet({})).toBeNull();
    expect(texteTrajet(null)).toBeNull();
    expect(texteTrajet({ distanceFraisKm: NaN })).toBeNull();
  });

  test('mêmes écritures que les pastilles de la section Livraison', () => {
    expect(texteDistance(1000)).toBe('1,0 km');
    expect(texteDistance(999.6)).toBe('1000 m');
    expect(texteDuree(4500)).toBe('75 min');
  });
});

describe('panier : suppléments nommés', () => {
  const noms = { coca: 'Coca', piment: 'Sauce piment' };
  const nomDe = (id) => noms[id];

  test('nom, et quantité au-delà de 1', () => {
    expect(
      supplementsNommes(
        [
          { id: 'coca', quantity: 1 },
          { id: 'piment', quantity: 2 },
        ],
        nomDe,
      ),
    ).toEqual(['Coca', 'Sauce piment x2']);
  });

  test('quantité nulle ignorée ; supplément inconnu gardé sous un nom générique', () => {
    expect(
      supplementsNommes(
        [
          { id: 'coca', quantity: 0 },
          { id: 'disparu', quantity: 1 },
        ],
        nomDe,
      ),
    ).toEqual(['Supplément']);
    expect(supplementsNommes([], nomDe)).toEqual([]);
  });

  test('aucun tiret long dans les textes', () => {
    for (const t of [texteTrajet({ distanceMetres: 5000, dureeSecondes: 600 }), ...supplementsNommes([{ id: 'coca', quantity: 3 }], nomDe)]) {
      expect(t).not.toMatch(/[–—]/);
    }
  });
});
