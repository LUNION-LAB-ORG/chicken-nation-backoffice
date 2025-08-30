"use client"

import React from 'react'
import DashboardPageHeader from '@/components/ui/DashboardPageHeader'

import { DashboardPeriodFilter } from './PeriodFilter'

interface OrderHeaderProps {
  currentView: 'list' | 'create' | 'edit' | 'view'
  onBack?: () => void
  onCreateMenu: () => void
}

function OrderHeader({ currentView = 'list', onBack }: OrderHeaderProps) {
 

  if (currentView === 'list') {
 
 
    const actions = [
      // Filtre de période en premier
      {
        label: "Filtre période",
        onClick: () => {},  
        customComponent: <DashboardPeriodFilter />
      },
     
    ];

    return (
      <DashboardPageHeader
        mode="list"
        title="Tableau de bord"
        actions={actions}
      />
    )
  }

  return (
    <DashboardPageHeader
   
      onBack={onBack}
      title={
        "Tableau de bord"
      }
      gradient={true}
    />
  )
}

export default OrderHeader
