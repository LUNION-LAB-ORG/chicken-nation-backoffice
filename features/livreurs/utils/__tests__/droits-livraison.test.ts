// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';

import { Action, Modules } from '../../../users/types/auth.type';
import { droitsLivraison, lectureSeuleLivraison, peutAgirSurRestaurant } from '../droits-livraison';

/**
 * Droits de l'exploitation des livraisons (conception du 24/10, 4.3) : chaque
 * clé est le miroir d'une garde du serveur. Les droits de chaque rôle sont
 * ceux de `permissionsByRole.ts` du serveur ; `can` reprend la règle de
 * `authStore.can` (ALL, exclusions, puis le module).
 */

const ANGRE = '0b8f3a52-6a51-4d0e-9b0e-2b6f0f7a1a01';
const MARCORY = '7c1d2e3f-4a5b-4c6d-8e7f-901a2b3c4d02';

const TOUT = Object.values(Action);

function canPour(permissions) {
  return (module, action) => {
    if (permissions.exclusions?.includes(module)) return false;
    if (permissions.modules[Modules.ALL]?.includes(action)) return true;
    return permissions.modules[module]?.includes(action) ?? false;
  };
}

const ADMIN = { modules: { [Modules.ALL]: TOUT } };
const LIVRAISON_OPS = {
  modules: {
    [Modules.COMMANDES]: [Action.READ],
    [Modules.LIVREURS]: [Action.READ],
    [Modules.PLANNING]: [Action.READ],
  },
};
// Serveur pas encore déployé : LIVRAISON_OPS sans le droit PLANNING.
const LIVRAISON_OPS_ANCIEN = {
  modules: { [Modules.COMMANDES]: [Action.READ], [Modules.LIVREURS]: [Action.READ] },
};
// Étape 4 de la conception : le manager reçoit le droit PLANNING, pas LIVREURS.
const MANAGER = {
  modules: {
    [Modules.COMMANDES]: [Action.READ, Action.UPDATE, Action.UPDATE_FULL],
    [Modules.PLANNING]: [Action.READ, Action.CREATE, Action.UPDATE, Action.DELETE],
  },
};
const MANAGER_ANCIEN = { modules: { [Modules.COMMANDES]: [Action.READ, Action.UPDATE, Action.UPDATE_FULL] } };
const CAISSIER = { modules: { [Modules.COMMANDES]: [Action.READ, Action.UPDATE, Action.UPDATE_FULL] } };
// Serveur d'avant le 26/10 : le centre d'appels sans la livraison.
const CALL_CENTER_ANCIEN = {
  modules: {
    [Modules.COMMANDES]: [Action.CREATE, Action.READ, Action.UPDATE, Action.UPDATE_FULL, Action.PRINT],
    [Modules.DASHBOARD]: [Action.READ],
    [Modules.CLIENTS]: [Action.CREATE, Action.READ, Action.UPDATE, Action.EXPORT],
    [Modules.CALLS]: [Action.READ],
  },
};
// Première demande du 26/10 : tout le module Livraison en lecture, comme LIVRAISON_OPS.
const CALL_CENTER_LECTURE = {
  modules: {
    ...CALL_CENTER_ANCIEN.modules,
    [Modules.LIVREURS]: [Action.READ],
    [Modules.PLANNING]: [Action.READ],
  },
};
// Seconde demande du 26/10 (« oui le call center peut agir dans livraison ») :
// le planning en écriture ; les gestes des courses sont ouverts par une liste
// de rôles (ROLES_ACTIONS_COURSES), LIVREURS reste en lecture.
const CALL_CENTER = {
  modules: {
    ...CALL_CENTER_ANCIEN.modules,
    [Modules.LIVREURS]: [Action.READ],
    [Modules.PLANNING]: [Action.READ, Action.CREATE, Action.UPDATE, Action.DELETE],
  },
};
const MARKETING = {
  modules: {
    [Modules.CLIENTS]: [Action.READ],
    [Modules.CRM]: [Action.READ, Action.UPDATE],
    [Modules.PROMOTIONS]: TOUT,
  },
};
const COMPTABLE = { modules: { [Modules.COMMANDES]: [Action.READ, Action.EXPORT], [Modules.DASHBOARD]: [Action.READ] } };
const CUISINE = { modules: { [Modules.COMMANDES]: [Action.READ, Action.UPDATE] } };

const droits = (permissions, membre) => droitsLivraison({ can: canPour(permissions), membre });

const ACTIONS = ['piloterCourses', 'gererLivreurs', 'supprimerLivreur', 'creerPlanning'];

describe('droitsLivraison', () => {
  test('le droit Planning a la valeur du serveur', () => {
    expect(Modules.PLANNING).toBe('planning');
  });

  test('ADMIN : tout, sur tous les restaurants', () => {
    const d = droits(ADMIN, { role: 'ADMIN', type: 'BACKOFFICE', restaurant_id: null });
    expect(d.voirLivraison).toBe(true);
    expect(d.voirPlanning).toBe(true);
    for (const cle of ACTIONS) expect(d[cle]).toBe(true);
    expect(d.modifierPlanning(ANGRE)).toBe(true);
    expect(d.modifierPlanning(MARCORY)).toBe(true);
    expect(d.supprimerPlanning(MARCORY)).toBe(true);
  });

  test('ADMIN dont la fiche garde un restaurant : compte du siège, tous les restaurants', () => {
    const d = droits(ADMIN, { role: 'ADMIN', type: 'BACKOFFICE', restaurant_id: ANGRE });
    expect(d.modifierPlanning(MARCORY)).toBe(true);
    expect(d.supprimerPlanning(MARCORY)).toBe(true);
  });

  test('LIVRAISON_OPS : tout voir, aucune action', () => {
    const d = droits(LIVRAISON_OPS, { role: 'LIVRAISON_OPS', type: 'BACKOFFICE' });
    expect(d.voirLivraison).toBe(true);
    expect(d.voirPlanning).toBe(true);
    for (const cle of ACTIONS) expect(d[cle]).toBe(false);
    expect(d.modifierPlanning(ANGRE)).toBe(false);
    expect(d.supprimerPlanning(ANGRE)).toBe(false);
  });

  test('LIVRAISON_OPS face à un serveur sans le droit Planning : le planning disparaît', () => {
    const d = droits(LIVRAISON_OPS_ANCIEN, { role: 'LIVRAISON_OPS', type: 'BACKOFFICE' });
    expect(d.voirLivraison).toBe(true);
    expect(d.voirPlanning).toBe(false);
  });

  test('MANAGER : le planning de son restaurant seulement, ni En direct, ni Courses, ni Livreurs', () => {
    const d = droits(MANAGER, { role: 'MANAGER', type: 'RESTAURANT', restaurant_id: ANGRE });
    expect(d.voirLivraison).toBe(false);
    expect(d.voirPlanning).toBe(true);
    expect(d.creerPlanning).toBe(true);
    expect(d.piloterCourses).toBe(false);
    expect(d.gererLivreurs).toBe(false);
    expect(d.supprimerLivreur).toBe(false);
    expect(d.modifierPlanning(ANGRE)).toBe(true);
    expect(d.supprimerPlanning(ANGRE)).toBe(true);
    expect(d.modifierPlanning(MARCORY)).toBe(false);
    expect(d.supprimerPlanning(MARCORY)).toBe(false);
    expect(d.modifierPlanning(null)).toBe(false);
    expect(d.modifierPlanning(undefined)).toBe(false);
  });

  test('ASSISTANT_MANAGER reconnu par son rôle, même sans type', () => {
    const d = droits(MANAGER, { role: 'ASSISTANT_MANAGER', restaurant_id: ANGRE });
    expect(d.modifierPlanning(ANGRE)).toBe(true);
    expect(d.modifierPlanning(MARCORY)).toBe(false);
  });

  test('compte de restaurant sans restaurant rattaché : aucun planning', () => {
    const d = droits(MANAGER, { role: 'MANAGER', type: 'RESTAURANT', restaurant_id: null });
    expect(d.modifierPlanning(ANGRE)).toBe(false);
    expect(d.supprimerPlanning(ANGRE)).toBe(false);
  });

  test('MANAGER face à un serveur sans le droit Planning : rien', () => {
    const d = droits(MANAGER_ANCIEN, { role: 'MANAGER', type: 'RESTAURANT', restaurant_id: ANGRE });
    expect(d.voirLivraison).toBe(false);
    expect(d.voirPlanning).toBe(false);
    expect(d.creerPlanning).toBe(false);
    expect(d.modifierPlanning(ANGRE)).toBe(false);
  });

  test('CALL_CENTER : agit sur les courses et le planning de tous les restaurants', () => {
    const d = droits(CALL_CENTER, { role: 'CALL_CENTER', type: 'BACKOFFICE', restaurant_id: null });
    expect(d.voirLivraison).toBe(true);
    expect(d.voirPlanning).toBe(true);
    // Affecter, annuler, relancer, réessayer, Turbo, reprendre en interne.
    expect(d.piloterCourses).toBe(true);
    expect(d.creerPlanning).toBe(true);
    for (const restaurant of [ANGRE, MARCORY, null]) {
      expect(d.modifierPlanning(restaurant)).toBe(true);
      expect(d.supprimerPlanning(restaurant)).toBe(true);
    }
  });

  test('CALL_CENTER : la gestion des comptes des livreurs reste à l\'administrateur', () => {
    const d = droits(CALL_CENTER, { role: 'CALL_CENTER', type: 'BACKOFFICE', restaurant_id: null });
    // Valider, refuser, forcer l'activation, suspendre, réactiver, changer de restaurant.
    expect(d.gererLivreurs).toBe(false);
    expect(d.supprimerLivreur).toBe(false);
  });

  test('CALL_CENTER dont la fiche garde un restaurant : compte du siège, tous les restaurants', () => {
    const membre = { role: 'CALL_CENTER', type: 'BACKOFFICE', restaurant_id: ANGRE };
    const d = droits(CALL_CENTER, membre);
    expect(d.modifierPlanning(MARCORY)).toBe(true);
    expect(d.supprimerPlanning(MARCORY)).toBe(true);
    expect(peutAgirSurRestaurant(membre, MARCORY)).toBe(true);
  });

  test('CALL_CENTER face au serveur de la lecture seule : tout voir, aucune action', () => {
    const d = droits(CALL_CENTER_LECTURE, { role: 'CALL_CENTER', type: 'BACKOFFICE', restaurant_id: null });
    expect(d.voirLivraison).toBe(true);
    expect(d.voirPlanning).toBe(true);
    for (const cle of ACTIONS) expect(d[cle]).toBe(false);
    for (const restaurant of [ANGRE, MARCORY, null]) {
      expect(d.modifierPlanning(restaurant)).toBe(false);
      expect(d.supprimerPlanning(restaurant)).toBe(false);
    }
  });

  test('CALL_CENTER face à un serveur sans la lecture de la livraison : rien ne change', () => {
    const d = droits(CALL_CENTER_ANCIEN, { role: 'CALL_CENTER', type: 'BACKOFFICE' });
    expect(d.voirLivraison).toBe(false);
    expect(d.voirPlanning).toBe(false);
    for (const cle of ACTIONS) expect(d[cle]).toBe(false);
  });

  test('droit LIVREURS d\'écriture reçu par erreur : CALL_CENTER ne gère pas les comptes, LIVRAISON_OPS ne fait rien', () => {
    const TOUT_LIVRAISON = { modules: { [Modules.LIVREURS]: TOUT, [Modules.PLANNING]: TOUT } };
    const centre = droits(TOUT_LIVRAISON, { role: 'CALL_CENTER', type: 'BACKOFFICE' });
    expect(centre.piloterCourses).toBe(true);
    expect(centre.creerPlanning).toBe(true);
    expect(centre.gererLivreurs).toBe(false);
    expect(centre.supprimerLivreur).toBe(false);

    const suivi = droits(TOUT_LIVRAISON, { role: 'LIVRAISON_OPS', type: 'BACKOFFICE' });
    expect(suivi.voirLivraison).toBe(true);
    expect(suivi.voirPlanning).toBe(true);
    for (const cle of ACTIONS) expect(suivi[cle]).toBe(false);
    expect(suivi.modifierPlanning(ANGRE)).toBe(false);
    expect(suivi.supprimerPlanning(ANGRE)).toBe(false);
  });

  test('gestes des courses : ADMIN et CALL_CENTER seulement ; comptes des livreurs : ADMIN seul', () => {
    // Miroir de ROLES_ACTIONS_COURSES et du @UserRoles(ADMIN) des livreurs : même
    // avec tous les droits, aucun autre rôle n'a ces boutons.
    for (const role of ['ADMIN', 'CALL_CENTER', 'LIVRAISON_OPS', 'MANAGER', 'ASSISTANT_MANAGER', 'CAISSIER', 'MARKETING', 'COMPTABLE', 'CUISINE']) {
      const d = droits(ADMIN, { role, type: 'BACKOFFICE' });
      expect(d.piloterCourses).toBe(role === 'ADMIN' || role === 'CALL_CENTER');
      expect(d.gererLivreurs).toBe(role === 'ADMIN');
      expect(d.supprimerLivreur).toBe(role === 'ADMIN');
    }
  });

  test('MARKETING, COMPTABLE, CUISINE : rien de plus', () => {
    for (const [role, permissions] of [
      ['MARKETING', MARKETING],
      ['COMPTABLE', COMPTABLE],
      ['CUISINE', CUISINE],
    ]) {
      const d = droits(permissions, { role, type: 'BACKOFFICE' });
      expect(d.voirLivraison).toBe(false);
      expect(d.voirPlanning).toBe(false);
      for (const cle of ACTIONS) expect(d[cle]).toBe(false);
      expect(d.modifierPlanning(ANGRE)).toBe(false);
      expect(d.supprimerPlanning(ANGRE)).toBe(false);
    }
  });

  test('CAISSIER : rien', () => {
    const d = droits(CAISSIER, { role: 'CAISSIER', type: 'RESTAURANT', restaurant_id: ANGRE });
    expect(d.voirLivraison).toBe(false);
    expect(d.voirPlanning).toBe(false);
    for (const cle of ACTIONS) expect(d[cle]).toBe(false);
    expect(d.modifierPlanning(ANGRE)).toBe(false);
  });

  test('ADMIN sans le droit LIVREURS (exclusion) : ni courses ni comptes des livreurs', () => {
    const d = droits(
      { modules: { [Modules.ALL]: TOUT }, exclusions: [Modules.LIVREURS] },
      { role: 'ADMIN', type: 'BACKOFFICE' },
    );
    expect(d.voirLivraison).toBe(false);
    expect(d.piloterCourses).toBe(false);
    expect(d.gererLivreurs).toBe(false);
    expect(d.supprimerLivreur).toBe(false);
  });

  test('exclusion du module : refus même avec ALL', () => {
    const d = droits(
      { modules: { [Modules.ALL]: TOUT }, exclusions: [Modules.PLANNING] },
      { role: 'ADMIN', type: 'BACKOFFICE' },
    );
    expect(d.voirLivraison).toBe(true);
    expect(d.voirPlanning).toBe(false);
    expect(d.modifierPlanning(ANGRE)).toBe(false);
  });

  test('aucun compte : rien', () => {
    const d = droits(ADMIN, null);
    expect(d.piloterCourses).toBe(false);
    expect(d.gererLivreurs).toBe(false);
    expect(d.modifierPlanning(ANGRE)).toBe(false);
    expect(d.supprimerPlanning(ANGRE)).toBe(false);
  });
});

describe('lectureSeuleLivraison', () => {
  test('suivi des livraisons seulement ; le centre d\'appels agit depuis le 26/10', () => {
    expect(lectureSeuleLivraison({ role: 'LIVRAISON_OPS' })).toBe(true);
    for (const role of ['ADMIN', 'CALL_CENTER', 'MANAGER', 'ASSISTANT_MANAGER', 'CAISSIER', 'MARKETING', null, undefined]) {
      expect(lectureSeuleLivraison({ role })).toBe(false);
    }
    expect(lectureSeuleLivraison(null)).toBe(false);
  });
});

describe('peutAgirSurRestaurant', () => {
  test('siège : tous ; restaurant : le sien', () => {
    expect(peutAgirSurRestaurant({ role: 'CALL_CENTER', type: 'BACKOFFICE' }, MARCORY)).toBe(true);
    expect(peutAgirSurRestaurant({ role: 'CAISSIER', restaurant_id: ANGRE }, ANGRE)).toBe(true);
    expect(peutAgirSurRestaurant({ role: 'CAISSIER', restaurant_id: ANGRE }, MARCORY)).toBe(false);
    expect(peutAgirSurRestaurant({ type: 'RESTAURANT', role: 'ADMIN', restaurant_id: ANGRE }, MARCORY)).toBe(false);
  });
});
