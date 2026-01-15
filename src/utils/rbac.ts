/**
 * 🔒 SYSTÈME RBAC GRANULAIRE
 * Matrice complète des permissions basée sur les tableaux de spécifications
 */

export type UserRole = 'ADMIN' | 'MARKETING' | 'COMPTABLE' | 'MANAGER' | 'CAISSIER' | 'CALL_CENTER' | 'CUISINE' | 'CLIENT';
export type UserType = 'BACKOFFICE' | 'RESTAURANT' | 'CLIENT';

export type Module =
  | 'categorie'
  | 'plat'
  | 'supplement'
  | 'client'
  | 'adresse'
  | 'favoris'
  | 'utilisateur'
  | 'restaurant'
  | 'commande'
  | 'offre_speciale'
  | 'paiement'
  | 'message'
  | 'ticket';

export type Action =
  | 'create'
  | 'update'
  | 'remove'
  | 'view'
  | 'enable'
  | 'disable'
  | 'accept'
  | 'reject';
  
/**
 * ✅ MATRICE COMPLÈTE DES PERMISSIONS
 * Basée sur les 5 tableaux de spécifications
 */
export const RBAC_MATRIX: Record<UserRole, Record<Module, Record<Action, boolean>>> = {
  ADMIN: {
    // ✅ ADMIN: voit tout et peut tout modifier SAUF informations commandes/clients
    categorie: { create: true, update: true, remove: true, view: true, enable: true, disable: true, accept: false, reject: false },
    plat: { create: true, update: true, remove: true, view: true, enable: true, disable: true, accept: false, reject: false },
    supplement: { create: true, update: true, remove: true, view: true, enable: true, disable: true, accept: false, reject: false },

    // ✅ ADMIN: peut voir clients mais PAS modifier leurs informations
    client: { create: false, update: false, remove: false, view: true, enable: true, disable: true, accept: false, reject: false },
    adresse: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },
    favoris: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },

    // ✅ ADMIN: contrôle total utilisateurs/restaurants
    utilisateur: { create: true, update: true, remove: true, view: true, enable: true, disable: true, accept: false, reject: false },
    restaurant: { create: true, update: true, remove: true, view: true, enable: true, disable: true, accept: false, reject: false },

    // ✅ ADMIN: peut voir commandes mais PAS modifier informations commandes
    commande: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },
    offre_speciale: { create: true, update: true, remove: true, view: true, enable: true, disable: true, accept: false, reject: false },

    // ✅ ADMIN: voit et contrôle paiements
    paiement: { create: true, update: true, remove: true, view: true, enable: false, disable: false, accept: false, reject: false },

    // ✅ ADMIN: contrôle total des messages
    message: { create: true, update: true, remove: true, view: true, enable: false, disable: false, accept: false, reject: false },

    // ✅ ADMIN: contrôle total des tickets
    ticket: { create: true, update: true, remove: true, view: true, enable: false, disable: false, accept: true, reject: true },
  },

  MARKETING: {
    // ✅ MARKETING: voit tout SAUF CA, peut voir/modifier catégories, plats, promotions
    categorie: { create: true, update: true, remove: true, view: true, enable: true, disable: true, accept: false, reject: false },
    plat: { create: true, update: true, remove: true, view: true, enable: true, disable: true, accept: false, reject: false },
    supplement: { create: true, update: true, remove: true, view: true, enable: true, disable: true, accept: false, reject: false },

    // ✅ MARKETING: peut voir clients (pour comprendre la base client)
    client: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },
    adresse: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },
    favoris: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },

    // ✅ MARKETING: peut voir utilisateurs/restaurants
    utilisateur: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },
    restaurant: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },

    // ✅ MARKETING: peut voir commandes (pas le CA mais les données commandes)
    commande: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },
    offre_speciale: { create: true, update: true, remove: true, view: true, enable: true, disable: true, accept: false, reject: false },

    // ✅ MARKETING: PAS d'accès au CA (paiements)
    paiement: { create: false, update: false, remove: false, view: false, enable: false, disable: false, accept: false, reject: false },

    // ✅ MARKETING: peut voir/envoyer messages pour communication client
    message: { create: true, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },

    // ✅ MARKETING: peut voir tickets pour insights client
    ticket: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },
  },

  COMPTABLE: {
    // ✅ COMPTABLE: ne voit QUE commandes et CA de tous restaurants
    categorie: { create: false, update: false, remove: false, view: false, enable: false, disable: false, accept: false, reject: false },
    plat: { create: false, update: false, remove: false, view: false, enable: false, disable: false, accept: false, reject: false },
    supplement: { create: false, update: false, remove: false, view: false, enable: false, disable: false, accept: false, reject: false },

    // ✅ COMPTABLE: pas d'accès aux clients
    client: { create: false, update: false, remove: false, view: false, enable: false, disable: false, accept: false, reject: false },
    adresse: { create: false, update: false, remove: false, view: false, enable: false, disable: false, accept: false, reject: false },
    favoris: { create: false, update: false, remove: false, view: false, enable: false, disable: false, accept: false, reject: false },

    // ✅ COMPTABLE: peut voir restaurants (pour rapports CA par restaurant)
    utilisateur: { create: false, update: false, remove: false, view: false, enable: false, disable: false, accept: false, reject: false },
    restaurant: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },

    // ✅ COMPTABLE: accès total aux commandes et CA
    commande: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },
    offre_speciale: { create: false, update: false, remove: false, view: false, enable: false, disable: false, accept: false, reject: false },

    // ✅ COMPTABLE: accès total au CA (paiements)
    paiement: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },

    // ✅ COMPTABLE: pas d'accès aux messages
    message: { create: false, update: false, remove: false, view: false, enable: false, disable: false, accept: false, reject: false },

    // ✅ COMPTABLE: pas d'accès aux tickets
    ticket: { create: false, update: false, remove: false, view: false, enable: false, disable: false, accept: false, reject: false },
  },

  MANAGER: {
    // ✅ MANAGER: voit tout du CA jusqu'au menu, SAUF menus et promotions (pas de modification)
    categorie: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },
    plat: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },
    supplement: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },

    // ✅ MANAGER: peut voir clients
    client: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },
    adresse: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },
    favoris: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },

    // ✅ MANAGER: contrôle utilisateurs et peut voir restaurants
    utilisateur: { create: true, update: true, remove: true, view: true, enable: true, disable: true, accept: false, reject: false },
    restaurant: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },

    // ✅ MANAGER: peut voir commandes et gérer le processus
    commande: { create: true, update: true, remove: true, view: true, enable: true, disable: true, accept: true, reject: true },
    offre_speciale: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },

    // ✅ MANAGER: voit le CA (paiements)
    paiement: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },

    // ✅ MANAGER: peut voir/envoyer messages store
    message: { create: true, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },

    // ✅ MANAGER: peut voir, assigner et résoudre tickets
    ticket: { create: false, update: true, remove: false, view: true, enable: false, disable: false, accept: true, reject: true },
  },

  // Rôles Restaurant
  CAISSIER: {
    // ✅ CAISSIER: peut voir le bouton "mes commandes" et traiter commandes (accepter, prêt, terminer)
    categorie: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },
    plat: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },
    supplement: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },

    client: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },
    adresse: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },
    favoris: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },

    // ✅ CAISSIER: pas d'accès au personnel/restaurants
    utilisateur: { create: false, update: false, remove: false, view: false, enable: false, disable: false, accept: false, reject: false },
    restaurant: { create: false, update: false, remove: false, view: false, enable: false, disable: false, accept: false, reject: false },

    // ✅ CAISSIER: peut traiter les commandes (accepter, prêt, terminer)
    commande: { create: false, update: true, remove: false, view: true, enable: false, disable: false, accept: true, reject: true },

    offre_speciale: { create: false, update: false, remove: false, view: false, enable: false, disable: false, accept: false, reject: false },
    paiement: { create: false, update: false, remove: false, view: false, enable: false, disable: false, accept: false, reject: false },

    // ✅ CAISSIER: pas d'accès aux messages
    message: { create: false, update: false, remove: false, view: false, enable: false, disable: false, accept: false, reject: false },

    // ✅ CAISSIER: pas d'accès aux tickets
    ticket: { create: false, update: false, remove: false, view: false, enable: false, disable: false, accept: false, reject: false },
  },

  CALL_CENTER: {
    // ✅ CALL_CENTER: mêmes écrans que caissière + peut voir messages du store
    categorie: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },
    plat: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },
    supplement: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },

    // ✅ CALL_CENTER: même config que CAISSIER pour clients
    client: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },
    adresse: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },
    favoris: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },

    // ✅ CALL_CENTER: pas d'accès au personnel/restaurants
    utilisateur: { create: false, update: false, remove: false, view: false, enable: false, disable: false, accept: false, reject: false },
    restaurant: { create: false, update: false, remove: false, view: false, enable: false, disable: false, accept: false, reject: false },

    // ✅ CALL_CENTER: même que caissier pour commandes + peut voir messages
    commande: { create: true, update: true, remove: true, view: true, enable: true, disable: true, accept: true, reject: true },

    // ✅ CALL_CENTER: peut voir les promotions pour informer clients
    offre_speciale: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },
    paiement: { create: false, update: false, remove: false, view: false, enable: false, disable: false, accept: false, reject: false },

    // ✅ CALL_CENTER: peut voir et envoyer messages du store
    message: { create: true, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },

    // ✅ CALL_CENTER: rôle support principal - peut créer, voir et modifier tickets
    ticket: { create: true, update: true, remove: false, view: true, enable: false, disable: false, accept: true, reject: true },
  },

  CUISINE: {
    // ✅ CUISINE : Aucun accès aux menus/inventaire
    categorie: { create: false, update: false, remove: false, view: false, enable: false, disable: false, accept: false, reject: false },
    plat: { create: false, update: false, remove: false, view: false, enable: false, disable: false, accept: false, reject: false },
    supplement: { create: false, update: false, remove: false, view: false, enable: false, disable: false, accept: false, reject: false },

    // ✅ CUISINE : Aucun accès aux clients
    client: { create: false, update: false, remove: false, view: false, enable: false, disable: false, accept: false, reject: false },
    adresse: { create: false, update: false, remove: false, view: false, enable: false, disable: false, accept: false, reject: false },
    favoris: { create: false, update: false, remove: false, view: false, enable: false, disable: false, accept: false, reject: false },

    // ✅ CUISINE : Aucun accès au personnel/restaurants
    utilisateur: { create: false, update: false, remove: false, view: false, enable: false, disable: false, accept: false, reject: false },
    restaurant: { create: false, update: false, remove: false, view: false, enable: false, disable: false, accept: false, reject: false },

    // ✅ CUISINE : COMMANDES UNIQUEMENT
    commande: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },

    // ✅ CUISINE : Aucun accès aux promotions/paiements
    offre_speciale: { create: false, update: false, remove: false, view: false, enable: false, disable: false, accept: false, reject: false },
    paiement: { create: false, update: false, remove: false, view: false, enable: false, disable: false, accept: false, reject: false },

    // ✅ CUISINE: pas d'accès aux messages
    message: { create: false, update: false, remove: false, view: false, enable: false, disable: false, accept: false, reject: false },

    // ✅ CUISINE: pas d'accès aux tickets
    ticket: { create: false, update: false, remove: false, view: false, enable: false, disable: false, accept: false, reject: false },
  },

  CLIENT: {
    // Tableau 1
    categorie: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },
    plat: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },
    supplement: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },

    // Tableau 2
    client: { create: true, update: true, remove: true, view: true, enable: false, disable: false, accept: false, reject: false },
    adresse: { create: true, update: true, remove: true, view: true, enable: false, disable: false, accept: false, reject: false },
    favoris: { create: true, update: true, remove: true, view: true, enable: false, disable: false, accept: false, reject: false },

    // Tableau 3
    utilisateur: { create: true, update: true, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },
    restaurant: { create: true, update: true, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },

    // Tableau 4
    commande: { create: true, update: true, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },
    offre_speciale: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },

    // Tableau 5: Module Paiement
    paiement: { create: true, update: true, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },

    // ✅ CLIENT: peut envoyer/recevoir messages
    message: { create: true, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },

    // ✅ CLIENT: peut créer des tickets pour ses problèmes
    ticket: { create: true, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },
  },
};

/**
 * 🔍 FONCTIONS UTILITAIRES RBAC
 */

/**
 * Vérifie si un utilisateur a une permission spécifique
 */
export function hasPermission(
  userRole: UserRole | undefined,
  moduleName: Module,
  action: Action
): boolean {
  if (!userRole) return false;
  return RBAC_MATRIX[userRole]?.[moduleName]?.[action] || false;
}

/**
 * Vérifie si un utilisateur peut effectuer plusieurs actions sur un module
 */
export function hasModulePermissions(
  userRole: UserRole | undefined,
  moduleName: Module,
  actions: Action[]
): boolean {
  if (!userRole) return false;
  return actions.every(action => hasPermission(userRole, moduleName, action));
}

/**
 * Obtient toutes les permissions d'un utilisateur pour un module
 */
export function getModulePermissions(
  userRole: UserRole | undefined,
  moduleName: Module
): Record<Action, boolean> {
  if (!userRole) {
    return {
      create: false,
      update: false,
      remove: false,
      view: false,
      enable: false,
      disable: false,
      accept: false,
      reject: false,
    };
  }
  return RBAC_MATRIX[userRole][moduleName];
}

/**
 * Obtient tous les modules accessibles par un utilisateur
 */
export function getAccessibleModules(userRole: UserRole | undefined): Module[] {
  if (!userRole) return [];

  const modules: Module[] = [];
  const rolePermissions = RBAC_MATRIX[userRole];

  for (const moduleKey in rolePermissions) {
    const modulePermissions = rolePermissions[moduleKey as Module];
    // Si l'utilisateur a au moins une permission sur le module
    if (Object.values(modulePermissions).some(permission => permission)) {
      modules.push(moduleKey as Module);
    }
  }

  return modules;
}

/**
 * Vérifie si un utilisateur peut gérer (CRUD) un module
 */
export function canManageModule(
  userRole: UserRole | undefined,
  moduleName: Module
): boolean {
  return hasModulePermissions(userRole, moduleName, ['create', 'update', 'remove', 'view']);
}


