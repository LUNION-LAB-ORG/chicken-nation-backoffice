// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';
import { apresBascule, estAConfirmer, fraisLivraisonRetenus, panierAnnuleParLeClient } from '../bascule';

/**
 * Bascule vers le call center : ce que la modification fera de la taxe, du
 * total et du paiement, miroir de `OrderService.update` côté serveur.
 */

/** Commande du site à payer à la livraison, encore à confirmer. */
const commande = (o = {}) => ({
  orderType: 'À livrer',
  rawStatus: 'PENDING',
  paied: false,
  paiements: [],
  // OFFLINE sur une commande du client (utils/orderMapper).
  paymentChannel: 'Restaurant',
  amount: 5250,
  auto: true,
  channel: 'WEB',
  ...o,
});

describe('apresBascule : montant figé', () => {
  test('commande du site à payer à la livraison : taxe à zéro (24/10), frais de livraison du site, paiement inchangé', () => {
    expect(apresBascule(commande())).toEqual({ montantFige: null, fraisDuSite: true, paiement: 'inchange' });
  });

  test('commande payée : montant figé', () => {
    expect(apresBascule(commande({ paied: true })).montantFige).toBe('payee');
  });

  test('livraison déjà prête : taxe à zéro aussi (24/10)', () => {
    expect(apresBascule(commande({ rawStatus: 'READY' })).montantFige).toBe(null);
  });

  test('ailleurs que sur le site, ou déjà saisie par le personnel : taxe à zéro (inchangé)', () => {
    // Appli en espèces, commande sans canal (antérieure ou HubRise), saisie au call center.
    expect(apresBascule(commande({ channel: 'APP' })).montantFige).toBe(null);
    expect(apresBascule(commande({ channel: null })).montantFige).toBe(null);
    expect(apresBascule(commande({ auto: false })).montantFige).toBe(null);
  });

  test('panier en ligne non payé (site ou appli) : taxe à zéro et paiement à la caisse (inchangé)', () => {
    expect(apresBascule(commande({ paymentChannel: 'Appli' }))).toEqual({ montantFige: null, fraisDuSite: false, paiement: 'caisse' });
    expect(apresBascule(commande({ paymentChannel: 'Appli', channel: 'APP' }))).toEqual({
      montantFige: null,
      fraisDuSite: false,
      paiement: 'caisse',
    });
  });

  test('encaissement du livreur en attente : paiement « livreur » (inchangé)', () => {
    const c = commande({ paymentChannel: 'Appli', rawStatus: 'COLLECTED', paiements: [{ status: 'PENDING', amount: 5250 }] });
    // Livraison déjà prête : la taxe tombe aussi (24/10), le paiement reste au livreur.
    expect(apresBascule(c)).toEqual(expect.objectContaining({ montantFige: null, paiement: 'livreur' }));
  });
});

describe('estAConfirmer : jumeau de la règle du serveur', () => {
  test('site, à la livraison, du client, en attente, non payée', () => {
    expect(estAConfirmer(commande())).toBe(true);
  });

  test('chaque condition manquante la sort', () => {
    expect(estAConfirmer(commande({ channel: 'APP' }))).toBe(false);
    expect(estAConfirmer(commande({ channel: null }))).toBe(false);
    expect(estAConfirmer(commande({ channel: undefined }))).toBe(false);
    expect(estAConfirmer(commande({ paymentChannel: 'Appli' }))).toBe(false);
    expect(estAConfirmer(commande({ auto: false }))).toBe(false);
    expect(estAConfirmer(commande({ paied: true }))).toBe(false);
    expect(estAConfirmer(commande({ rawStatus: 'ACCEPTED' }))).toBe(false);
    expect(estAConfirmer(commande({ rawStatus: 'CANCELLED' }))).toBe(false);
  });
});

describe('panierAnnuleParLeClient : reprise d’une commande annulée', () => {
  const annulee = (o = {}) => commande({ rawStatus: 'CANCELLED', ...o });

  test('panier de l’application payable en ligne (inchangé)', () => {
    expect(panierAnnuleParLeClient(annulee({ paymentChannel: 'Appli', channel: 'APP' }))).toBe(true);
  });

  test('commande du site à payer à la livraison', () => {
    expect(panierAnnuleParLeClient(annulee())).toBe(true);
  });

  test('jamais : espèces de l’appli, payée, saisie par le personnel, pas annulée', () => {
    expect(panierAnnuleParLeClient(annulee({ channel: 'APP' }))).toBe(false);
    expect(panierAnnuleParLeClient(annulee({ channel: null }))).toBe(false);
    expect(panierAnnuleParLeClient(annulee({ paied: true }))).toBe(false);
    expect(panierAnnuleParLeClient(annulee({ auto: false }))).toBe(false);
    expect(panierAnnuleParLeClient(commande())).toBe(false);
  });
});

/**
 * Revue du 19/10 : à la reprise d'une commande du site à payer à la
 * livraison, l'aperçu des frais (qui ne connaît pas le client) remplaçait les
 * frais acceptés sur le site, et le formulaire enregistrait d'autres frais.
 */
describe('fraisLivraisonRetenus : frais de la commande du site gardés', () => {
  const ADRESSE = '{"title":"Maison","latitude":5.39,"longitude":-3.98}';
  const livraison = (o = {}) => ({ type: 'DELIVERY', address: ADRESSE, restaurant_id: 'r1', ...o });
  const figes = { ...livraison(), delivery_fee: 1000 };

  test('livraison inchangée : les frais de la commande, pas ceux de l’aperçu', () => {
    expect(fraisLivraisonRetenus(livraison(), 1500, figes)).toBe(1000);
    expect(fraisLivraisonRetenus(livraison({ address: ` ${ADRESSE} ` }), 1500, figes)).toBe(1000);
  });

  test('adresse, restaurant ou type changés par l’agent : les frais de l’aperçu', () => {
    expect(fraisLivraisonRetenus(livraison({ address: '{"title":"Bureau"}' }), 1500, figes)).toBe(1500);
    expect(fraisLivraisonRetenus(livraison({ restaurant_id: 'r2' }), 1500, figes)).toBe(1500);
    expect(fraisLivraisonRetenus(livraison({ type: 'PICKUP' }), 1500, figes)).toBe(1500);
  });

  test('toute autre commande : l’aperçu, comme avant', () => {
    expect(fraisLivraisonRetenus(livraison(), 1500, null)).toBe(1500);
    expect(fraisLivraisonRetenus(livraison(), 1500, undefined)).toBe(1500);
  });
});
