/* eslint-disable @typescript-eslint/ban-ts-comment -- tests bun : leurs types ne sont pas installés dans le backoffice. */
// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { afterAll, beforeEach, describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  LIBELLE_SAC_RAPPORTE,
  peutRapporterSac,
  sacARapporter,
  texteSacARapporter,
  texteSacRapporte,
} from '../sac-a-rapporter';

/**
 * « Sac rapporté » (demande du 28/10, contrat `sac-rapporte-contrat.md`,
 * partie C) : une commande dont la livraison a été annulée par le livreur
 * reste en livraison, le sac est chez lui. Quand il le rapporte, le
 * restaurant (ou l'admin) touche « Sac rapporté » : la commande redevient
 * prête et repart dans une nouvelle course.
 *
 * Le client HTTP est le VRAI (`src/services/api.ts`) : seul `fetch` est
 * factice. On lit donc l'adresse et le corps qui partent vraiment, et
 * l'erreur telle que l'écran la reçoit.
 */

process.env.NEXT_PUBLIC_API_URL = 'http://api.test';

const appels = [];
let reponse = { status: 200, corps: {} };
const fetchDOrigine = globalThis.fetch;
globalThis.fetch = async (url, options = {}) => {
  appels.push({
    url: String(url),
    methode: options.method,
    corps: typeof options.body === 'string' ? JSON.parse(options.body) : undefined,
  });
  const texte = typeof reponse.corps === 'string' ? reponse.corps : JSON.stringify(reponse.corps);
  return new Response(texte, { status: reponse.status });
};
// Le journal de `apiRequest` (jeton absent hors navigateur) n'a rien à faire ici.
const consoleDOrigine = { log: console.log, warn: console.warn, error: console.error };
console.log = () => {};
console.warn = () => {};
console.error = () => {};

afterAll(() => {
  globalThis.fetch = fetchDOrigine;
  Object.assign(console, consoleDOrigine);
});

const { sacRapporte } = await import('../../services/operations-service');

const lire = (chemin) => readFileSync(join(import.meta.dir, chemin), 'utf8');

const COMMANDE = '7b0c2f1e-3a4d-4e5f-8a9b-0c1d2e3f4a5b';
const SAC = {
  livreur: { id: 'l1', prenom: 'Koffi', nom: 'Kouassi' },
  depuis: '2026-10-28T12:41:00.000Z',
  motif: 'CLIENT_ABSENT',
};

beforeEach(() => {
  appels.length = 0;
  reponse = {
    status: 200,
    corps: { order_id: COMMANDE, reference: 'ORD-123', status: 'READY', livreur: { id: 'l1', prenom: 'Koffi' }, deja: false },
  };
});

describe('sac à rapporter : champ `sac_a_rapporter` de `operations/active`', () => {
  test('rempli : livreur, depuis, motif', () => {
    expect(sacARapporter({ id: 'o1', sac_a_rapporter: SAC })).toEqual(SAC);
  });

  test('null (serveur à jour, pas de sac) : rien', () => {
    expect(sacARapporter({ id: 'o1', sac_a_rapporter: null })).toBeNull();
  });

  test('absent (serveur ancien) : rien, le geste est caché', () => {
    expect(sacARapporter({ id: 'o1' })).toBeNull();
    expect(sacARapporter(null)).toBeNull();
    expect(sacARapporter(undefined)).toBeNull();
  });

  test('forme inattendue : lue sans rien inventer', () => {
    expect(sacARapporter({ sac_a_rapporter: 'oui' })).toBeNull();
    expect(sacARapporter({ sac_a_rapporter: {} })).toEqual({ livreur: null, depuis: null, motif: null });
    expect(sacARapporter({ sac_a_rapporter: { livreur: { prenom: 'Koffi' } } }).livreur).toBeNull();
    expect(sacARapporter({ sac_a_rapporter: { livreur: { id: 'l1' } } }).livreur).toEqual({ id: 'l1', prenom: null, nom: null });
  });
});

describe('textes du tiroir', () => {
  test('avec le prénom : « Sac à rapporter par Koffi »', () => {
    expect(texteSacARapporter(SAC)).toBe('Sac à rapporter par Koffi');
    expect(texteSacARapporter({ ...SAC, livreur: { ...SAC.livreur, prenom: '  Koffi ' } })).toBe('Sac à rapporter par Koffi');
  });

  test('sans prénom : « Sac à rapporter »', () => {
    expect(texteSacARapporter({ ...SAC, livreur: null })).toBe('Sac à rapporter');
    expect(texteSacARapporter({ ...SAC, livreur: { id: 'l1', prenom: null, nom: 'Kouassi' } })).toBe('Sac à rapporter');
    expect(texteSacARapporter({ ...SAC, livreur: { id: 'l1', prenom: '  ', nom: null } })).toBe('Sac à rapporter');
  });

  test('bouton et toast, mêmes mots que la caisse', () => {
    expect(LIBELLE_SAC_RAPPORTE).toBe('Sac rapporté');
    expect(texteSacRapporte('ORD-123')).toBe('Sac rapporté : ORD-123 de nouveau prête');
    expect(texteSacRapporte(null)).toBe('Sac rapporté');
  });

  test('aucun tiret cadratin', () => {
    const textes = [
      texteSacARapporter(SAC),
      texteSacARapporter({ ...SAC, livreur: null }),
      texteSacRapporte('ORD-123'),
      LIBELLE_SAC_RAPPORTE,
    ];
    for (const t of textes) expect(t).not.toContain('—');
    for (const fichier of ['../sac-a-rapporter.ts', '../../queries/sac-rapporte.mutation.ts']) {
      expect(lire(fichier)).not.toContain('—');
    }
  });
});

describe('qui touche « Sac rapporté » : miroir du serveur', () => {
  test('ADMIN, MANAGER, ASSISTANT_MANAGER, CAISSIER', () => {
    for (const role of ['ADMIN', 'MANAGER', 'ASSISTANT_MANAGER', 'CAISSIER']) {
      expect(peutRapporterSac(true, { role })).toBe(true);
    }
  });

  test('ni le centre d’appels, ni le suivi des livraisons, ni le marketing, ni la cuisine', () => {
    for (const role of ['CALL_CENTER', 'LIVRAISON_OPS', 'MARKETING', 'CUISINE', undefined]) {
      expect(peutRapporterSac(true, { role })).toBe(false);
    }
    expect(peutRapporterSac(true, null)).toBe(false);
  });

  test('sans le droit de changer le statut : jamais', () => {
    expect(peutRapporterSac(false, { role: 'ADMIN' })).toBe(false);
    expect(peutRapporterSac(false, { role: 'CAISSIER' })).toBe(false);
  });
});

describe('POST /courses/operations/commandes/:orderId/sac-rapporte', () => {
  test('adresse et corps vide', async () => {
    const r = await sacRapporte(COMMANDE);
    expect(appels).toEqual([
      {
        url: `http://api.test/api/v1/courses/operations/commandes/${COMMANDE}/sac-rapporte`,
        methode: 'POST',
        corps: {},
      },
    ]);
    expect(r.reference).toBe('ORD-123');
    expect(r.status).toBe('READY');
    expect(r.deja).toBe(false);
  });

  test('rejeu : 200 `deja: true`, sans erreur', async () => {
    reponse = { status: 200, corps: { ...reponse.corps, deja: true } };
    const r = await sacRapporte(COMMANDE);
    expect(r.deja).toBe(true);
  });

  test('refus du serveur : son texte, tel quel', async () => {
    const refus = [
      [404, 'Commande introuvable.'],
      [403, "Cette commande n'est pas celle de votre restaurant."],
      [409, 'Commande annulée.'],
      [409, 'Pas de sac à rapporter pour cette commande.'],
    ];
    for (const [status, message] of refus) {
      reponse = { status, corps: { statusCode: status, message, error: 'x' } };
      const erreur = await sacRapporte(COMMANDE).catch((e) => e);
      expect(erreur.message).toBe(message);
      expect(erreur.status).toBe(status);
    }
  });
});

describe('écrans', () => {
  test('tiroir : encadré rouge, bouton pour les rôles admis, aucune fenêtre de confirmation', () => {
    const tiroir = lire('../../components/drawer/DrawerActionsChickenNation.tsx');
    expect(tiroir).toContain('sacARapporter(');
    expect(tiroir).toContain('texteSacARapporter(sac)');
    expect(tiroir).toContain('peutRapporterSac(peutChangerStatut, membre)');
    expect(tiroir).toContain('rounded-xl border border-red-200 bg-red-50');
    expect(tiroir).toContain('<PackageX');
    expect(tiroir).toContain('<Undo2');
    expect(tiroir).not.toMatch(/\bconfirm\(/);
  });

  test('« À traiter » : le bouton sur la ligne d’une seule commande, pour les rôles admis', () => {
    const ligne = lire('../../../courses/components/ATraiter.tsx');
    expect(ligne).toContain('const sacId = peutRapporter ? sacRapporteDuSignal(s) : null;');
    expect(ligne).toContain('<Undo2');
    expect(ligne).not.toMatch(/\bconfirm\(/);
  });
});
