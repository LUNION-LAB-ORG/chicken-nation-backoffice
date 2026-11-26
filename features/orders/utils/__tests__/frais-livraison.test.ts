// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';
import {
  aideFrais,
  fraisAutomatiques,
  lireSaisieFrais,
  livraisonInchangee,
  valeurChampFrais,
} from '../frais-livraison';

/** Frais de livraison du formulaire : saisie de l'agent, frais enregistrés, aperçu du serveur. */

const ADRESSE = '{"title":"Maison","latitude":5.39,"longitude":-3.98}';
const livraison = (o = {}) => ({ type: 'DELIVERY', address: ADRESSE, restaurant_id: 'r1', ...o });
const enregistres = (frais = 1000) => ({ ...livraison(), delivery_fee: frais });

describe('frais de livraison : modification d’une commande', () => {
  test('livraison inchangée : les frais enregistrés, jamais ceux de l’aperçu', () => {
    expect(fraisAutomatiques({ livraison: livraison(), apercu: 1500, enregistres: enregistres(), saisis: false })).toBe(1000);
    // Sans attendre l'aperçu : ils sont déjà connus.
    expect(fraisAutomatiques({ livraison: livraison(), enregistres: enregistres(), saisis: false })).toBe(1000);
  });

  test('livraison offerte à l’enregistrement : zéro reste zéro', () => {
    expect(fraisAutomatiques({ livraison: livraison(), apercu: 1500, enregistres: enregistres(0), saisis: false })).toBe(0);
  });

  test('adresse, restaurant ou type changés par l’agent : les frais de l’aperçu', () => {
    const autre = (o) => fraisAutomatiques({ livraison: livraison(o), apercu: 1500, enregistres: enregistres(), saisis: false });
    expect(autre({ address: '{"title":"Bureau"}' })).toBe(1500);
    expect(autre({ restaurant_id: 'r2' })).toBe(1500);
    expect(autre({ type: 'PICKUP' })).toBe(1500);
    // Aperçu pas encore arrivé : rien à poser.
    expect(
      fraisAutomatiques({ livraison: livraison({ restaurant_id: 'r2' }), enregistres: enregistres(), saisis: false }),
    ).toBeUndefined();
  });

  test('retour à la livraison d’origine : de nouveau les frais enregistrés', () => {
    expect(livraisonInchangee(livraison({ address: ` ${ADRESSE} ` }), enregistres())).toBe(true);
    expect(livraisonInchangee(livraison({ restaurant_id: 'r2' }), enregistres())).toBe(false);
    expect(livraisonInchangee(livraison(), null)).toBe(false);
  });
});

describe('frais de livraison : nouvelle commande', () => {
  test('l’aperçu du serveur, dès qu’il répond', () => {
    expect(fraisAutomatiques({ livraison: livraison(), apercu: 1500, saisis: false })).toBe(1500);
    expect(fraisAutomatiques({ livraison: livraison(), apercu: 0, saisis: false })).toBe(0);
    expect(fraisAutomatiques({ livraison: livraison(), saisis: false })).toBeUndefined();
  });
});

describe('frais de livraison : saisie de l’agent', () => {
  test('ce que l’agent a saisi n’est plus jamais écrasé', () => {
    expect(fraisAutomatiques({ livraison: livraison(), apercu: 1500, saisis: true })).toBeUndefined();
    expect(fraisAutomatiques({ livraison: livraison(), apercu: 1500, enregistres: enregistres(), saisis: true })).toBeUndefined();
  });

  test('zéro est un montant : le champ l’affiche et le garde', () => {
    expect(lireSaisieFrais('0')).toBe(0);
    expect(valeurChampFrais(0)).toBe('0');
    expect(lireSaisieFrais('1500')).toBe(1500);
    expect(valeurChampFrais(1500)).toBe('1500');
  });

  test('champ vidé : rien n’est posé ; jamais de montant négatif', () => {
    expect(lireSaisieFrais('')).toBeUndefined();
    expect(lireSaisieFrais('  ')).toBeUndefined();
    expect(valeurChampFrais(undefined)).toBe('');
    expect(valeurChampFrais(null)).toBe('');
    expect(lireSaisieFrais('-500')).toBe(0);
  });
});

describe('frais de livraison : texte sous le champ', () => {
  const aide = (o = {}) => aideFrais({ verrouilles: false, saisis: false, enregistres: false, ...o });

  test('frais du site, montant saisi, frais enregistrés, ou calcul de la zone', () => {
    expect(aide({ verrouilles: true, saisis: true, enregistres: true })).toContain('acceptés par le client sur le site');
    // Commande de l'application à confirmer (26/11).
    expect(aide({ verrouilles: true, origine: 'appli' })).toContain("acceptés par le client dans l'application");
    expect(aide({ verrouilles: true, origine: 'site' })).toContain('acceptés par le client sur le site');
    expect(aide({ saisis: true, enregistres: true, distance: 3 })).toBe(
      'Montant saisi à la main : il n\'est plus recalculé. « Auto » remet les frais calculés.',
    );
    expect(aide({ enregistres: true, distance: 3 })).toBe(
      'Frais enregistrés avec la commande : ils ne sont pas recalculés. Modifiez le champ pour changer le montant.',
    );
    expect(aide({ distance: 6.84 })).toBe(
      'Calculé automatiquement selon la zone (6.8 km). Modifiez le champ pour forcer un autre montant.',
    );
    expect(aide()).toBeNull();
  });

  test('aucun tiret long dans les textes', () => {
    for (const t of [
      aide({ verrouilles: true }),
      aide({ saisis: true }),
      aide({ enregistres: true }),
      aide({ distance: 2 }),
    ]) {
      expect(t).not.toMatch(/[–—]/);
    }
  });
});
