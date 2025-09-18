/**
 * 🔒 HOOK RBAC PERSONNALISÉ
 * Interface simple pour vérifier les permissions utilisateur
 */

import { useAuthStore } from '@/store/authStore';
import { 
  hasPermission, 
  hasModulePermissions, 
  getModulePermissions, 
  getAccessibleModules, 
  canManageModule,
  type UserRole,
  type Module,
  type Action 
} from '@/utils/rbac';

export function useRBAC() {
  const { user } = useAuthStore();
  const userRole = user?.role as UserRole | undefined;

  return {
    // Informations utilisateur
    user,
    userRole,
    isAuthenticated: !!user,
    
    // Fonctions de vérification génériques
    hasPermission: (moduleName: Module, action: Action) => hasPermission(userRole, moduleName, action),
    hasModulePermissions: (moduleName: Module, actions: Action[]) => hasModulePermissions(userRole, moduleName, actions),
    getModulePermissions: (moduleName: Module) => getModulePermissions(userRole, moduleName),
    getAccessibleModules: () => getAccessibleModules(userRole),
    canManageModule: (moduleName: Module) => canManageModule(userRole, moduleName),
    
    // Vérifications spécifiques par module - Catégories
    canCreateCategory: () => hasPermission(userRole, 'categorie', 'create'),
    canUpdateCategory: () => hasPermission(userRole, 'categorie', 'update'),
    canDeleteCategory: () => hasPermission(userRole, 'categorie', 'remove'),
    canViewCategory: () => hasPermission(userRole, 'categorie', 'view'),
    
    // Plats
    canCreatePlat: () => hasPermission(userRole, 'plat', 'create'),
    canUpdatePlat: () => hasPermission(userRole, 'plat', 'update'),
    canDeletePlat: () => hasPermission(userRole, 'plat', 'remove'),
    canViewPlat: () => hasPermission(userRole, 'plat', 'view'),
    
    // Suppléments
    canCreateSupplement: () => hasPermission(userRole, 'supplement', 'create'),
    canUpdateSupplement: () => hasPermission(userRole, 'supplement', 'update'),
    canDeleteSupplement: () => hasPermission(userRole, 'supplement', 'remove'),
    canViewSupplement: () => hasPermission(userRole, 'supplement', 'view'),
    
    // Clients
    canCreateClient: () => hasPermission(userRole, 'client', 'create'),
    canUpdateClient: () => hasPermission(userRole, 'client', 'update'),
    canDeleteClient: () => hasPermission(userRole, 'client', 'remove'),
    canViewClient: () => hasPermission(userRole, 'client', 'view'),
    canViewClientComments: () => hasPermission(userRole, 'client', 'view'),
    
    // Adresses
    canCreateAdresse: () => hasPermission(userRole, 'adresse', 'create'),
    canUpdateAdresse: () => hasPermission(userRole, 'adresse', 'update'),
    canDeleteAdresse: () => hasPermission(userRole, 'adresse', 'remove'),
    canViewAdresse: () => hasPermission(userRole, 'adresse', 'view'),
    
    // Favoris
    canCreateFavoris: () => hasPermission(userRole, 'favoris', 'create'),
    canUpdateFavoris: () => hasPermission(userRole, 'favoris', 'update'),
    canDeleteFavoris: () => hasPermission(userRole, 'favoris', 'remove'),
    canViewFavoris: () => hasPermission(userRole, 'favoris', 'view'),
    
    // Utilisateurs
    canCreateUtilisateur: () => hasPermission(userRole, 'utilisateur', 'create'),
    canUpdateUtilisateur: () => hasPermission(userRole, 'utilisateur', 'update'),
    canDeleteUtilisateur: () => hasPermission(userRole, 'utilisateur', 'remove'),
    canViewUtilisateur: () => hasPermission(userRole, 'utilisateur', 'view'),
    canEnableUtilisateur: () => hasPermission(userRole, 'utilisateur', 'enable'),
    canDisableUtilisateur: () => hasPermission(userRole, 'utilisateur', 'disable'),
    
    // Restaurants
    canCreateRestaurant: () => hasPermission(userRole, 'restaurant', 'create'),
    canUpdateRestaurant: () => hasPermission(userRole, 'restaurant', 'update'),
    canDeleteRestaurant: () => hasPermission(userRole, 'restaurant', 'remove'),
    canViewRestaurant: () => hasPermission(userRole, 'restaurant', 'view'),
    
    // Commandes
    canCreateCommande: () => hasPermission(userRole, 'commande', 'create'),
    canUpdateCommande: () => hasPermission(userRole, 'commande', 'update'),
    canDeleteCommande: () => hasPermission(userRole, 'commande', 'remove'),
    canViewCommande: () => hasPermission(userRole, 'commande', 'view'),
    canAcceptCommande: () => hasPermission(userRole, 'commande', 'accept'),
    canRejectCommande: () => hasPermission(userRole, 'commande', 'reject'),
    
    // Offres Spéciales
    canCreateOffreSpeciale: () => hasPermission(userRole, 'offre_speciale', 'create'),
    canUpdateOffreSpeciale: () => hasPermission(userRole, 'offre_speciale', 'update'),
    canDeleteOffreSpeciale: () => hasPermission(userRole, 'offre_speciale', 'remove'),
    canViewOffreSpeciale: () => hasPermission(userRole, 'offre_speciale', 'view'),
    
    // Paiements
    canCreatePaiement: () => hasPermission(userRole, 'paiement', 'create'),
    canUpdatePaiement: () => hasPermission(userRole, 'paiement', 'update'),
    canDeletePaiement: () => hasPermission(userRole, 'paiement', 'remove'),
    canViewPaiement: () => hasPermission(userRole, 'paiement', 'view'),
    
    // Messages
    canCreateMessage: () => hasPermission(userRole, 'message', 'create'),
    canUpdateMessage: () => hasPermission(userRole, 'message', 'update'),
    canDeleteMessage: () => hasPermission(userRole, 'message', 'remove'),
    canViewMessage: () => hasPermission(userRole, 'message', 'view'),
    
    // Tickets
    canCreateTicket: () => hasPermission(userRole, 'ticket', 'create'),
    canUpdateTicket: () => hasPermission(userRole, 'ticket', 'update'),
    canDeleteTicket: () => hasPermission(userRole, 'ticket', 'remove'),
    canViewTicket: () => hasPermission(userRole, 'ticket', 'view'),
    canAcceptTicket: () => hasPermission(userRole, 'ticket', 'accept'),
    canRejectTicket: () => hasPermission(userRole, 'ticket', 'reject'),
    
    // Vérifications de rôles spécifiques
    isAdmin: () => userRole === 'ADMIN',
    isManager: () => userRole === 'MANAGER',
    isMarketing: () => userRole === 'MARKETING',
    isComptable: () => userRole === 'COMPTABLE',
    isCaissier: () => userRole === 'CAISSIER',
    isCallCenter: () => userRole === 'CALL_CENTER',
    isCuisine: () => userRole === 'CUISINE',
    isClient: () => userRole === 'CLIENT',
    
    // Vérifications de type d'utilisateur
    isBackOffice: () => ['ADMIN', 'MARKETING', 'COMPTABLE', 'MANAGER'].includes(userRole || ''),
    isRestaurantStaff: () => ['CAISSIER', 'CALL_CENTER', 'CUISINE'].includes(userRole || ''),
  };
}
