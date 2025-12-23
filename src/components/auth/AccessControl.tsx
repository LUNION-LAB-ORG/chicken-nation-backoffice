import React from 'react';
import { useAuthStore } from '@/store/authStore'; 

export type UserRole = 'ADMIN' | 'MANAGER' | 'CAISSIER' | 'CALL_CENTER' | 'CUISINE' | 'MARKETING' | 'COMPTABLE';
export type UserType = 'BACKOFFICE' | 'RESTAURANT';

export interface AccessControlProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  requiredType?: UserType;
  requireAuth?: boolean;
  fallback?: React.ReactNode;
  onAccessDenied?: () => void;
}

const ROLE_PERMISSIONS: Record<UserRole, {
  type: UserType;
  canAccessGlobalDashboard: boolean;
  canManageUsers: boolean;
  canManageRestaurants: boolean;
  canManagePromotions: boolean;
  canManageOrders: boolean;
  canViewReports: boolean;
  canManageInventory: boolean;
  canAccessMessages: boolean;
}> = {
  ADMIN: {
    type: 'BACKOFFICE',
    canAccessGlobalDashboard: true,
    canManageUsers: true,
    canManageRestaurants: true,
    canManagePromotions: true,
    canManageOrders: true,
    canViewReports: true,
    canManageInventory: true,
    canAccessMessages: true
  },
  MANAGER: {
    type: 'BACKOFFICE',
    canAccessGlobalDashboard: false,
    canManageUsers: true,  
    canManageRestaurants: false, 
    canManagePromotions: true,
    canManageOrders: true,
    canViewReports: true,
    canManageInventory: true,
    canAccessMessages: true
  },
  MARKETING: {
    type: 'BACKOFFICE',
    canAccessGlobalDashboard: false,
    canManageUsers: true, 
    canManageRestaurants: false,
    canManagePromotions: true,  
    canManageOrders: false, 
    canViewReports: true,
    canManageInventory: true,
    canAccessMessages: false
  },
  COMPTABLE: {
    type: 'BACKOFFICE',
    canAccessGlobalDashboard: false,
    canManageUsers: true,
    canManageRestaurants: false,
    canManagePromotions: false,
    canManageOrders: false,
    canViewReports: true,
    canManageInventory: true,
    canAccessMessages: false
  },
  CAISSIER: {
    type: 'RESTAURANT',
    canAccessGlobalDashboard: false,
    canManageUsers: false,
    canManageRestaurants: false,
    canManagePromotions: false,
    canManageOrders: true,
    canViewReports: false,
    canManageInventory: true,
    canAccessMessages: false
  },
  CALL_CENTER: {
    type: 'RESTAURANT',
    canAccessGlobalDashboard: false,
    canManageUsers: false,
    canManageRestaurants: false,
    canManagePromotions: false,
    canManageOrders: true,
    canViewReports: false,
    canManageInventory: true,
    canAccessMessages: true
  },
  CUISINE: {
    type: 'RESTAURANT',
    canAccessGlobalDashboard: false,
    canManageUsers: false,
    canManageRestaurants: false,
    canManagePromotions: false,
    canManageOrders: true,  
    canViewReports: false,
    canManageInventory: true,
    canAccessMessages: false
  }
};

/**
 * Hook pour vérifier les permissions utilisateur
 */
export function usePermissions() {
  const { user } = useAuthStore();

  const hasRole = (requiredRoles: UserRole[]): boolean => {
    if (!user?.role) return false;
    return requiredRoles.includes(user.role as UserRole);
  };

  const hasType = (requiredType: UserType): boolean => {
    if (!user?.role) return false;
    const rolePermissions = ROLE_PERMISSIONS[user.role as UserRole];
    return rolePermissions?.type === requiredType;
  };

  const hasPermission = (permission: keyof typeof ROLE_PERMISSIONS.ADMIN): boolean => {
    if (!user?.role) return false;
    const rolePermissions = ROLE_PERMISSIONS[user.role as UserRole];
    return Boolean(rolePermissions?.[permission]) || false;
  };

  const canAccessGlobalDashboard = (): boolean => {
    return hasPermission('canAccessGlobalDashboard');
  };

  const canManageUsers = (): boolean => {
    return hasPermission('canManageUsers');
  };

  const canManageRestaurants = (): boolean => {
    return hasPermission('canManageRestaurants');
  };

  const canManagePromotions = (): boolean => {
    return hasPermission('canManagePromotions');
  };

  const canManageOrders = (): boolean => {
    return hasPermission('canManageOrders');
  };

  const canViewReports = (): boolean => {
    return hasPermission('canViewReports');
  };

  const canManageInventory = (): boolean => {
    return hasPermission('canManageInventory');
  };

  const canAccessMessages = (): boolean => {
    return hasPermission('canAccessMessages');
  };

  return {
    user,
    hasRole,
    hasType,
    hasPermission,
    canAccessGlobalDashboard,
    canManageUsers,
    canManageRestaurants,
    canManagePromotions,
    canManageOrders,
    canViewReports,
    canManageInventory,
    canAccessMessages
  };
}

/**
 * Composant de contrôle d'accès
 */
export function AccessControl({
  children,
  requiredRoles,
  requiredType,
  requireAuth = true,
  fallback,
  onAccessDenied
}: AccessControlProps) {
  const { user, hasRole, hasType } = usePermissions();

  // ✅ SÉCURITÉ : Vérification de l'authentification
  if (requireAuth && !user) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-orange-100">
              <svg className="h-8 w-8 text-[#F17922]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Authentification requise
          </h2>
          <p className="text-gray-600 mb-6">
            Vous devez être connecté pour accéder à cette page. Veuillez vous connecter avec vos identifiants.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full bg-[#F17922] hover:bg-orange-600 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  // ✅ SÉCURITÉ : Vérification des rôles
  if (requiredRoles && !hasRole(requiredRoles)) {
    onAccessDenied?.();
    return fallback || (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
              <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Accès non autorisé
          </h2>
          <p className="text-gray-600 mb-6">
            Vous n&apos;avez pas les permissions nécessaires pour accéder à cette page. Contactez votre administrateur si vous pensez qu&apos;il s&apos;agit d&apos;une erreur.
          </p>
          <button
            onClick={() => window.location.href = '/gestion'}
            className="w-full bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
          >
            Retour au tableau de bord
          </button>
        </div>
      </div>
    );
  }

  // ✅ SÉCURITÉ : Vérification du type d'utilisateur
  if (requiredType && !hasType(requiredType)) {
    onAccessDenied?.();
    return fallback || (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100">
              <svg className="h-8 w-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Page non accessible
          </h2>
          <p className="text-gray-600 mb-6">
            Cette page n&apos;est pas accessible avec votre type de compte. Vous êtes connecté avec un compte qui n&apos;a pas accès à cette fonctionnalité.
          </p>
          <button
            onClick={() => window.location.href = '/gestion'}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
          >
            Retour au tableau de bord
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Composant pour masquer/afficher des éléments selon les permissions
 */
export interface PermissionGateProps {
  children: React.ReactNode;
  permission?: keyof typeof ROLE_PERMISSIONS.ADMIN;
  roles?: UserRole[];
  type?: UserType;
  fallback?: React.ReactNode;
}

export function PermissionGate({
  children,
  permission,
  roles,
  type,
  fallback = null
}: PermissionGateProps) {
  const { hasRole, hasType, hasPermission } = usePermissions();

  // Vérification des permissions
  if (permission && !hasPermission(permission)) {
    return <>{fallback}</>;
  }

  // Vérification des rôles
  if (roles && !hasRole(roles)) {
    return <>{fallback}</>;
  }

  // Vérification du type
  if (type && !hasType(type)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * HOC pour protéger des composants entiers
 */
export function withAccessControl<P extends object>(
  Component: React.ComponentType<P>,
  accessConfig: Omit<AccessControlProps, 'children'>
) {
  return function ProtectedComponent(props: P) {
    return (
      <AccessControl {...accessConfig}>
        <Component {...props} />
      </AccessControl>
    );
  };
}

/**
 * Utilitaires pour les vérifications rapides
 */
export const AccessUtils = {
  /**
   * Vérifie si l'utilisateur peut accéder au dashboard global
   */
  canAccessGlobalDashboard: (user: { role?: string }): boolean => {
    if (!user?.role) return false;
    return ROLE_PERMISSIONS[user.role as UserRole]?.canAccessGlobalDashboard || false;
  },

  /**
   * Vérifie si l'utilisateur peut gérer d'autres utilisateurs
   */
  canManageUsers: (user: { role?: string }): boolean => {
    if (!user?.role) return false;
    return ROLE_PERMISSIONS[user.role as UserRole]?.canManageUsers || false;
  },

  /**
   * Vérifie si l'utilisateur est un administrateur
   */
  isAdmin: (user: { role?: string }): boolean => {
    return user?.role === 'ADMIN';
  },

  /**
   * Vérifie si l'utilisateur est du back office
   */
  isBackOffice: (user: { role?: string }): boolean => {
    if (!user?.role) return false;
    return ROLE_PERMISSIONS[user.role as UserRole]?.type === 'BACKOFFICE';
  },

  /**
   * Obtient les permissions d'un rôle
   */
  getRolePermissions: (role: UserRole) => {
    return ROLE_PERMISSIONS[role] || null;
  }
};
