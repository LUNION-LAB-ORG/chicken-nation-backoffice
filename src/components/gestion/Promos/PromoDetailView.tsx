"use client"

import React, { useState } from 'react'
import { ApiPromotion } from '@/services/promotionService'
import { Edit, Trash2, Share, Calendar, Target, Palette, Eye, Users } from 'lucide-react'
import styles from './PromoDetailView.module.css'
import Image from 'next/image'
import PromoDeleteModal from './PromoDeleteModal'
import { formatPromotionImageUrl } from '@/utils/imageHelpers'
import { useRBAC } from '@/hooks/useRBAC'

interface PromoDetailViewProps {
  promo: ApiPromotion
  onEdit?: (promo: ApiPromotion) => void
  onDelete?: (promo: ApiPromotion) => void
  onDuplicate?: (promo: ApiPromotion) => void
  onBack?: () => void
  className?: string
}

const PromoDetailView = ({
  promo,
  onEdit,
  onDelete,
  className = ''
}: PromoDetailViewProps) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const { canUpdateOffreSpeciale, canDeleteOffreSpeciale } = useRBAC()
 



  // Cast temporaire pour utiliser les vraies données de l'API
  const promoData = promo as ApiPromotion & {
    type: string;
    discount: number;
    target_type: string;
    status: string;
    background: string;
    textColor: string;
    validUntil: string;
    current_usage?: number;
  };    
  
  const getDiscountText = () => {
     if (promo.discount_type === 'PERCENTAGE') {
      return `${promo.discount_value || promoData.discount || 0}%`
    } else if (promo.discount_type === 'FIXED_AMOUNT' || promoData.type === 'fixed_amount') {
      return `${promo.discount_value || promoData.discount || 0} FCFA`
    } else if (promo.discount_type === 'BUY_X_GET_Y' || promoData.type === 'buy_x_get_y') {
      return `Achetez ${promo.discount_value || promoData.discount || 1}`
    }
    return `${promo.discount_value || promoData.discount || 0}%`
  }

   const formatExpirationDate = (dateString?: string) => {
    if (!dateString) return 'N/A'

    try {
      const date = new Date(dateString)
      // Vérifier si la date est valide
      if (isNaN(date.getTime())) {
        console.warn('Date invalide reçue:', dateString)
        return 'Date invalide'
      }

      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    } catch (error) {
      console.error('Erreur lors du formatage de la date:', error, dateString)
      return 'Erreur de date'
    }
  }

  // Fonction pour formater le type de cible
  const getTargetTypeText = () => {
    switch (promoData.target_type) {
      case 'ALL_PRODUCTS':
        return 'Tous les produits'
      case 'SPECIFIC_PRODUCTS':
        return 'Produits spécifiques'
      case 'CATEGORIES':
        return 'Catégories'
      default:
        return 'Tous les produits'
    }
  }  
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Date non définie'

    try {
      const date = new Date(dateString)
      // Vérifier si la date est valide
      if (isNaN(date.getTime())) {
        console.warn('Date invalide reçue:', dateString)
        return 'Date invalide'
      }

      return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch (error) {
      console.error('Erreur lors du formatage de la date:', error, dateString)
      return 'Erreur de date'
    }
  }  // Fonction pour déterminer le statut de la promotion

  const getPromotionStatus = () => {
    // ✅ CORRIGÉ : Utiliser directement promo.status de l'API
    if (promo.status) {
      switch (promo.status) {
        case 'ACTIVE':
          return { text: 'Actif', icon: '🟢', className: 'text-green-600 font-semibold' }
        case 'DRAFT':
          return { text: 'Brouillon', icon: '🟡', className: 'text-yellow-600 font-semibold' }
        case 'EXPIRED':
          return { text: 'Expiré', icon: '🔴', className: 'text-red-600 font-semibold' }
        case 'UPCOMING':
          return { text: 'À venir', icon: '🟡', className: 'text-blue-600 font-semibold' }
        default:
          return { text: 'Inconnu', icon: '⚪', className: 'text-gray-600 font-semibold' }
      }
    }

    // ✅ Fallback : Si pas de statut API, calculer basé sur les dates
    const now = new Date()
    const startDate = new Date(promo.start_date || Date.now())
    const endDate = new Date(promo.expiration_date || '')

    if (now < startDate) {
      return { text: 'À venir', icon: '🟡', className: 'text-blue-600 font-semibold' }
    } else if (now > endDate) {
      return { text: 'Expiré', icon: '🔴', className: 'text-red-600 font-semibold' }
    } else {
      return { text: 'Actif', icon: '🟢', className: 'text-green-600 font-semibold' }
    }
  }
    const statusInfo = getPromotionStatus()

    return (    <div className={`bg-white min-h-screen ${className}`}>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 p-8 max-w-7xl mx-auto">
        {/* Section gauche - Prévisualisation et cards supplémentaires */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-6 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-200">
            <div className="p-2 bg-[#F17922] rounded-lg ">
              <Eye className="text-white" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Aperçu du coupon</h3>
              <p className="text-sm text-gray-600 font-medium">Prévisualisation en temps réel</p>
            </div>
          </div>

          {/* Prévisualisation du coupon avec design épuré */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200     transition-all duration-300 rounded-3xl p-8">
            <div
              className={`w-full h-max-width xl:h-58 lg:h-50 md:h-45 sm:h-50 xs:h-45 rounded-3xl p-6 relative overflow-hidden border-4 ${styles.promoCard}`}                ref={(el) => {
                if (el) {
                  // Use consistent field names for background and text color
                  el.style.setProperty('--card-background-color', promo.background_color || promoData.background || '#F17922');
                  el.style.setProperty('--card-border-color', promo.text_color || promoData.textColor || '#FFFFFF');
                  el.style.setProperty('--circle-background-color', promo.text_color || promoData.textColor || '#FFFFFF');
                  el.style.setProperty('--discount-text-color', promo.text_color || promoData.textColor || '#FFFFFF');
                  el.style.setProperty('--expiration-text-color', promo.text_color || promoData.textColor || '#FFFFFF');
                }
              }}
            >
              {/* Icône cube 3D avec Image */}
              <div className="absolute inset-0 w-full h-full overflow-hidden">
                <Image
                  src="/icons/cube_3d.svg"
                  alt="Cube 3D"
                  fill
                  className="object-cover "
                  style={{
                    filter: `brightness(0) saturate(100%) invert(${promo.text_color === '#FFFFFF' ? '100%' : '0%'})`,
                    opacity: 1,
                  }}
                />
              </div>

              {/* Badge "Visibilité" en haut à droite */}
              <div className="absolute top-4 right-4 z-10">
                <div className="bg-white rounded-xl lg:px-2 md:px-1 sm:px-2 sm:py-2 2xl:px-4 xl:px-4 2xl:py-1 py-[1px] px-1 xl:py-[1px] shadow-sm">
                  <span className="text-orange-500 2xl:text-xs lg:text-[10px] text-xs font-medium">{promo.visibility || 'PUBLIC'}</span>
                </div>
              </div>

              {/* Contenu texte en position absolue */}
              <div className="relative z-10">
                {/* Section du titre - Titre de la promotion au lieu du pourcentage */}
                <div className="mb-4">                  <div
                    className={`2xl:text-[60px] xl:text-4xdel lg:text-4xl md:text-lg sm:text-md font-blocklyn-grunge font-black leading-none ${styles.discountText} ${styles.formattedTitle}`}
                  >
                    <span className="2xl:text-4xl lg:text-3xl xl:text-4xl sm:text-2xl xs:text-xl">{promo.title}</span>
                  </div>                  <div
                    className={`2xl:text-1xl xl:text-xs lg:text-[10px] font-blocklyn-grunge tracking-wider mt-2 ${styles.discountSubtext}
                      ${styles.formattedDescription}`}
                  >
                   <span className="lg:text-xl md:text-lg sm:-md: xs-text:xs">{promo.description}</span>
                  </div>

                </div>

                {/* Section expiration en bas */}
                <div className="absolute 2xl:top-20 xl:top-22 lg:top-8 md:top-10 sm:top-10 top-8 left-0">
                  <div
                    className={`text-xl 2xl:mt-22 xl:mt-20 md:mt-18 mt-20 sm:mt-24 z-99 md:text-sm xs:mt-0 sm:text-xs font-medium ${styles.expirationText}`}
                  >
                    Expire le {formatExpirationDate(promo.expiration_date || promoData.validUntil)}
                  </div>
                </div>
              </div>
                {/* Image positionnée à droite et en bas, légèrement immergée */}
              {promo.coupon_image_url && (
                <div className="absolute -bottom-1 -mt-4 -right-1 w-16 h-16 sm:w-28 sm:h-28 md:w-24 md:h-24 lg:w-35 lg:h-35 xl:w-40 xl:h-40 2xl:w-55 2xl:h-46">
                  <Image
                    src={formatPromotionImageUrl(promo.coupon_image_url)}
                    alt={promo.title || 'Promo'}
                    className="w-full h-full object-contain"
                    width={200}
                    height={200}
                    onError={(e) => {
                      console.warn('Erreur de chargement de l\'image de promo:', promo.coupon_image_url); 
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              {/* Masques circulaires - positionnés plus haut */}
              {/* Cercle gauche */}
              <div className={styles.circleLeft}></div> 
              <div className={styles.circleRight}></div>

              {/*  Indicateur de statut utilisant le vrai statut */}
              {promo.status === 'EXPIRED' && (
                <div className="absolute inset-0 bg-black/50 rounded-3xl flex items-center justify-center">
                  <span className="text-white font-bold text-xs sm:text-sm">EXPIRÉ</span>
                </div>
              )}
              {promo.status === 'UPCOMING' && (
                <div className="absolute inset-0 bg-blue-500/50 rounded-3xl flex items-center justify-center">
                  <span className="text-white font-bold text-xs sm:text-sm">À VENIR</span>
                </div>
              )}
              {promo.status === 'DRAFT' && (
                <div className="absolute inset-0 bg-yellow-500/50 rounded-3xl flex items-center justify-center">
                  <span className="text-white font-bold text-xs sm:text-sm">BROUILLON</span>
                </div>
              )}
            </div>
          </div>

          {(promo.target_standard || promo.target_premium || promo.target_gold) && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-xs">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center gap-3">
                <div className="p-2 bg-[#F17922] rounded-lg">
                  <Users className="text-white" size={18} />
                </div>
                <h4 className="text-sm font-bold text-gray-900">Cibles utilisateurs</h4>
              </div>
              <div className="p-6 flex flex-wrap gap-3">
                {/* Standard - toujours affiché */}
                <div className={`flex items-center gap-3 px-4 py-2 rounded-lg border ${
                  promo.visibility === 'PRIVATE'
                    ? 'bg-gray-100 text-gray-400 border-gray-300 opacity-50'
                    : promo.target_standard
                      ? 'bg-gray-50 text-gray-800 border-gray-200'
                      : 'bg-gray-100 text-gray-400 border-gray-300 opacity-50'
                }`}>
                  <span className="text-lg">⭐</span>
                  <span className="font-medium">Standard</span>
                </div>

                {/* Premium - toujours affiché */}
                <div className={`flex items-center gap-3 px-4 py-2 rounded-lg ${
                  promo.visibility === 'PRIVATE'
                    ? 'bg-gray-100 text-gray-400 border border-gray-300 opacity-50'
                    : promo.target_premium
                      ? 'bg-[#F17922] text-white'
                      : 'bg-gray-100 text-gray-400 border border-gray-300 opacity-50'
                }`}>
                  <span className="text-lg">💎</span>
                  <span className="font-medium">Premium</span>
                </div>

                {/* Gold - toujours affiché */}
                <div className={`flex items-center gap-3 px-4 py-2 rounded-lg ${
                  promo.visibility === 'PRIVATE'
                    ? 'bg-gray-100 text-gray-400 border border-gray-300 opacity-50'
                    : promo.target_gold
                      ? 'bg-gray-800 text-white'
                      : 'bg-gray-100 text-gray-400 border border-gray-300 opacity-50'
                }`}>
                  <span className="text-lg">👑</span>
                  <span className="font-medium">Gold</span>
                </div>
              </div>
            </div>
          )}
          <div className="bg-white rounded-lg border border-gray-200 shadow-xs">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center gap-3">
              <div className="p-2 bg-[#F17922] rounded-lg">
                <Target className="text-white" size={18} />
              </div>
              <h4 className="text-sm font-bold text-gray-900">Contraintes et limites</h4>
            </div>            <div className="p-6 space-y-4">
              {promo.max_total_usage && (
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg   ">
                  <div className="w-12 h-12 bg-[#F17922] rounded-lg flex items-center justify-center text-xl text-white">📊</div>
                  <div className="flex-1 flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Usage total maximum</span>
                    <span className="text-sm font-bold text-gray-900 bg-white px-3 py-1 rounded border border-gray-200">{promo.max_total_usage}</span>
                  </div>
                </div>
              )}

              {promo.max_usage_per_user && (
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg ">
                  <div className="w-12 h-12 bg-[#F17922] rounded-lg flex items-center justify-center text-xl text-white">​🧑‍🦰​</div>
                  <div className="flex-1 flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Usage par utilisateur</span>
                    <span className="text-sm font-bold text-gray-900 bg-white px-3 py-1 rounded border border-gray-200">{promo.max_usage_per_user}</span>
                  </div>
                </div>
              )}

              {promo.min_order_amount && (
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg ">
                  <div className="w-12 h-12 bg-[#F17922] rounded-lg flex items-center justify-center text-xl text-white">💰</div>
                  <div className="flex-1 flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Montant minimum</span>
                    <span className="text-sm font-bold text-gray-900 bg-white px-3 py-1 rounded border border-gray-200">{promo.min_order_amount} FCFA</span>
                  </div>
                </div>
              )}

              {promo.max_discount_amount && (
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg  ">
                  <div className="w-12 h-12 bg-[#F17922] rounded-lg flex items-center justify-center text-xl text-white">🎯</div>
                  <div className="flex-1 flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Réduction maximum</span>
                    <span className="text-sm font-bold text-gray-900 bg-white px-3 py-1 rounded border border-gray-200">{promo.max_discount_amount} FCFA</span>
                  </div>
                </div>
              )}

              {promo.current_usage !== undefined && (
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg ">
                  <div className="w-12 h-12 bg-[#F17922] rounded-lg flex items-center justify-center text-xl text-white">📈</div>
                  <div className="flex-1 flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Utilisation actuelle</span>
                    <span className="text-sm font-bold text-gray-900 bg-white px-3 py-1 rounded border border-gray-200">{promo.current_usage}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-xs">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center gap-3">
              <div className="p-2 bg-[#F17922] rounded-lg text-lg">
                🛠️
              </div>
              <h4 className="text-sm font-bold text-gray-900">Actions disponibles</h4>
            </div>
            <div className="p-3 sm:p-6 flex flex-col sm:flex-row gap-2 sm:gap-3">
              {/* Bouton Modifier - conditionnel RBAC */}
              {onEdit && canUpdateOffreSpeciale() && (
                <button
                  onClick={() => onEdit(promo)}
                  className="flex items-center justify-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 bg-[#F17922] text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium hover:bg-[#E06A1B] transition-colors duration-200 flex-1 sm:flex-none"
                >
                  <Edit size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span className="hidden xs:inline sm:inline">Modifier</span>
                  <span className="hidden sm:inline">la promotion</span>
                </button>
              )}

              <button
                onClick={() => navigator.share?.({
                  title: promo.title,
                  text: promo.description
                })}
                className="flex items-center justify-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 bg-green-500 text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium hover:bg-green-600 transition-colors duration-200 flex-1 sm:flex-none"
              >
                <Share size={16} className="sm:w-[18px] sm:h-[18px]" />
                <span>Partager</span>
              </button>

              {/* Bouton Supprimer - conditionnel RBAC */}
              {onDelete && canDeleteOffreSpeciale() && (
                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="flex items-center justify-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 bg-gray-100 border border-gray-200 text-gray-700 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium hover:bg-gray-200 transition-colors duration-200 flex-1 sm:flex-none"
                >
                  <Trash2 size={16} className="sm:w-[18px] sm:h-[18px] text-red-500" />
                  <span className="text-gray-600">Supprimer</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Section droite - Informations détaillées */}
        <div className="space-y-6">
          {/* Header avec icône et titre */}
          <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-[#F17922] to-[#FA6345] rounded-2xl text-white shadow-xs relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-white/10 transform -translate-x-full group-hover:translate-x-full transition-transform duration-500"></div>
            <div className="bg-white/20 p-3 rounded-xl relative z-10 group-hover:rotate-3 transition-transform">
              <Target size={28} />
            </div>
            <div className="relative z-10">
              <h3 className="text-2xl font-bold">Informations détaillées</h3>
              <p className="text-white/90 text-sm">Toutes les informations de votre promotion</p>
            </div>
          </div>

          {/* Card principale avec informations essentielles */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs">
            <div className="px-6 py-4 border-b border-gray-100">
              <h4 className="text-lg font-semibold text-gray-900">Informations principales</h4>
            </div>
            <div className="p-6">
              {/* Grid des informations principales */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-xs font-medium text-gray-500 mb-1">TITRE</label>
                  <p className="text-sm font-semibold text-gray-900 truncate">{promo.title}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-xs font-medium text-gray-500 mb-1">TYPE</label>
                  <p className="text-sm font-semibold text-gray-900">
                    {promo.discount_type === 'PERCENTAGE' ? 'Pourcentage' :
                     promo.discount_type === 'FIXED_AMOUNT' ? 'Montant fixe' :
                     promo.discount_type === 'BUY_X_GET_Y' ? 'Achetez X obtenez Y' :
                     'Type inconnu'}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-xs font-medium text-gray-500 mb-1">VALEUR</label>
                  <p className="text-sm font-bold text-gray-900">{getDiscountText()}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-xs font-medium text-gray-500 mb-1">CIBLE</label>
                  <p className="text-sm font-semibold text-gray-900">{getTargetTypeText()}</p>
                </div>
              </div>

              {/* Description si elle existe */}
              {promo.description && (
                <div className="border-t border-gray-100 pt-6">
                  <label className="block text-xs font-medium text-gray-500 mb-2">DESCRIPTION</label>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700 leading-relaxed">{promo.description}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Dates et validité avec design moderne */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs hover:shadow-xs transition-shadow">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center gap-3">
              <Calendar className="text-[#F17922]" size={20} />
              <h4 className="text-sm font-semibold text-gray-900">Dates et validité</h4>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-lg shadow-xs">📅</div>
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Date de début</div>
                  <div className="text-sm font-medium text-gray-900">{formatDate(promo.start_date)}</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-lg  ">⏰</div>
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Date d&apos;expiration</div>
                  <div className="text-sm font-medium text-gray-900">{formatDate(promo.expiration_date || promoData.validUntil)}</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-lg ">{statusInfo.icon}</div>
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Statut</div>
                  <div className={`text-sm font-medium ${statusInfo.className}`}>
                    {statusInfo.text}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-lg  ">👁️</div>
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Visibilité</div>
                  <div className="text-sm font-medium text-gray-900">{promo.visibility || 'PUBLIC'}</div>
                </div>
              </div>
            </div>


            </div>
              <div className="bg-white rounded-lg border border-gray-200 shadow-xs">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center gap-3">
              <div className="p-2 bg-[#F17922] rounded-lg">
                <Palette className="text-white" size={18} />
              </div>
              <h4 className="text-sm font-bold text-gray-900">Couleurs du design</h4>
            </div>
            <div className="p-6 grid grid-cols-1 gap-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg  ">
                <div
                  className={`w-14 h-14 rounded-lg border-2 border-white shadow-xs ${styles.colorSwatch}`}
                  ref={(el) => {
                    if (el) {
                      el.style.setProperty('--swatch-color', promoData.background || '#F17922');
                    }
                  }}
                ></div>
                <div className="flex-1">
                  <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">🎨 Couleur de fond</span>
                  <span className="text-sm font-bold text-gray-900 font-mono bg-white px-3 py-1 rounded border border-gray-200">{promoData.background || '#F17922'}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg  ">
                <div
                  className={`w-14 h-14 rounded-lg border-2 border-white shadow-xs ${styles.colorSwatch}`}
                  ref={(el) => {
                    if (el) {
                      el.style.setProperty('--swatch-color', promoData.textColor || '#FFFFFF');
                    }
                  }}
                ></div>
                <div className="flex-1">
                  <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">✍️ Couleur du texte</span>
                  <span className="text-sm font-bold text-gray-900 font-mono bg-white px-3 py-1 rounded border border-gray-200">{promoData.textColor || '#FFFFFF'}</span>
                </div>
              </div>
            </div>          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      <PromoDeleteModal
        open={isDeleteModalOpen}
        promo={promo}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => {
          setIsDeleteModalOpen(false)
          onDelete?.(promo)
        }}
      />
    </div>
  )
}

export default PromoDetailView
