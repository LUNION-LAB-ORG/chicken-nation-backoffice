// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';

import { affichageBandeau } from '../tableau-livraison';

/**
 * Bandeau des restaurants sans activité lisible (relecture du 25/10) : le
 * tableau de la livraison en erreur 500 ou hors délai, sans donnée en cache,
 * ne laissait au siège que « Impossible de lire l'activité des restaurants »
 * et « Réessayer ». Plus aucun choix de restaurant, alors que le restaurant
 * gardé dans le navigateur filtrait encore Courses, Livreurs et En direct.
 */

const siege = { compteDeRestaurant: false, peutLire: true, erreur: null, aDesDonnees: false, enErreur: false, enChargement: false };
const restaurant = { ...siege, compteDeRestaurant: true };
const e500 = Object.assign(new Error('Erreur serveur'), { status: 500 });
const e404 = Object.assign(new Error('Ressource non trouvée.'), { status: 404 });

describe('ce que montre le bandeau', () => {
  test('siège, erreur sans donnée : la ligne d’erreur et les onglets des restaurants', () => {
    expect(affichageBandeau({ ...siege, erreur: e500, enErreur: true })).toBe('erreur_et_onglets');
    expect(affichageBandeau({ ...siege, erreur: new Error('Délai dépassé'), enErreur: true })).toBe(
      'erreur_et_onglets',
    );
  });

  test('compte de restaurant, erreur sans donnée : la ligne d’erreur seule', () => {
    expect(affichageBandeau({ ...restaurant, erreur: e500, enErreur: true })).toBe('erreur');
  });

  test('route absente ou compte qui ne lit pas le tableau : les onglets, rien pour un restaurant', () => {
    expect(affichageBandeau({ ...siege, erreur: e404, enErreur: true })).toBe('onglets');
    expect(affichageBandeau({ ...siege, peutLire: false })).toBe('onglets');
    expect(affichageBandeau({ ...restaurant, erreur: e404, enErreur: true })).toBe('rien');
  });

  test('données lues : les cartes, même pendant une erreur de relecture', () => {
    expect(affichageBandeau({ ...siege, aDesDonnees: true })).toBe('cartes');
    expect(affichageBandeau({ ...siege, aDesDonnees: true, erreur: e500, enErreur: true })).toBe('cartes');
  });

  test('premier chargement : les squelettes', () => {
    expect(affichageBandeau({ ...siege, enChargement: true })).toBe('squelettes');
    expect(affichageBandeau(siege)).toBe('rien');
  });
});
