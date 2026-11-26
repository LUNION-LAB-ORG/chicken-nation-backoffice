// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  CANAUX,
  CLES_DE_L_ONGLET,
  TYPES_DE_COMMANDE,
  basculerCanal,
  canauxCoches,
  choixPaiement,
  clesAEnregistrer,
  coupureEnVigueur,
  ecrireCanaux,
  libelleDuReglage,
  lireCanaux,
  paiementAffiche,
} from '../reglages-commandes';

/**
 * Paramètres > Vente > Commandes (26/11) : un seul endroit par réglage.
 * Demandes du client : « deux endroits où on gère les frais », « pas de
 * doublons », « C'est paiement de la commande et non paiement d'une
 * livraison », « on doit cocher site web ou appli ».
 */

const [livraison, emporter, surPlace] = TYPES_DE_COMMANDE;
const maintenant = new Date('2026-11-26T12:00:00');

describe('types cochés par canal : Appli, Site web', () => {
  test('les deux cases, dans cet ordre ; sur place : l’application seule', () => {
    expect(CANAUX).toEqual([
      { cle: 'APP', libelle: 'Appli' },
      { cle: 'WEB', libelle: 'Site web' },
    ]);
    expect(livraison.canauxPossibles).toEqual(['APP', 'WEB']);
    expect(emporter.canauxPossibles).toEqual(['APP', 'WEB']);
    expect(surPlace.canauxPossibles).toEqual(['APP']);
  });

  test('lecture comme le serveur : liste, « 1 » les deux, « 0 » aucun, vide la valeur par défaut', () => {
    expect(lireCanaux('APP,WEB', [])).toEqual(['APP', 'WEB']);
    expect(lireCanaux('web', [])).toEqual(['WEB']);
    expect(lireCanaux('1', [])).toEqual(['APP', 'WEB']);
    expect(lireCanaux('0', ['APP', 'WEB'])).toEqual([]);
    expect(lireCanaux(undefined, ['APP', 'WEB'])).toEqual(['APP', 'WEB']);
    expect(lireCanaux('', ['APP'])).toEqual(['APP']);
    expect(lireCanaux('partout', ['APP', 'WEB'])).toEqual([]);
  });

  test('rien de réglé : livraison et à emporter cochés partout, sur place nulle part (comme le serveur)', () => {
    expect(canauxCoches(livraison, {}, maintenant)).toEqual(['APP', 'WEB']);
    expect(canauxCoches(emporter, {}, maintenant)).toEqual(['APP', 'WEB']);
    expect(canauxCoches(surPlace, {}, maintenant)).toEqual([]);
  });

  test('à emporter : décocher le site, puis l’appli, puis recocher', () => {
    let v = basculerCanal(emporter, 'WEB', false, {});
    expect(v).toEqual({ order_type_emporter: 'APP' });
    v = basculerCanal(emporter, 'APP', false, v);
    // Aucun canal : « 0 », jamais vide (vide vaudrait la valeur par défaut).
    expect(v).toEqual({ order_type_emporter: '0' });
    expect(canauxCoches(emporter, v, maintenant)).toEqual([]);
    v = basculerCanal(emporter, 'WEB', true, v);
    expect(v).toEqual({ order_type_emporter: 'WEB' });
    v = basculerCanal(emporter, 'APP', true, v);
    expect(v).toEqual({ order_type_emporter: 'APP,WEB' });
  });

  test('sur place : seule l’application se coche, le site est ignoré', () => {
    expect(ecrireCanaux(surPlace, ['APP', 'WEB'], {})).toEqual({ order_type_sur_place: 'APP' });
    expect(canauxCoches(surPlace, { order_type_sur_place: '1' }, maintenant)).toEqual(['APP']);
    expect(ecrireCanaux(surPlace, [], {})).toEqual({ order_type_sur_place: '0' });
  });
});

describe('livraison : un seul interrupteur', () => {
  test('coupure en vigueur : aucune case cochée ; date de reprise passée : de nouveau cochée', () => {
    const coupee = { 'delivery.app_disabled': '1' };
    expect(coupureEnVigueur(coupee, maintenant)).toBe(true);
    expect(canauxCoches(livraison, coupee, maintenant)).toEqual([]);
    const future = { ...coupee, 'delivery.app_disabled_until': '2026-11-26T18:00' };
    expect(canauxCoches(livraison, future, maintenant)).toEqual([]);
    const passee = { ...coupee, 'delivery.app_disabled_until': '2026-11-26T08:00' };
    expect(coupureEnVigueur(passee, maintenant)).toBe(false);
    expect(canauxCoches(livraison, passee, maintenant)).toEqual(['APP', 'WEB']);
    // Date illisible : la coupure tient, comme sans date.
    expect(coupureEnVigueur({ ...coupee, 'delivery.app_disabled_until': 'demain' }, maintenant)).toBe(true);
  });

  test('un seul canal décoché : le type est retiré de ce canal, sans coupure', () => {
    const v = ecrireCanaux(livraison, ['APP'], {});
    expect(v).toEqual({ order_type_livraison: 'APP', 'delivery.app_disabled': '0', 'delivery.app_disabled_until': '' });
    expect(canauxCoches(livraison, v, maintenant)).toEqual(['APP']);
  });

  test('plus aucun canal : c’est la coupure, le message reste, et la reprise rendra la livraison partout', () => {
    const avant = { 'delivery.app_disabled_message': 'Pluie', order_type_livraison: 'APP' };
    const coupe = ecrireCanaux(livraison, [], avant);
    expect(coupe).toEqual({
      'delivery.app_disabled_message': 'Pluie',
      order_type_livraison: 'APP,WEB',
      'delivery.app_disabled': '1',
    });
    expect(canauxCoches(livraison, coupe, maintenant)).toEqual([]);

    // Une case recochée : la coupure est levée, la date vidée.
    const repris = ecrireCanaux(livraison, ['WEB'], { ...coupe, 'delivery.app_disabled_until': '2026-11-27T08:00' });
    expect(repris['delivery.app_disabled']).toBe('0');
    expect(repris['delivery.app_disabled_until']).toBe('');
    expect(repris.order_type_livraison).toBe('WEB');
    expect(canauxCoches(livraison, repris, maintenant)).toEqual(['WEB']);
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
    expect(libelleDuReglage('order_type_sur_place')).toBe('Sur place : proposé sur (canaux)');
    expect(libelleDuReglage('order_paiement_reception')).toBe('Commande à payer à la réception');
    expect(libelleDuReglage('delivery.app_disabled_message')).toBe('Livraison coupée : message au client');
  });
});

describe('textes de l’écran', () => {
  const source = readFileSync(join(import.meta.dir, '..', 'OrderSettings.tsx'), 'utf8');

  test('« Proposé sur », avec des cases à cocher par canal', () => {
    expect(source).toContain('Proposé sur');
    expect(source).toContain('type="checkbox"');
    expect(source).not.toContain('Proposé aux clients');
  });

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
