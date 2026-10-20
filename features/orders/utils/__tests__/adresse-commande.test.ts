// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';
import { adresseBrute, libelleAdresse, objetAdresse } from '../adresse-commande';
import { formatAddress } from '../formatAddress';
import { mapApiOrderToUiOrder } from '../orderMapper';

/**
 * Adresse d'une commande reçue en OBJET (colonne JSON) : recette du 20/10,
 * une adresse `{}` faisait planter la liste « Par application » (erreur
 * React 31 : un objet rendu dans la page). La liste ne doit recevoir que du
 * texte, quelle que soit la forme de l'adresse.
 */

const commandeApi = (address) => ({
  id: 'o1',
  reference: 'ORD-TEST-00001',
  customer_id: 'c1',
  paied: true,
  delivery_fee: 1000,
  delivery_service: 'CHICKEN_NATION',
  zone_id: null,
  points: 0,
  type: 'DELIVERY',
  table_type: null,
  places: null,
  address,
  code_promo: null,
  tax: 0,
  amount: 8500,
  net_amount: 7500,
  discount: 0,
  date: null,
  time: null,
  fullname: 'Awa',
  phone: '0700000000',
  email: null,
  note: null,
  auto: true,
  payment_method: 'OFFLINE',
  status: 'COMPLETED',
  restaurant_id: 'r1',
  promotion_id: null,
  order_items: [],
  paiements: [],
});

const MAISON = { title: 'Maison', address: 'Riviera 2', city: 'Abidjan', latitude: 5.3622, longitude: -3.9576 };

const FORMES = [
  ['objet vide (graine du banc)', {}],
  ['objet complet', MAISON],
  ['texte JSON', JSON.stringify(MAISON)],
  ['texte JSON vide', '{}'],
  ['texte libre', 'Riviera 2, près de la pharmacie'],
  ['texte vide', ''],
  ['absente', null],
  ['tableau', []],
  ['nombre', 42],
];

describe('adresse d’une commande : toujours du texte pour la liste', () => {
  test.each(FORMES)('%s : adresse, adresse brute, ville et infobulle sont du texte', (_nom, address) => {
    const ui = mapApiOrderToUiOrder(commandeApi(address));
    expect(typeof ui.address).toBe('string');
    expect(ui.rawAddress === null || typeof ui.rawAddress === 'string').toBe(true);
    const { short, full } = formatAddress(ui.address);
    expect(typeof short).toBe('string');
    expect(typeof full).toBe('string');
    // Appelée directement sur la valeur du serveur aussi.
    const direct = formatAddress(address);
    expect(typeof direct.short).toBe('string');
    expect(typeof direct.full).toBe('string');
  });

  test('objet complet : libellé lisible, et l’adresse brute se relit en JSON (carte, coordonnées)', () => {
    const ui = mapApiOrderToUiOrder(commandeApi(MAISON));
    expect(ui.address).toBe('Maison, Riviera 2, Abidjan');
    expect(JSON.parse(ui.rawAddress)).toEqual(MAISON);
    expect(formatAddress(MAISON)).toEqual({ short: 'Abidjan', full: 'Maison, Riviera 2, Abidjan' });
  });

  test('objet vide : « Adresse non disponible », comme un texte JSON vide', () => {
    expect(libelleAdresse({})).toBe('Adresse non disponible');
    expect(libelleAdresse('{}')).toBe('Adresse non disponible');
    expect(mapApiOrderToUiOrder(commandeApi({})).rawAddress).toBe('{}');
  });

  test('texte JSON : inchangé (formattedAddress d’abord)', () => {
    expect(libelleAdresse(JSON.stringify({ formattedAddress: 'Cocody, Abidjan', city: 'Abidjan' }))).toBe('Cocody, Abidjan');
    expect(adresseBrute('{"city":"Abidjan"}')).toBe('{"city":"Abidjan"}');
    expect(objetAdresse('pas du json')).toBeNull();
  });
});
