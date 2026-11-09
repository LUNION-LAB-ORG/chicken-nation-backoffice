import { describe, expect, test } from 'bun:test';

import {
  distanceDeChezLui,
  messageChangement,
  messageValidation,
  restaurantPropose,
  restaurantsParProximite,
} from '../rattachement';
import { renfortLisible, detailEtatDuJour } from '../livreurs-du-jour';

const ZONE4 = { id: 'zone4', name: 'CHICKEN NATION ZONE 4', latitude: 5.286, longitude: -3.9737 };
const FAYA = { id: 'faya', name: 'CHICKEN NATION FAYA', latitude: 5.38, longitude: -3.93 };
const SANS = { id: 'sans', name: 'CHICKEN NATION SANS', latitude: null, longitude: null };

describe('valider avec le restaurant : le plus proche de chez lui d’abord', () => {
  const chezLui = { lat: 5.29, lng: -3.97 };

  test('classés par distance, sans coordonnées à la fin ; sans domicile, l’ordre reçu', () => {
    expect(restaurantsParProximite([FAYA, SANS, ZONE4], chezLui).map((c) => c.restaurant.id)).toEqual(['zone4', 'faya', 'sans']);
    expect(restaurantsParProximite([FAYA, SANS, ZONE4], null).map((c) => c.restaurant.id)).toEqual(['faya', 'sans', 'zone4']);
  });

  test('choix de départ : son restaurant, sinon le plus proche, sinon aucun', () => {
    const classes = restaurantsParProximite([FAYA, ZONE4], chezLui);
    expect(restaurantPropose(classes, 'faya')).toBe('faya');
    expect(restaurantPropose(classes, null)).toBe('zone4');
    expect(restaurantPropose(restaurantsParProximite([FAYA, ZONE4], null), null)).toBe('');
  });

  test('distance lisible', () => {
    expect(distanceDeChezLui(0.42)).toBe('à 400 m de chez lui');
    expect(distanceDeChezLui(3.44)).toBe('à 3,4 km de chez lui');
    expect(distanceDeChezLui(null)).toBeNull();
  });
});

describe('messages après le geste : une ligne, ce que le serveur a fait', () => {
  const ajoute = { retire_de: [], ajoute_a: [{ plan_id: 'p', restaurant_id: 'zone4', creneaux: 11 }] };
  const deplace = {
    retire_de: [{ plan_id: 'a', restaurant_id: 'faya', creneaux: 9 }],
    ajoute_a: [{ plan_id: 'p', restaurant_id: 'zone4', creneaux: 11 }],
  };

  test('validation', () => {
    expect(messageValidation(ajoute, ZONE4.name)).toBe('Livreur validé et ajouté au planning de ZONE 4');
    expect(messageValidation({ retire_de: [], ajoute_a: [] }, ZONE4.name)).toBe('Livreur validé');
    expect(messageValidation(null, ZONE4.name)).toBe('Livreur validé');
  });

  test('changement de restaurant', () => {
    expect(messageChangement(deplace, FAYA.name, ZONE4.name)).toBe(
      'Restaurant changé : retiré du planning de FAYA, ajouté à celui de ZONE 4.',
    );
    expect(messageChangement(ajoute, null, ZONE4.name)).toBe('Restaurant changé : ajouté au planning de ZONE 4.');
    expect(messageChangement({ retire_de: deplace.retire_de, ajoute_a: [] }, FAYA.name, ZONE4.name)).toBe(
      'Restaurant changé : retiré du planning de FAYA.',
    );
    expect(messageChangement(null, FAYA.name, ZONE4.name)).toBe('Restaurant affecté au livreur');
    expect(messageChangement({ retire_de: [], ajoute_a: [] }, FAYA.name, ZONE4.name)).toBe('Restaurant affecté au livreur');
  });
});

describe('liste « Aujourd’hui » : « En renfort près de … »', () => {
  const maintenant = new Date('2026-11-09T12:00:00Z');

  test('à côté de la place dans la file, pour un livreur disponible', () => {
    expect(renfortLisible({ restaurant_name: ZONE4.name })).toBe('En renfort près de ZONE 4');
    expect(renfortLisible(null)).toBeNull();
    expect(detailEtatDuJour('DISPONIBLE', { rang: 1, renfort: { restaurant_name: ZONE4.name } }, maintenant).texte).toBe(
      'Rang FIFO #1 · En renfort près de ZONE 4',
    );
    expect(detailEtatDuJour('DISPONIBLE', { rang: null, renfort: { restaurant_name: ZONE4.name } }, maintenant).texte).toBe(
      'En renfort près de ZONE 4',
    );
    expect(detailEtatDuJour('DISPONIBLE', { rang: 2 }, maintenant).texte).toBe('Rang FIFO #2');
  });
});
