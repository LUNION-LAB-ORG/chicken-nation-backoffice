/* eslint-disable @typescript-eslint/ban-ts-comment -- tests bun : leurs types ne sont pas installés dans le backoffice. */
// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { afterAll, beforeEach, describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { droitsLivraison } from '../../../livreurs/utils/droits-livraison';
import { Action, Modules } from '../../../users/types/auth.type';
import {
  LIBELLE_RELANCER_LIVRAISON,
  gestesSacARapporter,
  peutRelancerLivraison,
  texteLivraisonRelancee,
} from '../relance-livraison';

/**
 * « Relancer la livraison » d'une livraison annulée par le livreur (demande
 * du 28/10, contrat `relancer-livraison-contrat.md`, partie B). Le livreur a
 * touché « Annuler », la commande est restée en livraison, le sac est chez
 * lui. Le siège a trouvé une solution avec le client : la même livraison
 * repart avec le même livreur, sans passage au restaurant. « Sac rapporté »
 * reste à côté.
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

const { relancerLivraisonCommande } = await import('../../services/course.service');

const lire = (chemin) => readFileSync(join(import.meta.dir, chemin), 'utf8');

const COMMANDE = '7b0c2f1e-3a4d-4e5f-8a9b-0c1d2e3f4a5b';
const REPONSE = {
  order_id: COMMANDE,
  reference: 'ORD-123',
  course_id: 'c2',
  course_reference: 'CRS-281026-0012',
  nouvelle_course: true,
  rang: 1,
  demarree: true,
  livreur: { id: 'l1', prenom: 'Koffi' },
  appli_connectee: true,
  deja: false,
};

beforeEach(() => {
  appels.length = 0;
  reponse = { status: 200, corps: { ...REPONSE } };
});

describe('texte du toast', () => {
  test('réussite : « Livraison relancée : ORD-123 avec Koffi »', () => {
    expect(texteLivraisonRelancee(REPONSE)).toBe('Livraison relancée : ORD-123 avec Koffi');
  });

  test('rejeu (`deja: true`) : le même texte', () => {
    expect(texteLivraisonRelancee({ ...REPONSE, deja: true })).toBe('Livraison relancée : ORD-123 avec Koffi');
  });

  test('sans prénom : « Livraison relancée : ORD-123 »', () => {
    expect(texteLivraisonRelancee({ ...REPONSE, livreur: { id: 'l1', prenom: null } })).toBe(
      'Livraison relancée : ORD-123',
    );
    expect(texteLivraisonRelancee({ ...REPONSE, livreur: { id: 'l1', prenom: '  ' } })).toBe(
      'Livraison relancée : ORD-123',
    );
    expect(texteLivraisonRelancee({ ...REPONSE, livreur: null })).toBe('Livraison relancée : ORD-123');
  });

  test('appli du livreur pas connectée : « , par notification »', () => {
    expect(texteLivraisonRelancee({ ...REPONSE, appli_connectee: false })).toBe(
      'Livraison relancée : ORD-123 avec Koffi, par notification',
    );
    expect(texteLivraisonRelancee({ ...REPONSE, livreur: null, appli_connectee: false })).toBe(
      'Livraison relancée : ORD-123, par notification',
    );
  });

  test('connexion inconnue (`null`) : pas de suffixe', () => {
    expect(texteLivraisonRelancee({ ...REPONSE, appli_connectee: null })).toBe('Livraison relancée : ORD-123 avec Koffi');
  });

  test('référence absente de la réponse : celle de l’écran ; aucune : « Livraison relancée »', () => {
    expect(texteLivraisonRelancee({ ...REPONSE, reference: undefined }, 'ORD-9')).toBe(
      'Livraison relancée : ORD-9 avec Koffi',
    );
    expect(texteLivraisonRelancee(null, 'ORD-9')).toBe('Livraison relancée : ORD-9');
    expect(texteLivraisonRelancee(undefined, null)).toBe('Livraison relancée');
  });

  test('libellé du bouton : les mots d’avant', () => {
    expect(LIBELLE_RELANCER_LIVRAISON).toBe('Relancer la livraison');
  });

  test('aucun tiret cadratin', () => {
    const textes = [
      texteLivraisonRelancee(REPONSE),
      texteLivraisonRelancee({ ...REPONSE, appli_connectee: false }),
      texteLivraisonRelancee(null, null),
      LIBELLE_RELANCER_LIVRAISON,
    ];
    for (const t of textes) expect(t).not.toContain('—');
    for (const fichier of [
      '../relance-livraison.ts',
      '../../queries/relance-livraison.mutation.ts',
      '../../components/ATraiter.tsx',
    ]) {
      expect(lire(fichier)).not.toContain('—');
    }
    // Fichiers plus anciens (un tiret d'avant, laissé tel quel) : les lignes du geste.
    for (const fichier of [
      '../../services/course.service.ts',
      '../../../operations/components/drawer/DrawerActionsChickenNation.tsx',
    ]) {
      const lignes = lire(fichier)
        .split('\n')
        .filter((l) => /relanceLivraison|relancerLivraison|RELANCER_LIVRAISON|relancer la livraison|relance la livraison|envoiRelance/i.test(l));
      expect(lignes.length).toBeGreaterThan(0);
      for (const l of lignes) expect(l).not.toContain('—');
    }
  });
});

// Droits des rôles : ceux de `permissionsByRole.ts` du serveur ; `can` reprend
// la règle de `authStore.can` (ALL, exclusions, puis le module).
const TOUT = Object.values(Action);
const canPour = (permissions) => (module, action) => {
  if (permissions.modules[Modules.ALL]?.includes(action)) return true;
  return permissions.modules[module]?.includes(action) ?? false;
};
const COMMANDES_CAISSE = { [Modules.COMMANDES]: [Action.READ, Action.UPDATE, Action.UPDATE_FULL] };
const ROLES = {
  ADMIN: { modules: { [Modules.ALL]: TOUT } },
  CALL_CENTER: {
    modules: {
      [Modules.COMMANDES]: [Action.CREATE, Action.READ, Action.UPDATE, Action.UPDATE_FULL, Action.PRINT],
      [Modules.LIVREURS]: [Action.READ],
      [Modules.PLANNING]: [Action.READ, Action.CREATE, Action.UPDATE, Action.DELETE],
    },
  },
  MANAGER: {
    modules: { ...COMMANDES_CAISSE, [Modules.PLANNING]: [Action.READ, Action.CREATE, Action.UPDATE, Action.DELETE] },
  },
  ASSISTANT_MANAGER: {
    modules: { ...COMMANDES_CAISSE, [Modules.PLANNING]: [Action.READ, Action.CREATE, Action.UPDATE, Action.DELETE] },
  },
  CAISSIER: { modules: COMMANDES_CAISSE },
  LIVRAISON_OPS: {
    modules: {
      [Modules.COMMANDES]: [Action.READ],
      [Modules.LIVREURS]: [Action.READ],
      [Modules.PLANNING]: [Action.READ],
    },
  },
  MARKETING: { modules: { [Modules.CLIENTS]: [Action.READ], [Modules.PROMOTIONS]: TOUT } },
};
const TYPES = { ADMIN: 'BACKOFFICE', CALL_CENTER: 'BACKOFFICE', LIVRAISON_OPS: 'BACKOFFICE', MARKETING: 'BACKOFFICE' };
const peutPour = (role) =>
  peutRelancerLivraison(
    droitsLivraison({ can: canPour(ROLES[role]), membre: { role, type: TYPES[role] ?? 'RESTAURANT', restaurant_id: null } }),
  );

describe('qui touche « Relancer la livraison » : miroir de ROLES_ACTIONS_COURSES', () => {
  test('ADMIN et CALL_CENTER', () => {
    expect(peutPour('ADMIN')).toBe(true);
    expect(peutPour('CALL_CENTER')).toBe(true);
  });

  test('ni le restaurant, ni le suivi des livraisons, ni le marketing', () => {
    for (const role of ['MANAGER', 'ASSISTANT_MANAGER', 'CAISSIER', 'LIVRAISON_OPS', 'MARKETING']) {
      expect(peutPour(role)).toBe(false);
    }
  });

  test('sans droits : jamais', () => {
    expect(peutRelancerLivraison(null)).toBe(false);
    expect(peutRelancerLivraison(undefined)).toBe(false);
    expect(peutRelancerLivraison({ piloterCourses: false })).toBe(false);
  });
});

describe('disposition du tiroir', () => {
  test('les deux (ADMIN) : deux colonnes, Relancer à gauche', () => {
    expect(gestesSacARapporter(true, true)).toEqual({
      gestes: ['RELANCER_LIVRAISON', 'SAC_RAPPORTE'],
      deuxColonnes: true,
    });
  });

  test('un seul : pleine largeur (centre d’appels : Relancer ; restaurant : Sac rapporté)', () => {
    expect(gestesSacARapporter(true, false)).toEqual({ gestes: ['RELANCER_LIVRAISON'], deuxColonnes: false });
    expect(gestesSacARapporter(false, true)).toEqual({ gestes: ['SAC_RAPPORTE'], deuxColonnes: false });
  });

  test('aucun : rien', () => {
    expect(gestesSacARapporter(false, false)).toEqual({ gestes: [], deuxColonnes: false });
  });
});

describe('POST /courses/commandes/:orderId/relancer-livraison', () => {
  test('adresse et corps vide', async () => {
    const r = await relancerLivraisonCommande(COMMANDE);
    expect(appels).toEqual([
      {
        url: `http://api.test/api/v1/courses/commandes/${COMMANDE}/relancer-livraison`,
        methode: 'POST',
        corps: {},
      },
    ]);
    expect(r.reference).toBe('ORD-123');
    expect(r.livreur.prenom).toBe('Koffi');
    expect(r.deja).toBe(false);
  });

  test('rejeu : 200 `deja: true`, sans erreur', async () => {
    reponse = { status: 200, corps: { ...REPONSE, deja: true } };
    const r = await relancerLivraisonCommande(COMMANDE);
    expect(r.deja).toBe(true);
  });

  test('refus du serveur : son texte, tel quel', async () => {
    const refus = [
      [404, 'Commande introuvable.'],
      [409, 'Commande annulée.'],
      [409, 'Sac déjà rapporté.'],
      [409, 'Aucune livraison annulée sur cette commande.'],
      [409, 'Ce livreur va au restaurant pour une autre course : Sac rapporté à son arrivée.'],
      [409, "Ce livreur est en pause jusqu'à 14 h 32."],
      [409, "Ce livreur est hors service : il n'a pas repris le travail dans l'appli."],
      [409, 'Ce livreur est injoignable : ni appli connectée, ni notifications.'],
      [409, 'Ce livreur a déjà une offre en attente de réponse.'],
    ];
    for (const [status, message] of refus) {
      reponse = { status, corps: { statusCode: status, message, error: 'x' } };
      const erreur = await relancerLivraisonCommande(COMMANDE).catch((e) => e);
      expect(erreur.message).toBe(message);
      expect(erreur.status).toBe(status);
    }
  });

  test('403 de la garde des rôles : un texte lisible, jamais « Forbidden resource »', async () => {
    reponse = { status: 403, corps: { statusCode: 403, message: 'Forbidden resource', error: 'Forbidden' } };
    const erreur = await relancerLivraisonCommande(COMMANDE).catch((e) => e);
    expect(erreur.message).not.toContain('Forbidden');
    expect(erreur.status).toBe(403);
  });
});

describe('écrans', () => {
  test('tiroir : Relancer à côté de Sac rapporté, contour orange, aucune fenêtre de confirmation', () => {
    const tiroir = lire('../../../operations/components/drawer/DrawerActionsChickenNation.tsx');
    expect(tiroir).toContain('useRelanceLivraisonMutation()');
    expect(tiroir).toContain('peutRelancerLivraison(droitsLivraison)');
    expect(tiroir).toContain('gestesSacARapporter(');
    expect(tiroir).toContain('grid grid-cols-2 gap-2');
    expect(tiroir).toContain('border border-[#F17922]');
    expect(tiroir).toContain('text-[#F17922]');
    expect(tiroir).toContain('<RotateCw');
    expect(tiroir).toContain('LIBELLE_RELANCER_LIVRAISON');
    // « Sac rapporté » inchangé, un seul envoi à la fois.
    expect(tiroir).toContain('peutRapporterSac(peutChangerStatut, membre)');
    expect(tiroir).toContain('<Undo2');
    expect(tiroir).toContain('const envoiGeste = envoiSac || envoiRelance;');
    expect(tiroir).not.toMatch(/\bconfirm\(/);
  });

  test('« À traiter » : le bouton sur la ligne d’une seule commande, à gauche de « Sac rapporté »', () => {
    const ligne = lire('../../components/ATraiter.tsx');
    expect(ligne).toContain('const relanceId = peutRelancer ? relanceLivraisonDuSignal(s) : null;');
    expect(ligne).toContain('title={LIBELLE_RELANCER_LIVRAISON}');
    expect(ligne).toContain('aria-label={LIBELLE_RELANCER_LIVRAISON}');
    expect(ligne).toContain('<span className="hidden @xl:inline">{LIBELLE_RELANCER_LIVRAISON}</span>');
    expect(ligne.indexOf('{relanceId && (')).toBeGreaterThan(-1);
    expect(ligne.indexOf('{relanceId && (')).toBeLessThan(ligne.indexOf('{sacId && ('));
    // Le geste ne doit pas ouvrir la commande (clic de la ligne).
    expect(ligne).toMatch(/\{relanceId && \([\s\S]*?e\.stopPropagation\(\);[\s\S]*?relancerCommande\(/);
    expect(ligne).not.toMatch(/\bconfirm\(/);
  });

  test('après le geste : Opérations, commande, courses et tableau de la livraison relus', () => {
    const mutation = lire('../../queries/relance-livraison.mutation.ts');
    expect(mutation).toContain('useInvalidateOperationsQuery');
    expect(mutation).toContain('TABLEAU_LIVRAISON_CLE');
    expect(mutation).toContain('texteLivraisonRelancee(');
    expect(mutation).toContain('toast.error(e.message)');
  });

  test('le commentaire de `actionsATraiter` ne dit plus que la relance ne la prend pas', () => {
    expect(lire('../tableau-livraison.ts')).not.toContain('ne la prend pas');
  });
});
