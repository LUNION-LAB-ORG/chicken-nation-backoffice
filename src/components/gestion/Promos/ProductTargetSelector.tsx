"use client"

import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import Checkbox from '@/components/ui/Checkbox'
import Image from 'next/image'
import { formatImageUrl } from '@/utils/imageHelpers'
import { MenuItem } from '@/types'
import { Category } from '@/services/categoryService'

type ProductTarget = 'all' | 'specific' | 'categories'

interface ProductTargetSelectorProps {
  activeProductTarget: ProductTarget
  onProductTargetChange: (target: ProductTarget) => void
  menus: MenuItem[]
  categories: Category[]
  loadingMenus: boolean
  loadingCategories: boolean
  selectedMenus: string[]
  selectedCategories: string[]
  onMenuToggle: (menuId: string) => void
  onCategoryToggle: (categoryId: string) => void
  onSelectAllMenus: () => void
  onSelectAllCategories: () => void
  getSelectedItemsDisplay: (selectedIds: string[], items: Array<{id?: string, name: string}>, maxDisplay?: number) => string | null
}

const ProductTargetSelector = ({
  activeProductTarget,
  onProductTargetChange,
  menus,
  categories,
  loadingMenus,
  loadingCategories,
  selectedMenus,
  selectedCategories,
  onMenuToggle,
  onCategoryToggle,
  onSelectAllMenus,
  onSelectAllCategories,
  // getSelectedItemsDisplay // Non utilisé actuellement
}: ProductTargetSelectorProps) => {
  const [showMenuDropdown, setShowMenuDropdown] = useState(false)
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  
  const menuDropdownRef = useRef<HTMLDivElement>(null)
  const categoryDropdownRef = useRef<HTMLDivElement>(null)

  // Effet pour fermer les dropdowns quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuDropdownRef.current && !menuDropdownRef.current.contains(event.target as Node)) {
        setShowMenuDropdown(false)
      }
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setShowCategoryDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div>
      <h3 className="text-[#F17922] font-medium mb-4">Produits ciblés</h3>
      <div className="space-y-3">
        {/* Tous les produits - Actif par défaut */}
        <button
          type="button"
          onClick={() => onProductTargetChange('all')}
          className={`w-full p-4 cursor-pointer rounded-xl flex justify-between items-center transition-colors ${
            activeProductTarget === 'all'
               ? 'bg-[#FDE9DA] border-2 border-[#F17922]'
                : 'bg-white border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <span className={`text-sm ${
              activeProductTarget === 'all' ? "text-slate-600 font-medium" : "text-gray-400"
              }`}>Tous les produits</span>
          <span className={`text-sm ${
              activeProductTarget === 'all' ? "text-slate-600 font-medium" : "text-gray-400"
              }`}>Tous les produits sont inclus</span>
        </button>

        {/* Produits spécifiques */}
        <div className="relative" ref={menuDropdownRef}>
          <button
            type="button"
            onClick={() => {
              onProductTargetChange('specific')
              setShowMenuDropdown(!showMenuDropdown)
            }}
            className={`w-full p-4 cursor-pointer rounded-xl flex justify-between items-center transition-colors ${
              activeProductTarget === 'specific'
                   ? 'bg-[#FDE9DA] border-2 border-[#F17922]'
                  : 'bg-white border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <span className={`text-sm ${
                activeProductTarget === 'specific' ? "text-slate-600 font-medium" : "text-gray-400"
                }`}>Produits spécifiques</span>
            <div className="flex items-center gap-2">
              {selectedMenus.length > 0 && (
                <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
                  {selectedMenus.length} sélectionné{selectedMenus.length > 1 ? 's' : ''}
                </span>
              )}
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showMenuDropdown ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {showMenuDropdown && activeProductTarget === 'specific' && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-80 overflow-hidden">
              {/* Header avec "Tout sélectionner" */}
              <div className="p-3 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {loadingMenus ? "Chargement..." : `${menus.length} menu${menus.length > 1 ? 's' : ''} disponible${menus.length > 1 ? 's' : ''}`}
                  </span>
                  {!loadingMenus && menus.length > 0 && (
                    <button
                      type="button"
                      onClick={onSelectAllMenus}
                      className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                    >
                      {selectedMenus.length === menus.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                    </button>
                  )}
                </div>
              </div>

              {/* Liste des menus */}
              <div className="max-h-60 overflow-y-auto">
                {loadingMenus ? (
                  <div className="px-4 py-3 text-gray-500 text-sm bg-white">Chargement des menus...</div>
                ) : menus.length === 0 ? (
                  <div className="px-4 py-3 text-gray-500 text-sm bg-white">Aucun menu disponible</div>
                ) : (
                  menus.map((menu) => (
                    <div
                      key={menu.id}
                      className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 bg-white"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                          <Image
                            src={formatImageUrl(menu.image)}
                            alt={menu.name}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/images/placeholder-food.jpg';
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">{menu.name}</div>
                          <div className="text-xs text-gray-500 truncate">{menu.description}</div>
                          <div className="text-xs text-orange-600 font-medium">{menu.price} FCFA</div>
                        </div>
                      </div>
                      <Checkbox
                        checked={selectedMenus.includes(menu.id)}
                        onChange={() => onMenuToggle(menu.id)}
                        id={`menu-${menu.id}`}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Catégories spécifiques */}
        <div className="relative" ref={categoryDropdownRef}>
          <button
            type="button"
            onClick={() => {
              onProductTargetChange('categories')
              setShowCategoryDropdown(!showCategoryDropdown)
            }}
            className={`w-full p-4 cursor-pointer rounded-xl flex justify-between items-center transition-colors ${
              activeProductTarget === 'categories'
                  ? 'bg-[#FDE9DA] border-2 border-[#F17922]'
                  : 'bg-white border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <span className={`text-sm ${
                activeProductTarget === 'categories' ? "text-slate-600 font-medium" : "text-gray-400"
                }`}>Catégories spécifiques</span>
            <div className="flex items-center gap-2">
              {selectedCategories.length > 0 && (
                <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
                  {selectedCategories.length} sélectionnée{selectedCategories.length > 1 ? 's' : ''}
                </span>
              )}
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {showCategoryDropdown && activeProductTarget === 'categories' && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-80 overflow-hidden">
              {/* Header avec "Tout sélectionner" */}
              <div className="p-3 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {loadingCategories ? "Chargement..." : `${categories.length} catégorie${categories.length > 1 ? 's' : ''} disponible${categories.length > 1 ? 's' : ''}`}
                  </span>
                  {!loadingCategories && categories.length > 0 && (
                    <button
                      type="button"
                      onClick={onSelectAllCategories}
                      className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                    >
                      {selectedCategories.length === categories.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                    </button>
                  )}
                </div>
              </div>

              {/* Liste des catégories */}
              <div className="max-h-60 overflow-y-auto">
                {loadingCategories ? (
                  <div className="px-4 py-3 text-gray-500 text-sm bg-white">Chargement des catégories...</div>
                ) : categories.length === 0 ? (
                  <div className="px-4 py-3 text-gray-500 text-sm bg-white">Aucune catégorie disponible</div>
                ) : (
                  categories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 bg-white"
                    >
                      <Checkbox
                        checked={selectedCategories.includes(category.id)}
                        onChange={() => onCategoryToggle(category.id)}
                        id={`category-${category.id}`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">{category.name}</div>
                        {category.description && (
                          <div className="text-xs text-gray-500 truncate">{category.description}</div>
                        )}
                        {category.productCount && (
                          <div className="text-xs text-orange-600 font-medium">{category.productCount} produit{category.productCount > 1 ? 's' : ''}</div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProductTargetSelector
