"use client"

import { ChevronLeft, Search, LucideIcon } from 'lucide-react'
import React from 'react'
import { motion } from 'framer-motion'

interface SearchConfig {
  placeholder?: string
  buttonText?: string
  onSearch?: (value: string) => void
  realTimeSearch?: boolean  
}

interface ActionButton {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
  icon?: LucideIcon
  className?: string
  customComponent?: React.ReactNode
}

interface DashboardPageHeaderProps {
  // Mode et navigation
  mode?: 'list' | 'detail' | 'create' | 'edit'
  onBack?: () => void

  // Contenu
  title: string
  subtitle?: string


  searchConfig?: SearchConfig

  // Actions
  actions?: ActionButton[]

  // Style
  gradient?: boolean
  className?: string
}

const DashboardPageHeader = ({
  mode = 'list',
  onBack,
  title,
  subtitle,
  searchConfig,
  actions = [],
  gradient = true,
  className = ''
}: DashboardPageHeaderProps) => {
  const [searchValue, setSearchValue] = React.useState('')

  // Animations
  const containerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0 }
  }

  const handleSearch = () => {
    searchConfig?.onSearch?.(searchValue)
  }

  // ✅ Gestion de la recherche en temps réel
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);

    // Si la recherche en temps réel est activée, déclencher la recherche immédiatement
    if (searchConfig?.realTimeSearch) {
      searchConfig?.onSearch?.(value);
    }
  }

  // ✅ Gestion de la touche Entrée
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }

  const renderSearchBar = () => {
    if (!searchConfig) return null

    return (
      <div className="flex w-full -mt-2 sm:mt-0 sm:w-auto sm:flex-1 max-w-full sm:max-w-[280px] md:max-w-md py-1.5 rounded-xl sm:rounded-2xl bg-[#F5F5F5] pr-2">
        <div className="flex items-center w-full">
          <Search className="text-[#9E9E9E] ml-3 sm:ml-4" size={18} />
          <input
            type="text"
            value={searchValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={searchConfig.placeholder || "Rechercher..."}
            className="w-full px-2 sm:px-3 font-sofia-regular font-light  py-1 text-sm text-gray-700 focus:outline-none bg-transparent"
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-2 sm:px-3 py-1 text-xs cursor-pointer hover:opacity-90 text-white bg-[#F17922] rounded-lg sm:rounded-xl whitespace-nowrap"
        >
          {searchConfig.buttonText || "Chercher"}
        </button>
      </div>
    )
  }

  const renderActions = () => {
    if (actions.length === 0) return null

    return (
      <div className="flex mt-4 flex-col sm:flex-row gap-2 w-full sm:w-auto ">
        {actions.map((action, index) => {
          // Si customComponent est fourni, l'utiliser à la place du bouton par défaut
          if (action.customComponent) {
            return (
              <div key={index} className={mode === 'list' ? 'w-full sm:w-auto' : ''}>
                {action.customComponent}
              </div>
            )
          }

          return (
            <motion.button
              key={index}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={action.onClick}
              className={`
                px-3 py-1 sm:py-1 cursor-pointer text-sm font-sofia-regular font-light rounded-xl transition-colors flex items-center justify-center gap-2
                ${action.className ||
                  (action.variant === 'secondary'
                    ? 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                    : 'text-white bg-[#F17922] hover:bg-[#e06816]'
                  )}
                ${mode === 'list' ? 'w-full sm:w-auto' : ''}
              `}
            >
              {action.icon && <action.icon size={18} />}
              {action.label}
            </motion.button>
          )
        })}
      </div>
    )
  }

  return (
    <motion.nav
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`
        flex flex-col sm:flex-row items-start sm:items-center justify-between
        w-full px-3 sm:px-4 py-2 sm:py-3 bg-white mb-4 sm:mb-6
         sm:-mt-6 border border-slate-200
        rounded-b-2xl sm:rounded-3xl ${className}
      `}
    >
      <div className='flex flex-col sm:flex-row pt-5 items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto'>
        {/* Bouton retour et titre de la section*/}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {mode !== 'list' && onBack && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onBack}
              className="p-2 hover:bg-gray-100 cursor-pointer rounded-full transition-colors"
            >
              <ChevronLeft size={30} className="text-orange-500" />
            </motion.button>
          )}

          <div className="flex flex-col">
            <span className={`
              text-xl sm:text-xl lg:mt-0  font-urbanist  lg:text-3xl font-bold
              ${gradient ? 'bg-gradient-to-l from-[#FA6345] to-[#F17922] bg-clip-text text-transparent' : 'text-[#F17922]'}
            `}>
              {title}
            </span>
            {subtitle && (
              <span className="text-sm text-gray-500">
                {subtitle}
              </span>
            )}
          </div>
        </div>

        {/* Barre de recherche*/}
        {renderSearchBar()}
      </div>

      {/* Boutons d'actions */}
      {renderActions()}
    </motion.nav>
  )
}

export default DashboardPageHeader