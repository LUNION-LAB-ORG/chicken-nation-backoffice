"use client"

import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'

type Option = {
  value: string
  label: string
  price?: string
  image?: string
  available?: boolean
}

type SelectWithCheckboxesAndImagesProps = {
  options: Option[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  className?: string
}

const SelectWithCheckboxesAndImages = ({
  options,
  value,
  onChange,
  placeholder = 'Selectionner...',
  className = '',
}: SelectWithCheckboxesAndImagesProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (options.length === 0) return;
    
    const validValues = value.filter(v => options.some(opt => opt.value === v));
    
    if (validValues.length !== value.length) { 
      const hasRealDifference = value.some(v => !validValues.includes(v)) || 
                               validValues.some(v => !value.includes(v));
      
      if (hasRealDifference) {
        onChange(validValues);
      }
    }
  }, [options, value, onChange]);

  useEffect(() => {
    setIsMounted(true)
    setPortalContainer(document.body)

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleOptionClick = (optionValue: string) => {
    const newValue = [...value]
    const index = newValue.indexOf(optionValue)
    if (index === -1) {
      newValue.push(optionValue)
    } else {
      newValue.splice(index, 1)
    }
    onChange(newValue)
  }

  // Filtrer les options disponibles
  const availableOptions = options.filter(option => 
    option.available === undefined || option.available === true
  )

  // Filtrer en fonction du terme de recherche
  const filteredOptions = availableOptions.filter(option => 
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const renderDropdown = () => {
    if (!containerRef.current || !isOpen || !portalContainer || !isMounted) return null

    const rect = containerRef.current.getBoundingClientRect()
    const needsScrollbar = filteredOptions.length > 5
    
    return createPortal(
      <div 
        className="fixed inset-0"
        style={{ 
          zIndex: 99999,
          pointerEvents: 'none'
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div 
          className="absolute bg-white border border-white rounded-t-xl shadow-lg overflow-hidden"
          style={{ 
            bottom: `${window.innerHeight - rect.top + window.scrollY}px`,
            left: `${rect.left + window.scrollX}px`,
            width: `${rect.width}px`,
            pointerEvents: 'auto'
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Barre de recherche */}
          <div className="sticky top-0 bg-orange-100 p-2 border-b border-gray-100 z-10">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher..."
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 dark:text-gray-700 dark:placeholder:text-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#F17922] focus:border-[#F17922]"
                onClick={(e) => e.stopPropagation()}
              />
              {searchTerm && (
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setSearchTerm('')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              )}
            </div>
          </div>
          
          <div className="py-0">
            {/* Option "Tout sélectionner" */}
            <div
              className="flex items-center justify-between px-4 py-3 bg-[#f5f5f5] hover:bg-[#e5e5e5] cursor-pointer border-b-2 border-white"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                // Si tous sont sélectionnés, on désélectionne tout, sinon on sélectionne tout
                onChange(
                  value.length === availableOptions.length
                    ? []
                    : availableOptions.map((opt) => opt.value)
                );
                return false;
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
            >
              <span className="text-[#595959] font-regular text-[13px]">
                Tout sélectionner
              </span>
              <div
                className={`w-6 h-6 rounded-md ${
                  value.length === availableOptions.length
                    ? "bg-[#F17922]"
                    : "border-2 border-gray-300"
                } flex items-center justify-center`}
              >
                {value.length === availableOptions.length && (
                  <svg
                    width="14"
                    height="10"
                    viewBox="0 0 14 10"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M1 5L5 9L13 1"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
            </div>

            {/* Message si aucun résultat */}
            {filteredOptions.length === 0 && (
              <div className="px-4 py-3 text-center text-gray-500 text-sm">
                Aucun résultat pour {searchTerm}
              </div>
            )}
            
            <div className={`${needsScrollbar ? 'max-h-[250px] overflow-y-auto' : ''}`}>
              {filteredOptions.map((option, index) => (
                <div
                  key={option.value}
                  className={`flex items-center justify-between px-4 py-3 hover:bg-[#f5f5f5] cursor-pointer ${
                    index === 0 ? 'border-b-2 border-white' : ''
                  } bg-[#f5f5f5]`}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleOptionClick(option.value);
                    return false;
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                >
                  <div className="flex items-center gap-3">
                    {option.image && option.image.startsWith('http') && (
                      <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                        <Image 
                          src={option.image} 
                          alt={option.label} 
                          width={24} 
                          height={24} 
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                    {option.image && !option.image.startsWith('http') && (
                      <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 bg-gray-200 flex items-center justify-center">
                        <span className="text-[10px] text-gray-500">{option.label.charAt(0)}</span>
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="text-[#595959] font-regular text-[13px]">{option.label}</span>
                      {option.price && (
                        <span className="text-[#9796A1] text-[11px]">
                          {option.price === "0 XOF" || option.price === "0" ? "Gratuit" : option.price}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-md ${value.includes(option.value) ? 'bg-[#F17922]' : 'border-2 border-gray-300'} flex items-center justify-center`}>
                    {value.includes(option.value) && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 5L5 9L13 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>,
      portalContainer
    )
  }

  return (
    <div className="relative" ref={containerRef}>
      <div
        className={`flex items-center justify-between w-full px-4 py-2 bg-[#d8d8d8] rounded-xl cursor-pointer ${className}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center w-full justify-between gap-2">
          <span className="text-[#595959] font-semibold text-[13px]">{placeholder}</span>
          <svg
            width="12"
            height="8"
            viewBox="0 0 12 8"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`text-gray-400 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          >
            <path d="M1 1L6 6L11 1" stroke="#595959" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
      {renderDropdown()}
    </div>
  )
}

export default SelectWithCheckboxesAndImages