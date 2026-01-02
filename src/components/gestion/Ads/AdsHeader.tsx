"use client"

import React from 'react'
import DashboardPageHeader from '@/components/ui/DashboardPageHeader'
import { Plus } from 'lucide-react'
import { useRBAC } from '@/hooks/useRBAC'

interface AdsHeaderProps {
  currentView: 'list' | 'create' | 'edit' | 'view'
  onBack?: () => void
  onCreateAd?: () => void
}

function AdsHeader({ currentView = 'list', onBack, onCreateAd }: AdsHeaderProps) {
  const { canCreateOffreSpeciale } = useRBAC()

  if (currentView === 'list') {
    // ✅ RBAC: Vérifier les permissions pour créer une publicité (offre spéciale)
    const canAddAd = canCreateOffreSpeciale() && onCreateAd

    return (
      <DashboardPageHeader
        mode="list"
        title="Publicités"

        actions={canAddAd ? [
          {
            label: "Créer une diffusion",
            onClick: onCreateAd,
            icon: Plus,
            variant: 'primary'
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
          ? 'Créer une diffusion'
          : currentView === 'edit'
            ? 'Modifier la diffusion'
            : 'Détails de la diffusion'
      }
      gradient={true}
    />
  )
}

export default AdsHeader
