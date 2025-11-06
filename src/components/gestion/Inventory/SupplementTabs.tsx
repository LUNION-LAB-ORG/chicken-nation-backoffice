"use client"

import React from 'react'

export type TabItem = {
  id: string
  label: string
}

interface SupplementTabsProps {
  tabs: TabItem[]
  selectedTab: string
  onTabChange: (tabId: string) => void
}

export default function SupplementTabs({ 
  tabs, 
  selectedTab, 
  onTabChange 
}: SupplementTabsProps) {
  // Fonction pour obtenir l'initiale ou l'abréviation d'un label
  const getShortLabel = (label: string, id: string): string => {
    // Cas spéciaux pour certains onglets
    if (id === 'all') return 'Tous';
    if (id === 'FOOD') return 'Sauc.';
    if (id === 'DRINK') return 'Bois.';
    if (id === 'ACCESSORY') return 'Supp.';
  
    return label.charAt(0).toUpperCase();
  };

  return (
    <div className="flex bg-[#F4F4F5] rounded-[10px] items-center gap-2">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-4 py-1.5 rounded-[10px] cursor-pointer ${
            selectedTab === tab.id
              ? 'bg-[#F17922] font-bold text-white'
              : 'text-[#9796A1] hover:bg-gray-50'
          }`}
        >
       
          <span className="hidden md:inline text-[10px] lg:text-[14px]">{tab.label}</span>
          <span className="md:hidden text-[10px]">{getShortLabel(tab.label, tab.id)}</span>
        </button>
      ))}
    </div>
  )
}
