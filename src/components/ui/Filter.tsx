"use client"

import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import Checkbox from './Checkbox'

interface FilterOption {
  id: string | number
  name: string
}

interface FilterProps {
  options: FilterOption[]
  selectedOptions: string[]
  onChange: (selected: string[]) => void
  className?: string
}

export default function Filter({ options, selectedOptions, onChange, className = '' }: FilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const filterRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={filterRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none"
      >
        <span className="text-gray-600">Filtre</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="p-2 max-h-60 overflow-y-auto">
            {options.map((option) => (
              <div key={option.id} className="flex items-center gap-2 py-1.5 px-2">
                <Checkbox
                  checked={selectedOptions.includes(option.name)}
                  onChange={(checked) => {
                    onChange(
                      checked
                        ? [...selectedOptions, option.name]
                        : selectedOptions.filter(name => name !== option.name)
                    )
                  }}
                />
                <span className="text-sm text-gray-600">{option.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
