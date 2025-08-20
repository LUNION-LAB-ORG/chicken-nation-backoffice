import React, { useState, useRef, useEffect } from 'react' 
import { createPortal } from 'react-dom'
import Image from 'next/image'

interface Option {
  value: string
  label: string
}

interface SelectWithCheckboxesProps {
  options: Option[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  className?: string
}

const SelectWithCheckboxes = ({
  options,
  value,
  onChange,
  // placeholder = 'Sélectionner...',
  className = '',
}: SelectWithCheckboxesProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null)

  useEffect(() => {
    setPortalContainer(document.body)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
 
  }, [value, options]);

  useEffect(() => {
     if (options.length === 0) return;
    
     const validValues = value.filter(v => options.some(opt => opt.value === v));
    
     if (validValues.length !== value.length) { 
       const hasRealDifference = value.some(v => !validValues.includes(v)) || 
                               validValues.some(v => !value.includes(v));
      
      if (hasRealDifference) {
        onChange(validValues);
      } else { 
      }
    }
  }, [options, value, onChange]);

  const handleOptionClick = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue]
    onChange(newValue)
  }

 

  const renderDropdown = () => {
    if (!containerRef.current || !isOpen || !portalContainer) return null

    const rect = containerRef.current.getBoundingClientRect()
    
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
          className="absolute bg-white border border-white  rounded-b-xl shadow-lg overflow-hidden"
          style={{ 
            top: `${rect.bottom + window.scrollY}px`,
            left: `${rect.left + window.scrollX}px`,
            width: `${rect.width}px`,
            pointerEvents: 'auto'
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="py-0 max-h-60 overflow-y-auto">
            <div
              className="flex items-center justify-between px-4 py-3 bg-[#f5f5f5]
               hover:bg-[#f5f5f5] cursor-pointer border-b-2 border-white"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onChange(value.length === options.length ? [] : options.map(opt => opt.value));
                return false;
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
            >
              <span className="text-[#595959] font-regular text-[13px]">Tous les restaurants</span>
              <div className={`w-6 h-6 rounded-md ${value.length === options.length ? 'bg-[#F17922]' : 'border-2 border-gray-300'} flex items-center justify-center`}>
                {value.length === options.length && (
                  <svg width="14" height="10" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 5L5 9L13 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
            </div>
            {options.filter(opt => opt.value !== 'all').map((option, index) => (
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
                <span className="text-[#595959] font-regular text-[13px]">{option.label}</span>
                <div className={`w-6 h-6 rounded-md ${value.includes(option.value) ? 'bg-[#F17922]' : 'border-2 border-gray-300'} flex items-center justify-center`}>
                  {value.includes(option.value) && (
                    <svg width="14" height="10" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 5L5 9L13 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>,
      portalContainer
    )
  }

  return (
    <div className="relative" ref={containerRef}>
      <div
        className={`flex items-center justify-center w-full px-4 py-2 bg-[#d8d8d8] rounded-xl cursor-pointer ${className}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-center gap-2">
          <span className="text-[#595959] font-semibold text-[13px]">Sélectionnez les restaurants</span>
          <Image 
            src="/icons/down.png" 
            alt="arrow" 
            width={4} 
            height={4}
            className={`w-1 xs:w-3 xs:h-2 sm:w-4 sm:h-2 text-gray-400 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </div>
      {renderDropdown()}
    </div>
  )
}

export default SelectWithCheckboxes
