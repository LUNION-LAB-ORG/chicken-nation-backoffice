"use client"

import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface AdFilterProps {
  onFilterChange?: (filter: string) => void
  className?: string
}

const filterOptions = [
  { value: 'all', label: 'Tous' },
  { value: 'recent', label: 'Les plus récents' },
  { value: 'popular', label: 'Les plus lus' }
]

export default function AdFilter({ onFilterChange, className = '' }: AdFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState(filterOptions[0])

  const handleFilterSelect = (filter: typeof filterOptions[0]) => {
    setSelectedFilter(filter)
    setIsOpen(false)
    if (onFilterChange) {
      onFilterChange(filter.value)
    }
  }

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-2 px-3 py-1.5 text-gray-500 bg-white border border-gray-200 rounded-xl h-10 w-40 text-sm"
      >
        <span className="truncate text-gray-400">{selectedFilter.label}</span>
        <ChevronDown color='#99a1af ' size={20} className={`transition-transform  ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-sm">
          <ul className="py-1">
            {filterOptions.map((option) => (
              <li key={option.value}>
                <button
                  type="button"
                  className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 ${
                    selectedFilter.value === option.value ? 'bg-gray-50 text-[#F17922]' : 'text-gray-700'
                  }`}
                  onClick={() => handleFilterSelect(option)}
                >
                  {option.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
