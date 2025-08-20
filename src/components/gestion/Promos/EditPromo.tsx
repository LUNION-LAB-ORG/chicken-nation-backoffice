"use client"

import React, { useState, useEffect } from 'react'
import { getAllRestaurants, Restaurant } from '@/services/restaurantService'
import { getAllMenus } from '@/services/menuService'
import { getAllCategories, Category } from '@/services/categoryService'
import { MenuItem } from '@/types'
import { PromoCardData } from './PromoCard'
import {
  ApiPromotion,
  UnifiedPromoFormData,
  PromoTransitData,
  createEmptyUnifiedFormData,
  convertUnifiedFormDataToTransitData,
  convertDetailedApiPromotionToUnifiedFormData,
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

interface EditPromoProps {
  onSave?: (promoData: PromoTransitData) => void
  onSaveAsDraft?: (promoData: PromoTransitData) => Promise<void>
  onCancel?: () => void
  className?: string
  initialData?: ApiPromotion | PromoCardData
  isEditing?: boolean
}

type PromoType = 'percentage' | 'fixed' | 'buyXgetY'
type ProductTarget = 'all' | 'specific' | 'categories'

const EditPromo = ({ onSave, onSaveAsDraft, onCancel, className = '', initialData, isEditing = false }: EditPromoProps) => {
  // ✅ ÉTAT UNIFIÉ - Remplace tous les états séparés
  const [unifiedFormData, setUnifiedFormData] = useState<UnifiedPromoFormData>(createEmptyUnifiedFormData())

  // États pour les erreurs et loading
  const [errors, setErrors] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // États pour les données externes (restaurants, menus, catégories)
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loadingRestaurants, setLoadingRestaurants] = useState(true)
  const [menus, setMenus] = useState<MenuItem[]>([])
  const [loadingMenus, setLoadingMenus] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)

  // État pour l'affichage des dropdowns
  const [showPublicDropdown, setShowPublicDropdown] = useState(false)

  // ✅ FONCTIONS HELPER POUR ACCÉDER AUX DONNÉES UNIFIÉES
  const updateFormData = (updates: Partial<UnifiedPromoFormData>) => {
    setUnifiedFormData(prev => ({ ...prev, ...updates }))
  }

  // Getters pour compatibilité avec l'UI existante
  const activePromoType = unifiedFormData.discountType
  const setActivePromoType = (type: PromoType) => updateFormData({ discountType: type })

  const activeProductTarget = unifiedFormData.productTarget
  const setActiveProductTarget = (target: ProductTarget) => updateFormData({ productTarget: target, targetType: target })

  const percentageValue = unifiedFormData.percentageValue
  const setPercentageValue = (value: string) => updateFormData({ percentageValue: value, discountValue: parseFloat(value) || 0 })

  const fixedAmountValue = unifiedFormData.fixedAmountValue
  const setFixedAmountValue = (value: string) => updateFormData({ fixedAmountValue: value, discountValue: parseFloat(value) || 0 })

  const buyQuantity = unifiedFormData.buyQuantity
  const setBuyQuantity = (value: string) => updateFormData({ buyQuantity: value, discountValue: parseFloat(value) || 0 })

  const getQuantity = unifiedFormData.getQuantity
  const setGetQuantity = (value: string) => updateFormData({ getQuantity: value })

  const discountCeiling = unifiedFormData.discountCeiling
  const setDiscountCeiling = (value: string) => updateFormData({ discountCeiling: value })

  const selectedRestaurants = unifiedFormData.selectedRestaurants
  const setSelectedRestaurants = (restaurants: string[]) => updateFormData({ selectedRestaurants: restaurants })

  const selectedMenus = unifiedFormData.selectedMenus
  const setSelectedMenus = (menus: string[]) => updateFormData({ selectedMenus: menus, targetedDishIds: menus })

  const selectedCategories = unifiedFormData.selectedCategories
  const setSelectedCategories = (categories: string[]) => updateFormData({ selectedCategories: categories })

  const selectedRewardMenus = unifiedFormData.selectedRewardMenus
  const setSelectedRewardMenus = (menus: string[]) => updateFormData({
    selectedRewardMenus: menus,
    offeredDishes: menus.map(menuId => ({ dishId: menuId, quantity: parseFloat(getQuantity) || 1 }))
  })

  const minOrderAmount = unifiedFormData.minOrderAmount
  const setMinOrderAmount = (value: string) => updateFormData({ minOrderAmount: value, minOrderAmountApi: parseFloat(value) || null })

  const maxUsagePerClient = unifiedFormData.maxUsagePerClient
  const setMaxUsagePerClient = (value: string) => updateFormData({ maxUsagePerClient: value, maxUsagePerUser: parseFloat(value) || null })

  const maxTotalUsage = unifiedFormData.maxTotalUsage
  const setMaxTotalUsage = (value: string) => updateFormData({ maxTotalUsage: value, maxTotalUsageApi: parseFloat(value) || null })

  const selectedPublicTypes = unifiedFormData.selectedPublicTypes
  const setSelectedPublicTypes = (types: string[]) => updateFormData({
    selectedPublicTypes: types,
    visibility: types.includes('Public') ? 'PUBLIC' : 'PRIVATE',
    targetStandard: types.includes('Utilisateur Standard') || types.includes('Public'),
    targetPremium: types.includes('Utilisateur Premium') || types.includes('Public'),
    targetGold: types.includes('Utilisateur Gold') || types.includes('Public')
  })

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

  // ✅ Initialiser les données quand le mode édition est activé
  useEffect(() => {
    if (isEditing && initialData) {
      console.log('🔧 [EditPromo] Mode édition activé, initialisation des données:', initialData);

      try {
        // Utiliser la fonction de conversion correcte
        const mappedData = convertDetailedApiPromotionToUnifiedFormData(initialData as ApiPromotion);
        
        console.log('📄 [EditPromo] Données converties pour le formulaire:', mappedData);
        console.log('🏪 [EditPromo] === VÉRIFICATION DES RESTAURANTS MAPPÉS ===');
        console.log('📋 [EditPromo] selectedRestaurants après mapping:', {
          selectedRestaurants: mappedData.selectedRestaurants,
          selectedRestaurants_length: mappedData.selectedRestaurants?.length || 0,
          selectedRestaurants_values: mappedData.selectedRestaurants?.map(rid => ({ value: rid, type: typeof rid }))
        });

        // Mise à jour de tous les états avec les données converties
        updateFormData(mappedData);

      } catch (error) {
        console.error('Erreur lors du mapping des données:', error);
        // En cas d'erreur, garder les données par défaut
      }
    }
  }, [initialData, isEditing]);

  // ✅ Effet pour comparer les IDs des restaurants sélectionnés avec les restaurants disponibles
  useEffect(() => {
    if (restaurants.length > 0 && unifiedFormData.selectedRestaurants.length > 0) {
      console.log('🔍 [EditPromo] === COMPARAISON DES IDS RESTAURANTS ===');
      console.log('📋 [EditPromo] Restaurants disponibles:', restaurants.map(r => ({ id: r.id, name: r.name, type: typeof r.id })));
      console.log('📋 [EditPromo] Restaurants sélectionnés:', unifiedFormData.selectedRestaurants.map(rid => ({ value: rid, type: typeof rid })));
      
      // Vérifier les correspondances
      const matches = unifiedFormData.selectedRestaurants.map(selectedId => {
        const found = restaurants.find(r => r.id === selectedId || r.id === selectedId.toString() || r.id?.toString() === selectedId);
        return {
          selectedId,
          found: !!found,
          foundRestaurant: found ? { id: found.id, name: found.name } : null
        };
      });
      console.log('🔍 [EditPromo] Correspondances trouvées:', matches);
    }
  }, [restaurants, unifiedFormData.selectedRestaurants]);

  // Fonctions pour gérer les restaurants sélectionnés
  const handleRestaurantToggle = (restaurantId: string) => {
    const currentRestaurants = unifiedFormData.selectedRestaurants
    const newRestaurants = currentRestaurants.includes(restaurantId)
      ? currentRestaurants.filter(id => id !== restaurantId)
      : [...currentRestaurants, restaurantId]
    setSelectedRestaurants(newRestaurants)
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
    const currentMenus = unifiedFormData.selectedMenus
    const newMenus = currentMenus.includes(menuId)
      ? currentMenus.filter(id => id !== menuId)
      : [...currentMenus, menuId]
    setSelectedMenus(newMenus)
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
    const currentCategories = unifiedFormData.selectedCategories
    const newCategories = currentCategories.includes(categoryId)
      ? currentCategories.filter(id => id !== categoryId)
      : [...currentCategories, categoryId]
    setSelectedCategories(newCategories)
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
    const currentTypes = unifiedFormData.selectedPublicTypes
    let newTypes: string[]

    if (publicType === 'Public') {
      // Si on sélectionne Public, on désélectionne tout le reste et on met seulement Public
      if (currentTypes.includes('Public')) {
        newTypes = currentTypes.filter(type => type !== 'Public') // Désélectionner Public
      } else {
        newTypes = ['Public'] // Sélectionner seulement Public, désélectionner tout le reste
      }
    } else {
      // Si on sélectionne un type privé, on désélectionne Public automatiquement
      newTypes = currentTypes.includes(publicType)
        ? currentTypes.filter(type => type !== publicType) // Désélectionner ce type privé
        : [...currentTypes.filter(type => type !== 'Public'), publicType] // Ajouter ce type privé et retirer Public
    }

    setSelectedPublicTypes(newTypes)
  }

  const handleSelectAllPublicTypes = () => {
    // Cette fonction sélectionne/désélectionne tous les types privés (sans Public)
    const privateTypesSelected = publicTypeOptions.filter(type => selectedPublicTypes.includes(type))

    if (privateTypesSelected.length === publicTypeOptions.length) {
      // Si tous les types privés sont sélectionnés, on les désélectionne tous
      const newTypes = selectedPublicTypes.filter(type => !publicTypeOptions.includes(type))
      setSelectedPublicTypes(newTypes)
    } else {
      // Sinon, on sélectionne tous les types privés et on retire Public
      setSelectedPublicTypes([...publicTypeOptions])
    }
  }

  // Fonctions pour gérer les menus de récompense sélectionnés
  const handleRewardMenuToggle = (menuId: string) => {
    const currentRewardMenus = unifiedFormData.selectedRewardMenus
    const newRewardMenus = currentRewardMenus.includes(menuId)
      ? currentRewardMenus.filter(id => id !== menuId)
      : [...currentRewardMenus, menuId]
    setSelectedRewardMenus(newRewardMenus)
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

  // Validation spécifique pour l'étape 1 (EditPromo)
  const validateEditPromoStep = () => {
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
    console.log('🔄 [SAVE] Début de la sauvegarde normale...');
    setIsSubmitting(true);
    setErrors([]);

    try {
      // Validation spécifique à l'étape 1 seulement
      console.log('🔍 [SAVE] Validation du formulaire...');
      const validation = validateEditPromoStep();
      if (!validation.isValid) {
        console.log('❌ [SAVE] Validation échouée:', validation.errors);
        setErrors(validation.errors);
        toast.error('Veuillez corriger les erreurs dans le formulaire');
        return;
      }
      

      // ✅ MISE À JOUR DES DONNÉES UNIFIÉES avec les valeurs actuelles du formulaire
      const updatedUnifiedFormData: UnifiedPromoFormData = {
        ...unifiedFormData,
        // Mettre à jour avec les valeurs actuelles du formulaire
        discountType: activePromoType,
        percentageValue,
        fixedAmountValue,
        buyQuantity,
        getQuantity,
        discountCeiling,
        productTarget: activeProductTarget,
        targetType: activeProductTarget,
        selectedMenus,
        selectedCategories,
        selectedRewardMenus,
        selectedRestaurants,
        minOrderAmount,
        maxUsagePerClient,
        maxTotalUsage,
        selectedPublicTypes,
        // Calculer discountValue selon le type
        discountValue: activePromoType === 'percentage' ? (parseFloat(percentageValue) || 0) :
                      activePromoType === 'fixed' ? (parseFloat(fixedAmountValue) || 0) :
                      (parseFloat(buyQuantity) || 0)
      };

      console.log('🔧 [SAVE] Données unifiées:', updatedUnifiedFormData);

      // ✅ UTILISER LA FONCTION DE CONVERSION UNIFIÉE
      if (onSave) {
        console.log('🔄 [SAVE] Conversion des données pour l\'API...');
        const promoDataToPass = convertUnifiedFormDataToTransitData(updatedUnifiedFormData);

        console.log('📤 [SAVE] Données finales à envoyer:', promoDataToPass);
        console.log('🔒 [SAVE] Visibilité:', promoDataToPass.visibility);

        console.log('🚀 [SAVE] Appel de onSave...');

        // ✅ ATTENDRE LA RÉPONSE DU BACKEND
        const backendResponse = await onSave(promoDataToPass);

        console.log('📥 [SAVE] Réponse du backend reçue:', backendResponse);
        console.log('📊 [SAVE] Type de réponse:', typeof backendResponse);
        console.log('📋 [SAVE] Détails de la réponse:', JSON.stringify(backendResponse, null, 2));

      
      } else {
        console.warn('⚠️ [SAVE] onSave n\'est pas défini');
      }

    } catch (error) {
      console.error('❌ [SAVE] Erreur lors de la sauvegarde:', error);
      console.error('❌ [SAVE] Stack trace:', error instanceof Error ? error.stack : 'Pas de stack trace');
      const errorMessage = error instanceof Error ? error.message : 'Une erreur inattendue s\'est produite';
      toast.error(errorMessage);
      setErrors([errorMessage]);
    } finally {
      console.log('🏁 [SAVE] Fin du processus de sauvegarde');
      setIsSubmitting(false);
    }
  };

  // Fonction pour sauvegarder comme brouillon
  const handleSaveAsDraft = async () => {
    console.log('🔄 [DRAFT] Début de la sauvegarde comme brouillon...');
    setIsSubmitting(true);
    setErrors([]);

    try {
      console.log('📝 [DRAFT] Données actuelles du formulaire:', {
        activePromoType,
        percentageValue,
        fixedAmountValue,
        buyQuantity,
        getQuantity,
        selectedRestaurants,
        selectedMenus,
        selectedCategories,
        selectedPublicTypes
      });

      // ✅ MISE À JOUR DES DONNÉES UNIFIÉES avec visibility: "DRAFT"
      const updatedUnifiedFormData: UnifiedPromoFormData = {
        ...unifiedFormData,
        // Mettre à jour avec les valeurs actuelles du formulaire
        discountType: activePromoType,
        percentageValue,
        fixedAmountValue,
        buyQuantity,
        getQuantity,
        discountCeiling,
        productTarget: activeProductTarget,
        targetType: activeProductTarget,
        selectedMenus,
        selectedCategories,
        selectedRewardMenus,
        selectedRestaurants,
        minOrderAmount,
        maxUsagePerClient,
        maxTotalUsage,
        selectedPublicTypes,
        // ✅ FORCER LA VISIBILITÉ EN DRAFT
        visibility: 'DRAFT',
        // Calculer discountValue selon le type
        discountValue: activePromoType === 'percentage' ? (parseFloat(percentageValue) || 0) :
                      activePromoType === 'fixed' ? (parseFloat(fixedAmountValue) || 0) :
                      (parseFloat(buyQuantity) || 0)
      };

      console.log('🔧 [DRAFT] Données unifiées mises à jour:', updatedUnifiedFormData);

      // ✅ UTILISER LA FONCTION DE SAUVEGARDE BROUILLON SPÉCIFIQUE
      if (onSaveAsDraft) {
        console.log('🔄 [DRAFT] Conversion des données pour l\'API...');
        const promoDataToPass = convertUnifiedFormDataToTransitData(updatedUnifiedFormData);

        // ✅ S'assurer que la visibilité est bien DRAFT dans les données finales
        promoDataToPass.visibility = 'DRAFT';

        console.log('📤 [DRAFT] Données finales à envoyer à l\'API:', promoDataToPass);
        console.log('🔒 [DRAFT] Visibilité forcée:', promoDataToPass.visibility);

        console.log('🚀 [DRAFT] Appel de onSaveAsDraft avec les données...');

        // ✅ ATTENDRE LA RÉPONSE DU BACKEND
        await onSaveAsDraft(promoDataToPass);

        console.log('✅ [DRAFT] Sauvegarde terminée avec succès');
        // Le toast est géré dans handleSaveAsDraft du parent
      } else {
        console.warn('⚠️ [DRAFT] onSaveAsDraft n\'est pas défini');
        toast.error('Erreur: fonction de sauvegarde brouillon non disponible');
      }

    } catch (error) {
      console.error('❌ [DRAFT] Erreur lors de la sauvegarde du brouillon:', error);
      console.error('❌ [DRAFT] Stack trace:', error instanceof Error ? error.stack : 'Pas de stack trace');
      const errorMessage = error instanceof Error ? error.message : 'Une erreur inattendue s\'est produite';
      toast.error(`Erreur brouillon: ${errorMessage}`);
      setErrors([errorMessage]);
    } finally {
      console.log('🏁 [DRAFT] Fin du processus de sauvegarde');
      setIsSubmitting(false);
    }
  };

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
            className={`w-70 px-6 py-3 cursor-pointer rounded-xl transition-colors font-regular ${
              isSubmitting
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gray-200 text-[#71717A] hover:bg-gray-300'
            }`}
          >
            {isSubmitting ? 'Sauvegarde...' : 'Enregistrer comme brouillon'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-70 cursor-pointer px-6 py-3 bg-gray-200 text-[#71717A] rounded-xl hover:bg-gray-300 transition-colors font-regular"
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

export default EditPromo
