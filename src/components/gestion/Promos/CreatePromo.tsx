"use client"

import React, { useState, useEffect } from 'react'
import { getAllRestaurants, Restaurant } from '@/services/restaurantService'
import { getAllMenus } from '@/services/menuService'
import { getAllCategories, Category } from '@/services/categoryService'
import { MenuItem } from '@/types'
import { PromoCardData } from './PromoCard'
import {
  ApiPromotion,
  PromoTransitData
} from '@/services/promotionService'
import { toast } from 'react-hot-toast'

import PercentagePromoForm from './PercentagePromoForm'
import FixedAmountPromoForm from './FixedAmountPromoForm'
import BuyXGetYPromoForm from './BuyXGetYPromoForm'
import RestaurantDropdown from './RestaurantDropdown'
import PromoTypeButtons from './PromoTypeButtons'
import ProductTargetSelector from './ProductTargetSelector'
import ConstraintsSection from './ConstraintsSection'
import RewardSelector from './RewardSelector'

interface CreatePromoProps {
  onSave?: (promoData: PromoTransitData) => void
  onSaveAsDraft?: (promoData: PromoTransitData) => void
  onCancel?: () => void
  className?: string
  initialData?: ApiPromotion | PromoCardData
  isEditing?: boolean
}

type PromoType = 'percentage' | 'fixed' | 'buyXgetY'
type ProductTarget = 'all' | 'specific' | 'categories'

const CreatePromo = ({ onSave, onSaveAsDraft, onCancel, className = '', initialData, isEditing = false }: CreatePromoProps) => {
  // États pour les sélections
  const [activePromoType, setActivePromoType] = useState<PromoType>('percentage')
  const [activeProductTarget, setActiveProductTarget] = useState<ProductTarget>('all')

  // États pour les erreurs et loading
  const [errors, setErrors] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // États pour les restaurants
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loadingRestaurants, setLoadingRestaurants] = useState(true)

  const [selectedRestaurants, setSelectedRestaurants] = useState<string[]>([])

  // États pour les menus
  const [menus, setMenus] = useState<MenuItem[]>([])
  const [loadingMenus, setLoadingMenus] = useState(true)

  const [selectedMenus, setSelectedMenus] = useState<string[]>([])

  // États pour les catégories
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)

  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  // États pour les contraintes et limites (type Pourcentage)
  const [minOrderAmount, setMinOrderAmount] = useState('')
  const [maxUsagePerClient, setMaxUsagePerClient] = useState('')
  const [maxTotalUsage, setMaxTotalUsage] = useState('')

  const [selectedPublicTypes, setSelectedPublicTypes] = useState<string[]>([])
  const [showPublicDropdown, setShowPublicDropdown] = useState(false)

  // États pour la dropdown Récompense (type buyXgetY)
  const [selectedRewardMenus, setSelectedRewardMenus] = useState<string[]>([])

  // États pour les valeurs des formulaires
  const [percentageValue, setPercentageValue] = useState('')
  const [fixedAmountValue, setFixedAmountValue] = useState('')
  const [buyQuantity, setBuyQuantity] = useState('')
  const [getQuantity, setGetQuantity] = useState('')
  const [discountCeiling, setDiscountCeiling] = useState('')

  // Charger les restaurants, menus et catégories au montage du composant
  useEffect(() => {
    const loadData = async () => {
      try {
        // Charger les restaurants
        setLoadingRestaurants(true)
        const restaurantData = await getAllRestaurants()
        setRestaurants(restaurantData.filter(r => r.active)) // Seulement les restaurants actifs

        // Charger les menus
        setLoadingMenus(true)
        const menuData = await getAllMenus()
        setMenus(menuData.filter(m => m.isAvailable) as unknown as MenuItem[]) // Seulement les menus disponibles

        // Charger les catégories
        setLoadingCategories(true)
        const categoryData = await getAllCategories()
        setCategories(categoryData) // Toutes les catégories
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error)
        setRestaurants([])
        setMenus([])
        setCategories([])
      } finally {
        setLoadingRestaurants(false)
        setLoadingMenus(false)
        setLoadingCategories(false)
      }
    }

    loadData()
  }, [])



  // Fonctions pour gérer les restaurants sélectionnés
  const handleRestaurantToggle = (restaurantId: string) => {
    setSelectedRestaurants(prev =>
      prev.includes(restaurantId)
        ? prev.filter(id => id !== restaurantId)
        : [...prev, restaurantId]
    )
  }

  const handleSelectAllRestaurants = () => {
    if (selectedRestaurants.length === restaurants.length) {
      setSelectedRestaurants([])
    } else {
      setSelectedRestaurants(restaurants.map(r => r.id || '').filter(Boolean))
    }
  }

  // Fonctions pour gérer les menus sélectionnés
  const handleMenuToggle = (menuId: string) => {
    setSelectedMenus(prev =>
      prev.includes(menuId)
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    )
  }

  const handleSelectAllMenus = () => {
    if (selectedMenus.length === menus.length) {
      setSelectedMenus([])
    } else {
      setSelectedMenus(menus.map(m => m.id))
    }
  }

  // Fonctions pour gérer les catégories sélectionnées
  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  const handleSelectAllCategories = () => {
    if (selectedCategories.length === categories.length) {
      setSelectedCategories([])
    } else {
      setSelectedCategories(categories.map(c => c.id))
    }
  }

  // Options pour la visibilité : Public + types privés
  const publicTypeOptions = ['Utilisateur Standard', 'Utilisateur Premium', 'Utilisateur Gold']

  const handlePublicTypeToggle = (publicType: string) => {
    setSelectedPublicTypes(prev => {
      if (publicType === 'Public') {
        // Si on sélectionne Public, on désélectionne tout le reste et on met seulement Public
        if (prev.includes('Public')) {
          return prev.filter(type => type !== 'Public') // Désélectionner Public
        } else {
          return ['Public'] // Sélectionner seulement Public, désélectionner tout le reste
        }
      } else {
        // Si on sélectionne un type privé, on désélectionne Public automatiquement
        const newSelection = prev.includes(publicType)
          ? prev.filter(type => type !== publicType) // Désélectionner ce type privé
          : [...prev.filter(type => type !== 'Public'), publicType] // Ajouter ce type privé et retirer Public

        return newSelection
      }
    })
  }

  const handleSelectAllPublicTypes = () => {
    // Cette fonction sélectionne/désélectionne tous les types privés (sans Public)
    const privateTypesSelected = publicTypeOptions.filter(type => selectedPublicTypes.includes(type))

    if (privateTypesSelected.length === publicTypeOptions.length) {
      // Si tous les types privés sont sélectionnés, on les désélectionne tous
      setSelectedPublicTypes(prev => prev.filter(type => !publicTypeOptions.includes(type)))
    } else {
      // Sinon, on sélectionne tous les types privés et on retire Public
      setSelectedPublicTypes([...publicTypeOptions])
    }
  }

  // Fonctions pour gérer les menus de récompense sélectionnés
  const handleRewardMenuToggle = (menuId: string) => {
    setSelectedRewardMenus(prev =>
      prev.includes(menuId)
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    )
  }

  const handleSelectAllRewardMenus = () => {
    if (selectedRewardMenus.length === menus.length) {
      setSelectedRewardMenus([])
    } else {
      setSelectedRewardMenus(menus.map(m => m.id))
    }
  }

  // Fonction utilitaire pour afficher les éléments sélectionnés de manière subtile
  const getSelectedItemsDisplay = (selectedIds: string[], items: Array<{id?: string, name: string}>, maxDisplay: number = 2) => {
    if (selectedIds.length === 0) return null

    const selectedItems = items.filter(item => item.id && selectedIds.includes(item.id))

    if (selectedIds.length <= maxDisplay) {
      return selectedItems.map(item => item.name).join(', ')
    } else {
      const displayItems = selectedItems.slice(0, maxDisplay).map(item => item.name).join(', ')
      return `${displayItems} +${selectedIds.length - maxDisplay} autre${selectedIds.length - maxDisplay > 1 ? 's' : ''}`
    }
  }





  // Validation spécifique pour l'étape 1 (CreatePromo)
  const validateCreatePromoStep = () => {
    const errors: string[] = [];

    // Validation de la valeur de discount selon le type
    switch (activePromoType) {
      case 'percentage':
        const percentValue = parseFloat(percentageValue) || 0;
        if (percentValue <= 0) {
          errors.push('Le pourcentage de réduction doit être supérieur à 0');
        }
        if (percentValue > 100) {
          errors.push('Le pourcentage de réduction ne peut pas dépasser 100%');
        }
        break;
      case 'fixed':
        const fixedValue = parseFloat(fixedAmountValue) || 0;
        if (fixedValue <= 0) {
          errors.push('Le montant de réduction doit être supérieur à 0');
        }
        break;
      case 'buyXgetY':
        const buyQty = parseFloat(buyQuantity) || 0;
        const getQty = parseFloat(getQuantity) || 0;
        if (buyQty <= 0) {
          errors.push('La quantité à acheter doit être supérieure à 0');
        }
        if (getQty <= 0) {
          errors.push('La quantité gratuite doit être supérieure à 0');
        }
        break;
    }

    // Validation des produits ciblés si nécessaire
    if (activeProductTarget === 'specific' && selectedMenus.length === 0) {
      errors.push('Vous devez sélectionner au moins un produit pour une promotion ciblée');
    }

    if (activeProductTarget === 'categories' && selectedCategories.length === 0) {
      errors.push('Vous devez sélectionner au moins une catégorie pour une promotion ciblée');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  // Fonction de soumission avec gestion d'erreurs
  const handleSubmit = async () => {
    console.log('🚀 [CreatePromo] === DÉBUT DE LA SOUMISSION ===');
    console.log('📥 [CreatePromo] États actuels:', {
      selectedRestaurants,
      selectedPublicTypes,
      selectedMenus,
      selectedCategories,
      activePromoType,
      activeProductTarget
    });

    setIsSubmitting(true);
    setErrors([]);

    try {
      // Validation spécifique à l'étape 1 seulement
      const validation = validateCreatePromoStep();
      if (!validation.isValid) {
        setErrors(validation.errors);
        toast.error('Veuillez corriger les erreurs dans le formulaire');
        return;
      }

      // ✅ Pour l'étape 1, nous passons les données complètes au format PromoTransitData
      if (onSave) {
        const promoDataToPass: PromoTransitData = {
          // Données de l'étape 1 (CreatePromo)
          promoType: activePromoType,
          discountType: activePromoType,
          percentageValue,
          fixedAmountValue,
          buyQuantity,
          getQuantity,
          discountCeiling,
          productTarget: activeProductTarget,
          selectedMenus,
          selectedCategories,
          selectedRewardMenus,
          selectedRestaurants,
          minOrderAmount,
          maxUsagePerClient,
          maxTotalUsage,
          selectedPublicTypes,

          // Données de l'étape 2 (vides pour l'instant)
          title: '',
          description: '',
          startDate: '',
          expirationDate: '',
          backgroundColor: '',
          textColor: '',
          couponImageUrl: '',

          // Métadonnées
          isEditing: false
        };

        console.log('📤 [CreatePromo] Données à passer à onSave:', {
          selectedRestaurants: promoDataToPass.selectedRestaurants,
          selectedPublicTypes: promoDataToPass.selectedPublicTypes,
          selectedMenus: promoDataToPass.selectedMenus,
          selectedCategories: promoDataToPass.selectedCategories,
          productTarget: promoDataToPass.productTarget,
          discountType: promoDataToPass.discountType
        });

        onSave(promoDataToPass);
      }

    } catch (error) {
      console.error('❌ [CreatePromo] Erreur lors de la soumission:', error);
      const errorMessage = error instanceof Error ? error.message : 'Une erreur inattendue s\'est produite';
      toast.error(errorMessage);
      setErrors([errorMessage]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAsDraft = async () => {
    setIsSubmitting(true);
    setErrors([]);

    try {
      // Validation spécifique à l'étape 1 seulement
      const validation = validateCreatePromoStep();
      if (!validation.isValid) {
        setErrors(validation.errors);
        toast.error('Veuillez corriger les erreurs dans le formulaire');
        return;
      }

      // ✅ Pour sauvegarder comme brouillon, créer un PromoTransitData complet
      if (onSaveAsDraft) {
        const promoDataToPass: PromoTransitData = {
          // Données de l'étape 1 (CreatePromo)
          promoType: activePromoType,
          discountType: activePromoType,
          percentageValue,
          fixedAmountValue,
          buyQuantity,
          getQuantity,
          discountCeiling,
          productTarget: activeProductTarget,
          selectedMenus,
          selectedCategories,
          selectedRewardMenus,
          selectedRestaurants,
          minOrderAmount,
          maxUsagePerClient,
          maxTotalUsage,
          selectedPublicTypes,

          // Données de l'étape 2 (vides pour brouillon)
          title: '',
          description: '',
          startDate: '',
          expirationDate: '',
          backgroundColor: '',
          textColor: '',
          couponImageUrl: '',

          // Métadonnées
          isEditing: false
        };
        onSaveAsDraft(promoDataToPass);
      }

    } catch (error) {
      console.error('Erreur lors de la sauvegarde du brouillon:', error);
      const errorMessage = error instanceof Error ? error.message : 'Une erreur inattendue s\'est produite';
      toast.error(errorMessage);
      setErrors([errorMessage]);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Initialisation des données pour l'édition
  useEffect(() => {
    if (initialData && isEditing) {
      // Vérifier si c'est une ApiPromotion ou PromoCardData
      const isApiPromotion = 'discount_type' in initialData;

      if (isApiPromotion) {
        const apiPromotion = initialData as ApiPromotion;

        // Mettre à jour les états du formulaire
        setActivePromoType(apiPromotion.discount_type === 'PERCENTAGE' ? 'percentage' :
                          apiPromotion.discount_type === 'FIXED_AMOUNT' ? 'fixed' : 'buyXgetY');

        setActiveProductTarget(apiPromotion.target_type === 'ALL_PRODUCTS' ? 'all' :
                             apiPromotion.target_type === 'SPECIFIC_PRODUCTS' ? 'specific' : 'categories');

        // Mettre à jour les valeurs
        if (apiPromotion.discount_type === 'PERCENTAGE') {
          setPercentageValue(apiPromotion.discount_value.toString());
        } else if (apiPromotion.discount_type === 'FIXED_AMOUNT') {
          setFixedAmountValue(apiPromotion.discount_value.toString());
        } else if (apiPromotion.discount_type === 'BUY_X_GET_Y') {
          setBuyQuantity(apiPromotion.discount_value.toString());
        }

        // Mettre à jour les sélections
        if (apiPromotion.targeted_dish_ids) {
          setSelectedMenus(apiPromotion.targeted_dish_ids);
        }
      } else {
        // C'est une PromoCardData, faire un mapping simple
        const promoCard = initialData as PromoCardData;

        setActivePromoType(promoCard.type === 'percentage' ? 'percentage' :
                          promoCard.type === 'fixed' ? 'fixed' : 'buyXgetY');

        if (promoCard.type === 'percentage') {
          setPercentageValue(promoCard.discount?.replace('%', '') || '');
        }
      }
    }
  }, [initialData, isEditing]);

  return (
    <div className={`bg-white rounded-xl text-gray-900 ${className}`}>
      <div className="p-6 space-y-6">
        {/* Affichage des erreurs de validation */}
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  {errors.length === 1 ? 'Erreur de validation' : 'Erreurs de validation'}
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <ul className="list-disc list-inside space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dropdown restaurant en haut */}
        <RestaurantDropdown
          restaurants={restaurants}
          loading={loadingRestaurants}
          selectedRestaurants={selectedRestaurants}
          onRestaurantToggle={handleRestaurantToggle}
          onSelectAll={handleSelectAllRestaurants}
          getSelectedItemsDisplay={getSelectedItemsDisplay}
        />

        {/* Section principale en deux colonnes */}
        <div className="flex flex-col lg:flex-row lg:justify-between gap-6 lg:gap-8">
          {/* Colonne de gauche - Types de promotion */}
          <PromoTypeButtons
            activePromoType={activePromoType}
            onPromoTypeChange={setActivePromoType}
          />

          {/* Colonne de droite - Champs selon le type de promotion */}
          <div className="flex-1 justify-between ">
            {activePromoType === 'percentage' && (
              <PercentagePromoForm
                percentageValue={percentageValue}
                onPercentageChange={setPercentageValue}
                discountCeiling={discountCeiling}
                onDiscountCeilingChange={setDiscountCeiling}
              />
            )}

            {activePromoType === 'fixed' && (
              <FixedAmountPromoForm
                fixedAmountValue={fixedAmountValue}
                onFixedAmountChange={setFixedAmountValue}
                discountCeiling={discountCeiling}
                onDiscountCeilingChange={setDiscountCeiling}
              />
            )}

            {activePromoType === 'buyXgetY' && (
              <BuyXGetYPromoForm
                buyQuantity={buyQuantity}
                onBuyQuantityChange={setBuyQuantity}
                getQuantity={getQuantity}
                onGetQuantityChange={setGetQuantity}
                discountCeiling={discountCeiling}
                onDiscountCeilingChange={setDiscountCeiling}
              />
            )}
          </div>
        </div>

        {/* Section Produits ciblés */}
        <ProductTargetSelector
          activeProductTarget={activeProductTarget}
          onProductTargetChange={setActiveProductTarget}
          menus={menus}
          categories={categories}
          loadingMenus={loadingMenus}
          loadingCategories={loadingCategories}
          selectedMenus={selectedMenus}
          selectedCategories={selectedCategories}
          onMenuToggle={handleMenuToggle}
          onCategoryToggle={handleCategoryToggle}
          onSelectAllMenus={handleSelectAllMenus}
          onSelectAllCategories={handleSelectAllCategories}
          getSelectedItemsDisplay={getSelectedItemsDisplay}
        />

        {/* Section Contraintes et limites - Pour le type Pourcentage */}
        {activePromoType === 'percentage' && (
          <ConstraintsSection
            minOrderAmount={minOrderAmount}
            onMinOrderAmountChange={setMinOrderAmount}
            maxUsagePerClient={maxUsagePerClient}
            onMaxUsagePerClientChange={setMaxUsagePerClient}
            maxTotalUsage={maxTotalUsage}
            onMaxTotalUsageChange={setMaxTotalUsage}
            selectedPublicTypes={selectedPublicTypes}
            onPublicTypeToggle={handlePublicTypeToggle}
            onSelectAllPublicTypes={handleSelectAllPublicTypes}
            showPublicDropdown={showPublicDropdown}
            onShowPublicDropdownChange={setShowPublicDropdown}
            publicTypeOptions={publicTypeOptions}
          />
        )}

        {/* Section Contraintes et limites - Pour le type Montant fixe */}
        {activePromoType === 'fixed' && (
          <ConstraintsSection
            minOrderAmount={minOrderAmount}
            onMinOrderAmountChange={setMinOrderAmount}
            maxUsagePerClient={maxUsagePerClient}
            onMaxUsagePerClientChange={setMaxUsagePerClient}
            maxTotalUsage={maxTotalUsage}
            onMaxTotalUsageChange={setMaxTotalUsage}
            selectedPublicTypes={selectedPublicTypes}
            onPublicTypeToggle={handlePublicTypeToggle}
            onSelectAllPublicTypes={handleSelectAllPublicTypes}
            showPublicDropdown={showPublicDropdown}
            onShowPublicDropdownChange={setShowPublicDropdown}
            publicTypeOptions={publicTypeOptions}
          />
        )}

        {/* Section contraintes et limites  - Uniquement pour le montant Fixe */}




        {/* Section Récompense et Contraintes - Pour le type Achetez X, Obtenez Y */}
        {activePromoType === 'buyXgetY' && (
          <div className="mt-8">
            {/* Section Récompense */}
            <RewardSelector
              menus={menus}
              loadingMenus={loadingMenus}
              selectedRewardMenus={selectedRewardMenus}
              onRewardMenuToggle={handleRewardMenuToggle}
              onSelectAllRewardMenus={handleSelectAllRewardMenus}
              getSelectedItemsDisplay={getSelectedItemsDisplay}
            />

            {/* Section Contraintes et limites */}
            <ConstraintsSection
              minOrderAmount={minOrderAmount}
              onMinOrderAmountChange={setMinOrderAmount}
              maxUsagePerClient={maxUsagePerClient}
              onMaxUsagePerClientChange={setMaxUsagePerClient}
              maxTotalUsage={maxTotalUsage}
              onMaxTotalUsageChange={setMaxTotalUsage}
              selectedPublicTypes={selectedPublicTypes}
              onPublicTypeToggle={handlePublicTypeToggle}
              onSelectAllPublicTypes={handleSelectAllPublicTypes}
              showPublicDropdown={showPublicDropdown}
              onShowPublicDropdownChange={setShowPublicDropdown}
              publicTypeOptions={publicTypeOptions}
            />
          </div>
        )}

        {/* Boutons d'action */}
        <div className="flex flex-col gap-6 justify-end sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 mt-32">
          <button
            type="button"
            onClick={handleSaveAsDraft}
            disabled={isSubmitting}
            className={`w-70 px-6 py-3 cursor-pointer bg-gray-200 text-[#71717A] rounded-xl hover:bg-gray-300 transition-colors font-regular ${
              isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? 'Sauvegarde...' : 'Enregistrer comme brouillon'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className=" w-70 cursor-pointer px-6 py-3 bg-gray-200 text-[#71717A] rounded-xl hover:bg-gray-300 transition-colors font-regular"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`w-70 cursor-pointer px-6 py-3 rounded-xl font-medium transition-opacity ${
              isSubmitting
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-[#F17922] to-[#FA6345] text-white hover:opacity-90'
            }`}
          >
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CreatePromo
