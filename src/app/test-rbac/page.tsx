"use client"

import React, { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import RBACTest from '@/components/test/RBACTest'
import { UserRole } from '@/utils/rbac'

/**
 * 🧪 PAGE DE TEST RBAC
 * Permet de tester le système RBAC avec différents rôles
 */
export default function TestRBACPage() {
  const { user, setUser } = useAuthStore()
  const [selectedRole, setSelectedRole] = useState<UserRole>('ADMIN')

  const roles: { value: UserRole; label: string; description: string }[] = [
    { value: 'ADMIN', label: 'Administrateur', description: 'Accès complet aux offres spéciales' },
    { value: 'MARKETING', label: 'Marketing', description: 'Gestion des promotions et publicités' },
    { value: 'COMPTABLE', label: 'Comptable', description: 'Accès aux données financières' },
    { value: 'MANAGER', label: 'Manager', description: 'Gestion des opérations restaurant' },
    { value: 'CAISSIER', label: 'Caissier', description: 'Gestion des commandes et clients' },
    { value: 'CALL_CENTER', label: 'Call Center', description: 'Support client et commandes' },
    { value: 'CUISINE', label: 'Cuisine', description: 'Gestion des plats et préparation' },
    { value: 'CLIENT', label: 'Client', description: 'Accès client standard' },
  ]

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role)

    // Simuler un utilisateur avec le rôle sélectionné
    const testUser = {
      id: 'test-user-' + role.toLowerCase(),
      fullname: `Test ${role}`,
      email: `test-${role.toLowerCase()}@chickennation.com`,
      role: (role === 'CLIENT' ? 'EMPLOYEE' : role) as import('@/types/auth').User['role'],
      name: `Test ${role}`,
      restaurant_id: role === 'MANAGER' ? 'test-restaurant-id' : undefined,
      type: (role === 'ADMIN' || role === 'MARKETING' || role === 'COMPTABLE' || role === 'MANAGER'
        ? 'BACKOFFICE'
        : role === 'CLIENT'
          ? 'CUSTOMER'
          : 'RESTAURANT') as import('@/types/auth').User['type'],
    }

    setUser(testUser)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">🧪 Test du Système RBAC</h1>
            <p className="text-gray-600">
              Testez les permissions pour chaque rôle utilisateur dans le système Chicken Nation
            </p>
          </div>

          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Sélectionner un rôle à tester :</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {roles.map((role) => (
                <button
                  key={role.value}
                  onClick={() => handleRoleChange(role.value)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${selectedRole === role.value
                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <div className="font-semibold">{role.label}</div>
                  <div className="text-sm text-gray-500 mt-1">{role.description}</div>
                </button>
              ))}
            </div>

            {user && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-800 mb-2">👤 Utilisateur de test actuel :</h3>
                <div className="text-sm text-blue-700">
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Rôle:</strong> {user.role}</p>
                  <p><strong>Type:</strong> {user.type || 'Non défini'}</p>
                  {user.restaurant_id && <p><strong>Restaurant ID:</strong> {user.restaurant_id}</p>}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Composant de test RBAC */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <RBACTest />
        </div>

        {/* Instructions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
          <h3 className="font-semibold text-yellow-800 mb-2">📋 Instructions de test :</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>1. Sélectionnez un rôle ci-dessus pour simuler un utilisateur</li>
            <li>2. Observez les permissions autorisées/refusées pour ce rôle</li>
            <li>3. Vérifiez que les permissions correspondent aux tableaux de spécifications</li>
            <li>4. Testez différents rôles pour valider la matrice RBAC complète</li>
            <li>5. Les boutons d&apos;actions dans l&apos;interface doivent être cachés selon ces permissions</li>
          </ul>
        </div>

        {/* Légende des rôles */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-6">
          <h3 className="font-semibold text-gray-800 mb-3">🏷️ Légende des rôles :</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">👔 Back Office :</h4>
              <ul className="space-y-1 text-gray-600">
                <li><strong>ADMIN:</strong> Toutes permissions offres spéciales</li>
                <li><strong>MARKETING:</strong> Gestion promotions + publicités</li>
                <li><strong>COMPTABLE:</strong> Accès données financières</li>
                <li><strong>MANAGER:</strong> Opérations restaurant + commandes</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">🏪 Restaurant :</h4>
              <ul className="space-y-1 text-gray-600">
                <li><strong>CAISSIER:</strong> Commandes + clients</li>
                <li><strong>CALL_CENTER:</strong> Support + commandes</li>
                <li><strong>CUISINE:</strong> Plats + préparation</li>
                <li><strong>CLIENT:</strong> Ses propres données</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
