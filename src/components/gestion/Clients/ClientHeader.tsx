"use client"

import React from 'react'
import DashboardPageHeader from '@/components/ui/DashboardPageHeader' 

interface ClientHeaderProps {
  currentView: string;
  selectedClientId?: string | null;
  onBack?: () => void;
  onSearch: (query: string) => void;
  onViewReviews?: () => void;
  onToggleConnected?: () => void;
  showingConnectedOnly?: boolean;
  onViewOrders?: () => void;
}

export default function ClientHeader({
  currentView, 
  onBack,
  onSearch, 
  onViewReviews,
}: ClientHeaderProps) {

  // Vue liste principale
  if (currentView === 'list') {
    return (
      <DashboardPageHeader
        mode="list"
        title="Clients"
        searchConfig={{
          placeholder: "Rechercher un client",
          buttonText: "Chercher",
          onSearch: onSearch || (() => {}),
          realTimeSearch: true 
        }}
        actions={[
          {
            label: "Notes & avis", 
            onClick: onViewReviews || (() => {}),
           
          }
        ]}
      />
    )
  }

  // Autres vues (détail, création, etc.)
  return (
    <DashboardPageHeader
      mode={currentView === 'view' ? 'detail' : currentView === 'reviews' ? 'detail' : currentView === 'create' ? 'create' : currentView === 'edit' ? 'edit' : 'list'}
      onBack={onBack}
      title={
        currentView === 'create'
          ? 'Créer un menu'
          : currentView === 'edit'
            ? 'Modifier le client'
            : currentView === 'reviews'
              ? 'Commentaires'
              : 'Détails du client'
      }
      gradient={true}
    />
  )
}