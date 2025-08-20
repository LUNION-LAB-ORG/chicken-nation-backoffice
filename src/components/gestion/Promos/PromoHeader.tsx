"use client"

import React from 'react'
import DashboardPageHeader from '@/components/ui/DashboardPageHeader'

interface PromoHeaderProps {
  currentView?: 'list' | 'create' | 'edit' | 'view' | 'personalize' | 'editPersonalize' | 'allPromotions'
  onBack?: () => void
  onCreatePromo?: () => void
  onSearch?: (query: string) => void
}

function PromoHeader({ currentView = 'list', onBack, onSearch }: PromoHeaderProps) {
  if (currentView === 'list') {
    return (
      <DashboardPageHeader
        mode="list"
        title="Promotions"
      />
    )
  }

  if (currentView === 'allPromotions') {
    return (
      <DashboardPageHeader
        mode="detail"
        title="Toutes les promotions"
        onBack={onBack}
        searchConfig={{
          placeholder: "Rechercher une promotion...",
          buttonText: "Chercher",
          onSearch: onSearch || (() => {}),
          realTimeSearch: true  // ✅ Activer la recherche en temps réel
        }}
        gradient={true}
      />
    )
  }

  return (
    <DashboardPageHeader
      mode={currentView === 'view' ? 'detail' : currentView === 'personalize' || currentView === 'editPersonalize' ? 'create' : currentView === 'edit' ? 'edit' : 'create'}
      onBack={onBack}
      title={
        currentView === 'create'
          ? 'Créer une promotion'
          : currentView === 'edit'
            ? 'Modifier la promotion'
            : currentView === 'personalize'
              ? 'Personnaliser la promotion'
              : currentView === 'editPersonalize'
                ? 'Modifier la promotion'
                : 'Détails de la promotion'
      }
      gradient={true}
    />
  )
}

export default PromoHeader
