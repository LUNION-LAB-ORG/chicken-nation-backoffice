"use client"

import React from 'react'
import DashboardPageHeader from '@/components/ui/DashboardPageHeader'
import { Plus } from 'lucide-react'
import { useAuthStore } from '../../../../features/users/hook/authStore'
import { Action, Modules } from '../../../../features/users/types/auth.type'

interface AdsHeaderProps {
  currentView: 'list' | 'create' | 'edit' | 'view'
  onBack?: () => void
  onCreateAd?: () => void
}

function AdsHeader({ currentView = 'list', onBack, onCreateAd }: AdsHeaderProps) {

const {can} = useAuthStore()

  if (currentView === 'list') {
    return (
      <DashboardPageHeader
        mode="list"
        title="Publicités"

        actions={can(Modules.FIDELITE, Action.CREATE) ? [
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
