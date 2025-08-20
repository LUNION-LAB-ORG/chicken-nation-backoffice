"use client"

import React from 'react'
import { ApiPromotion } from '@/services/promotionService'

interface PromoStatsProps {
  className?: string
  promotions?: ApiPromotion[] // ✅ AJOUT : Données dynamiques du backend
  onViewAllPromotions?: () => void // ✅ AJOUT : Callback pour "Voir tous"
}

interface PromoItem {
  discount: string
  description: string
  expiry: string
  category: string
  badge: string
  salesCount?: number // ✅ AJOUT : Pour les statistiques de ventes
}

interface StatSection {
  title: string
  items: PromoItem[]
  totalCount?: number // ✅ AJOUT : Nombre total pour chaque section
}

const PromoStats = ({ className = '', promotions = [], onViewAllPromotions }: PromoStatsProps) => {
  // ✅ FONCTIONS HELPER POUR CALCULER LES STATISTIQUES DYNAMIQUES

  // Fonction pour vérifier si une promotion est expirée
  const isExpired = (promo: ApiPromotion): boolean => {
    if (promo.status === 'EXPIRED') return true;
    if (promo.expiration_date) {
      const expirationDate = new Date(promo.expiration_date);
      const now = new Date();
      return expirationDate < now;
    }
    return false;
  };

  // Fonction pour formater le discount
  const formatDiscount = (promo: ApiPromotion): string => {
    switch (promo.discount_type) {
      case 'PERCENTAGE':
        return `Réduction de ${promo.discount_value}%`;
      case 'FIXED_AMOUNT':
        return `Réduction de ${promo.discount_value} XOF`;
      case 'BUY_X_GET_Y':
        return `Achetez ${promo.discount_value}, obtenez 1`;
      default:
        return `Réduction de ${promo.discount_value}%`;
    }
  };

  // Fonction pour formater la date d'expiration
  const formatExpiry = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return `Expire le ${date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })}`;
    } catch {
      return 'Date d\'expiration invalide';
    }
  };

  // Fonction pour déterminer la catégorie cible
  const getTargetCategory = (promo: ApiPromotion): string => {
    switch (promo.target_type) {
      case 'ALL_PRODUCTS':
        return 'Tous les produits';
      case 'SPECIFIC_PRODUCTS':
        return `${promo.targeted_dish_ids?.length || 0} produit(s) spécifique(s)`;
      case 'CATEGORIES':
        return `${promo.targeted_category_ids?.length || 0} catégorie(s)`;
      default:
        return 'Tous les produits';
    }
  };

  // Fonction pour déterminer le badge de visibilité
  const getVisibilityBadge = (promo: ApiPromotion): string => {
    if (isExpired(promo)) return 'Expiré';
    return promo.visibility === 'PUBLIC' ? 'Public' : 'Privé';
  };

  // ✅ CALCUL DES STATISTIQUES DYNAMIQUES

  // Promotions en cours (actives et non expirées)
  const activePromotions = promotions.filter(promo =>
    !isExpired(promo) && promo.status !== 'EXPIRED' && promo.status !== 'DRAFT'
  ).slice(0, 3); // Limiter à 3 pour l'affichage

  // Promotions expirées
  const expiredPromotions = promotions.filter(promo =>
    isExpired(promo) || promo.status === 'EXPIRED'
  ).slice(0, 3); // Limiter à 3 pour l'affichage

  // ✅ Top promotions par usage réel (triées par current_usage décroissant)
  const topPromotions = promotions
    .filter(promo => !isExpired(promo) && promo.status !== 'EXPIRED' && promo.status !== 'DRAFT')
    .sort((a, b) => (b.current_usage || 0) - (a.current_usage || 0)) // Trier par usage décroissant
    .slice(0, 3); // Limiter à 3 pour l'affichage

  // ✅ CONSTRUCTION DES SECTIONS DYNAMIQUES
  const stats: StatSection[] = [
    {
      title: "Promotions en cours",
      totalCount: promotions.filter(promo => !isExpired(promo) && promo.status !== 'EXPIRED' && promo.status !== 'DRAFT').length,
      items: activePromotions.map(promo => ({
        discount: formatDiscount(promo),
        description: promo.description || "Via l'application",
        expiry: promo.expiration_date ? formatExpiry(promo.expiration_date) : '',
        category: getTargetCategory(promo),
        badge: getVisibilityBadge(promo)
      }))
    },
    {
      title: "Promotions expirées",
      totalCount: promotions.filter(promo => isExpired(promo) || promo.status === 'EXPIRED').length,
      items: expiredPromotions.map(promo => ({
        discount: formatDiscount(promo),
        description: promo.description || "Via l'application",
        expiry: "",
        category: getTargetCategory(promo),
        badge: "Expiré"
      }))
    },
    {
      title: "Nombres des promotions",
      totalCount: promotions.length,
      items: topPromotions.map((promo) => {
        const currentUsage = promo.current_usage || 0;
        const maxUsage = promo.max_total_usage;

        // Construire le texte des ventes avec limite si disponible
        let salesText = `${currentUsage} ventes générées`;
        if (maxUsage) {
          salesText += ` / ${maxUsage} max`;
        }

        return {
          discount: formatDiscount(promo),
          description: promo.expiration_date ? formatExpiry(promo.expiration_date) : "Pas de date d'expiration",
          expiry: "",
          category: salesText, // ✅ AFFICHAGE AVEC LIMITES
          badge: "",
          salesCount: currentUsage // ✅ UTILISATION DES DONNÉES RÉELLES
        };
      })
    }
  ]

  const getBadgeStyles = (badge: string) => {
    switch (badge) {
      case 'Expiré':
        return 'bg-red-100 text-red-600'
      case 'Public':
        return 'bg-[#E4E4E7] text-orange-500'
      case 'Privé':
        return 'bg-blue-100 text-blue-600' // ✅ AJOUT : Style pour les promotions privées
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 items-start ${className}`}>
      {stats.map((section, sectionIndex) => (
        <div key={sectionIndex} className="bg-white border border-gray-200 rounded-2xl overflow-hidden h-fit">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-md font-medium text-gray-500">{section.title}</h3>
              {section.totalCount !== undefined && (
                <span className="bg-[#F17922] text-white text-xs font-medium px-2 py-1 rounded-full">
                  {section.totalCount}
                </span>
              )}
            </div>
            <div className="border-b border-gray-200 mb-4"></div>

            <div className="space-y-4">
              {section.items.length > 0 ? (
                section.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="text-xs font-medium text-gray-500 mb-1">{item.discount}</h4>
                        <p className="text-xs text-gray-600 mb-1">{item.description}</p>
                        {item.expiry && (
                          <p className="text-xs text-gray-500">{item.expiry}</p>
                        )}
                      </div>
                      <div className="ml-4 text-right">
                        {section.title === "Nombres des promotions" ? (
                          <p className="text-xs font-medium text-[#006fee]">{item.category}</p>
                        ) : (
                          <>
                            <p className="text-xs text-gray-600 mb-1">{item.category}</p>
                            {item.badge && (
                              <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getBadgeStyles(item.badge)}`}>
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-xs text-gray-400">
                    {section.title === "Promotions en cours" && "Aucune promotion en cours"}
                    {section.title === "Promotions expirées" && "Aucune promotion expirée"}
                    {section.title === "Nombres des promotions" && "Aucune promotion disponible"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {section.title === "Nombres des promotions" && (
            <div className="bg-gray-400 hover:bg-[#F17200] cursor-pointer px-6 py-4">
              <button
                type="button"
                className="w-full text-white text-sm font-medium cursor-pointer   transition-colors"
                onClick={onViewAllPromotions}
              >
                Voir tous
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default PromoStats
