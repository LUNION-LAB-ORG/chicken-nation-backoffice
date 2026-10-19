// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';
import { texteBandeau } from '../relance';
import { actionsRelance, repriseALaLivraison } from '../relance-actions';

/** Commande du site à payer à la livraison : textes et boutons de « À relancer ». */

const maintenant = new Date(2026, 9, 19, 14, 10).getTime();

const ligne = (id: string, extra = {}) => ({
  id,
  reference: `CN-${id}`,
  created_at: new Date(2026, 9, 19, 14, 9).toISOString(),
  client_nom: 'Awa',
  telephone: null,
  restaurant: { id: 'r1', name: 'Zone 4' },
  type: 'DELIVERY',
  amount: 5000,
  paiement_refuse: false,
  annulee_par_client: false,
  channel: 'WEB',
  ...extra,
});

const groupe = ({ aConfirmer = true, etat = 'A_RELANCER', prise = null, refuse = false } = {}) => ({
  cle: 'o1',
  etat,
  tete: ligne('o1', { paiement_a_la_livraison: aConfirmer }),
  autres: [],
  alerte_le: null,
  prise,
  signaux: { paiement_refuse: refuse, commande_recente: null, annulee_par_client: null, commande_suivante: null },
  crm: null,
  a_confirmer: aConfirmer,
});

const prise = (parMoi: boolean) => ({
  par: { id: parMoi ? 'moi' : 'koffi', fullname: parMoi ? 'Moi' : 'Koffi Yao' },
  le: new Date(maintenant).toISOString(),
  expire_le: new Date(maintenant + 600_000).toISOString(),
  par_moi: parMoi,
});

/** Serveur d'avant le paiement à la livraison : aucun des nouveaux champs. */
const ancien = (g) => {
  const copie = structuredClone(g);
  delete copie.a_confirmer;
  delete copie.signaux.commande_suivante;
  delete copie.tete.paiement_a_la_livraison;
  return copie;
};

describe('relance : commande à confirmer, texte de la notification', () => {
  test('une seule commande : le motif dit d’appeler pour confirmer', () => {
    const t = texteBandeau([groupe()], maintenant);
    expect(t).toStartWith('1 commande à relancer : Awa');
    expect(t).toContain('paiement à la livraison, appeler pour confirmer');
  });

  test('plusieurs commandes : « dont n à confirmer », avec les autres motifs', () => {
    const t = texteBandeau(
      [groupe(), groupe(), groupe({ aConfirmer: false, refuse: true })],
      maintenant,
    );
    expect(t).toStartWith('3 commandes à relancer');
    expect(t).toContain('dont 2 à confirmer et 1 paiement refusé');
  });

  test('un panier en ligne seul : aucun motif de livraison (inchangé)', () => {
    const t = texteBandeau([groupe({ aConfirmer: false })], maintenant);
    expect(t).not.toContain('livraison');
    expect(t).not.toContain('confirmer');
  });

  test('une commande prise ne compte pas dans la notification', () => {
    expect(texteBandeau([groupe({ etat: 'PRIS', prise: prise(true) })], maintenant)).toBe('');
  });

  test('serveur plus ancien : ni motif ni compte « à confirmer »', () => {
    const un = texteBandeau([ancien(groupe())], maintenant);
    expect(un).not.toContain('confirmer');
    const deux = texteBandeau([ancien(groupe()), ancien(groupe())], maintenant);
    expect(deux).toBe('2 commandes à relancer, la plus ancienne depuis 1 min');
  });
});

describe('relance : boutons d’une commande à confirmer', () => {
  test('à relancer : jamais « Ignorer », « Annuler la commande » à sa place', () => {
    const a = actionsRelance(groupe(), { estAdmin: false });
    expect(a).toEqual(['prendre', 'annuler', 'ouvrir']);
    expect(a).not.toContain('ignorer');
  });

  test('prise par moi : reprendre, libérer, annuler', () => {
    expect(actionsRelance(groupe({ etat: 'PRIS', prise: prise(true) }), { estAdmin: false })).toEqual([
      'reprendre',
      'liberer',
      'annuler',
      'ouvrir',
    ]);
  });

  test('prise d’un collègue : rien pour l’agent, libérer et annuler pour l’ADMIN', () => {
    const g = groupe({ etat: 'PRIS', prise: prise(false) });
    expect(actionsRelance(g, { estAdmin: false })).toEqual(['ouvrir']);
    expect(actionsRelance(g, { estAdmin: true })).toEqual(['liberer', 'annuler', 'ouvrir']);
  });

  test('panier en ligne : boutons d’avant, « Ignorer » et jamais « Annuler »', () => {
    const en = (o) => actionsRelance(groupe({ aConfirmer: false, ...o }), { estAdmin: false });
    expect(en({})).toEqual(['prendre', 'ignorer', 'ouvrir']);
    expect(en({ etat: 'PRIS', prise: prise(true) })).toEqual(['reprendre', 'liberer', 'ignorer', 'ouvrir']);
    expect(en({ etat: 'PRIS', prise: prise(false) })).toEqual(['ouvrir']);
    expect(en({ etat: 'EN_COURS' })).toEqual(['ignorer', 'ouvrir']);
    expect(
      actionsRelance(groupe({ aConfirmer: false, etat: 'PRIS', prise: prise(false) }), { estAdmin: true }),
    ).toEqual(['liberer', 'ignorer', 'ouvrir']);
  });

  test('serveur plus ancien : lu comme un panier en ligne', () => {
    expect(actionsRelance(ancien(groupe()), { estAdmin: false })).toEqual(['prendre', 'ignorer', 'ouvrir']);
  });
});

describe('relance : reprise d’une commande à payer à la livraison', () => {
  test('à confirmer, ou annulée par le client : on confirme la commande', () => {
    expect(repriseALaLivraison(groupe())).toBe(true);
    // Annulée par le client : plus « à confirmer », toujours à la livraison.
    const annulee = groupe({ aConfirmer: false });
    annulee.tete = ligne('o1', { paiement_a_la_livraison: true, annulee_par_client: true });
    expect(repriseALaLivraison(annulee)).toBe(true);
  });

  test('panier en ligne, ou serveur plus ancien : la question du débit reste', () => {
    expect(repriseALaLivraison(groupe({ aConfirmer: false }))).toBe(false);
    expect(repriseALaLivraison(ancien(groupe()))).toBe(false);
  });
});

test('aucun tiret long dans les textes', () => {
  const textes = [
    texteBandeau([groupe()], maintenant),
    texteBandeau([groupe(), groupe({ aConfirmer: false, refuse: true })], maintenant),
  ];
  for (const t of textes) expect(t).not.toMatch(/[–—]/);
});
