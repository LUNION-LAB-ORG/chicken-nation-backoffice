// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';
import { avertissementRepriseEnLigne, pastilleAnnulation, texteBandeau, textePaiementEnLigne } from '../relance';
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

/**
 * Revue du 19/10 : « Modifier ma commande », puis une nouvelle commande à
 * confirmer. Le serveur signale l'annulation de l'ancienne sur le groupe :
 * l'écran disait « Annulée par le client » en ambre à côté de « appeler pour
 * confirmer », et l'agent pouvait croire que le client avait renoncé.
 */
describe('relance : commande à confirmer après « Modifier ma commande »', () => {
  const annuleeA = new Date(2026, 9, 19, 14, 5).toISOString();
  const modifiee = (o = {}) => {
    const g = groupe(o);
    g.signaux.annulee_par_client = { le: annuleeA };
    return g;
  };
  const lisible = (t) => t.replace(/[\u00a0\u202f]/g, ' ');

  test('pastille : « Commande précédente annulée par le client », en gris', () => {
    expect(pastilleAnnulation(modifiee(), maintenant)).toEqual({
      texte: 'Commande précédente annulée par le client à 14 h 05',
      ton: 'gris',
    });
  });

  test('panier en ligne annulé par le client : pastille d’avant, en ambre', () => {
    expect(pastilleAnnulation(modifiee({ aConfirmer: false }), maintenant)).toEqual({
      texte: 'Annulée par le client à 14 h 05',
      ton: 'ambre',
    });
    expect(pastilleAnnulation(groupe(), maintenant)).toBeNull();
  });

  test('notification : la commande à confirmer n’est pas dite « annulée par le client »', () => {
    const un = lisible(texteBandeau([modifiee()], maintenant));
    expect(un).toContain('paiement à la livraison, appeler pour confirmer');
    expect(un).not.toContain('annulée');
    const plusieurs = lisible(texteBandeau([modifiee(), modifiee({ aConfirmer: false })], maintenant));
    expect(plusieurs).toContain('dont 1 à confirmer et 1 annulée par le client');
  });
});

/**
 * Revue du 19/10 : le client valide « Payer à la livraison », puis paie en
 * ligne un autre panier. Le serveur le signale sur la commande à confirmer
 * (`paiement_en_ligne_en_cours`) : l'écran le dit avant toute transmission.
 */
describe('relance : paiement en ligne en cours sur un autre panier du client', () => {
  const lisible = (t) => (t ?? '').replace(/[\u00a0\u202f]/g, ' ');
  const enLigne = (jusqua: number, o = {}) => {
    const g = groupe(o);
    g.signaux.paiement_en_ligne_en_cours = { reference: 'CN-o2', jusqua: new Date(jusqua).toISOString() };
    return g;
  };

  test('pastille, notification et boîte de reprise le disent tant que le délai court', () => {
    const g = enLigne(maintenant + 120_000);
    expect(lisible(textePaiementEnLigne(g, maintenant))).toBe(
      'Paiement en ligne en cours sur CN-o2 : vérifiez avec le client avant de transmettre',
    );
    expect(lisible(texteBandeau([g], maintenant))).toContain('appeler pour confirmer, paiement en ligne en cours');
    expect(lisible(avertissementRepriseEnLigne(g, maintenant))).toBe(
      'Un paiement en ligne est en cours sur CN-o2. Si le client le termine, ne transmettez pas cette commande : ' +
        'annulez-la avec la raison « Doublon ».',
    );
  });

  test('délai passé, panier en ligne, ou serveur plus ancien : rien', () => {
    expect(textePaiementEnLigne(enLigne(maintenant - 1), maintenant)).toBeNull();
    expect(avertissementRepriseEnLigne(enLigne(maintenant - 1), maintenant)).toBeNull();
    expect(textePaiementEnLigne(enLigne(maintenant + 120_000, { aConfirmer: false }), maintenant)).toBeNull();
    expect(textePaiementEnLigne(groupe(), maintenant)).toBeNull();
    expect(textePaiementEnLigne(ancien(groupe()), maintenant)).toBeNull();
  });
});

test('aucun tiret long dans les textes', () => {
  const textes = [
    texteBandeau([groupe()], maintenant),
    texteBandeau([groupe(), groupe({ aConfirmer: false, refuse: true })], maintenant),
  ];
  for (const t of textes) expect(t).not.toMatch(/[–—]/);
});
