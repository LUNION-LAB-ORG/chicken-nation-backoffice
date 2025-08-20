"use client"

import React from 'react'

interface PersonnelTabsProps {
  tabs: string[]
  selected: string
  onSelect: (tab: string) => void
}

const PersonnelTabs: React.FC<PersonnelTabsProps> = ({ tabs, selected, onSelect }) => {
  return (
    <div
      className="flex items-center bg-[#f4f4f5] rounded-[12px] px-2 mb-4 w-fit 
      overflow-x-auto scrollbar-thin scrollbar-thumb-[#E4E4E7] 
      scrollbar-track-transparent"
      style={{ minHeight: 40 }}
    >
      {tabs.map((tab, idx) => (
        <button
          key={tab}
          className={`transition-colors font-sofia-bold cursor-pointer text-[11px] lg:text-[14px]
             px-5 py-1 rounded-[12px] focus:outline-none whitespace-nowrap
            ${selected === tab
              ? 'bg-[#F17922] text-white font-bold shadow-none'
              : 'bg-transparent text-[#71717A] font-normal  '}
            ${idx === 0 ? '' : 'ml-1'}
          `}
          style={{ minWidth: 75, height: 30 }}
          onClick={() => onSelect(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}

export default PersonnelTabs
