"use client"

import React, { useState, useMemo } from 'react'
import { ApiPromotion, mapApiPromotionToPromoCard } from '@/services/promotionService'
import { ChevronDown } from 'lucide-react'
import PromoDesignGridCard from './PromoDesignGridCard'
import { PromoCardData } from './PromoCard'

interface AllPromotionsProps {
  promotions: ApiPromotion[]
  onViewPromo: (promo: ApiPromotion) => void
  searchQuery?: string
}

const AllPromotions = ({
  promotions,
  onViewPromo,
  searchQuery = ''
}: AllPromotionsProps) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expired' | 'draft'>('all')
  const [filterVisibility, setFilterVisibility] = useState<'all' | 'public' | 'private'>('all')
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false)
  const [isVisibilityDropdownOpen, setIsVisibilityDropdownOpen] = useState(false)

  // Fonction pour vérifier si une promotion est expirée
  const isExpired = (promo: ApiPromotion): boolean => {
    if (promo.status === 'EXPIRED') return true
    if (promo.expiration_date) {
      const expirationDate = new Date(promo.expiration_date)
      const now = new Date()
      return expirationDate < now
    }
    return false
  }

  // Fonctions helper pour les labels des filtres
  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'all': return 'Tous les statuts'
      case 'active': return 'Actif'
      case 'expired': return 'Expiré'
      case 'draft': return 'Brouillon'
      default: return 'Tous les statuts'
    }
  }

  const getVisibilityLabel = (visibility: string): string => {
    switch (visibility) {
      case 'all': return 'Toutes visibilités'
      case 'public': return 'Public'
      case 'private': return 'Privé'
      default: return 'Toutes visibilités'
    }
  }



  // Fonction de recherche complète dans tous les champs
  const searchInAllFields = (promo: ApiPromotion, query: string): boolean => {
    if (!query.trim()) return true

    const searchTerm = query.toLowerCase().trim()

    // Fonction helper pour formater le discount pour la recherche
    const getDiscountText = (promo: ApiPromotion): string => {
      switch (promo.discount_type) {
        case 'PERCENTAGE':
          return `${promo.discount_value}% réduction pourcentage`
        case 'FIXED_AMOUNT':
          return `${promo.discount_value} XOF montant fixe`
        case 'BUY_X_GET_Y':
          return `achetez ${promo.discount_value} obtenez buy get`
        default:
          return `${promo.discount_value}`
      }
    }

    // Fonction helper pour le type de cible
    const getTargetText = (promo: ApiPromotion): string => {
      switch (promo.target_type) {
        case 'ALL_PRODUCTS':
          return 'tous les produits'
        case 'SPECIFIC_PRODUCTS':
          return 'produits spécifiques'
        case 'CATEGORIES':
          return 'catégories'
        default:
          return 'tous les produits'
      }
    }

    // Tous les champs à rechercher
    const searchableFields = [
      promo.title || '',
      promo.description || '',
      promo.status || '',
      promo.visibility || '',
      getDiscountText(promo),
      getTargetText(promo),
      promo.start_date || '',
      promo.expiration_date || '',
      // Recherche par statut en français
      promo.status === 'ACTIVE' ? 'actif' : '',
      promo.status === 'DRAFT' ? 'brouillon' : '',
      promo.status === 'EXPIRED' ? 'expiré' : '',
      // Recherche par visibilité en français
      promo.visibility === 'PUBLIC' ? 'public' : '',
      promo.visibility === 'PRIVATE' ? 'privé' : '',
      // Recherche par type de promotion en français
      promo.discount_type === 'PERCENTAGE' ? 'pourcentage' : '',
      promo.discount_type === 'FIXED_AMOUNT' ? 'montant fixe' : '',
      promo.discount_type === 'BUY_X_GET_Y' ? 'achetez obtenez' : '',
    ]

    // Vérifier si le terme de recherche est présent dans au moins un champ
    return searchableFields.some(field =>
      field.toLowerCase().includes(searchTerm)
    )
  }

  // Filtrage des promotions avec useMemo (pattern Orders)
  const filteredPromotions = useMemo(() => {
    let filtered = promotions

    // Appliquer le filtre par statut
    if (filterStatus === 'active') {
      filtered = filtered.filter(promo => !isExpired(promo) && promo.status === 'ACTIVE')
    } else if (filterStatus === 'expired') {
      filtered = filtered.filter(promo => isExpired(promo) || promo.status === 'EXPIRED')
    } else if (filterStatus === 'draft') {
      filtered = filtered.filter(promo => promo.status === 'DRAFT')
    }

    // Appliquer le filtre par visibilité
    if (filterVisibility === 'public') {
      filtered = filtered.filter(promo => promo.visibility === 'PUBLIC')
    } else if (filterVisibility === 'private') {
      filtered = filtered.filter(promo => promo.visibility === 'PRIVATE')
    }

    // Appliquer le filtre de recherche si une requête de recherche est présente
    if (searchQuery && searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(promo => {
        return searchInAllFields(promo, query)
      })
    }

    return filtered
  }, [promotions, filterStatus, filterVisibility, searchQuery])

  return (
    <div className="bg-white min-h-screen">
      {/* Filtres style Inventory */}
      <div className="bg-white border-b-2 border-gray-100  p-4 mt-4  ">
        {/* Header avec filtres */}
        <div className="flex justify-between items-center mb-6">
          {/* Compteur */}
          <span className="bg-[#F17922] text-white text-sm font-medium px-3 py-1 rounded-full">
            {filteredPromotions.length} promotion{filteredPromotions.length > 1 ? 's' : ''}
          </span>

          {/* Filtres dropdown style Inventory */}
          <div className="flex gap-3">
            {/* Filtre Statut */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                className="flex items-center space-x-2 bg-[#F4F4F5] rounded-[10px] px-4 py-2 cursor-pointer"
              >
                <span className="text-[10px] lg:text-[14px] text-[#9796A1]">
                  {getStatusLabel(filterStatus)}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </button>

              {isStatusDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-full bg-white rounded-[10px] shadow-lg py-1 z-50 min-w-[150px]">
                  {['all', 'active', 'expired', 'draft'].map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => {
                        setFilterStatus(status as 'all' | 'active' | 'expired' | 'draft');
                        setIsStatusDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2 hover:text-[#F17922] cursor-pointer text-left text-[10px] lg:text-[14px] text-gray-900 hover:bg-gray-50"
                    >
                      {getStatusLabel(status)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Filtre Visibilité */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsVisibilityDropdownOpen(!isVisibilityDropdownOpen)}
                className="flex items-center space-x-2 bg-[#F4F4F5] rounded-[10px] px-4 py-2 cursor-pointer"
              >
                <span className="text-[10px] lg:text-[14px] text-[#9796A1]">
                  {getVisibilityLabel(filterVisibility)}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </button>

              {isVisibilityDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-full bg-white rounded-[10px] shadow-lg py-1 z-50 min-w-[150px]">
                  {['all', 'public', 'private'].map((visibility) => (
                    <button
                      key={visibility}
                      type="button"
                      onClick={() => {
                        setFilterVisibility(visibility as 'all' | 'public' | 'private');
                        setIsVisibilityDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2 hover:text-[#F17922] cursor-pointer text-left text-[10px] lg:text-[14px] text-gray-900 hover:bg-gray-50"
                    >
                      {getVisibilityLabel(visibility)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grille des promotions avec cards custom */}
      <div className="p-6">
        {filteredPromotions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📢</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune promotion trouvée</h3>
            <p className="text-gray-500">
              {searchQuery.trim() || filterStatus !== 'all' || filterVisibility !== 'all'
                ? 'Essayez de modifier vos critères de recherche ou filtres'
                : 'Aucune promotion disponible pour le moment'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPromotions.map((promo) => {
              // Convertir ApiPromotion vers PromoCardData pour PromoDesignGridCard
              const promoCardData: PromoCardData = mapApiPromotionToPromoCard(promo)

              return (
                <PromoDesignGridCard
                  key={promo.id}
                  promo={promoCardData}
                  onClick={() => onViewPromo(promo)}
                  className="h-full"
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default AllPromotions
