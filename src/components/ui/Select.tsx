import Image from 'next/image'
import React, { useState, useRef, useEffect } from 'react'

interface Option {
  value: string
  label: string
}

interface SelectProps {
  options: Option[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

const Select = ({ options, value, onChange, placeholder, className }: SelectProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const selectRef = useRef<HTMLDivElement>(null)
  const selectedOption = options.find(option => option.value === value)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <>
      <style jsx>{`
        .dropdown-enter {
          opacity: 0;
          transform: translateY(-8px);
        }
        .dropdown-enter-active {
          opacity: 1;
          transform: translateY(0);
          transition: opacity 200ms, transform 200ms;
        }
      `}</style>
      
      <div ref={selectRef} className="relative w-full">
        <div
          role="button"
          tabIndex={0}
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setIsOpen(!isOpen)
            }
          }}
          className={`relative w-full flex items-center justify-between px-2 xs:px-3 sm:px-4 py-1.5 
            xs:py-2 sm:py-3 bg-white border border-[#D8D8D8] rounded-lg xs:rounded-xl sm:rounded-2xl text-left focus:outline-none cursor-pointer ${className}`}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className="block truncate text-xs xs:text-sm text-gray-700 pr-2 min-w-0">
            {selectedOption ? selectedOption.label : placeholder || "Choisissez une catégorie"}
          </span>
          <Image 
            src="/icons/down.png" 
            alt="arrow" 
            width={4} 
            height={4}
            className={`w-1 xs:w-3 xs:h-2 sm:w-4 sm:h-2 text-gray-400 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>

        {isOpen && (
          <div 
            className="absolute z-50 w-full mt-1 bg-white rounded-lg xs:rounded-xl sm:rounded-2xl max-h-48 xs:max-h-52 sm:max-h-60 overflow-auto border border-gray-200 shadow-lg animate-slideDown"
            role="listbox"
          >
            {options.map((option) => (
              <div
                key={option.value}
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
                role="option"
                aria-selected={option.value === value}
                className={`px-2 xs:px-3 sm:px-4 py-1.5 xs:py-2 sm:py-3 text-xs xs:text-sm cursor-pointer hover:bg-[#FBD2B5] hover:text-[#F17922] transition-colors truncate ${
                  option.value === value ? 'bg-[#FBD2B5] text-[#F17922] font-medium' : 'text-gray-900'
                }`}
              >
                {option.label}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

export default Select 