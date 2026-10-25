/* eslint-disable @typescript-eslint/ban-ts-comment -- tests bun : leurs types ne sont pas installés dans le backoffice. */
// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { afterAll, describe, expect, test } from 'bun:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import {
  actionPaiement,
  adresseCourte,
  commandeProgrammee,
  formatPrix,
  libelleStatutCarte,
  nomClientCarte,
  restaurantDeLaCarte,
} from '../carte-operations';

/**
 * Carte « En cours », version 2 (retours du client du 24 et du 25/10) : la
 * carte d'avant, mêmes mots, mêmes informations, même ordre et même place ;
 * restaurant, client et adresse sur une ligne chacun.
 */

const consoleDOrigine = { log: console.log, warn: console.warn, error: console.error };
console.log = () => {};
console.warn = () => {};
afterAll(() => Object.assign(console, consoleDOrigine));

const { OperationsCard } = await import('../../components/OperationsCard');

function commande(extra = {}) {
  return {
    id: 'o1',
    reference: 'ORD-241024-0012',
    status: 'IN_PROGRESS',
    type: 'DELIVERY',
    channel: 'WEB',
    auto: true,
    amount: 12500,
    paied: false,
    payment_method: 'ONLINE',
    fullname: 'Aya Koné',
    customer: null,
    phone: '0707070707',
    address: JSON.stringify({ address: 'Riviera 3, Cocody' }),
    restaurant: { id: 'r1', name: 'CHICKEN NATION ZONE 4' },
    created_at: new Date(Date.now() - 5 * 60_000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 60_000).toISOString(),
    date: null,
    time: null,
    ...extra,
  };
}

const rendre = (order, props = {}) =>
  renderToStaticMarkup(React.createElement(OperationsCard, { order, onClick: () => undefined, ...props }));

describe('les mots d’avant', () => {
  test('statut en majuscules, comme la page Commandes', () => {
    expect(['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'READY', 'PICKED_UP', 'COLLECTED', 'COMPLETED', 'CANCELLED'].map(libelleStatutCarte)).toEqual([
      'EN ATTENTE',
      'NOUVELLE',
      'EN PRÉPARATION',
      'PRÊT',
      'EN LIVRAISON',
      'RÉCUPÉRÉE',
      'TERMINÉE',
      'ANNULÉE',
    ]);
  });

  test('montant « 12.500 F », client, adresse', () => {
    expect(formatPrix(12500)).toBe('12.500 F');
    expect(formatPrix(undefined)).toBe('0 F');
    expect(nomClientCarte({ customer: { first_name: 'Koffi', last_name: 'Yao' }, fullname: 'K' })).toBe('Koffi Yao');
    expect(nomClientCarte({ fullname: 'Aya' })).toBe('Aya');
    expect(nomClientCarte({})).toBe('Client');
    expect(adresseCourte({ address: JSON.stringify({ address: 'Riviera 3' }) })).toBe('Riviera 3');
    expect(adresseCourte({ address: 'texte libre' })).toBe('texte libre');
    expect(adresseCourte({ address: null })).toBe('');
  });

  test('restaurant, nom entier, pour un compte du siège seulement', () => {
    const o = { restaurant: { name: 'CHICKEN NATION ZONE 4' } };
    expect(restaurantDeLaCarte(o, 'BACKOFFICE')).toBe('CHICKEN NATION ZONE 4');
    expect(restaurantDeLaCarte(o, 'RESTAURANT')).toBeNull();
    expect(restaurantDeLaCarte({ restaurant: null }, 'BACKOFFICE')).toBeNull();
  });

  test('pied : « Faire le paiement » à la livraison une fois sortie, sinon « Paiement en attente », rien si payée', () => {
    expect(actionPaiement({ paied: true, payment_method: 'OFFLINE', status: 'COLLECTED' })).toBeNull();
    expect(actionPaiement({ paied: false, payment_method: 'OFFLINE', status: 'PICKED_UP' })).toBe('payer');
    expect(actionPaiement({ paied: false, payment_method: 'OFFLINE', status: 'COLLECTED' })).toBe('payer');
    expect(actionPaiement({ paied: false, payment_method: 'OFFLINE', status: 'READY' })).toBe('attente');
    expect(actionPaiement({ paied: false, payment_method: 'ONLINE', status: 'COLLECTED' })).toBe('attente');
  });

  test('commande programmée : « Plus tard · 20h00 », puis « À préparer · 20h00 »', () => {
    const programmee = { date: '2026-10-24T00:00:00.000Z', time: '20:00', created_at: '2026-10-24T12:00:00.000Z' };
    expect(commandeProgrammee(programmee, new Date('2026-10-24T13:00:00.000Z'))).toEqual({
      texte: 'Plus tard · 20h00',
      titre: 'À traiter plus tard : préparation à partir de 19h00',
      plusTard: true,
    });
    expect(commandeProgrammee(programmee, new Date('2026-10-24T19:10:00.000Z'))?.texte).toBe('À préparer · 20h00');
    expect(commandeProgrammee({ ...programmee, time: '12:05' }, new Date('2026-10-24T12:01:00.000Z'))).toBeNull();
  });
});

describe('la carte affichée', () => {
  test('statut, type, origine en pastilles ; client, téléphone, adresse, montant', () => {
    const html = rendre(commande());
    for (const mot of ['EN PRÉPARATION', 'À livrer', 'Site web', 'Aya Koné', '0707070707', 'Riviera 3, Cocody', '12.500 F', 'ORD-241024-0012', 'Paiement en attente']) {
      expect(html).toContain(mot);
    }
    expect(html).toContain('border-2');
  });

  test('origine « Manuel » et « Appli », types « À récupérer » et « À table »', () => {
    expect(rendre(commande({ channel: 'CALL_CENTER', auto: false, type: 'PICKUP' }))).toContain('Manuel');
    expect(rendre(commande({ channel: 'APP', auto: true, type: 'TABLE' }))).toContain('Appli');
    expect(rendre(commande({ type: 'PICKUP' }))).toContain('À récupérer');
    expect(rendre(commande({ type: 'TABLE' }))).toContain('À table');
  });

  test('« Faire le paiement » sur une commande sortie à payer à la livraison', () => {
    const html = rendre(commande({ status: 'COLLECTED', payment_method: 'OFFLINE' }));
    expect(html).toContain('RÉCUPÉRÉE');
    expect(html).toContain('Faire le paiement');
  });

  test('à côté du minuteur, comme avant : référence et montant, programmée, pastilles, puis la ligne de suivi', () => {
    const html = rendre(commande({ date: '2099-10-24T00:00:00.000Z', time: '20:00' }), {
      showWarningBadge: true,
      warningLabel: 'En retard',
      extra: React.createElement('span', null, 'Attendue par la course de Koffi, départ au plus tard 12 h 44'),
    });
    const ordre = ['ORD-241024-0012', '12.500 F', 'Plus tard · 20h00', 'EN PRÉPARATION', 'À livrer', 'Site web', 'En retard', 'Attendue par la course de Koffi', 'Aya Koné', 'Riviera 3, Cocody'];
    const places = ordre.map((mot) => html.indexOf(mot));
    expect(places.every((p) => p >= 0)).toBe(true);
    expect([...places].sort((x, y) => x - y)).toEqual(places);
  });

  test('les pastilles passent à la ligne quand la place manque : aucune cachée (relecture du 25/10)', () => {
    const html = rendre(commande(), { showWarningBadge: true, warningLabel: 'En retard' });
    expect(html).toContain('flex-wrap');
    expect(html).not.toContain('overflow-hidden');
    expect(html).not.toContain('h-[26px]');
  });

  test('pas de bande vide : sans programmée ni suivi, rien entre le montant et les pastilles', () => {
    const html = rendre(commande({ status: 'ACCEPTED', type: 'DELIVERY', channel: 'CALL_CENTER', auto: false }));
    const entre = html.slice(html.indexOf('12.500 F'), html.indexOf('NOUVELLE'));
    expect(entre).not.toContain('h-6');
    expect(entre).not.toContain('<div class="mt-1');
    expect(html).toContain('Manuel');
    expect(html).not.toContain('<div class="mt-2 min-w-0">');
  });

  test('aucun tiret cadratin', () => {
    expect(rendre(commande({ address: null, status: 'UNKNOWN' }))).not.toContain('—');
  });
});
