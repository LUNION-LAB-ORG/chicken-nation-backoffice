// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { estRetraitComplementaire, etatRemise, remiseParCode, texteRemiseValidee } from '../remise-par-code';

// Même adresse d'API que les autres tests du dossier (`code-retrait.test.ts`) :
// bun garde les modules d'un fichier à l'autre, le client HTTP chargé par la
// fenêtre ne doit pas figer une autre adresse.
process.env.NEXT_PUBLIC_API_URL = 'http://api.test';
const { PickupValidationModal } = await import('../../components/PickupValidationModal');

/**
 * Relecture du 23/10 (constat « retrait complémentaire impossible depuis le
 * backoffice ») : course K récupérée (IN_DELIVERY), livreur encore au
 * comptoir. A est remise (PICKED_UP), C a été ajoutée après le retrait et elle
 * est prête (READY). Le serveur rend K pour le code et remet C à la
 * validation ; la fenêtre grisait le bouton en comptant A « pas prête ».
 */

function livraison(id, statutCommande, extra = {}) {
  return {
    id,
    course_id: 'k',
    sequence_order: 1,
    order_id: `o-${id}`,
    statut: 'PENDING',
    order: {
      id: `o-${id}`,
      reference: `CMD-${id.toUpperCase()}`,
      status: statutCommande,
      paied: true,
      payment_method: 'ONLINE',
      amount: 5000,
      net_amount: 5000,
      delivery_fee: 1000,
      address: { address: 'Cocody', latitude: 5.35, longitude: -3.99 },
      fullname: `Client ${id}`,
    },
    ...extra,
  };
}

function course(statut, deliveries) {
  return {
    id: 'k',
    reference: 'CRS-K',
    pickup_code: '123',
    statut,
    restaurant_id: 'r1',
    restaurant: { id: 'r1', name: 'Angré' },
    deliveries,
    refusal_count: 0,
    total_delivery_fee: 2000,
    created_at: '2026-10-23T12:00:00.000Z',
    updated_at: '2026-10-23T12:05:00.000Z',
  };
}

const K = course('IN_DELIVERY', [livraison('a', 'PICKED_UP'), livraison('c', 'READY', { ajoutee_apres_retrait: true })]);

describe('retrait complémentaire (course déjà récupérée, livreur au comptoir)', () => {
  test('la commande déjà remise ne bloque pas : C est à remettre, le bouton est actif', () => {
    const r = remiseParCode(K);
    expect(r.complementaire).toBe(true);
    expect(r.aRemettre).toBe(1);
    expect(r.pasPretes).toBe(0);
    expect(r.peutValider).toBe(true);
    expect(r.bilan).toBe('1 commande à remettre au livreur');
    expect(r.ton).toBe('vert');
    expect(r.bouton).toBe('Remettre au livreur');
  });

  test('chaque ligne dit ce que la caisse fait', () => {
    expect(etatRemise(K.deliveries[0], true)).toBe('DEJA_REMISE');
    expect(etatRemise(K.deliveries[1], true)).toBe('A_REMETTRE');
    expect(etatRemise(livraison('d', 'IN_PROGRESS'), true)).toBe('PAS_PRETE');
    expect(etatRemise(livraison('e', 'READY', { statut: 'CANCELLED' }), true)).toBe('TERMINEE');
  });

  test('une commande encore en cuisine ne bloque pas la remise des prêtes (le serveur les ignore)', () => {
    const r = remiseParCode(
      course('IN_DELIVERY', [livraison('a', 'PICKED_UP'), livraison('c', 'READY'), livraison('d', 'IN_PROGRESS')]),
    );
    expect(r.peutValider).toBe(true);
    expect(r.bilan).toBe('1 commande à remettre au livreur, 1 commande encore en cuisine');
  });

  test('rien de prêt : bouton grisé, le serveur répondrait « rien à remettre »', () => {
    const toutRemis = remiseParCode(course('IN_DELIVERY', [livraison('a', 'PICKED_UP'), livraison('b', 'PICKED_UP')]));
    expect(toutRemis.peutValider).toBe(false);
    expect(toutRemis.bilan).toBe('Tout est déjà remis au livreur');
    const enCuisine = remiseParCode(course('IN_DELIVERY', [livraison('a', 'PICKED_UP'), livraison('d', 'IN_PROGRESS')]));
    expect(enCuisine.peutValider).toBe(false);
    expect(enCuisine.ton).toBe('ambre');
    expect(enCuisine.bilan).toBe("Rien à remettre pour l'instant, 1 commande encore en cuisine");
  });
});

describe('retrait ordinaire : la règle du serveur ne change pas', () => {
  test('toutes prêtes : bouton actif', () => {
    const r = remiseParCode(course('AT_RESTAURANT', [livraison('a', 'READY'), livraison('b', 'READY')]));
    expect(r.complementaire).toBe(false);
    expect(r.peutValider).toBe(true);
    expect(r.bilan).toBe('Toutes les commandes sont prêtes');
    expect(r.bouton).toBe('Valider la récupération');
  });

  test('une seule pas prête : bouton grisé (le serveur refuserait)', () => {
    for (const statut of ['ACCEPTED', 'AT_RESTAURANT', 'PENDING_ASSIGNMENT']) {
      const r = remiseParCode(course(statut, [livraison('a', 'READY'), livraison('b', 'IN_PROGRESS')]));
      expect(r.peutValider).toBe(false);
      expect(r.bilan).toBe('1 commande pas encore prête');
    }
    const deux = remiseParCode(course('ACCEPTED', [livraison('a', 'IN_PROGRESS'), livraison('b', 'ACCEPTED')]));
    expect(deux.bilan).toBe('2 commandes pas encore prêtes');
  });

  test('hors retrait complémentaire, une commande déjà remise reste « pas prête » comme au serveur', () => {
    expect(estRetraitComplementaire({ statut: 'ACCEPTED' })).toBe(false);
    expect(etatRemise(livraison('a', 'PICKED_UP'), false)).toBe('PAS_PRETE');
  });

  test('message de réussite selon le cas', () => {
    expect(texteRemiseValidee({ statut: 'IN_DELIVERY' })).toBe('Commande remise : le livreur peut partir');
    expect(texteRemiseValidee({ statut: 'ACCEPTED' })).toBe('Course validée : le livreur peut partir en livraison');
    expect(texteRemiseValidee(undefined)).toBe('Course validée : le livreur peut partir en livraison');
  });
});

describe('la fenêtre affichée à la caissière', () => {
  const rendre = (c) =>
    renderToStaticMarkup(
      React.createElement(
        QueryClientProvider,
        { client: new QueryClient() },
        React.createElement(PickupValidationModal, { course: c, onClose: () => undefined }),
      ),
    );
  const boutonValider = (html) => {
    const boutons = html.match(/<button[^>]*>(?:(?!<\/button>).)*<\/button>/gs) ?? [];
    return boutons.find((b) => /Remettre au livreur|Valider la récupération/.test(b));
  };

  test('retrait complémentaire : bouton « Remettre au livreur » actif, A « Déjà remise », C « À remettre »', () => {
    const html = rendre(K);
    const bouton = boutonValider(html);
    expect(bouton).toBeDefined();
    expect(bouton).toContain('Remettre au livreur');
    expect(bouton).not.toMatch(/disabled=""/);
    expect(html).toContain('DÉJÀ REMISE');
    expect(html).toContain('À REMETTRE');
    expect(html).toContain('1 commande à remettre au livreur');
    expect(html).not.toContain('pas encore prête');
  });

  test('retrait ordinaire avec une commande en cuisine : bouton grisé', () => {
    const html = rendre(course('AT_RESTAURANT', [livraison('a', 'READY'), livraison('b', 'IN_PROGRESS')]));
    const bouton = boutonValider(html);
    expect(bouton).toContain('Valider la récupération');
    expect(bouton).toMatch(/disabled=""/);
    expect(html).toContain('1 commande pas encore prête');
  });

  test('aucun tiret cadratin dans la fenêtre', () => {
    expect(rendre(K)).not.toContain('—');
    expect(rendre(course('ACCEPTED', [livraison('a', 'SOMETHING')]))).not.toContain('—');
  });
});
