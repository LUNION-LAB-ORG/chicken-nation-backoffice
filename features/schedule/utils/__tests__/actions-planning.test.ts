// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';

import { Action, Modules } from '../../../users/types/auth.type';
import { droitsLivraison } from '../../../livreurs/utils/droits-livraison';
import {
  AUCUNE_ACTION,
  GESTE_PRINCIPAL,
  LIBELLE_GESTE,
  MESSAGE_GESTE,
  actionsPlanning,
  suiteGeste,
  textesFenetres,
} from '../actions-planning';

/**
 * Gestes sur un planning selon l'état et le rôle (conception du 24/10,
 * 10.3). Les droits de chaque rôle sont ceux de `permissionsByRole.ts` du
 * serveur (branche be-planning) ; `can` reprend la règle de `authStore.can`.
 */

const ANGRE = '0b8f3a52-6a51-4d0e-9b0e-2b6f0f7a1a01';
const MARCORY = '7c1d2e3f-4a5b-4c6d-8e7f-901a2b3c4d02';
const ETATS = ['DRAFT', 'SENT', 'CONFIRMED', 'ARCHIVED'];

function canPour(permissions) {
  return (module, action) => {
    if (permissions.modules[Modules.ALL]?.includes(action)) return true;
    return permissions.modules[module]?.includes(action) ?? false;
  };
}

const COMPTES = {
  ADMIN: {
    permissions: { modules: { [Modules.ALL]: Object.values(Action) } },
    membre: { role: 'ADMIN', type: 'BACKOFFICE', restaurant_id: null },
  },
  LIVRAISON_OPS: {
    permissions: {
      modules: {
        [Modules.COMMANDES]: [Action.READ],
        [Modules.LIVREURS]: [Action.READ],
        [Modules.PLANNING]: [Action.READ],
      },
    },
    membre: { role: 'LIVRAISON_OPS', type: 'BACKOFFICE', restaurant_id: null },
  },
  MANAGER_ANGRE: {
    permissions: {
      modules: {
        [Modules.COMMANDES]: [Action.READ, Action.UPDATE, Action.UPDATE_FULL],
        [Modules.PLANNING]: [Action.READ, Action.CREATE, Action.UPDATE, Action.DELETE],
      },
    },
    membre: { role: 'MANAGER', type: 'RESTAURANT', restaurant_id: ANGRE },
  },
  ASSISTANT_ANGRE: {
    permissions: {
      modules: {
        [Modules.COMMANDES]: [Action.READ, Action.UPDATE, Action.UPDATE_FULL],
        [Modules.PLANNING]: [Action.READ, Action.CREATE, Action.UPDATE, Action.DELETE],
      },
    },
    membre: { role: 'ASSISTANT_MANAGER', type: 'RESTAURANT', restaurant_id: ANGRE },
  },
  CAISSIER_ANGRE: {
    permissions: { modules: { [Modules.COMMANDES]: [Action.READ, Action.UPDATE, Action.UPDATE_FULL] } },
    membre: { role: 'CAISSIER', type: 'RESTAURANT', restaurant_id: ANGRE },
  },
  // Serveur pas encore déployé : le manager n'a pas encore le droit Planning.
  MANAGER_ANCIEN: {
    permissions: { modules: { [Modules.COMMANDES]: [Action.READ, Action.UPDATE, Action.UPDATE_FULL] } },
    membre: { role: 'MANAGER', type: 'RESTAURANT', restaurant_id: ANGRE },
  },
};

const actions = (compte, statut, restaurantId = ANGRE, retraitDisponible = true) => {
  const { permissions, membre } = COMPTES[compte];
  const droits = droitsLivraison({ can: canPour(permissions), membre });
  return actionsPlanning({ statut, restaurantId, droits, retraitDisponible });
};

describe('actionsPlanning : selon l’état', () => {
  test('le geste principal suit l’état, aucun sur un archivé', () => {
    expect(actions('ADMIN', 'DRAFT').principal).toBe('envoyer');
    expect(actions('ADMIN', 'SENT').principal).toBe('confirmer');
    expect(actions('ADMIN', 'CONFIRMED').principal).toBe('archiver');
    expect(actions('ADMIN', 'ARCHIVED').principal).toBeNull();
    expect(GESTE_PRINCIPAL.ARCHIVED).toBeNull();
    expect(LIBELLE_GESTE.envoyer).toBe('Envoyer');
    // Le message suit le mot d'avant d'un plan de la liste (« Plan supprimé »).
    expect(MESSAGE_GESTE).toEqual({
      envoyer: 'Plan envoyé aux livreurs',
      confirmer: 'Plan confirmé',
      archiver: 'Plan archivé',
    });
  });

  test.each(ETATS)('%s : dates, ajout, retrait, jour et suppression permis', (statut) => {
    const a = actions('ADMIN', statut);
    expect(a.modifierDates).toBe(true);
    expect(a.ajouterLivreur).toBe(true);
    expect(a.retirerLivreur).toBe(true);
    expect(a.changerJour).toBe(true);
    expect(a.supprimer).toBe(true);
  });

  test('seul le brouillon change un jour sans fenêtre', () => {
    expect(actions('ADMIN', 'DRAFT').jourSansFenetre).toBe(true);
    expect(actions('ADMIN', 'SENT').jourSansFenetre).toBe(false);
    expect(actions('ADMIN', 'CONFIRMED').jourSansFenetre).toBe(false);
    expect(actions('ADMIN', 'ARCHIVED').jourSansFenetre).toBe(false);
  });

  test('serveur ancien (sans retrait) : pas de « Retirer du planning », le reste demeure', () => {
    const a = actions('ADMIN', 'CONFIRMED', ANGRE, false);
    expect(a.retirerLivreur).toBe(false);
    expect(a.ajouterLivreur).toBe(true);
    expect(a.supprimer).toBe(true);
  });
});

describe('actionsPlanning : selon le rôle', () => {
  test.each(ETATS)('ADMIN, %s : tout, sur tous les restaurants', (statut) => {
    expect(actions('ADMIN', statut, MARCORY).modifierDates).toBe(true);
    expect(actions('ADMIN', statut, MARCORY).supprimer).toBe(true);
  });

  test.each(ETATS)('LIVRAISON_OPS, %s : aucun geste', (statut) => {
    expect(actions('LIVRAISON_OPS', statut)).toEqual(AUCUNE_ACTION);
    expect(actions('LIVRAISON_OPS', statut, MARCORY)).toEqual(AUCUNE_ACTION);
  });

  test.each(['MANAGER_ANGRE', 'ASSISTANT_ANGRE'])('%s : tout sur le planning de son restaurant', (compte) => {
    for (const statut of ETATS) {
      const a = actions(compte, statut, ANGRE);
      expect(a.principal).toBe(GESTE_PRINCIPAL[statut]);
      expect(a.modifierDates && a.ajouterLivreur && a.retirerLivreur && a.changerJour && a.supprimer).toBe(true);
    }
  });

  test.each(['MANAGER_ANGRE', 'ASSISTANT_ANGRE'])('%s : rien sur le planning d’un autre restaurant', (compte) => {
    for (const statut of ETATS) {
      expect(actions(compte, statut, MARCORY)).toEqual(AUCUNE_ACTION);
    }
  });

  test('restaurant inconnu : un compte de restaurant ne fait rien', () => {
    expect(actions('MANAGER_ANGRE', 'DRAFT', null)).toEqual(AUCUNE_ACTION);
  });

  test('caissier, et manager sur le serveur ancien : aucun geste', () => {
    for (const statut of ETATS) {
      expect(actions('CAISSIER_ANGRE', statut)).toEqual(AUCUNE_ACTION);
      expect(actions('MANAGER_ANCIEN', statut)).toEqual(AUCUNE_ACTION);
    }
  });

  test('droit de modifier sans droit de supprimer : pas de « Supprimer »', () => {
    const droits = { modifierPlanning: () => true, supprimerPlanning: () => false };
    const a = actionsPlanning({ statut: 'SENT', restaurantId: ANGRE, droits });
    expect(a.supprimer).toBe(false);
    expect(a.principal).toBe('confirmer');
  });
});

describe('textes des fenêtres', () => {
  test('ce qui suit un geste', () => {
    expect(suiteGeste('DRAFT')).toBe('aucune');
    expect(suiteGeste('SENT')).toBe('prevenu');
    expect(suiteGeste('CONFIRMED')).toBe('prevenu');
    expect(suiteGeste('ARCHIVED')).toBe('journal');
  });

  test('brouillon : rien n’est dit au livreur', () => {
    const t = textesFenetres('DRAFT', 'Koffi');
    expect(t.jour).toBeNull();
    expect(t.ajout).toBeNull();
    expect(t.retrait).toBe('Ses jours de travail sont effacés.');
    expect(t.dates).toBe('Le plan sera régénéré pour les nouvelles dates.');
    expect(t.suppression).toBe('Vous pourrez en régénérer un.');
  });

  test.each(['SENT', 'CONFIRMED'])('%s : le livreur est prévenu', (statut) => {
    const t = textesFenetres(statut, 'Koffi');
    expect(t.jour).toBe('Koffi sera prévenu.');
    expect(t.ajout).toBe('Il sera prévenu.');
    expect(t.retrait).toBe('Ses jours de travail sont effacés et il est prévenu.');
    expect(t.dates).toContain('prévenus');
    expect(t.suppression).toContain('Les livreurs sont prévenus et ne le verront plus.');
  });

  test('envoyé : les dates régénèrent un brouillon à renvoyer', () => {
    expect(textesFenetres('SENT').dates).toContain('envoyez-le à nouveau');
  });

  test('confirmé : les réponses sont effacées, la suppression est notée au journal', () => {
    const t = textesFenetres('CONFIRMED');
    expect(t.dates).toContain('Les réponses des livreurs sont effacées');
    expect(t.suppression).toContain('notée au journal');
  });

  test('archivé : noté au journal, personne n’est prévenu', () => {
    const t = textesFenetres('ARCHIVED', 'Koffi');
    expect(t.jour).toBe('Plan archivé : noté au journal.');
    expect(t.ajout).toBe('Plan archivé : noté au journal.');
    expect(t.retrait).toContain('noté au journal');
    expect(t.dates).toContain('noté au journal');
    expect(t.suppression).toContain('notée au journal');
    for (const texte of Object.values(t)) expect(texte).not.toContain('prévenu');
  });

  test('aucun tiret cadratin ni tiret long', () => {
    for (const statut of ETATS) {
      for (const texte of Object.values(textesFenetres(statut, 'Koffi'))) {
        if (texte) expect(texte).not.toMatch(/[—–]/);
      }
    }
  });
});
