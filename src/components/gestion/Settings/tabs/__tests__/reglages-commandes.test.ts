// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  CANAUX,
  CLES_DES_ECRANS,
  TYPES_DE_COMMANDE,
  choixPaiement,
  cleParcours,
  clePaiement,
  cleType,
  clesAEnregistrer,
  coupureEnVigueur,
  libelleDuReglage,
  paiementAffiche,
  parcoursAffiche,
  typePropose,
  typesDuCanal,
} from '../reglages-commandes';

/**
 * Paramètres > Vente > Commandes de l'appli, Commandes du site (26/11).
 * Demandes du client : « deux endroits où on gère les frais », « pas de
 * doublons », « C'est paiement de la commande et non paiement d'une
 * livraison », puis « on doit avoir le paramétrage pour le site et le
 * paramétrage pour l'appli, pareil pour commande à payer à la réception ».
 */

const [livraison, emporter, surPlace] = TYPES_DE_COMMANDE;
const { APP: appli, WEB: site } = CANAUX;
const maintenant = new Date('2026-11-26T12:00:00');

describe('un paramétrage par canal', () => {
  test('les clés : pour chaque canal, deux par type et le parcours ; le site n’a pas de sur place', () => {
    expect(cleType(livraison, appli)).toBe('order_type_livraison_appli');
    expect(clePaiement(emporter, site)).toBe('order_paiement_emporter_site');
    expect(cleParcours(appli)).toBe('order_paiement_reception_appli');
    expect(cleParcours(site)).toBe('order_paiement_reception_site');
    expect(typesDuCanal(appli).map((t) => t.cle)).toEqual(['livraison', 'emporter', 'sur_place']);
    expect(typesDuCanal(site).map((t) => t.cle)).toEqual(['livraison', 'emporter']);
    expect([...CLES_DES_ECRANS].sort()).toEqual(
      [
        'order_type_livraison_appli',
        'order_type_emporter_appli',
        'order_type_sur_place_appli',
        'order_paiement_livraison_appli',
        'order_paiement_emporter_appli',
        'order_paiement_sur_place_appli',
        'order_paiement_reception_appli',
        'order_type_livraison_site',
        'order_type_emporter_site',
        'order_paiement_livraison_site',
        'order_paiement_emporter_site',
        'order_paiement_reception_site',
      ].sort(),
    );
  });

  test('rien de réglé, application : livraison et à emporter payés en ligne, pas de sur place, commande directe', () => {
    expect(typePropose(livraison, appli, {})).toBe(true);
    expect(typePropose(emporter, appli, {})).toBe(true);
    expect(typePropose(surPlace, appli, {})).toBe(false);
    expect(paiementAffiche(livraison, appli, {})).toBe('EN_LIGNE');
    expect(paiementAffiche(emporter, appli, {})).toBe('EN_LIGNE');
    expect(parcoursAffiche(appli, {})).toBe('DIRECTE');
  });

  test('rien de réglé, site : la livraison se paie aussi à la livraison, et la commande attend sa confirmation', () => {
    expect(typePropose(livraison, site, {})).toBe(true);
    expect(typePropose(emporter, site, {})).toBe(true);
    expect(paiementAffiche(livraison, site, {})).toBe('LES_DEUX');
    expect(paiementAffiche(emporter, site, {})).toBe('EN_LIGNE');
    expect(parcoursAffiche(site, {})).toBe('APRES_CONFIRMATION');
  });

  test('régler un canal ne touche pas l’autre', () => {
    const valeurs = {
      order_type_livraison_appli: '0',
      order_paiement_emporter_appli: 'LES_DEUX',
      order_paiement_reception_appli: 'APRES_CONFIRMATION',
      order_type_emporter_site: '0',
      order_paiement_reception_site: 'DIRECTE',
    };
    expect([typePropose(livraison, appli, valeurs), typePropose(livraison, site, valeurs)]).toEqual([false, true]);
    expect([typePropose(emporter, appli, valeurs), typePropose(emporter, site, valeurs)]).toEqual([true, false]);
    expect([paiementAffiche(emporter, appli, valeurs), paiementAffiche(emporter, site, valeurs)]).toEqual(['LES_DEUX', 'EN_LIGNE']);
    expect([parcoursAffiche(appli, valeurs), parcoursAffiche(site, valeurs)]).toEqual(['APRES_CONFIRMATION', 'DIRECTE']);
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

  test('livraison sur le site : la clé du 19/10, lue dans ses deux écritures comme le serveur', () => {
    const lire = (valeur) => paiementAffiche(livraison, site, { order_paiement_livraison_site: valeur });
    // Ancienne écriture : « 1 » proposé, « 0 » coupé.
    expect(lire('1')).toBe('LES_DEUX');
    expect(lire('oui')).toBe('LES_DEUX');
    expect(lire('0')).toBe('EN_LIGNE');
    // Nouvelle écriture.
    expect(lire('LES_DEUX')).toBe('LES_DEUX');
    expect(lire('A_LA_RECEPTION')).toBe('A_LA_RECEPTION');
    expect(lire('EN_LIGNE')).toBe('EN_LIGNE');
    // Illisible : en ligne seulement.
    expect(lire('peut-être')).toBe('EN_LIGNE');
    // Ailleurs, « 1 » ne veut rien dire : en ligne seulement.
    expect(paiementAffiche(livraison, appli, { order_paiement_livraison_appli: '1' })).toBe('EN_LIGNE');
    expect(paiementAffiche(emporter, site, { order_paiement_emporter_site: '1' })).toBe('EN_LIGNE');
  });
});

describe('coupure temporaire de la livraison : affichée ici, réglée dans Livraison', () => {
  test('en vigueur tant que la date de reprise n’est pas passée', () => {
    const coupee = { 'delivery.app_disabled': '1' };
    expect(coupureEnVigueur({}, maintenant)).toBe(false);
    expect(coupureEnVigueur(coupee, maintenant)).toBe(true);
    expect(coupureEnVigueur({ ...coupee, 'delivery.app_disabled_until': '2026-11-26T18:00' }, maintenant)).toBe(true);
    expect(coupureEnVigueur({ ...coupee, 'delivery.app_disabled_until': '2026-11-26T08:00' }, maintenant)).toBe(false);
    // Date illisible : la coupure tient, comme sans date.
    expect(coupureEnVigueur({ ...coupee, 'delivery.app_disabled_until': 'demain' }, maintenant)).toBe(true);
  });

  test('un seul endroit par réglage', () => {
    // Ces écrans n'enregistrent ni la coupure, ni les frais.
    for (const cle of ['delivery.app_disabled', 'delivery.app_disabled_until', 'delivery.app_disabled_message', 'order_tax_rate', 'base_delivery_fee'])
      expect(CLES_DES_ECRANS).not.toContain(cle);
    // La coupure se règle dans l'onglet Livraison, et nulle part ailleurs.
    const livraisonSource = readFileSync(join(import.meta.dir, '..', 'DeliverySettings.tsx'), 'utf8');
    expect(livraisonSource).toMatch(/key:\s*"delivery\.app_disabled"/);
    const source = readFileSync(join(import.meta.dir, '..', 'OrderSettings.tsx'), 'utf8');
    expect(source).not.toContain('order_tax_rate');
    expect(source).not.toContain('base_delivery_fee');
    expect(source).not.toContain('app_disabled_message');
  });
});

describe('enregistrement', () => {
  test('seulement ce qui a changé, pour les deux canaux', () => {
    const enBase = { order_type_emporter_appli: '1', order_paiement_reception_site: 'DIRECTE', order_tax_rate: '0.01' };
    expect(clesAEnregistrer(enBase, enBase)).toEqual([]);
    const modifie = {
      ...enBase,
      order_paiement_reception_site: 'APRES_CONFIRMATION',
      order_paiement_reception_appli: 'APRES_CONFIRMATION',
      order_tax_rate: '0.05',
    };
    expect(clesAEnregistrer(modifie, enBase).sort()).toEqual(['order_paiement_reception_appli', 'order_paiement_reception_site']);
  });

  test('libellés enregistrés avec les réglages', () => {
    expect(libelleDuReglage('order_paiement_livraison_appli')).toBe('Application, livraison : paiement de la commande');
    expect(libelleDuReglage('order_type_emporter_site')).toBe('Site web, à emporter : proposé');
    expect(libelleDuReglage('order_paiement_reception_site')).toBe('Site web : commande à payer à la réception');
    expect(libelleDuReglage('order_paiement_reception_appli')).toBe('Application : commande à payer à la réception');
  });
});

describe('textes de l’écran', () => {
  const source = readFileSync(join(import.meta.dir, '..', 'OrderSettings.tsx'), 'utf8');

  test('« Paiement de la commande », jamais « Paiement d’une livraison » ; phrase sur l’application pas à jour retirée', () => {
    expect(source).toContain('Paiement de la commande');
    expect(source).not.toContain("Paiement d'une livraison");
    expect(source).not.toContain("n'est pas à jour");
  });

  test('chaque canal a son titre', () => {
    expect(appli.titre).toBe("Commandes de l'application");
    expect(site.titre).toBe('Commandes du site web');
  });

  test('aucun tiret cadratin', () => {
    expect(source).not.toMatch(/[—–]/);
    expect(readFileSync(join(import.meta.dir, '..', 'reglages-commandes.ts'), 'utf8')).not.toMatch(/[—–]/);
  });
});
