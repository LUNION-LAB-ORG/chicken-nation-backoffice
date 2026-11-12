/* eslint-disable @typescript-eslint/ban-ts-comment -- tests bun : leurs types ne sont pas installés dans le backoffice. */
// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { afterAll, describe, expect, test } from 'bun:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/** La fenêtre « Rembourser un paiement » dans ses cas, avec une vérification toute prête. */
const consoleDOrigine = { log: console.log, warn: console.warn, error: console.error };
console.log = () => {};
console.warn = () => {};
afterAll(() => Object.assign(console, consoleDOrigine));

const { cleVerification } = await import('../../../queries/remboursement.query');
const { FenetreRemboursement, RembourserPaiement } = await import('../RembourserPaiement');

const verification = (p = {}) => ({
  paiement: { id: 'p-1', reference: '459100796371', montant: 6060, frais: 116, total: 6176, moyen: 'wave', date: '2026-11-12T00:13:00Z', statut: 'SUCCESS', rembourse_at: null, rembourse_par: null },
  commande: { id: 'o-1', reference: 'ORD-261111-55490' },
  kkiapay: { statut: 'SUCCESS', libelle: 'Payée', montant: 6060, frais: 116, moyen: 'Wave', date: '2026-11-12T00:13:00Z' },
  compte: 'Compte du restaurant Angré',
  remboursable: true,
  constatable: false,
  raison: null,
  ...p,
});

const rendre = (v) => {
  const c = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  if (v) c.setQueryData(cleVerification('p-1'), v);
  return renderToStaticMarkup(
    React.createElement(QueryClientProvider, { client: c }, React.createElement(FenetreRemboursement, { paiementId: 'p-1', onFermer: () => {} })),
  );
};

describe('fenêtre de remboursement', () => {
  test('pendant la vérification : on attend KKiaPay', () => {
    expect(rendre(null)).toContain('Vérification auprès de KKiaPay');
  });

  test('payée chez KKiaPay : la fiche, l’avertissement et « Rembourser 6.060 F »', () => {
    const html = rendre(verification());
    for (const mot of ['#459100796371', 'Payée', '6.060 F', '116 F', 'Wave', 'Compte du restaurant Angré', 'Le client récupère', 'Rembourser 6.060 F', 'Annuler']) {
      expect(html).toContain(mot);
    }
    expect(html).not.toContain('Enregistrer le remboursement');
  });

  test('déjà remboursée chez KKiaPay : on propose de l’enregistrer', () => {
    const html = rendre(
      verification({
        kkiapay: { statut: 'REVERTED', libelle: 'Remboursée', montant: 6060, frais: 0, moyen: 'Wave', date: null },
        remboursable: false,
        constatable: true,
        raison: 'KKiaPay indique que cette transaction est déjà remboursée. Enregistrez-le ici pour que la commande le dise.',
      }),
    );
    expect(html).toContain('Remboursée');
    expect(html).toContain('Enregistrer le remboursement');
    expect(html).not.toContain('Rembourser 6.060 F');
  });

  test('pas remboursable : la raison, et seulement « Fermer »', () => {
    const html = rendre(
      verification({ remboursable: false, raison: 'Le montant chez KKiaPay (9 000 F) ne correspond pas à ce paiement (6 060 F). Remboursement bloqué par prudence.' }),
    );
    expect(html).toContain('Remboursement bloqué par prudence');
    expect(html).toContain('Fermer');
    expect(html).not.toContain('Rembourser 6.060 F');
    expect(html).not.toContain('Enregistrer le remboursement');
  });

  test('le bouton de la ligne ne vérifie rien tant qu’on ne clique pas', () => {
    const c = new QueryClient();
    const html = renderToStaticMarkup(React.createElement(QueryClientProvider, { client: c }, React.createElement(RembourserPaiement, { paiementId: 'p-1' })));
    expect(html).toContain('Rembourser');
    expect(html).not.toContain('Vérification auprès de KKiaPay');
  });

  test('aucun tiret cadratin', () => {
    expect(rendre(verification()) + rendre(verification({ remboursable: false, constatable: true, raison: 'x' }))).not.toMatch(/[—–]/);
  });
});
