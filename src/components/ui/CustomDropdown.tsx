"use client"

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface CustomDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
  dropdownClassName?: string;
}

export function CustomDropdown({
  options,
  value,
  onChange,
  placeholder = "Sélectionner...",
  label,
  disabled = false,
  className = "",
  dropdownClassName = ""
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fermer le dropdown quand on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Trouver l'option sélectionnée
  const selectedOption = options.find(option => option.value === value);

  const handleOptionClick = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full md:px-4 md:py-4 px-3 py-3 text-left bg-white border border-gray-300 rounded-xl 
          focus:outline-none focus:ring-2 focus:ring-[#F17922] focus:border-[#F17922] 
          transition-all duration-200 flex items-center justify-between
          ${disabled 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : 'hover:border-gray-400 cursor-pointer'
          }
          ${isOpen ? 'ring-2 ring-[#F17922] border-[#F17922]' : ''}
        `}
      >
        <div className="flex items-center gap-2">
          {selectedOption?.icon && selectedOption.icon}
          <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown 
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'transform rotate-180' : ''
          }`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && !disabled && (
        <div className={`
          absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg 
          max-h-60 overflow-auto ${dropdownClassName}
        `}>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleOptionClick(option.value)}
              className={`
                w-full px-3 py-2 text-left flex items-center justify-between gap-2 
                hover:bg-gray-50 transition-colors duration-150
                ${option.value === value 
                  ? 'bg-[#FFF8EE] text-[#F17922] font-medium' 
                  : 'text-gray-700'
                }
                ${option === options[0] ? 'rounded-t-lg' : ''}
                ${option === options[options.length - 1] ? 'rounded-b-lg' : ''}
              `}
            >
              <div className="flex items-center gap-2">
                {option.icon && option.icon}
                <span>{option.label}</span>
              </div>
              {option.value === value && (
                <Check className="w-4 h-4 text-[#F17922]" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 