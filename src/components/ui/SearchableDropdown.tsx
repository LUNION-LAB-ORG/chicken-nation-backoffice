"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, X, Loader2, Check } from 'lucide-react';
import Image from 'next/image';
import { formatImageUrl } from '@/utils/imageHelpers';

interface Option {
  id: string;
  label: string;
  email?: string;
  phone?: string;
  image?: string;
}

interface SearchableDropdownProps {
  label: string;
  placeholder: string;
  options: Option[];
  value?: string | string[];
  onChange: (value: string | string[]) => void;
  isLoading?: boolean;
  onSearchChange?: (search: string) => void;
  className?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  multiSelect?: boolean;
}

export function SearchableDropdown({
  label,
  placeholder,
  options,
  value,
  onChange,
  isLoading = false,
  onSearchChange,
  className = "",
  error,
  required = false,
  disabled = false,
  multiSelect = false
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [displayValue, setDisplayValue] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fermer le dropdown quand on clique ailleurs
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Mettre à jour l'affichage quand la valeur change
  useEffect(() => {
    if (multiSelect) {
      const selectedValues = Array.isArray(value) ? value : [];
      if (selectedValues.length === 0) {
        setDisplayValue('');
      } else if (selectedValues.length === 1) {
        const selectedOption = options.find(option => option.id === selectedValues[0]);
        setDisplayValue(selectedOption ? selectedOption.label : '');
      } else {
        setDisplayValue(`${selectedValues.length} participants sélectionnés`);
      }
    } else {
      const selectedOption = options.find(option => option.id === value);
      setDisplayValue(selectedOption ? selectedOption.label : '');
      if (selectedOption) {
        setSearchTerm(selectedOption.label);
      }
    }
  }, [value, options, multiSelect]);

  // Filtrer les options selon la recherche
  const filteredOptions = searchTerm.trim() 
    ? options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (option.email && option.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (option.phone && option.phone.includes(searchTerm))
      )
    : options;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    
    if (!multiSelect) {
      setDisplayValue(newSearchTerm);
      
      // Si le champ est vidé, réinitialiser la sélection
      if (!newSearchTerm.trim()) {
        onChange('');
      }
    }
    
    // Ouvrir le dropdown si pas encore ouvert
    if (!isOpen) {
      setIsOpen(true);
    }

    // Callback pour la recherche externe (avec debounce géré par le parent)
    if (onSearchChange) {
      onSearchChange(newSearchTerm);
    }
  };

  const handleOptionSelect = (option: Option) => {
    if (multiSelect) {
      const currentValues = Array.isArray(value) ? value : [];
      const isSelected = currentValues.includes(option.id);
      
      if (isSelected) {
        // Déselectionner
        const newValues = currentValues.filter(id => id !== option.id);
        onChange(newValues);
      } else {
        // Sélectionner
        const newValues = [...currentValues, option.id];
        onChange(newValues);
      }
      
      // Ne pas fermer le dropdown en mode multi-select
    } else {
      // Mode simple - sélectionner et fermer
      onChange(option.id);
      setDisplayValue(option.label);
      setSearchTerm(option.label);
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    if (multiSelect) {
      onChange([]);
    } else {
      onChange('');
    }
    setDisplayValue('');
    setSearchTerm('');
    setIsOpen(false);
  };

  const isSelected = (optionId: string): boolean => {
    if (multiSelect) {
      const selectedValues = Array.isArray(value) ? value : [];
      return selectedValues.includes(optionId);
    } else {
      return value === optionId;
    }
  };

  const toggleDropdown = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Label */}
      <label className="block md:text-sm text-xs font-medium text-black mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Champ de recherche/sélection */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 md:pl-4 pl-3 flex items-center pointer-events-none">
          <Search className="md:h-5 md:w-5 h-4 w-4 text-gray-400" />
        </div>
        
        <input
          type="text"
          value={isOpen ? searchTerm : displayValue}
          onChange={handleSearchChange}
          onFocus={() => {
            if (!disabled) {
              setIsOpen(true);
              // En mode multi-select, vider le champ de recherche quand on focus
              if (multiSelect) {
                setSearchTerm('');
              } else {
                // En mode simple, mettre le terme de recherche égal à la valeur affichée
                setSearchTerm(displayValue);
              }
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            block w-full md:pl-12 pl-10 md:pr-12 pr-10 md:py-4 py-3 
            border rounded-xl md:text-sm text-xs text-black placeholder-gray-400 
            focus:outline-none focus:ring-2 focus:ring-primary-500 
            ${error ? 'border-red-500' : 'border-gray-300'} 
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
            transition-colors
          `}
        />

        {/* Loading spinner   */}
        <div className="absolute inset-y-0 right-0 flex items-center md:pr-4 pr-3">
          {isLoading ? (
            <Loader2 className="md:h-5 md:w-5 h-4 w-4 text-gray-400 animate-spin" />
          ) : (
            <div className="flex items-center space-x-2">
              {((!multiSelect && value) || (multiSelect && Array.isArray(value) && value.length > 0)) && (
                <button 
                  type="button"
                  onClick={handleClear}
                  title="Effacer la sélection"
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="md:h-4 md:w-4 h-3 w-3" />
                </button>
              )}
              <button
                type="button"
                onClick={toggleDropdown}
                title={isOpen ? "Fermer la liste" : "Ouvrir la liste"}
                className="text-gray-400 hover:text-gray-600"
              >
                <ChevronDown className={`md:h-5 md:w-5 h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Message d'erreur */}
      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}

      {/* Dropdown des options */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 text-primary-500 animate-spin" />
              <span className="ml-2 text-sm text-gray-500">Recherche...</span>
            </div>
          ) : filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <div
                key={option.id}
                onClick={() => handleOptionSelect(option)}
                className={`
                  px-4 py-3 cursor-pointer hover:bg-gray-50 flex items-center space-x-3
                  ${isSelected(option.id) ? 'bg-orange-50 text-orange-600' : 'text-black'}
                  border-b border-gray-100 last:border-b-0
                `}
              >
                {/* Checkbox pour multi-select */}
                {multiSelect && (
                  <div className={`
                    w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0
                    ${isSelected(option.id) 
                      ? 'bg-primary-500 border-primary-500 text-white' 
                      : 'border-gray-300 bg-white'
                    }
                  `}>
                    {isSelected(option.id) && (
                      <Check className="w-3 h-3" />
                    )}
                  </div>
                )}

                {/* Avatar ou initiales */}
                <div className="w-8 h-8 rounded-full overflow-hidden bg-primary-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {option.image && formatImageUrl(option.image) ? (
                    <Image
                      src={formatImageUrl(option.image)}
                      alt={option.label}
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Masquer l'image et laisser l'initiale s'afficher
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        // Forcer le re-render en modifiant la source
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `<span class="text-xs font-medium">${option.label.charAt(0).toUpperCase()}</span>`;
                        }
                      }}
                    />
                  ) : (
                    <span className="text-xs font-medium">
                      {option.label.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                
                {/* Informations */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {option.label}
                  </div>
                  {(option.email || option.phone) && (
                    <div className="text-xs text-gray-600 truncate">
                      {option.email && <span>{option.email}</span>}
                      {option.email && option.phone && <span> • </span>}
                      {option.phone && <span>{option.phone}</span>}
                    </div>
                  )}
                </div>

                {/* Indicateur de sélection pour mode simple */}
                {!multiSelect && value === option.id && (
                  <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0" />
                )}
              </div>
            ))
          ) : searchTerm.trim() ? (
            <div className="px-4 py-8 text-center text-sm text-black">
              Aucun résultat trouvé pour &quot;{searchTerm}&quot;
            </div>
          ) : options.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-black">
              Aucune option disponible
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-sm text-black">
              Tapez pour rechercher...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
