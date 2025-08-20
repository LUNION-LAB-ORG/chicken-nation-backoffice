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
  | 'paiement';

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
    // Tableau 1: Module Catégorie, Plat, Supplément
    categorie: { create: true, update: true, remove: true, view: true, enable: true, disable: true, accept: false, reject: false },
    plat: { create: true, update: true, remove: true, view: true, enable: true, disable: true, accept: false, reject: false },
    supplement: { create: true, update: true, remove: true, view: true, enable: true, disable: true, accept: false, reject: false },
    
    // Tableau 2: Module Client, Adresse, Favoris
    client: { create: false, update: true, remove: true, view: true, enable: true, disable: true, accept: false, reject: false },
    adresse: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },
    favoris: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },
    
    // Tableau 3: Module Utilisateur, Restaurant
    utilisateur: { create: true, update: false, remove: true, view: true, enable: true, disable: true, accept: false, reject: false },
    restaurant: { create: true, update: true, remove: true, view: true, enable: true, disable: true, accept: false, reject: false },
    
    // Tableau 4: Module Commande, Offre Spéciale
    commande: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },
    offre_speciale: { create: true, update: true, remove: true, view: true, enable: false, disable: false, accept: false, reject: false },

    // Tableau 5: Module Paiement
    paiement: { create: false, update: false, remove: false, view: false, enable: false, disable: false, accept: false, reject: false },
  },

  MARKETING: {
    // Tableau 1
    categorie: { create: true, update: true, remove: false, view: true, enable: true, disable: true, accept: false, reject: false },
    plat: { create: true, update: true, remove: false, view: true, enable: true, disable: true, accept: false, reject: false },
    supplement: { create: true, update: true, remove: false, view: true, enable: true, disable: true, accept: false, reject: false },
    
    // Tableau 2
    client: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },
    adresse: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },
    favoris: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },
    
    // Tableau 3
    utilisateur: { create: true, update: false, remove: true, view: true, enable: false, disable: false, accept: false, reject: false },
    restaurant: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },
    
    // Tableau 4
    commande: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },
    offre_speciale: { create: true, update: true, remove: true, view: true, enable: false, disable: false, accept: false, reject: false },

    // Tableau 5: Module Paiement
    paiement: { create: false, update: false, remove: false, view: false, enable: false, disable: false, accept: false, reject: false },
  },

  COMPTABLE: {
    // Tableau 1
    categorie: { create: true, update: true, remove: true, view: true, enable: true, disable: true, accept: true, reject: true },
    plat: { create: true, update: true, remove: true, view: true, enable: true, disable: true, accept: true, reject: true },
    supplement: { create: true, update: true, remove: true, view: true, enable: true, disable: true, accept: true, reject: true },
    
    // Tableau 2
    client: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },
    adresse: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },
    favoris: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },
    
    // Tableau 3
    utilisateur: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },
    restaurant: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },
    
    // Tableau 4
    commande: { create: false, update: false, remove: false, view: false, enable: false, disable: false, accept: false, reject: false },
    offre_speciale: { create: false, update: false, remove: false, view: false, enable: false, disable: false, accept: false, reject: false },

    // Tableau 5: Module Paiement
    paiement: { create: false, update: false, remove: false, view: false, enable: false, disable: false, accept: false, reject: false },
  },

  MANAGER: {
    // Tableau 1
    categorie: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },
    plat: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },
    supplement: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },
    
    // Tableau 2
    client: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },
    adresse: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },
    favoris: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },
    
    // Tableau 3
    utilisateur: { create: true, update: true, remove: true, view: true, enable: true, disable: true, accept: false, reject: false },
    restaurant: { create: false, update: false, remove: false, view: false, enable: true, disable: true, accept: false, reject: false },
    
    // Tableau 4
    commande: { create: true, update: true, remove: true, view: true, enable: false, disable: false, accept: true, reject: true },
    offre_speciale: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },

    // Tableau 5: Module Paiement
    paiement: { create: true, update: true, remove: true, view: true, enable: false, disable: false, accept: false, reject: false },
  },

  // Rôles Restaurant (à compléter avec tableau 5)
  CAISSIER: {
    categorie: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },
    plat: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },
    supplement: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },

    client: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },
    adresse: { create: true, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },
    favoris: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },

    // ✅ PERSONNEL complètement retiré pour CAISSIER
    utilisateur: { create: false, update: false, remove: false, view: false, enable: false, disable: false, accept: false, reject: false },
    restaurant: { create: false, update: false, remove: false, view: false, enable: false, disable: false, accept: false, reject: false },
    commande: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },

    offre_speciale: { create: false, update: false, remove: false, view: false, enable: false, disable: false, accept: false, reject: false },
    paiement: { create: false, update: false, remove: false, view: false, enable: false, disable: false, accept: false, reject: false },
  },

  CALL_CENTER: {
    // ✅ Même config que CAISSIER pour menus/inventaire
    categorie: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },
    plat: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },
    supplement: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },

    // ✅ Même config que CAISSIER pour clients
    client: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },
    adresse: { create: true, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },
    favoris: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },

    // ✅ PERSONNEL complètement retiré pour CALL_CENTER
    utilisateur: { create: false, update: false, remove: false, view: false, enable: false, disable: false, accept: false, reject: false },
    restaurant: { create: false, update: false, remove: false, view: false, enable: false, disable: false, accept: false, reject: false },
    
    // ✅ Même config que CAISSIER pour commandes
    commande: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },

    // ✅ CALL_CENTER peut voir les promotions (lecture seule)
    offre_speciale: { create: false, update: false, remove: false, view: true, enable: false, disable: false, accept: false, reject: false },
    paiement: { create: false, update: false, remove: false, view: false, enable: false, disable: false, accept: false, reject: false },
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


