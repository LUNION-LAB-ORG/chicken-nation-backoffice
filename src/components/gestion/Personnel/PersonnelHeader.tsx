"use client"

import React from 'react'
import DashboardPageHeader from '@/components/ui/DashboardPageHeader'
import { useRBAC } from '@/hooks/useRBAC'

interface MenuHeaderProps {
  onAddPersonnel?: () => void
  onSearch?: (query: string) => void
  isReadOnly?: boolean
}

function PersonnelHeader({ onAddPersonnel, onSearch, isReadOnly = false }: MenuHeaderProps) {
  const { canCreateUtilisateur } = useRBAC()

  // ✅ RBAC: Vérifier les permissions pour créer un utilisateur
  const canAddPersonnel = canCreateUtilisateur() && !isReadOnly && onAddPersonnel

  return (
    <DashboardPageHeader
      mode="list"
      title="Personnel"
      searchConfig={{
        placeholder: "Rechercher",
        buttonText: "Chercher",
        onSearch: onSearch || ((value) => console.log('Searching:', value)),
        realTimeSearch: true  // ✅ Activer la recherche en temps réel
      }}
      actions={canAddPersonnel ? [
        {
          label: "Créer un membre",
          onClick: onAddPersonnel,
        }
      ] : []}
    />
  )
}

export default PersonnelHeader
