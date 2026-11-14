// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';
import { messageErreurConfirmation, texteBandeau, textePaiementSignale } from '../relance';
import { actionsRelance, panierAConfirmerParDefaut, paniersAPayerEnLigne } from '../relance-actions';

/** « Confirmer le paiement » d'un panier payé que le webhook n'a pas confirmé (14/11). */

const maintenant = new Date(2026, 10, 14, 14, 40).getTime();

const ligne = (id: string, extra = {}) => ({
  id,
  reference: `ORD-${id}`,
  created_at: new Date(2026, 10, 14, 14, 30).toISOString(),
  client_nom: 'Diabi Yasmine',
  telephone: '+2250708411544',
  restaurant: { id: 'r1', name: 'Sococe 2 Plateaux' },
  type: 'DELIVERY',
  amount: 8780,
  paiement_refuse: false,
  annulee_par_client: false,
  channel: 'APP',
  paiement_a_la_livraison: false,
  ...extra,
});

const signal = (orderId = 'o1', extra = {}) => ({
  order_id: orderId,
  reference: `ORD-${orderId}`,
  transaction_id: 'qXw9Ab12',
  montant: 8780,
  moyen: 'MOBILE_MONEY',
  le: new Date(2026, 10, 14, 14, 32).toISOString(),
  motif: 'transaction introuvable',
  ...extra,
});

const groupe = ({ etat = 'A_RELANCER', prise = null, signale = null, tete = ligne('o1'), autres = [], aConfirmer = false } = {}) => ({
  cle: tete.id,
  etat,
  tete,
  autres,
  alerte_le: null,
  prise,
  signaux: {
    paiement_refuse: false,
    commande_recente: null,
    annulee_par_client: null,
    commande_suivante: null,
    paiement_signale: signale,
  },
  crm: null,
  a_confirmer: aConfirmer,
});

const prise = (parMoi: boolean) => ({
  par: { id: parMoi ? 'moi' : 'koffi', fullname: parMoi ? 'Moi' : 'Koffi Yao' },
  le: new Date(maintenant).toISOString(),
  expire_le: new Date(maintenant + 600_000).toISOString(),
  par_moi: parMoi,
});

describe('relance : bouton « Confirmer le paiement »', () => {
  test('panier en ligne sans signal, pas en main : aucun bouton, rien ne change', () => {
    expect(actionsRelance(groupe(), { estAdmin: false })).toEqual(['prendre', 'ignorer', 'ouvrir']);
    expect(actionsRelance(groupe(), { estAdmin: true })).toEqual(['prendre', 'ignorer', 'ouvrir']);
  });

  test('en main : le client dit avoir payé, le bouton suit « Reprendre au téléphone »', () => {
    expect(actionsRelance(groupe({ etat: 'PRIS', prise: prise(true) }), { estAdmin: false })).toEqual([
      'reprendre',
      'confirmer_paiement',
      'liberer',
      'ignorer',
      'ouvrir',
    ]);
  });

  test('paiement signalé : le bouton apparaît sans prise, paiement en cours compris', () => {
    expect(actionsRelance(groupe({ signale: signal() }), { estAdmin: false })).toEqual([
      'prendre',
      'confirmer_paiement',
      'ignorer',
      'ouvrir',
    ]);
    expect(actionsRelance(groupe({ etat: 'EN_COURS', signale: signal() }), { estAdmin: false })).toEqual([
      'confirmer_paiement',
      'ignorer',
      'ouvrir',
    ]);
  });

  test('prise d’un collègue : rien pour l’agent, même signalé ; l’ADMIN confirme', () => {
    const g = groupe({ etat: 'PRIS', prise: prise(false), signale: signal() });
    expect(actionsRelance(g, { estAdmin: false })).toEqual(['ouvrir']);
    expect(actionsRelance(g, { estAdmin: true })).toEqual(['confirmer_paiement', 'liberer', 'ignorer', 'ouvrir']);
  });

  test('commande à payer à la livraison, en main : aucun paiement en ligne à confirmer', () => {
    const g = groupe({
      etat: 'PRIS',
      prise: prise(true),
      aConfirmer: true,
      tete: ligne('o1', { channel: 'WEB', paiement_a_la_livraison: true }),
    });
    expect(actionsRelance(g, { estAdmin: false })).not.toContain('confirmer_paiement');
  });

  test('tête à payer à la livraison, autre panier en ligne signalé : bouton, et ce panier proposé', () => {
    const g = groupe({
      aConfirmer: true,
      tete: ligne('o1', { channel: 'WEB', paiement_a_la_livraison: true }),
      autres: [ligne('o2')],
      signale: signal('o2'),
    });
    expect(actionsRelance(g, { estAdmin: false })).toEqual(['prendre', 'confirmer_paiement', 'annuler', 'ouvrir']);
    expect(panierAConfirmerParDefaut(g)?.id).toBe('o2');
  });

  test('serveur plus ancien : signal absent, lu comme « aucun paiement signalé »', () => {
    const g = groupe();
    delete g.signaux.paiement_signale;
    expect(actionsRelance(g, { estAdmin: false })).toEqual(['prendre', 'ignorer', 'ouvrir']);
    expect(textePaiementSignale(g, maintenant)).toBeNull();
  });
});

describe('relance : paniers confirmables', () => {
  test('ni à payer à la livraison, ni annulés par le client ; la tête d’abord', () => {
    const g = groupe({
      tete: ligne('o1'),
      autres: [ligne('o2', { annulee_par_client: true }), ligne('o3', { paiement_a_la_livraison: true }), ligne('o4')],
    });
    expect(paniersAPayerEnLigne(g).map((b) => b.id)).toEqual(['o1', 'o4']);
  });

  test('panier proposé : celui du signal s’il est confirmable, sinon le premier', () => {
    const tete = ligne('o1');
    const autres = [ligne('o2'), ligne('o3', { annulee_par_client: true })];
    expect(panierAConfirmerParDefaut(groupe({ tete, autres }))?.id).toBe('o1');
    expect(panierAConfirmerParDefaut(groupe({ tete, autres, signale: signal('o2') }))?.id).toBe('o2');
    // Signal sur un panier annulé : on ne le propose pas.
    expect(panierAConfirmerParDefaut(groupe({ tete, autres, signale: signal('o3') }))?.id).toBe('o1');
    expect(
      panierAConfirmerParDefaut(groupe({ tete: ligne('o1', { paiement_a_la_livraison: true }) })),
    ).toBeNull();
  });
});

describe('relance : textes du paiement signalé', () => {
  test('pastille : heure, montant et moyen ; le panier cité s’il n’est pas la tête', () => {
    expect(textePaiementSignale(groupe({ signale: signal() }), maintenant)).toBe(
      `Paiement KKiaPay reçu à 14 h 32 : ${new Intl.NumberFormat('fr-FR').format(8780)} F par Mobile Money, non confirmé`,
    );
    const autre = groupe({ autres: [ligne('o2')], signale: signal('o2', { montant: null, moyen: 'NOUVEAU' }) });
    expect(textePaiementSignale(autre, maintenant)).toBe('Paiement KKiaPay reçu à 14 h 32 sur ORD-o2 par NOUVEAU, non confirmé');
  });

  test('notification : le motif est dit pour une commande, compté pour plusieurs', () => {
    expect(texteBandeau([groupe({ signale: signal() })], maintenant)).toContain('paiement KKiaPay reçu, non confirmé');
    const t = texteBandeau([groupe({ signale: signal() }), groupe({ tete: ligne('o2') })], maintenant);
    expect(t).toStartWith('2 commandes à relancer');
    expect(t).toContain('dont 1 paiement reçu non confirmé');
  });

  test('refus : le texte du serveur pour un 5xx, le message sinon', () => {
    const indisponible = Object.assign(new Error('Erreur temporaire du serveur. Réessayez plus tard.'), {
      status: 503,
      messageServeur: 'KKiaPay ne répond pas : réessayez dans un instant.',
    });
    expect(messageErreurConfirmation(indisponible)).toBe('KKiaPay ne répond pas : réessayez dans un instant.');
    const conflit = Object.assign(new Error('Cette transaction KKiaPay paie déjà la commande ORD-1.'), { status: 409 });
    expect(messageErreurConfirmation(conflit)).toBe('Cette transaction KKiaPay paie déjà la commande ORD-1.');
    expect(messageErreurConfirmation(Object.assign(new Error(''), { status: 500 }))).toBe('Confirmation impossible.');
  });
});
