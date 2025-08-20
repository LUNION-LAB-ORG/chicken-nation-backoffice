"use client"

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

interface AdSearchProps {
  onSearch?: (query: string) => void
  placeholder?: string
  className?: string
}

export default function AdSearch({ onSearch, placeholder = "Rechercher...", className = '' }: AdSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Effet pour gérer le debounce de la recherche
  useEffect(() => {
    // Annuler le timer précédent
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Définir un nouveau timer pour déclencher la recherche après 300ms
    debounceTimerRef.current = setTimeout(() => {
      if (onSearch && searchQuery !== undefined) {
        onSearch(searchQuery)
      }
    }, 300)

    // Nettoyer le timer lors du démontage du composant
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [searchQuery, onSearch])

  const handleSearch = () => {
    if (onSearch) {
      onSearch(searchQuery)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleClear = () => {
    setSearchQuery('')
    if (onSearch) {
      onSearch('')
    }
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  return (
    <div className={`relative ${className}`}>
      <div
        className={`flex items-center border ${isFocused ? 'border-gray-400' : 'border-gray-200'}
                   rounded-xl h-10 px-3 w-full transition-colors duration-200
                   ${isFocused ? 'bg-white shadow-sm' : 'bg-white'}`}
      >
        <button
          type="button"
          onClick={handleSearch}
          className="flex-shrink-0 mr-2"
          aria-label="Rechercher"
        >
          <Image
            src='/icons/search.png'
            alt="Rechercher"
            width={22}
            height={22}
            className='cursor-pointer hover:opacity-80 transition-opacity'
          />
        </button>

        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="flex-1 border-none outline-none text-gray-600 text-sm bg-transparent"
        />

        {searchQuery && (
          <button
            type="button"
            onClick={handleClear}
            className="text-gray-400 hover:text-gray-600 ml-1 flex-shrink-0 p-1"
            aria-label="Effacer"
          >
            <span className="text-lg font-medium">×</span>
          </button>
        )}
      </div>
    </div>
  )
}
