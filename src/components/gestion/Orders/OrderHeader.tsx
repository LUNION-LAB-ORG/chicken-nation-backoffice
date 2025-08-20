"use client"

import React from 'react'
import DashboardPageHeader from '@/components/ui/DashboardPageHeader'
import ExportDropdown from '@/components/ui/ExportDropdown'
import { useOrdersQuery } from '@/hooks/useOrdersQuery'

interface OrderHeaderProps {
  currentView: 'list' | 'create' | 'edit' | 'view'
  onBack?: () => void
  onCreateMenu: () => void
  onSearch?: (searchQuery: string) => void
  // ✅ Paramètres nécessaires pour useOrdersQuery
  activeFilter?: string
  selectedRestaurant?: string
  searchQuery?: string
  selectedDate?: Date | null
  // ✅ Nouveaux props pour les commandes en attente
  hasPendingOrders?: boolean
  pendingOrdersCount?: number
  isSoundPlaying?: boolean
}

function OrderHeader({ 
  currentView = 'list', 
  onBack, 
  onSearch, 
  activeFilter = 'all',
  selectedRestaurant,
  searchQuery = '',
  selectedDate = null,
  hasPendingOrders = false,
  pendingOrdersCount = 0,
  isSoundPlaying = false
}: OrderHeaderProps) {

  const { orders: realOrders } = useOrdersQuery({
    activeFilter,
    selectedRestaurant,
    searchQuery,
    selectedDate
  });

  const handleSearch = (query: string) => {
    onSearch?.(query);
  }

  if (currentView === 'list') {
    return (
      <div>
        <DashboardPageHeader
          mode="list"
          title="Commandes"
          searchConfig={{
            placeholder: "Rechercher par référence...",
            buttonText: "Chercher",
            onSearch: handleSearch,
            realTimeSearch: true
          }}
          actions={[
            {
              label: "Exporter",
              onClick: () => {}, // Sera remplacé par le dropdown
              customComponent: (
                <ExportDropdown
                  orders={realOrders}
                  buttonText="Exporter"
                />
              )
            }
          ]}
        />
        
        {/* ✅ Indicateur visuel pour les commandes en attente */}
        {hasPendingOrders && (
          <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <span className="text-orange-800 font-medium">
              🔔 {pendingOrdersCount} commande{pendingOrdersCount > 1 ? 's' : ''} en attente
            </span>
          </div>
        )}
      </div>
    )
  }

  return (
    <DashboardPageHeader
      mode={currentView === 'view' ? 'detail' : currentView}
      onBack={onBack}
      title={
        currentView === 'create'
          ? 'Créer un menu'
          : currentView === 'edit'
            ? 'Modifier le menu'
            : 'Détails '
      }
      gradient={true}
      actions={
        currentView === 'view'
          ? [
              {
                label: "Exporter",
                onClick: () => {}, // Sera remplacé par le dropdown
                customComponent: (
                  <ExportDropdown
                    orders={realOrders}
                    buttonText="Exporter"
                  />
                )
              }
            ]
          : undefined
      }
    />
  )
}

export default OrderHeader
