// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  CLES_DE_L_ONGLET,
  TYPES_DE_COMMANDE,
  choixPaiement,
  clesAEnregistrer,
  coupureEnVigueur,
  ecrireTypePropose,
  libelleDuReglage,
  paiementAffiche,
  typePropose,
} from '../reglages-commandes';

/**
 * Paramètres > Vente > Commandes (26/11) : un seul endroit par réglage.
 * Demandes du client : « deux endroits où on gère les frais », « pas de
 * doublons », « C'est paiement de la commande et non paiement d'une
 * livraison ».
 */

const [livraison, emporter, surPlace] = TYPES_DE_COMMANDE;
const maintenant = new Date('2026-11-26T12:00:00');

describe('types proposés', () => {
  test('rien de réglé : livraison et à emporter proposés, pas de sur place (comme le serveur)', () => {
    expect(typePropose(livraison, {})).toBe(true);
    expect(typePropose(emporter, {})).toBe(true);
    expect(typePropose(surPlace, {})).toBe(false);
  });

  test('à emporter et sur place : leur propre clé', () => {
    expect(typePropose(emporter, { order_type_emporter: '0' })).toBe(false);
    expect(typePropose(surPlace, { order_type_sur_place: '1' })).toBe(true);
    expect(ecrireTypePropose(emporter, false, {})).toEqual({ order_type_emporter: '0' });
    expect(ecrireTypePropose(surPlace, true, { a: 'b' })).toEqual({ a: 'b', order_type_sur_place: '1' });
  });
});

describe('livraison : un seul interrupteur, la coupure', () => {
  test('coupée : non proposée ; date de reprise passée : de nouveau proposée', () => {
    const coupee = { 'delivery.app_disabled': '1' };
    expect(coupureEnVigueur(coupee, maintenant)).toBe(true);
    expect(typePropose(livraison, coupee, maintenant)).toBe(false);
    const future = { ...coupee, 'delivery.app_disabled_until': '2026-11-26T18:00' };
    expect(typePropose(livraison, future, maintenant)).toBe(false);
    const passee = { ...coupee, 'delivery.app_disabled_until': '2026-11-26T08:00' };
    expect(coupureEnVigueur(passee, maintenant)).toBe(false);
    expect(typePropose(livraison, passee, maintenant)).toBe(true);
    // Date illisible : la coupure tient, comme sans date.
    expect(coupureEnVigueur({ ...coupee, 'delivery.app_disabled_until': 'demain' }, maintenant)).toBe(true);
  });

  test('ancienne clé du type à « 0 » : non proposée aussi (aucun interrupteur caché)', () => {
    expect(typePropose(livraison, { order_type_livraison: '0' }, maintenant)).toBe(false);
  });

  test('« Non » écrit la coupure et garde le message ; « Oui » la lève, vide la date, et remet l’ancienne clé', () => {
    const avant = { 'delivery.app_disabled_message': 'Pluie', order_type_livraison: '0' };
    const non = ecrireTypePropose(livraison, false, avant);
    expect(non).toEqual({
      'delivery.app_disabled_message': 'Pluie',
      order_type_livraison: '1',
      'delivery.app_disabled': '1',
    });
    expect(typePropose(livraison, non, maintenant)).toBe(false);

    const oui = ecrireTypePropose(livraison, true, { ...non, 'delivery.app_disabled_until': '2026-11-27T08:00' });
    expect(oui['delivery.app_disabled']).toBe('0');
    expect(oui['delivery.app_disabled_until']).toBe('');
    expect(oui.order_type_livraison).toBe('1');
    expect(typePropose(livraison, oui, maintenant)).toBe(true);
  });
});

describe('paiement de la commande', () => {
  test('choix : en ligne, à la réception, les deux, avec le lieu du type', () => {
    expect(choixPaiement('À la livraison').map((o) => o.label)).toEqual([
      'En ligne seulement',
      'À la livraison seulement',
      'En ligne ou à la livraison',
    ]);
    expect(choixPaiement('Au restaurant')[2].label).toBe('En ligne ou au restaurant');
  });

  test('clé absente : ce que le serveur applique ; la livraison part de l’ancien réglage du site', () => {
    expect(paiementAffiche(emporter, {})).toBe('EN_LIGNE');
    expect(paiementAffiche(surPlace, {})).toBe('EN_LIGNE');
    expect(paiementAffiche(livraison, {})).toBe('LES_DEUX');
    expect(paiementAffiche(livraison, { order_paiement_livraison_site: '1' })).toBe('LES_DEUX');
    expect(paiementAffiche(livraison, { order_paiement_livraison_site: '0' })).toBe('EN_LIGNE');
    // Enregistré : il l'emporte.
    expect(paiementAffiche(livraison, { order_paiement_livraison_site: '0', order_paiement_livraison: 'A_LA_RECEPTION' })).toBe(
      'A_LA_RECEPTION',
    );
  });
});

describe('enregistrement', () => {
  test('seulement ce qui a changé, et seulement les clés de l’onglet', () => {
    const enBase = { order_type_emporter: '1', order_paiement_reception: 'DIRECTE', order_tax_rate: '0.01' };
    expect(clesAEnregistrer(enBase, enBase)).toEqual([]);
    const modifie = { ...enBase, order_paiement_reception: 'APRES_CONFIRMATION', order_tax_rate: '0.05', 'delivery.app_disabled': '1' };
    expect(clesAEnregistrer(modifie, enBase).sort()).toEqual(['delivery.app_disabled', 'order_paiement_reception']);
  });

  test('vider un champ jamais enregistré n’est pas une modification', () => {
    // « Oui » sur la livraison vide la date de reprise : rien à écrire si elle n'existait pas.
    expect(clesAEnregistrer({ 'delivery.app_disabled_until': '' }, {})).toEqual([]);
    expect(clesAEnregistrer({ 'delivery.app_disabled_until': '' }, { 'delivery.app_disabled_until': '2026-11-27T08:00' })).toEqual([
      'delivery.app_disabled_until',
    ]);
  });

  test('un seul endroit par réglage : ni les frais de service ni les frais de livraison de base ici', () => {
    expect(CLES_DE_L_ONGLET).not.toContain('order_tax_rate');
    expect(CLES_DE_L_ONGLET).not.toContain('base_delivery_fee');
    // La coupure n'est plus réglée dans l'onglet Livraison.
    const livraisonSource = readFileSync(join(import.meta.dir, '..', 'DeliverySettings.tsx'), 'utf8');
    expect(livraisonSource).not.toMatch(/key:\s*"delivery\.app_disabled/);
    const source = readFileSync(join(import.meta.dir, '..', 'OrderSettings.tsx'), 'utf8');
    expect(source).not.toContain('order_tax_rate"');
    expect(source).not.toContain('base_delivery_fee"');
  });

  test('libellés enregistrés avec les réglages', () => {
    expect(libelleDuReglage('order_paiement_livraison')).toBe('Livraison : paiement de la commande');
    expect(libelleDuReglage('order_type_sur_place')).toBe('Sur place : proposé aux clients');
    expect(libelleDuReglage('order_paiement_reception')).toBe('Commande à payer à la réception');
    expect(libelleDuReglage('delivery.app_disabled_message')).toBe('Livraison coupée : message au client');
  });
});

describe('textes de l’écran', () => {
  const source = readFileSync(join(import.meta.dir, '..', 'OrderSettings.tsx'), 'utf8');

  test('« Paiement de la commande », jamais « Paiement d’une livraison » ; phrase sur l’application pas à jour retirée', () => {
    expect(source).toContain('Paiement de la commande');
    expect(source).not.toContain("Paiement d'une livraison");
    expect(source).not.toContain("n'est pas à jour");
  });

  test('aucun tiret cadratin', () => {
    expect(source).not.toMatch(/[—–]/);
    expect(readFileSync(join(import.meta.dir, '..', 'reglages-commandes.ts'), 'utf8')).not.toMatch(/[—–]/);
  });
});
