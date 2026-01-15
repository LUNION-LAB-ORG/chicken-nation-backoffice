"use client"

import React from 'react'
import { useRBAC } from '@/hooks/useRBAC'
import { useAuthStore } from '../../../features/users/hook/authStore'

/**
 * 🧪 COMPOSANT DE TEST RBAC
 * Affiche toutes les permissions pour le rôle actuel
 */
export default function RBACTest() {
  const { user } = useAuthStore()
  const rbac = useRBAC()

  if (!user) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">Vous devez être connecté pour tester les permissions RBAC.</p>
        </div>
      </div>
    )
  }

  const permissions = [
    // Catégories
    { name: 'Créer Catégorie', check: rbac.canCreateCategory },
    { name: 'Modifier Catégorie', check: rbac.canUpdateCategory },
    { name: 'Supprimer Catégorie', check: rbac.canDeleteCategory },
    { name: 'Voir Catégorie', check: rbac.canViewCategory },
    
    // Plats
    { name: 'Créer Plat', check: rbac.canCreatePlat },
    { name: 'Modifier Plat', check: rbac.canUpdatePlat },
    { name: 'Supprimer Plat', check: rbac.canDeletePlat },
    { name: 'Voir Plat', check: rbac.canViewPlat },
    
    // Suppléments
    { name: 'Créer Supplément', check: rbac.canCreateSupplement },
    { name: 'Modifier Supplément', check: rbac.canUpdateSupplement },
    { name: 'Supprimer Supplément', check: rbac.canDeleteSupplement },
    { name: 'Voir Supplément', check: rbac.canViewSupplement },
    
    // Clients
    { name: 'Créer Client', check: rbac.canCreateClient },
    { name: 'Modifier Client', check: rbac.canUpdateClient },
    { name: 'Supprimer Client', check: rbac.canDeleteClient },
    { name: 'Voir Client', check: rbac.canViewClient },
    { name: 'Voir Commentaires Client', check: rbac.canViewClientComments },
    
    // Utilisateurs
    { name: 'Créer Utilisateur', check: rbac.canCreateUtilisateur },
    { name: 'Modifier Utilisateur', check: rbac.canUpdateUtilisateur },
    { name: 'Supprimer Utilisateur', check: rbac.canDeleteUtilisateur },
    { name: 'Voir Utilisateur', check: rbac.canViewUtilisateur },
    
    // Restaurants
    { name: '🏢 Créer Restaurant', check: rbac.canCreateRestaurant },
    { name: '🏢 Modifier Restaurant', check: rbac.canUpdateRestaurant },
    { name: '🏢 Supprimer Restaurant', check: rbac.canDeleteRestaurant },
    { name: '🏢 Voir Restaurant', check: rbac.canViewRestaurant },
    
    // Commandes
    { name: 'Créer Commande', check: rbac.canCreateCommande },
    { name: 'Modifier Commande', check: rbac.canUpdateCommande },
    { name: 'Supprimer Commande', check: rbac.canDeleteCommande },
    { name: 'Voir Commande', check: rbac.canViewCommande },
    { name: 'Accepter Commande', check: rbac.canAcceptCommande },
    { name: 'Rejeter Commande', check: rbac.canRejectCommande },
    
    // Offres Spéciales
    { name: 'Créer Offre Spéciale', check: rbac.canCreateOffreSpeciale },
    { name: 'Modifier Offre Spéciale', check: rbac.canUpdateOffreSpeciale },
    { name: 'Supprimer Offre Spéciale', check: rbac.canDeleteOffreSpeciale },
    { name: 'Voir Offre Spéciale', check: rbac.canViewOffreSpeciale },
    
    // Paiements
    { name: 'Créer Paiement', check: rbac.canCreatePaiement },
    { name: 'Modifier Paiement', check: rbac.canUpdatePaiement },
    { name: 'Supprimer Paiement', check: rbac.canDeletePaiement },
    { name: 'Voir Paiement', check: rbac.canViewPaiement },
  ]

  const allowedPermissions = permissions.filter(p => p.check())
  const deniedPermissions = permissions.filter(p => !p.check())

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">
          🔒 Test des Permissions RBAC - Chicken Nation
        </h1>
        
        {/* ✅ Informations sur l'utilisateur actuel */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h2 className="text-lg font-semibold text-blue-800 mb-2">Utilisateur Connecté</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><strong>Nom:</strong> {user?.fullname || 'Non défini'}</div>
            <div><strong>Email:</strong> {user?.email || 'Non défini'}</div>
            <div><strong>Rôle:</strong> 
              <span className={`ml-2 px-2 py-1 rounded text-xs font-bold ${
                user?.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                user?.role === 'MANAGER' ? 'bg-green-100 text-green-800' :
                user?.role === 'MARKETING' ? 'bg-purple-100 text-purple-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {user?.role || 'Non défini'}
              </span>
            </div>
            <div><strong>Type:</strong> {rbac.isBackOffice() ? 'Back Office' : rbac.isRestaurantStaff() ? 'Restaurant' : 'Client'}</div>
          </div>
        </div>

        {/* ✅ Test spécifique pour les restaurants */}
        <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
          <h2 className="text-lg font-semibold text-orange-800 mb-2">🏢 Test Spécifique - Module Restaurants</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <div className={`p-2 rounded ${rbac.canCreateRestaurant() ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              Créer: {rbac.canCreateRestaurant() ? '✅' : '❌'}
            </div>
            <div className={`p-2 rounded ${rbac.canUpdateRestaurant() ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              Modifier: {rbac.canUpdateRestaurant() ? '✅' : '❌'}
            </div>
            <div className={`p-2 rounded ${rbac.canDeleteRestaurant() ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              Supprimer: {rbac.canDeleteRestaurant() ? '✅' : '❌'}
            </div>
            <div className={`p-2 rounded ${rbac.canViewRestaurant() ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              Voir: {rbac.canViewRestaurant() ? '✅' : '❌'}
            </div>
          </div>
          <div className="mt-2 text-xs text-orange-700">
            <strong>Attendu pour ADMIN:</strong> ✅✅✅✅ | <strong>Attendu pour MANAGER:</strong> ❌❌❌❌
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="text-lg font-semibold text-green-800">✅ Permissions Accordées</h3>
            <p className="text-2xl font-bold text-green-600">{allowedPermissions.length}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <h3 className="text-lg font-semibold text-red-800">❌ Permissions Refusées</h3>
            <p className="text-2xl font-bold text-red-600">{deniedPermissions.length}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-800">📊 Total</h3>
            <p className="text-2xl font-bold text-blue-600">{permissions.length}</p>
          </div>
        </div>

        {/* Liste des permissions accordées */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-green-800 mb-3">✅ Permissions Accordées ({allowedPermissions.length})</h3>
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {allowedPermissions.map((permission, index) => (
                <div key={index} className="bg-green-50 p-2 rounded border border-green-200 text-sm text-green-800">
                  {permission.name}
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-red-800 mb-3">❌ Permissions Refusées ({deniedPermissions.length})</h3>
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {deniedPermissions.map((permission, index) => (
                <div key={index} className="bg-red-50 p-2 rounded border border-red-200 text-sm text-red-800">
                  {permission.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
