"use client"

import React, { useState, useEffect } from 'react'
import PromoHeader from './PromoHeader'
import PromoStats from './PromoStats'
import PromoTabs from './PromoTabs'
import PromoGrid from './PromoGrid'
import CreatePromo from './CreatePromo'
import EditPromo from './EditPromo'
// Force reload
import PromoDetailView from './PromoDetailView'
import PersonalizedPromo from './PersonalizedPromo'
import EditPersonalizedPromo from './EditPersonalizedPromo'
import AllPromotions from './AllPromotions'
import { PromoCardData } from './PromoCard'
import { toast } from 'react-hot-toast'
import {
  getAllPromotionsWithDetails,
  deletePromotion,

  createPromotionFromUnified,
  updatePromotionFromUnified,
  getPromotionById,
  ApiPromotion,
  PromotionFormData,
  mapApiPromotionToPromoCard,
  PromoTransitData,
  UnifiedPromoFormData,
  convertTransitDataToUnifiedFormData,
  mapUnifiedFormDataToApiPromotion,
} from '@/services/promotionService'
import { getHumanReadableError, getPromotionSuccessMessage } from '@/utils/errorMessages'

interface PromoState {
  view: 'list' | 'create' | 'edit' | 'view' | 'personalize' | 'editPersonalize' | 'allPromotions'
  selectedPromo?: PromoCardData
  selectedApiPromo?: ApiPromotion
  activeTab: string
  promos: PromoCardData[]
  loading: boolean
  tempPromoData?: PromoTransitData
  searchQuery: string
}


const Promos = () => {
  const [promoState, setPromoState] = useState<PromoState>({
    view: 'list',
    activeTab: 'all',
    promos: [],
    loading: false,
    searchQuery: ''
  })

  // État séparé pour stocker les promotions API originales
  const [apiPromotions, setApiPromotions] = useState<ApiPromotion[]>([])

  // Charger les promotions au montage du composant
  useEffect(() => {
    loadPromotions()
  }, [])
  
  const loadPromotions = async () => {
    setPromoState(prev => ({ ...prev, loading: true }))
    try {
      // ✅ CORRECTION : Utiliser getAllPromotionsWithDetails pour récupérer les restaurant_ids complets
      const fetchedApiPromotions = await getAllPromotionsWithDetails()

      // ✅ MODIFICATION : Charger TOUTES les promotions (y compris expirées) pour permettre le filtrage
      // Le filtrage des expirées sera géré dans filterPromotionsByTab
      const allApiPromotions = fetchedApiPromotions; // Pas de filtrage ici

      const mappedPromotions = allApiPromotions.map(mapApiPromotionToPromoCard)

      setApiPromotions(allApiPromotions)
      setPromoState(prev => ({
        ...prev,
        promos: mappedPromotions,
        loading: false
      }))
    } catch (error) {
      const userMessage = getHumanReadableError(error);
      toast.error(userMessage);
      setPromoState(prev => ({ ...prev, loading: false }))
    }
  }
  const handleViewChange = (view: 'list' | 'create' | 'edit' | 'view' | 'personalize' | 'editPersonalize' | 'allPromotions', promo?: PromoCardData, tempData?: PromoTransitData) => {
    setPromoState({
      ...promoState,
      view,
      selectedPromo: promo,
      tempPromoData: tempData
    })
  }

  // Fonction pour naviguer vers la vue "Toutes les promotions"
  const handleViewAllPromotions = () => {
    handleViewChange('allPromotions')
  }

  // Fonction pour gérer la recherche
  const handleSearch = (query: string) => {
    setPromoState(prev => ({
      ...prev,
      searchQuery: query
    }))
  }
  // ✅ FONCTION DE SAUVEGARDE BROUILLON AMÉLIORÉE - Utilise le système unifié
  const handleSaveAsDraft = async (promoData: PromoTransitData) => {
    try {
      setPromoState(prev => ({ ...prev, loading: true }))


      // ✅ Convertir PromoTransitData vers UnifiedPromoFormData
      const unifiedData = convertTransitDataToUnifiedFormData(promoData);

      // ✅ Compléter avec des valeurs par défaut pour le brouillon
      const currentDate = new Date().toISOString().split('T')[0];
      const expirationDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const draftUnifiedData: UnifiedPromoFormData = {
        ...unifiedData,
        title: unifiedData.title || `Brouillon de promotion - ${new Date().toLocaleDateString()}`,
        description: unifiedData.description || 'Promotion sauvegardée comme brouillon',
        startDate: unifiedData.startDate || currentDate,
        expirationDate: unifiedData.expirationDate || expirationDate,
        isActive: false, // Brouillon = inactif
        status: 'DRAFT'
      };

      // ✅ Utiliser la fonction de mapping unifiée pour créer l'API data
      const apiData = mapUnifiedFormDataToApiPromotion(draftUnifiedData, 'DRAFT');

      // ✅ Convertir vers PromotionFormData pour compatibilité avec l'API existante
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _promotionFormData: PromotionFormData = {
        title: draftUnifiedData.title,
        description: draftUnifiedData.description,
        discountType: draftUnifiedData.discountType,
        discountValue: draftUnifiedData.discountValue,
        targetType: draftUnifiedData.targetType,
        startDate: draftUnifiedData.startDate,
        expirationDate: draftUnifiedData.expirationDate,
        targetedDishIds: draftUnifiedData.targetedDishIds || [],
        offeredDishes: draftUnifiedData.offeredDishes || [],
        isActive: false,
        // Champs additionnels depuis l'API mapping
        minOrderAmount: apiData.min_order_amount || undefined,
        maxUsagePerUser: apiData.max_usage_per_user || undefined,
        maxTotalUsage: apiData.max_total_usage || undefined,
        maxDiscountAmount: apiData.max_discount_amount || undefined,
        targetStandard: apiData.target_standard,
        targetPremium: apiData.target_premium,
        targetGold: apiData.target_gold,
        visibility: apiData.visibility,
        backgroundColor: draftUnifiedData.backgroundColor,
        textColor: draftUnifiedData.textColor,
        couponImageUrl: draftUnifiedData.couponImageUrl
      };


      const response = await createPromotionFromUnified(draftUnifiedData, null, 'DRAFT')

      // Recharger les promotions pour afficher le nouveau brouillon
      await loadPromotions()

      // Retourner à la vue liste
      setPromoState(prev => ({
        ...prev,
        view: 'list',
        loading: false
      }))

      toast.success(getPromotionSuccessMessage('draft'))
    } catch (error) {
      console.error('❌ [index] Erreur lors de la sauvegarde du brouillon:', error)
      const userMessage = getHumanReadableError(error);
      toast.error(userMessage);
      setPromoState(prev => ({ ...prev, loading: false }))
    }
  }

  // ✅ FONCTION SPÉCIFIQUE POUR LA SAUVEGARDE BROUILLON EN MODE ÉDITION
  const handleSaveAsDraftEdit = async (promoData: PromoTransitData) => {
    try {
      setPromoState(prev => ({ ...prev, loading: true }))


      // ✅ Convertir PromoTransitData vers UnifiedPromoFormData
      const unifiedData = convertTransitDataToUnifiedFormData(promoData);


      // ✅ S'assurer que la visibilité est DRAFT
      const draftUnifiedData: UnifiedPromoFormData = {
        ...unifiedData,
        visibility: 'DRAFT',
        status: 'DRAFT'
      };

      // ✅ UTILISER updatePromotionFromUnified pour l'édition
      if (promoState.selectedApiPromo?.id) {
        const response = await updatePromotionFromUnified(
          promoState.selectedApiPromo.id,
          draftUnifiedData,
          null,
          'DRAFT'
        )

        // Recharger les promotions pour afficher les modifications
        await loadPromotions()

        // Retourner à la vue liste
        setPromoState(prev => ({
          ...prev,
          view: 'list',
          loading: false
        }))

        toast.success(getPromotionSuccessMessage('draft'))
      } else {
        throw new Error('ID de promotion manquant pour la mise à jour')
      }

    } catch (error) {
      console.error('❌ [index] Erreur lors de la sauvegarde du brouillon (ÉDITION):', error)
      const userMessage = getHumanReadableError(error);
      toast.error(userMessage);
      setPromoState(prev => ({ ...prev, loading: false }))
    }
  }

  const handlePersonalizePromo = (promoData: PromoTransitData) => {


    // ✅ UTILISATION DES FONCTIONS DE MAPPING UNIFIÉES
    let tempData: PromoTransitData = { ...promoData };
    let targetView: 'personalize' | 'editPersonalize' = 'personalize'; // Par défaut pour création

    // ✅ DÉTERMINER LA VUE CIBLE SELON LE CONTEXTE
    if (promoState.view === 'edit') {
      // Si on vient d'EditPromo → aller vers EditPersonalizedPromo
      targetView = 'editPersonalize';



      // Les données de promoData contiennent déjà les modifications de l'utilisateur
      tempData = { ...promoData };
      tempData.isEditing = true;

    } else if (promoState.view === 'create') {
      // Si on vient de CreatePromo → aller vers PersonalizedPromo
      targetView = 'personalize';

      // Pour la création, utiliser les données du formulaire telles quelles
      tempData.isEditing = false;
    }

    handleViewChange(targetView, undefined, tempData)
  }

  // ✅ NOUVELLE FONCTION : Filtrer les promotions selon l'onglet actif
  const filterPromotionsByTab = (promos: PromoCardData[], activeTab: string): PromoCardData[] => {
    // Fonction helper pour vérifier si une promotion est expirée
    const isExpired = (promo: PromoCardData): boolean => {
      const apiPromo = apiPromotions.find(api => api.id === promo.id);
      if (!apiPromo) return false;

      // Vérifier le statut EXPIRED
      if (apiPromo.status === 'EXPIRED') return true;

      // Vérifier la date d'expiration
      if (apiPromo.expiration_date) {
        const expirationDate = new Date(apiPromo.expiration_date);
        const now = new Date();
        return expirationDate < now;
      }

      return false;
    };

    switch (activeTab) {
      case 'all':
        // Toutes les promotions ACTIVES (exclure les expirées)
        return promos.filter(promo => !isExpired(promo));

      case 'public':
        // Promotions publiques ET actives
        return promos.filter(promo => {
          const apiPromo = apiPromotions.find(api => api.id === promo.id);
          return apiPromo?.visibility === 'PUBLIC' && !isExpired(promo);
        });

      case 'private':
        // Promotions privées ET actives
        return promos.filter(promo => {
          const apiPromo = apiPromotions.find(api => api.id === promo.id);
          return apiPromo?.visibility === 'PRIVATE' && !isExpired(promo);
        });

      case 'expired':
        // Promotions expirées uniquement
        return promos.filter(promo => isExpired(promo));

      default:
        return promos.filter(promo => !isExpired(promo)); // Par défaut, exclure les expirées
    }
  };

  const handleTabChange = (tab: string) => {
    setPromoState({
      ...promoState,
      activeTab: tab
    })
  }
  const handlePromoClick = (promo: PromoCardData) => {
    // Trouver la promotion API correspondante
    const correspondingApiPromo = apiPromotions.find(apiPromo => apiPromo.id === promo.id)

    if (correspondingApiPromo) {
      setPromoState(prev => ({
        ...prev,
        view: 'view',
        selectedPromo: promo,
        selectedApiPromo: correspondingApiPromo
      }))
    } else {

      handleViewChange('view', promo)
    }
  }

  const handleSavePromo = async () => {
    // Après sauvegarde via l'API, recharger la liste des promotions
    await loadPromotions();
    setPromoState(prev => ({
      ...prev,
      view: 'list'
    }))
    toast.success(promoState.view === 'edit' ? 'Promotion modifiée avec succès' : 'Promotion créée avec succès')
  }

  const handleDeletePromo = async (promo: PromoCardData) => {
    try {
      if (promo.id) {
        await deletePromotion(promo.id)

        // Mettre à jour les deux états pour filtrer la promotion supprimée
        const updatedPromos = promoState.promos.filter(p => p.id !== promo.id)
        const updatedApiPromotions = apiPromotions.filter(p => p.id !== promo.id)

        setApiPromotions(updatedApiPromotions)
        setPromoState({
          ...promoState,
          promos: updatedPromos,
          view: 'list'
        })
        toast.success(getPromotionSuccessMessage('delete'))
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      const userMessage = getHumanReadableError(error);
      toast.error(userMessage);
    }
  }

  const handleDuplicatePromo = (promo: PromoCardData) => {
    const duplicatedPromo: PromoCardData = {
      ...promo,
      id: Date.now().toString(),
      title: `${promo.title} (Copie)`
    }
    setPromoState({
      ...promoState,
      promos: [...promoState.promos, duplicatedPromo],
      view: 'list'
    })
    toast.success('Promotion dupliquée avec succès')
  }

  if (promoState.view !== 'list') {
    return (
      <div className="flex-1 overflow-auto p-4">
        <PromoHeader
          currentView={promoState.view}
          onBack={() => handleViewChange('list')}
          onSearch={promoState.view === 'allPromotions' ? handleSearch : undefined}
        />          {promoState.view === 'create' && (
          <CreatePromo
            onSave={handlePersonalizePromo}
            onSaveAsDraft={handleSaveAsDraft}
            onCancel={() => handleViewChange('list')}
          />
        )}          {promoState.view === 'edit' && promoState.selectedApiPromo && (
          <EditPromo
            initialData={promoState.selectedApiPromo}
            isEditing={true}
            onSave={handlePersonalizePromo}
            onSaveAsDraft={handleSaveAsDraftEdit}
            onCancel={() => handleViewChange('list')}
          />
        )}{promoState.view === 'personalize' && (
          <>

            <PersonalizedPromo
              promoData={promoState.tempPromoData}
              onSave={handleSavePromo}
              onCancel={() => handleViewChange('list')}
            />
          </>
        )}
        {promoState.view === 'editPersonalize' && (
          <>

            <EditPersonalizedPromo
              promoData={promoState.tempPromoData}
              onSave={handleSavePromo}
              onCancel={() => handleViewChange('list')}
            />
          </>
        )}

        {promoState.view === 'view' && promoState.selectedApiPromo && (
          <PromoDetailView
            promo={promoState.selectedApiPromo}
            onEdit={async (apiPromo) => {
              try {

                const detailedPromo = await getPromotionById(apiPromo.id!)

                setPromoState(prev => ({
                  ...prev,
                  view: 'edit',
                  selectedApiPromo: detailedPromo
                }))
              } catch (error) {
                console.error('❌ [index] Erreur lors du chargement des données détaillées:', error)
                const userMessage = getHumanReadableError(error);
                toast.error(userMessage);

                // Fallback : utiliser les données existantes
                const correspondingPromoCard = promoState.promos.find(p => p.id === apiPromo.id)
                if (correspondingPromoCard) {
                  handleViewChange('edit', correspondingPromoCard)
                }
              }
            }}
            onDelete={(apiPromo) => {
              // Trouver le PromoCardData correspondant pour la suppression
              const correspondingPromoCard = promoState.promos.find(p => p.id === apiPromo.id)
              if (correspondingPromoCard) {
                handleDeletePromo(correspondingPromoCard)
              }
            }}
            onDuplicate={(apiPromo) => {
              // Trouver le PromoCardData correspondant pour la duplication
              const correspondingPromoCard = promoState.promos.find(p => p.id === apiPromo.id)
              if (correspondingPromoCard) {
                handleDuplicatePromo(correspondingPromoCard)
              }
            }}
            onBack={() => handleViewChange('list')}
          />
        )}

        {promoState.view === 'allPromotions' && (
          <AllPromotions
            promotions={apiPromotions}
            searchQuery={promoState.searchQuery}
            onViewPromo={(apiPromo) => {
              // Trouver le PromoCardData correspondant pour la vue
              const correspondingPromoCard = promoState.promos.find(p => p.id === apiPromo.id)
              if (correspondingPromoCard) {
                setPromoState(prev => ({
                  ...prev,
                  view: 'view',
                  selectedPromo: correspondingPromoCard,
                  selectedApiPromo: apiPromo
                }))
              }
            }}
          />
        )}
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto p-4">
      <PromoHeader
        currentView={promoState.view}
        onCreatePromo={() => handleViewChange('create')}
      />

      <div className="mt-4 space-y-6 border-1 p-8 bg-white border-slate-200 rounded-xl">

        {/* Publicités en cours avec barre de recherche */}
        <div className='flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4'>
          <span className='text-[#F17922] text-[26px] text-md font-regular'>Publicitées récentes</span>

        </div>
        {/* Statistiques */}
        <PromoStats
          promotions={apiPromotions}
          onViewAllPromotions={handleViewAllPromotions}
        />

        {/* Onglets de navigation */}
        <div className="bg-white rounded-xl p-6">
          <PromoTabs
            activeTab={promoState.activeTab}
            onTabChange={handleTabChange}
            onCreatePromo={() => handleViewChange('create')}
            className="mb-6"
          />
          {/* Card des produits  */}

          <div className="2xl:w-[80%] w-[100%]">
            {/* Grille des promotions */}
            <PromoGrid
              promos={filterPromotionsByTab(promoState.promos, promoState.activeTab)}
              onPromoClick={handlePromoClick}
              loading={promoState.loading}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Promos