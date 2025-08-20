"use client"

import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { createPortal } from 'react-dom'

interface Option {
  value: string
  label: string
}

interface SimpleSelectProps {
  options: Option[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

const SimpleSelect = ({ options, value, onChange, placeholder, className }: SimpleSelectProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null)
  const selectRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const selectedOption = options.find(option => option.value === value)

  useEffect(() => {
     if (typeof document !== 'undefined') {
      const container = document.createElement('div');
      container.id = 'simple-select-portal';
      document.body.appendChild(container);
      setPortalContainer(container);
      
      return () => {
        document.body.removeChild(container);
      };
    }
  }, [])

  // Fermer le dropdown quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Ne fermer que si le dropdown est ouvert
      if (!isOpen) return;
      
      const target = event.target as Node;
      
       const isClickOnButton = buttonRef.current?.contains(target);
      const isClickInDropdown = dropdownRef.current?.contains(target);
      
       if (!isClickOnButton && !isClickInDropdown) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

   const getDropdownPosition = () => {
    if (!buttonRef.current) return { top: 0, left: 0, width: 0 }
    
    const rect = buttonRef.current.getBoundingClientRect()
    return {
      top: rect.bottom + window.scrollY + 5,
      left: rect.left + window.scrollX,
      width: rect.width
    }
  }

   const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

   const handleOptionClick = (e: React.MouseEvent, optionValue: string) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div ref={selectRef} className={`relative w-full ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleButtonClick}
        className="w-full flex items-center justify-between bg-[#d8d8d8] text-[#595959] font-semibold px-4 py-2 rounded-xl text-sm"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="block truncate">
          {selectedOption ? selectedOption.label : placeholder || "Choisissez une catégorie"}
        </span>
        <ChevronDown 
          className={`h-4 w-4 ml-2 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && portalContainer && createPortal(
        <div 
          ref={dropdownRef}
          className="fixed z-[99999] bg-white rounded-lg max-h-60 overflow-y-auto overflow-x-hidden shadow-lg border border-gray-200"
          role="listbox"
          style={{
            top: `${getDropdownPosition().top}px`,
            left: `${getDropdownPosition().left}px`,
            width: `${getDropdownPosition().width}px`,
            maxWidth: '100vw'
          }}
        >
          {options.length === 0 ? (
            <div className="px-4 py-2 text-gray-500 italic">
              Aucune option disponible
            </div>
          ) : (
            options.map((option) => (
              <div
                key={option.value}
                onClick={(e) => handleOptionClick(e, option.value)}
                role="option"
                aria-selected={option.value === value}
                className={`px-4 py-2 cursor-pointer hover:bg-[#FBD2B5] hover:text-[#F17922] transition-colors truncate ${
                  option.value === value ? 'bg-[#FBD2B5] text-[#F17922] font-medium' : 'text-gray-700'
                }`}
              >
                {option.label}
              </div>
            ))
          )}
        </div>,
        portalContainer
      )}
    </div>
  )
}

export default SimpleSelect
