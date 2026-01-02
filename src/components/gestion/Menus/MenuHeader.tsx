"use client"

import React from 'react'
import DashboardPageHeader from '@/components/ui/DashboardPageHeader'
import { Plus } from 'lucide-react'
import { useRBAC } from '@/hooks/useRBAC'

interface MenuHeaderProps {
  currentView: 'list' | 'create' | 'edit' | 'view'
  onBack?: () => void
  onCreateMenu?: () => void
  onSearch?: (searchQuery: string) => void
}

function MenuHeader({ currentView = 'list', onBack, onCreateMenu, onSearch }: MenuHeaderProps) {
  const { canCreatePlat } = useRBAC()

  if (currentView === 'list') {
    // ✅ RBAC: Vérifier les permissions pour créer un plat
    const canAddMenu = canCreatePlat() && onCreateMenu

    return (
      <DashboardPageHeader
        mode="list"
        title="Plat"
        searchConfig={{
          placeholder: "Rechercher un plat",
          buttonText: "Chercher",
          onSearch: onSearch || ((value) => console.log('Searching:', value)),
          realTimeSearch: true  // ✅ Activer la recherche en temps réel
        }}
        actions={canAddMenu ? [
          {
            label: "Créer un plat",
            onClick: onCreateMenu,
            icon: Plus,
          }
        ] : []}
      />
    )
  }

  return (
    <DashboardPageHeader
      mode={currentView}
      onBack={onBack}
      title={
        currentView === 'create'
          ? 'Créer un plat'
          : currentView === 'edit'
            ? 'Modifier le plat'
            : 'Détails du plat'
      }
      gradient={true}
    />
  )
}

export default MenuHeader
