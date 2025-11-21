"use client"

import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import Checkbox from '@/components/ui/Checkbox'

interface VisibilitySelectorProps {
  selectedTypes: string[]
  onTypesChange: (types: string[]) => void
  className?: string
}

const VisibilitySelector = ({ selectedTypes, onTypesChange, className = '' }: VisibilitySelectorProps) => {
  const [showPrivateDropdown, setShowPrivateDropdown] = useState(false)
  const privateDropdownRef = useRef<HTMLDivElement>(null)

  const privateTypeOptions = ['Utilisateur Standard', 'Utilisateur Premium', 'Utilisateur Gold']

  const handlePrivateTypeToggle = (privateType: string) => {
    const newTypes = selectedTypes.includes(privateType)
      ? selectedTypes.filter(type => type !== privateType)
      : [...selectedTypes, privateType]
    onTypesChange(newTypes)
  }

  // Effet pour fermer la dropdown quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (privateDropdownRef.current && !privateDropdownRef.current.contains(event.target as Node)) {
        setShowPrivateDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className={`mt-6 ${className}`}>
      {/* Header Public */}
      <div className="bg-[#ff6200] p-4 rounded-t-xl">
        <span className="font-medium text-gray-800">Public</span>
      </div>
      
      {/* Options de visibilité */}
      <div className="bg-white border border-gray-200 rounded-b-xl">
        {/* Option Privé avec dropdown */}
        <div className="relative" ref={privateDropdownRef}>
          <button
            type="button"
            onClick={() => setShowPrivateDropdown(!showPrivateDropdown)}
            className="w-full p-4 text-left flex justify-between items-center hover:bg-[#ff6200] transition-colors"
          >
            <span className="text-gray-700">Privé</span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showPrivateDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showPrivateDropdown && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-b-xl shadow-lg z-50">
              {privateTypeOptions.map((privateType) => (
                <div
                  key={privateType}
                  className="flex items-center gap-3 px-6 py-3 hover:bg-[#ff6200] transition-colors"
                >
                  <Checkbox
                    checked={selectedTypes.includes(privateType)}
                    onChange={() => handlePrivateTypeToggle(privateType)}
                    id={`private-${privateType}`}
                  />
                  <span className="text-gray-700">{privateType}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default VisibilitySelector
