// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';
import { aLHeure, texteBandeau } from '../relance';

/** Panier annulé par le client, relançable : textes lus par l'agent. */

const groupe = (annulee: string | null, refuse = false) => ({
  cle: 'o1',
  etat: 'A_RELANCER',
  tete: {
    id: 'o1',
    reference: 'CN-1',
    created_at: new Date(2026, 9, 1, 14, 0).toISOString(),
    client_nom: 'Awa',
    telephone: null,
    restaurant: { id: 'r1', name: 'Zone 4' },
    type: 'DELIVERY',
    amount: 5000,
    paiement_refuse: refuse,
    annulee_par_client: !!annulee,
  },
  autres: [],
  alerte_le: null,
  prise: null,
  signaux: {
    paiement_refuse: refuse,
    commande_recente: null,
    annulee_par_client: annulee ? { le: annulee } : null,
  },
  crm: null,
});

describe('relance : panier annulé par le client', () => {
  const maintenant = new Date(2026, 9, 1, 14, 10).getTime();

  test('heure de l’annulation : jour même, veille, plus ancien', () => {
    expect(aLHeure(new Date(2026, 9, 1, 14, 2).toISOString(), maintenant)).toBe('à 14 h 02');
    expect(aLHeure(new Date(2026, 8, 30, 21, 5).toISOString(), maintenant)).toBe('hier à 21 h 05');
    expect(aLHeure(new Date(2026, 8, 29, 9, 40).toISOString(), maintenant)).toBe('le 29/09 à 9 h 40');
    expect(aLHeure('pas une date', maintenant)).toBe('');
  });

  test('l’alerte porte le motif « annulée par le client »', () => {
    const un = texteBandeau([groupe(new Date(2026, 9, 1, 14, 2).toISOString())], maintenant);
    expect(un).toContain('annulée par le client');
    const deux = texteBandeau(
      [groupe(new Date(2026, 9, 1, 14, 2).toISOString()), groupe(null, true)],
      maintenant,
    );
    expect(deux).toContain('dont 1 paiement refusé et 1 annulée par le client');
  });

  test('serveur plus ancien (signal absent) : aucun motif', () => {
    const g = groupe(null);
    delete g.signaux.annulee_par_client;
    expect(texteBandeau([g], maintenant)).not.toContain('annulée');
  });

  test('aucun tiret long dans les textes', () => {
    const textes = [
      texteBandeau([groupe(new Date(2026, 9, 1, 14, 2).toISOString(), true)], maintenant),
      aLHeure(new Date(2026, 8, 29, 9, 40).toISOString(), maintenant),
    ];
    for (const t of textes) expect(t).not.toMatch(/[–—]/);
  });
});
