import { apiRequest } from './api';
import { PromoCardData } from '@/components/gestion/Promos/PromoCard';
import { getHumanReadableError, validatePromotionError } from '@/utils/errorMessages';

// Types backend API selon la spécification fournie
export interface ApiPromotion {
  id?: string;
  title: string;
  description?: string;
  discount_type: 'BUY_X_GET_Y' | 'PERCENTAGE' | 'FIXED_AMOUNT';
  discount_value: number;
  target_type: 'SPECIFIC_PRODUCTS' | 'ALL_PRODUCTS' | 'CATEGORIES';
  start_date: string; // Format: 2025-06-01
  expiration_date: string; // Format: 2025-08-31
  targeted_dish_ids?: string[];
  targeted_category_ids?: string[]; // ✅ NOUVEAU CHAMP selon config Postman
  restaurant_ids?: string[];  
  // ✅ CORRECTION : L'API retourne "restaurants" avec des objets complets (id + name)
  restaurants?: Array<{
    id: string;
    name: string;
  }>;
  offered_dishes?: Array<{
    dish_id: string;
    quantity: number;
  }>;
  // Champs additionnels basés sur la réponse API
  max_discount_amount?: number;
  max_total_usage?: number;
  max_usage_per_user?: number;
  min_order_amount?: number;
  target_standard?: boolean;
  target_premium?: boolean;
  target_gold?: boolean;
  visibility?: 'PUBLIC' | 'PRIVATE';
  background_color?: string;
  text_color?: string;
  coupon_image_url?: string;
  current_usage?: number;
  status?: 'ACTIVE' | 'DRAFT' | 'EXPIRED' | 'UPCOMING';
  created_at?: string;
  updated_at?: string;
  created_by_id?: string;
  expiration_color?: string;
  // ✅ NOUVEAUX CHAMPS de l'endpoint détaillé /api/v1/fidelity/promotions/{id}
  targeted_dishes?: Array<{
    id: string;
    name: string;
    description?: string;
    price: number;
    image?: string;
    is_promotion?: boolean;
    promotion_price?: number;
    category_id?: string;
    entity_status?: string;
    created_at?: string;
    updated_at?: string;
  }>;
  targeted_categories?: Array<{
    id: string;
    name: string;
    description?: string;
    image?: string;
    entity_status?: string;
    created_at?: string;
    updated_at?: string;
  }>;
}

// INTERFACE UNIFIÉE COMPLÈTE - Source de vérité unique pour tous les composants
export interface UnifiedPromoFormData {
  // === CHAMPS DE BASE OBLIGATOIRES ===
  title: string;
  description: string;
  discountType: 'percentage' | 'fixed' | 'buyXgetY';
  discountValue: number;
  targetType: 'all' | 'specific' | 'categories';
  startDate: string;
  expirationDate: string;
  isActive: boolean;

  // === CHAMPS DE VALEURS SPÉCIFIQUES PAR TYPE ===
  // Pour type 'percentage'
  percentageValue: string;
  // Pour type 'fixed'
  fixedAmountValue: string;
  // Pour type 'buyXgetY'
  buyQuantity: string;
  getQuantity: string;
  // Plafond de réduction (tous types)
  discountCeiling: string;

  // === SÉLECTIONS DE PRODUITS ET CIBLES ===
  productTarget: 'all' | 'specific' | 'categories';
  selectedMenus: string[];
  selectedCategories: string[];
  selectedRewardMenus: string[]; // Pour buyXgetY
  selectedRestaurants: string[];

  // === CONTRAINTES ET LIMITES ===
  minOrderAmount: string;
  maxUsagePerClient: string;
  maxTotalUsage: string;
  selectedPublicTypes: string[];

  // === CHAMPS DE PERSONNALISATION ===
  backgroundColor: string;
  textColor: string;
  couponImageUrl: string;

  // === MÉTADONNÉES ET API ===
  id?: string;
  currentUsage?: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  createdById?: string;

  // === CHAMPS API MAPPÉS ===
  maxDiscountAmount?: number | null;
  maxTotalUsageApi?: number | null;
  maxUsagePerUser?: number | null;
  minOrderAmountApi?: number | null;
  targetStandard?: boolean;
  targetPremium?: boolean;
  targetGold?: boolean;
  visibility?: string;
  targetedDishIds?: string[];
  offeredDishes?: Array<{
    dishId: string;
    quantity: number;
  }>;

  // === CHAMPS DE COMPATIBILITÉ ===
  discount?: string;
  type?: string;
  validUntil?: string;
  background?: string;
  caracter?: string;
}

// Interface pour le transit entre CreatePromo et PersonalizedPromo
export interface PromoTransitData {
  // === DONNÉES DE L'ÉTAPE 1 (CreatePromo/EditPromo) ===
  promoType: 'percentage' | 'fixed' | 'buyXgetY';
  discountType: 'percentage' | 'fixed' | 'buyXgetY';
  discountValue?: number; // ✅ AJOUTÉ

  // Valeurs spécifiques
  percentageValue: string;
  fixedAmountValue: string;
  buyQuantity: string;
  getQuantity: string;
  discountCeiling: string;

  // Cibles de produits
  productTarget: 'all' | 'specific' | 'categories';
  selectedMenus: string[];
  selectedCategories: string[];
  selectedRewardMenus: string[];
  selectedRestaurants: string[];

  // Contraintes
  minOrderAmount: string;
  maxUsagePerClient: string;
  maxTotalUsage: string;
  selectedPublicTypes: string[];

  // === DONNÉES DE L'ÉTAPE 2 (PersonalizedPromo) ===
  title?: string;
  description?: string;
  startDate?: string;
  expirationDate?: string;
  backgroundColor?: string;
  textColor?: string;
  couponImageUrl?: string;

  // === MÉTADONNÉES (pour l'édition) ===
  id?: string;
  currentUsage?: number;
  status?: string;
  isEditing?: boolean;

  // === CHAMPS SUPPLÉMENTAIRES POUR COMPATIBILITÉ ===
  targetType?: string;
  targetedDishIds?: string[];
  offeredDishes?: Array<{dishId: string; quantity: number}>;
  maxUsagePerUser?: number;
  maxDiscountAmount?: number;
  targetStandard?: boolean;
  targetPremium?: boolean;
  targetGold?: boolean;
  visibility?: string;
  restaurantIds?: string[];
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdById?: string;
}

// Interface legacy maintenue pour compatibilité
export interface PromotionFormData {
  title: string;
  description?: string;
  discountType: 'percentage' | 'fixed' | 'buyXgetY';
  discountValue: number;
  targetType: 'all' | 'specific' | 'categories';
  startDate: string;
  expirationDate: string;
  targetedDishIds?: string[];
  offeredDishes?: Array<{
    dishId: string;
    quantity: number;
  }>;
  isActive?: boolean;
  id?: string;
  maxDiscountAmount?: number | null;
  maxTotalUsage?: number | null;
  maxUsagePerUser?: number | null;
  minOrderAmount?: number | null;
  targetStandard?: boolean;
  targetPremium?: boolean;
  targetGold?: boolean;
  visibility?: string;
  backgroundColor?: string;
  textColor?: string;
  couponImageUrl?: string;
  // ✅ NOUVEAU: Support pour File upload
  couponImageFile?: File;
  currentUsage?: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  createdById?: string;
  discount?: string;
  type?: string;
  validUntil?: string;
  background?: string;
  caracter?: string;
  buyQuantity?: number;
  getQuantity?: number;
  maxDiscount?: number;
  minOrderValue?: number;
  usageLimit?: number;
}

// Réponses API pour les listes
interface ApiPromotionListResponse {
  data: ApiPromotion[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// === FONCTIONS DE MAPPING UNIFIÉES ET ROBUSTES ===

// Fonction utilitaire pour créer un objet UnifiedPromoFormData vide avec valeurs par défaut
export const createEmptyUnifiedFormData = (): UnifiedPromoFormData => ({
  // Champs de base obligatoires
  title: '',
  description: '',
  discountType: 'percentage',
  discountValue: 0,
  targetType: 'all',
  startDate: new Date().toISOString().split('T')[0],
  expirationDate: '',
  isActive: true,

  // Valeurs spécifiques par type
  percentageValue: '',
  fixedAmountValue: '',
  buyQuantity: '',
  getQuantity: '',
  discountCeiling: '',

  // Sélections
  productTarget: 'all',
  selectedMenus: [],
  selectedCategories: [],
  selectedRewardMenus: [],
  selectedRestaurants: [],

  // Contraintes
  minOrderAmount: '',
  maxUsagePerClient: '',
  maxTotalUsage: '',
  selectedPublicTypes: [],

  // Personnalisation
  backgroundColor: '',
  textColor: '',
  couponImageUrl: '',

  // Champs API mappés
  targetedDishIds: [],
  offeredDishes: [],
});

// ✅ Mapping ApiPromotion vers UnifiedPromoFormData (pour l'édition) - COMPLET
export const mapApiPromotionToUnifiedFormData = (apiPromo: ApiPromotion): UnifiedPromoFormData => {

  const baseData = createEmptyUnifiedFormData();

  // ✅ CHAMPS DE BASE
  baseData.title = apiPromo.title || '';
  baseData.description = apiPromo.description || '';
  baseData.startDate = apiPromo.start_date || baseData.startDate;
  baseData.expirationDate = apiPromo.expiration_date || '';
  baseData.isActive = apiPromo.status === 'ACTIVE';

  // ✅ MÉTADONNÉES
  baseData.id = apiPromo.id;
  baseData.status = apiPromo.status;
  baseData.currentUsage = apiPromo.current_usage || 0;

  // Mapping du type de discount
  switch (apiPromo.discount_type) {
    case 'PERCENTAGE':
      baseData.discountType = 'percentage';
      baseData.percentageValue = apiPromo.discount_value?.toString() || '';
      break;
    case 'FIXED_AMOUNT':
      baseData.discountType = 'fixed';
      baseData.fixedAmountValue = apiPromo.discount_value?.toString() || '';
      break;
    case 'BUY_X_GET_Y':
      baseData.discountType = 'buyXgetY';
      baseData.buyQuantity = apiPromo.discount_value?.toString() || '';
      // Pour BuyXGetY, getQuantity vient des offered_dishes
      if (apiPromo.offered_dishes && apiPromo.offered_dishes.length > 0) {
        baseData.getQuantity = apiPromo.offered_dishes[0].quantity?.toString() || '';
      }
      break;
  }

  baseData.discountValue = apiPromo.discount_value || 0;

  // Mapping du type de cible
  switch (apiPromo.target_type) {
    case 'ALL_PRODUCTS':
      baseData.targetType = 'all';
      baseData.productTarget = 'all';
      break;
    case 'SPECIFIC_PRODUCTS':
      baseData.targetType = 'specific';
      baseData.productTarget = 'specific';
      break;
    case 'CATEGORIES':
      baseData.targetType = 'categories';
      baseData.productTarget = 'categories';
      break;
  }

  // ✅ MAPPING DES SÉLECTIONS (CHAMPS CRITIQUES CORRIGÉS)

  // Mapping des plats ciblés (targeted_dishes contient des objets complets)
  if (apiPromo.targeted_dishes && apiPromo.targeted_dishes.length > 0) {
    baseData.selectedMenus = apiPromo.targeted_dishes.map((dish: { id: string }) => dish.id);
    baseData.targetedDishIds = apiPromo.targeted_dishes.map((dish: { id: string }) => dish.id);
  } else if (apiPromo.targeted_dish_ids) {
    // Fallback pour le format ancien
    baseData.selectedMenus = apiPromo.targeted_dish_ids;
    baseData.targetedDishIds = apiPromo.targeted_dish_ids;
  } else {
    baseData.selectedMenus = [];
    baseData.targetedDishIds = [];
  }

  // ✅ MAPPING DES CATÉGORIES CIBLÉES (targeted_categories contient des objets complets)
  if (apiPromo.targeted_categories && apiPromo.targeted_categories.length > 0) {
    baseData.selectedCategories = apiPromo.targeted_categories.map((category: { id: string }) => category.id);
  } else if ((apiPromo as { targeted_category_ids?: string[] }).targeted_category_ids) {
    // Fallback pour le format ancien
    baseData.selectedCategories = (apiPromo as { targeted_category_ids: string[] }).targeted_category_ids;
  } else {
    baseData.selectedCategories = [];
  }
 
  if (apiPromo.restaurants && apiPromo.restaurants.length > 0) {
    // ✅ PRIORITÉ : Utiliser le champ "restaurants" avec des objets complets
    baseData.selectedRestaurants = apiPromo.restaurants.map(restaurant => String(restaurant.id));
  
  } else if (apiPromo.restaurant_ids && apiPromo.restaurant_ids.length > 0) {
    // ✅ FALLBACK : Utiliser le champ "restaurant_ids" si disponible (compatibilité)
    baseData.selectedRestaurants = apiPromo.restaurant_ids.map(id => String(id));
   
  } else {
    baseData.selectedRestaurants = [];
    console.log('⚠️ [mapApiPromotionToUnifiedFormData] Aucun restaurant trouvé');
  }
  
  

  // ✅ MAPPING DES MENUS DE RÉCOMPENSE
  if (apiPromo.offered_dishes && apiPromo.offered_dishes.length > 0) {
    baseData.selectedRewardMenus = apiPromo.offered_dishes
      .map((dish: { dish_id: string }) => dish.dish_id)
      .filter(id => id !== undefined && id !== null); // ✅ Filtrer les valeurs undefined/null
    baseData.offeredDishes = apiPromo.offered_dishes
      .filter((dish: { dish_id: string; quantity: number }) => dish.dish_id !== undefined && dish.dish_id !== null) // ✅ Filtrer les plats invalides
      .map((dish: { dish_id: string; quantity: number }) => ({
        dishId: dish.dish_id,
        quantity: dish.quantity
      }));
  } else {
    baseData.selectedRewardMenus = [];
    baseData.offeredDishes = [];
  }

  // Mapping des contraintes
  baseData.minOrderAmount = apiPromo.min_order_amount?.toString() || '';
  baseData.minOrderAmountApi = apiPromo.min_order_amount;
  baseData.maxUsagePerClient = apiPromo.max_usage_per_user?.toString() || '';
  baseData.maxUsagePerUser = apiPromo.max_usage_per_user;
  baseData.maxTotalUsage = apiPromo.max_total_usage?.toString() || '';
  baseData.maxTotalUsageApi = apiPromo.max_total_usage;
  baseData.discountCeiling = apiPromo.max_discount_amount?.toString() || '';
  baseData.maxDiscountAmount = apiPromo.max_discount_amount;

  // Mapping des types de public
  const publicTypes: string[] = [];
  if (apiPromo.visibility === 'PUBLIC') {
    publicTypes.push('Public');
  } else {
    if (apiPromo.target_standard) publicTypes.push('Utilisateur Standard');
    if (apiPromo.target_premium) publicTypes.push('Utilisateur Premium');
    if (apiPromo.target_gold) publicTypes.push('Utilisateur Gold');
  }
  baseData.selectedPublicTypes = publicTypes;
  baseData.targetStandard = apiPromo.target_standard;
  baseData.targetPremium = apiPromo.target_premium;
  baseData.targetGold = apiPromo.target_gold;
  baseData.visibility = apiPromo.visibility;

  // Mapping de la personnalisation
  baseData.backgroundColor = apiPromo.background_color || '';
  baseData.textColor = apiPromo.text_color || '';
  baseData.couponImageUrl = apiPromo.coupon_image_url || '';

  // Métadonnées
  baseData.id = apiPromo.id;
  baseData.currentUsage = apiPromo.current_usage;
  baseData.status = apiPromo.status;
  baseData.createdAt = apiPromo.created_at;
  baseData.updatedAt = apiPromo.updated_at;
  baseData.createdById = apiPromo.created_by_id;

  // Champs de compatibilité
  baseData.discount = apiPromo.discount_type === 'PERCENTAGE' ? `${apiPromo.discount_value}%` : `${apiPromo.discount_value}`;
  baseData.type = apiPromo.discount_type === 'PERCENTAGE' ? 'percentage' : 'fixed';
  baseData.validUntil = apiPromo.expiration_date;
  baseData.background = apiPromo.background_color;
  baseData.caracter = apiPromo.text_color;



  return baseData;
};
 
export const mapUnifiedFormDataToApiPromotion = (formData: UnifiedPromoFormData, status: 'ACTIVE' | 'DRAFT' = 'ACTIVE'): Omit<ApiPromotion, 'id' | 'created_at' | 'updated_at'> => {
   

  // Conversion des types de discount
  let discountType: ApiPromotion['discount_type'];
  let discountValue: number;

  switch (formData.discountType) {
    case 'percentage':
      discountType = 'PERCENTAGE';
      discountValue = parseFloat(formData.percentageValue) || formData.discountValue || 0;
      break;
    case 'fixed':
      discountType = 'FIXED_AMOUNT';
      discountValue = parseFloat(formData.fixedAmountValue) || formData.discountValue || 0;
      break;
    case 'buyXgetY':
      discountType = 'BUY_X_GET_Y';
      discountValue = parseFloat(formData.buyQuantity) || formData.discountValue || 0;
      break;
    default:
      discountType = 'PERCENTAGE';
      discountValue = 0;
  }

  // Conversion des types de cible
  let targetType: ApiPromotion['target_type'];
  switch (formData.targetType || formData.productTarget) {
    case 'all':
      targetType = 'ALL_PRODUCTS';
      break;
    case 'specific':
      targetType = 'SPECIFIC_PRODUCTS';
      break;
    case 'categories':
      targetType = 'CATEGORIES';
      break;
    default:
      targetType = 'ALL_PRODUCTS';
  }

  // Construction de l'objet API
  const apiPromotion: Omit<ApiPromotion, 'id' | 'created_at' | 'updated_at' | 'created_by_id'> = {
    title: formData.title,
    description: formData.description,
    discount_type: discountType,
    discount_value: discountValue,
    target_type: targetType,
    start_date: formatDateForApi(formData.startDate),
    expiration_date: formatDateForApi(formData.expirationDate),
    status: status,
  };

  // Ajout conditionnel des champs selon le type et les sélections
  if (formData.selectedMenus && formData.selectedMenus.length > 0) {
    apiPromotion.targeted_dish_ids = formData.selectedMenus;
  } else if (formData.targetedDishIds && formData.targetedDishIds.length > 0) {
    apiPromotion.targeted_dish_ids = formData.targetedDishIds;
  }

  // ✅ NOUVEAU : Mapping des catégories ciblées
  if (formData.selectedCategories && formData.selectedCategories.length > 0) {
    apiPromotion.targeted_category_ids = formData.selectedCategories;
  }
 
  if (formData.selectedRestaurants && formData.selectedRestaurants.length > 0) {
    apiPromotion.restaurant_ids = formData.selectedRestaurants;
     
  } else {
    console.log('⚠️ [mapUnifiedFormDataToApiPromotion] Aucun restaurant sélectionné');
  }

  if (formData.selectedRewardMenus && formData.selectedRewardMenus.length > 0 && formData.discountType === 'buyXgetY') {
    const getQty = parseFloat(formData.getQuantity) || 1;
    // ✅ Filtrer les valeurs undefined/null avant d'envoyer à l'API
    const validMenuIds = formData.selectedRewardMenus.filter(menuId => menuId !== undefined && menuId !== null && menuId !== '');
    if (validMenuIds.length > 0) {
      apiPromotion.offered_dishes = validMenuIds.map(menuId => ({
        dish_id: menuId,
        quantity: getQty
      }));
    }
  } else if (formData.offeredDishes && formData.offeredDishes.length > 0) {
    // ✅ Filtrer les plats invalides
    const validOfferedDishes = formData.offeredDishes.filter(dish => dish.dishId !== undefined && dish.dishId !== null && dish.dishId !== '');
    if (validOfferedDishes.length > 0) {
      apiPromotion.offered_dishes = validOfferedDishes.map(dish => ({
        dish_id: dish.dishId,
        quantity: dish.quantity
      }));
    }
  }

  // Contraintes et limites
  if (formData.minOrderAmount && parseFloat(formData.minOrderAmount) > 0) {
    apiPromotion.min_order_amount = parseFloat(formData.minOrderAmount);
  } else if (formData.minOrderAmountApi !== null && formData.minOrderAmountApi !== undefined) {
    apiPromotion.min_order_amount = formData.minOrderAmountApi;
  }

  if (formData.maxUsagePerClient && parseFloat(formData.maxUsagePerClient) > 0) {
    apiPromotion.max_usage_per_user = parseFloat(formData.maxUsagePerClient);
  } else if (formData.maxUsagePerUser !== null && formData.maxUsagePerUser !== undefined) {
    apiPromotion.max_usage_per_user = formData.maxUsagePerUser;
  } else {
    apiPromotion.max_usage_per_user = 1; // Valeur par défaut
  }

  // ✅ GESTION SPÉCIALE DE "illimité" pour maxTotalUsage
  if (formData.maxTotalUsage && formData.maxTotalUsage.toLowerCase() !== 'illimité' && parseFloat(formData.maxTotalUsage) > 0) {
    apiPromotion.max_total_usage = parseFloat(formData.maxTotalUsage);
  } else if (formData.maxTotalUsageApi !== null && formData.maxTotalUsageApi !== undefined) {
    apiPromotion.max_total_usage = formData.maxTotalUsageApi;
  }
  // Si maxTotalUsage est "illimité", on ne définit pas max_total_usage (reste null)

  if (formData.discountCeiling && parseFloat(formData.discountCeiling) > 0) {
    apiPromotion.max_discount_amount = parseFloat(formData.discountCeiling);
  } else if (formData.maxDiscountAmount !== null && formData.maxDiscountAmount !== undefined) {
    apiPromotion.max_discount_amount = formData.maxDiscountAmount;
  }

 
  if (formData.selectedPublicTypes.includes('Public')) {
    // Public = visible pour tous, avec tous les targets à false explicitement
    apiPromotion.visibility = 'PUBLIC';
    apiPromotion.target_standard = false;
    apiPromotion.target_premium = false;
    apiPromotion.target_gold = false;
    
  } else {
    // Privé = sélection spécifique des types d'utilisateurs
    apiPromotion.visibility = 'PRIVATE';
    apiPromotion.target_standard = formData.selectedPublicTypes.includes('Utilisateur Standard') || formData.targetStandard || false;
    apiPromotion.target_premium = formData.selectedPublicTypes.includes('Utilisateur Premium') || formData.targetPremium || false;
    apiPromotion.target_gold = formData.selectedPublicTypes.includes('Utilisateur Gold') || formData.targetGold || false;

 
    // ✅ VALIDATION : Au moins un type doit être sélectionné en mode privé
    if (!apiPromotion.target_standard && !apiPromotion.target_premium && !apiPromotion.target_gold) {
      // Par défaut, cibler les utilisateurs standard si aucun type n'est sélectionné
      apiPromotion.target_standard = true;
    
    }
  }

  // Personnalisation
  if (formData.backgroundColor) {
    apiPromotion.background_color = formData.backgroundColor;
  }
  if (formData.textColor) {
    apiPromotion.text_color = formData.textColor;
  }
  if (formData.couponImageUrl) {
    apiPromotion.coupon_image_url = formData.couponImageUrl;
  }

  
  return apiPromotion;
};

// Mapping legacy pour compatibilité
export const mapFormDataToApiPromotion = (formData: PromotionFormData, status: 'ACTIVE' | 'DRAFT' = 'ACTIVE'): Omit<ApiPromotion, 'id' | 'created_at' | 'updated_at'> => {
  // Conversion des types de discount
  let discountType: ApiPromotion['discount_type'];
  switch (formData.discountType) {
    case 'percentage':
      discountType = 'PERCENTAGE';
      break;
    case 'fixed':
      discountType = 'FIXED_AMOUNT';
      break;
    case 'buyXgetY':
      discountType = 'BUY_X_GET_Y';
      break;
    default:
      discountType = 'PERCENTAGE';
  }

  // Conversion des types de cible
  let targetType: ApiPromotion['target_type'];
  switch (formData.targetType) {
    case 'all':
      targetType = 'ALL_PRODUCTS';
      break;
    case 'specific':
      targetType = 'SPECIFIC_PRODUCTS';
      break;
    case 'categories':
      targetType = 'CATEGORIES';
      break;
    default:
      targetType = 'ALL_PRODUCTS';
  }
  // Construction de l'objet API
  const apiPromotion: Omit<ApiPromotion, 'id' | 'created_at' | 'updated_at' | 'created_by_id'> = {
    title: formData.title,
    description: formData.description,
    discount_type: discountType,
    discount_value: formData.discountValue,
    target_type: targetType,
    start_date: formatDateForApi(formData.startDate),
    expiration_date: formatDateForApi(formData.expirationDate),
  };

  // Ajout conditionnel des champs selon le type
  if (formData.targetedDishIds && formData.targetedDishIds.length > 0) {
    apiPromotion.targeted_dish_ids = formData.targetedDishIds;
  }

  if (formData.offeredDishes && formData.offeredDishes.length > 0) {
    apiPromotion.offered_dishes = formData.offeredDishes.map(dish => ({
      dish_id: dish.dishId,
      quantity: dish.quantity
    }));
  }
  // Ajout des contraintes et limites
  if (formData.maxDiscount !== undefined && formData.maxDiscount > 0) {
    apiPromotion.max_discount_amount = formData.maxDiscount;
  }

  if (formData.usageLimit !== undefined && formData.usageLimit > 0) {
    apiPromotion.max_total_usage = formData.usageLimit;
  }

  if (formData.minOrderValue !== undefined && formData.minOrderValue > 0) {
    apiPromotion.min_order_amount = formData.minOrderValue;
  }

  // Ajout des champs visuels
  if (formData.backgroundColor) {
    apiPromotion.background_color = formData.backgroundColor;
  }

  if (formData.textColor) {
    apiPromotion.text_color = formData.textColor;
  }

  if (formData.couponImageUrl) {
    apiPromotion.coupon_image_url = formData.couponImageUrl;
  }
  // Par défaut, max_usage_per_user = 1 si pas spécifié
  apiPromotion.max_usage_per_user = 1;

  // ✅ CORRECTION CRITIQUE : Ne pas forcer les valeurs par défaut ici
  // Ces valeurs doivent être gérées par mapUnifiedFormDataToApiPromotion
  // qui a accès aux vraies données du formulaire
  // Définir le statut
  apiPromotion.status = status;

  return apiPromotion;
};

// Mapping backend vers frontend pour PromoCardData
export const mapApiPromotionToPromoCard = (apiPromo: ApiPromotion): PromoCardData => {
  // Détermination du statut
  let status: PromoCardData['status'] = 'active';
  const now = new Date();
  const startDate = new Date(apiPromo.start_date);
  const endDate = new Date(apiPromo.expiration_date);

  if (now < startDate) {
    status = 'upcoming';
  } else if (now > endDate) {
    status = 'expired';
  }

  // Construction du texte de discount
  let discountText = '';
  switch (apiPromo.discount_type) {
    case 'PERCENTAGE':
      discountText = `${apiPromo.discount_value}`;
      break;
    case 'FIXED_AMOUNT':
      discountText = `${apiPromo.discount_value}`;
      break;
    case 'BUY_X_GET_Y':
      discountText = `Achetez ${apiPromo.discount_value}`;
      break;
    default:
      discountText = `${apiPromo.discount_value}`;
  }  return {
    id: apiPromo.id || '',
    title: apiPromo.title,
    discount: discountText,
    description: apiPromo.description || '',
    type: apiPromo.discount_type === 'FIXED_AMOUNT' ? 'fixed' : 'percentage',
    status: status,
    validUntil: apiPromo.expiration_date,
    background: apiPromo.background_color || '#6B7280',
    textColor: apiPromo.text_color || '#FFFFFF',
    caracter: '#F17922',

    // Préservation de TOUTES les données de l'API
    discount_type: apiPromo.discount_type,
    discount_value: apiPromo.discount_value,
    target_type: apiPromo.target_type,
    targeted_dish_ids: apiPromo.targeted_dish_ids,
    offered_dishes: apiPromo.offered_dishes,
    min_order_amount: apiPromo.min_order_amount,
    max_discount_amount: apiPromo.max_discount_amount,
    max_total_usage: apiPromo.max_total_usage,
    max_usage_per_user: apiPromo.max_usage_per_user,
    current_usage: apiPromo.current_usage,
    start_date: apiPromo.start_date,
    expiration_date: apiPromo.expiration_date,
    visibility: apiPromo.visibility,
    target_standard: apiPromo.target_standard,
    target_premium: apiPromo.target_premium,
    target_gold: apiPromo.target_gold,
    background_color: apiPromo.background_color,
    text_color: apiPromo.text_color,
    coupon_image_url: apiPromo.coupon_image_url,
    created_at: apiPromo.created_at,
    updated_at: apiPromo.updated_at,
    created_by_id: apiPromo.created_by_id
  };
};

// Mapping backend vers frontend pour PromotionFormData
export const mapApiPromotionToFormData = (apiPromo: ApiPromotion): PromotionFormData => {
  // Conversion inverse des types
  let discountType: PromotionFormData['discountType'];
  switch (apiPromo.discount_type) {
    case 'PERCENTAGE':
      discountType = 'percentage';
      break;
    case 'FIXED_AMOUNT':
      discountType = 'fixed';
      break;
    case 'BUY_X_GET_Y':
      discountType = 'buyXgetY';
      break;
    default:
      discountType = 'percentage';
  }

  let targetType: PromotionFormData['targetType'];
  switch (apiPromo.target_type) {
    case 'ALL_PRODUCTS':
      targetType = 'all';
      break;
    case 'SPECIFIC_PRODUCTS':
      targetType = 'specific';
      break;
    case 'CATEGORIES':
      targetType = 'categories';
      break;
    default:
      targetType = 'all';
  }

  return {
    title: apiPromo.title,
    discountType: discountType,
    discountValue: apiPromo.discount_value,
    targetType: targetType,
    startDate: apiPromo.start_date,
    expirationDate: apiPromo.expiration_date,
    targetedDishIds: apiPromo.targeted_dish_ids || [],
    offeredDishes: apiPromo.offered_dishes?.map(dish => ({
      dishId: dish.dish_id,
      quantity: dish.quantity
    })) || [],
    isActive: apiPromo.status === 'ACTIVE'
  };
};

// Utilitaires
const formatDateForApi = (dateString: string): string => {
  if (!dateString) return new Date().toISOString().split('T')[0];


  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }

  // Sinon, convertir depuis Date vers format API
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

const generateDescriptionFromApiPromo = (apiPromo: ApiPromotion): string => {
  const targetDescription = apiPromo.target_type === 'ALL_PRODUCTS'
    ? 'tous les produits'
    : apiPromo.target_type === 'SPECIFIC_PRODUCTS'
    ? 'produits sélectionnés'
    : 'catégories sélectionnées';

  switch (apiPromo.discount_type) {
    case 'PERCENTAGE':
      return `${apiPromo.discount_value}`;
    case 'FIXED_AMOUNT':
      return `${apiPromo.discount_value}`;
    case 'BUY_X_GET_Y':
      return `Offre spéciale sur ${targetDescription}`;
    default:
      return `Promotion sur ${targetDescription}`;
  }
};

// Validation des données
export const validatePromotionData = (data: PromotionFormData): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Validation du titre
  if (!data.title || data.title.trim().length === 0) {
    errors.push('Le titre est requis');
  } else if (data.title.length > 100) {
    errors.push('Le titre ne peut pas dépasser 100 caractères');
  }

  // Validation de la valeur de discount
  if (!data.discountValue || data.discountValue <= 0) {
    errors.push('La valeur de réduction doit être supérieure à 0');
  }

  if (data.discountType === 'percentage' && data.discountValue > 100) {
    errors.push('Le pourcentage de réduction ne peut pas dépasser 100%');
  }

  // Validation des dates
  if (!data.startDate) {
    errors.push('La date de début est requise');
  }

  if (!data.expirationDate) {
    errors.push('La date de fin est requise');
  }

  if (data.startDate && data.expirationDate) {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.expirationDate);

    if (endDate <= startDate) {
      errors.push('La date de fin doit être postérieure à la date de début');
    }
  }

  // Validation spécifique aux produits ciblés
  if (data.targetType === 'specific' && (!data.targetedDishIds || data.targetedDishIds.length === 0)) {
    errors.push('Vous devez sélectionner au moins un produit pour une promotion ciblée');
  }

  // Validation pour BuyXGetY
  if (data.discountType === 'buyXgetY') {
    if (!data.buyQuantity || data.buyQuantity <= 0) {
      errors.push('La quantité à acheter doit être supérieure à 0');
    }
    if (!data.getQuantity || data.getQuantity <= 0) {
      errors.push('La quantité gratuite doit être supérieure à 0');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Services API
export const createPromotion = async (formData: PromotionFormData, status: 'ACTIVE' | 'DRAFT' = 'ACTIVE'): Promise<ApiPromotion> => {
  // Validation avant envoi
  const validation = validatePromotionData(formData);
  if (!validation.isValid) {
    throw new Error(`Données invalides: ${validation.errors.join(', ')}`);
  }
  try {

    // ✅ Si on a un File ou une image, utiliser FormData au lieu de JSON
    if (formData.couponImageFile || (formData.couponImageUrl && formData.couponImageUrl.startsWith('data:image'))) {

      const apiFormData = new FormData();

      // Ajouter tous les champs texte
      apiFormData.append('title', formData.title);
      if (formData.description) apiFormData.append('description', formData.description);

      // Mapping des types
      let discountType: string;
      switch (formData.discountType) {
        case 'percentage': discountType = 'PERCENTAGE'; break;
        case 'fixed': discountType = 'FIXED_AMOUNT'; break;
        case 'buyXgetY': discountType = 'BUY_X_GET_Y'; break;
        default: discountType = 'PERCENTAGE';
      }      apiFormData.append('discount_type', discountType);
      // Convertir en nombre pour éviter les erreurs de validation
      apiFormData.append('discount_value', formData.discountValue.toString());

      // Mapping des types de cible
      let targetType: string;
      switch (formData.targetType) {
        case 'all': targetType = 'ALL_PRODUCTS'; break;
        case 'specific': targetType = 'SPECIFIC_PRODUCTS'; break;
        case 'categories': targetType = 'CATEGORIES'; break;
        default: targetType = 'ALL_PRODUCTS';
      }
      apiFormData.append('target_type', targetType);

      // Dates - utiliser la même logique que la version JSON
      apiFormData.append('start_date', formatDateForApi(formData.startDate));
      apiFormData.append('expiration_date', formatDateForApi(formData.expirationDate));

      // Champs optionnels
      if (formData.targetedDishIds && formData.targetedDishIds.length > 0) {
        apiFormData.append('targeted_dish_ids', JSON.stringify(formData.targetedDishIds));
      }

      if (formData.offeredDishes && formData.offeredDishes.length > 0) {
        const offeredDishes = formData.offeredDishes.map(dish => ({
          dish_id: dish.dishId,
          quantity: dish.quantity
        }));
        apiFormData.append('offered_dishes', JSON.stringify(offeredDishes));
      }

      // Limites et contraintes
      if (formData.maxDiscount !== undefined && formData.maxDiscount > 0) {
        apiFormData.append('max_discount_amount', formData.maxDiscount.toString());
      }
      if (formData.usageLimit !== undefined && formData.usageLimit > 0) {
        apiFormData.append('max_total_usage', formData.usageLimit.toString());
      }
      if (formData.minOrderValue !== undefined && formData.minOrderValue > 0) {
        apiFormData.append('min_order_amount', formData.minOrderValue.toString());
      }
      // ✅ CORRECTION CRITIQUE : Gestion correcte de la visibilité et des cibles
      apiFormData.append('max_usage_per_user', '1');

      // Gérer la visibilité selon les données du formulaire
      if (formData.visibility === 'PUBLIC' || !formData.visibility) {
        apiFormData.append('visibility', 'PUBLIC');
        // ✅ CORRECTION : Mode PUBLIC - ne pas envoyer les targets
      } else {
        apiFormData.append('visibility', 'PRIVATE');
        // ✅ CORRECTION : Envoyer SEULEMENT les targets cochés avec "true"
        if (formData.targetStandard) {
          apiFormData.append('target_standard', 'true');
        }
        if (formData.targetPremium) {
          apiFormData.append('target_premium', 'true');
        }
        if (formData.targetGold) {
          apiFormData.append('target_gold', 'true');
        }

        // Validation : au moins un type doit être sélectionné en mode privé
        if (!formData.targetStandard && !formData.targetPremium && !formData.targetGold) {
          // Par défaut, cibler les utilisateurs standard
          apiFormData.append('target_standard', 'true');
        }
      }

      // Ajouter le statut
      apiFormData.append('status', status);

      // Champs visuels
      if (formData.backgroundColor) {
        apiFormData.append('background_color', formData.backgroundColor);
      }      if (formData.textColor) {
        apiFormData.append('text_color', formData.textColor);
      }
      // ✅ GESTION DE L'IMAGE : File directement ou conversion base64
      if (formData.couponImageFile) {
        // Utiliser le File directement (comme les autres services)
        apiFormData.append('coupon_image_url', formData.couponImageFile);
      } else if (formData.couponImageUrl && formData.couponImageUrl.startsWith('data:image')) {
        // Fallback pour base64 (compatibilité)
        const blob = dataURLtoBlob(formData.couponImageUrl);
        apiFormData.append('coupon_image_url', blob, 'coupon.jpg');
      }

      const response = await apiRequest<ApiPromotion>('/fidelity/promotions', 'POST', apiFormData);
      return response;

    } else {      // Sans image, utiliser l'ancien système JSON
      const apiData = mapFormDataToApiPromotion(formData, status);

      const response = await apiRequest<ApiPromotion>('/fidelity/promotions', 'POST', apiData);
      return response;
    }

  } catch (error) {
    // Retourner l'erreur originale de l'API au lieu d'un message générique
    if (error instanceof Error) {
      throw new Error(`Erreur API: ${error.message}`);
    }
    throw new Error('Impossible de créer la promotion. Veuillez réessayer.');
  }
};

// Fonction utilitaire pour convertir base64 en Blob
const dataURLtoBlob = (dataURL: string): Blob => {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new Blob([u8arr], { type: mime });
};

export const updatePromotion = async (id: string, formData: PromotionFormData): Promise<ApiPromotion> => {
  // Validation avant envoi
  const validation = validatePromotionData(formData);
  if (!validation.isValid) {
    throw new Error(`Données invalides: ${validation.errors.join(', ')}`);
  }

  try {
    // ✅ Si on a un File ou une image, utiliser FormData au lieu de JSON
    if (formData.couponImageFile || (formData.couponImageUrl && formData.couponImageUrl.startsWith('data:image'))) {

      const apiFormData = new FormData();
        // Champs requis
      apiFormData.append('title', formData.title);
      apiFormData.append('description', formData.description || '');
      // ✅ Mapping des types avec les BONNES valeurs d'énumération API
      let discountType: string;
      switch (formData.discountType) {
        case 'percentage': discountType = 'PERCENTAGE'; break;
        case 'fixed': discountType = 'FIXED_AMOUNT'; break;
        case 'buyXgetY': discountType = 'BUY_X_GET_Y'; break;
        default: discountType = 'PERCENTAGE';
      }
      apiFormData.append('discount_type', discountType);
      apiFormData.append('discount_value', formData.discountValue.toString());

      // ✅ Mapping des types de cible avec les BONNES valeurs d'énumération API
      let targetType: string;
      switch (formData.targetType) {
        case 'all': targetType = 'ALL_PRODUCTS'; break;
        case 'specific': targetType = 'SPECIFIC_PRODUCTS'; break;
        case 'categories': targetType = 'CATEGORIES'; break;
        default: targetType = 'ALL_PRODUCTS';
      }
      apiFormData.append('target_type', targetType);
      apiFormData.append('start_date', formatDateForApi(formData.startDate));
      apiFormData.append('expiration_date', formatDateForApi(formData.expirationDate));

      // Champs optionnels
      if (formData.targetedDishIds && formData.targetedDishIds.length > 0) {
        apiFormData.append('targeted_dish_ids', JSON.stringify(formData.targetedDishIds));
      }

      if (formData.offeredDishes && formData.offeredDishes.length > 0) {
        const offeredDishes = formData.offeredDishes.map(dish => ({
          dish_id: dish.dishId,
          quantity: dish.quantity
        }));
        apiFormData.append('offered_dishes', JSON.stringify(offeredDishes));
      }

      // Limites et contraintes
      if (formData.maxDiscount !== undefined && formData.maxDiscount > 0) {
        apiFormData.append('max_discount_amount', formData.maxDiscount.toString());
      }
      if (formData.usageLimit !== undefined && formData.usageLimit > 0) {
        apiFormData.append('max_total_usage', formData.usageLimit.toString());
      }
      if (formData.minOrderValue !== undefined && formData.minOrderValue > 0) {
        apiFormData.append('min_order_amount', formData.minOrderValue.toString());
      }

      // ✅ CORRECTION CRITIQUE : Gestion correcte de la visibilité et des cibles
      apiFormData.append('max_usage_per_user', '1');

      // Gérer la visibilité selon les données du formulaire
      if (formData.visibility === 'PUBLIC' || !formData.visibility) {
        apiFormData.append('visibility', 'PUBLIC');
        // ✅ CORRECTION : Mode PUBLIC - ne pas envoyer les targets
      } else {
        apiFormData.append('visibility', 'PRIVATE');
        // ✅ CORRECTION : Envoyer SEULEMENT les targets cochés avec "true"
        if (formData.targetStandard) {
          apiFormData.append('target_standard', 'true');
        }
        if (formData.targetPremium) {
          apiFormData.append('target_premium', 'true');
        }
        if (formData.targetGold) {
          apiFormData.append('target_gold', 'true');
        }

        // Validation : au moins un type doit être sélectionné en mode privé
        if (!formData.targetStandard && !formData.targetPremium && !formData.targetGold) {
          // Par défaut, cibler les utilisateurs standard
          apiFormData.append('target_standard', 'true');
        }
      }

      // Champs visuels
      if (formData.backgroundColor) {
        apiFormData.append('background_color', formData.backgroundColor);
      }      if (formData.textColor) {
        apiFormData.append('text_color', formData.textColor);
      }

      // ✅ GESTION DE L'IMAGE : File directement ou conversion base64
      if (formData.couponImageFile) {
        // Utiliser le File directement (comme les autres services)
        apiFormData.append('coupon_image_url', formData.couponImageFile);
      } else if (formData.couponImageUrl && formData.couponImageUrl.startsWith('data:image')) {
        // Fallback pour base64 (compatibilité)
        const blob = dataURLtoBlob(formData.couponImageUrl);
        apiFormData.append('coupon_image_url', blob, 'coupon.jpg');
      }

      const response = await apiRequest<ApiPromotion>(`/fidelity/promotions/${id}`, 'PATCH', apiFormData);
      return response;

    } else {
      // Sans image, utiliser l'ancien système JSON
      const apiData = mapFormDataToApiPromotion(formData);

      const response = await apiRequest<ApiPromotion>(`/fidelity/promotions/${id}`, 'PATCH', apiData);
      return response;
    }

  } catch (error) {
    // Retourner l'erreur originale de l'API au lieu d'un message générique
    if (error instanceof Error) {
      throw new Error(`Erreur API: ${error.message}`);
    }
    throw new Error('Impossible de mettre à jour la promotion. Veuillez réessayer.');
  }
};

export const getAllPromotions = async (): Promise<ApiPromotion[]> => {
  try {
    const response = await apiRequest<ApiPromotionListResponse>('/fidelity/promotions', 'GET');
    
   
    if (response.data && response.data.length > 0) {
      response.data.forEach((promo, index) => {
       
      });
    } else {
      console.log('⚠️ [getAllPromotions] Aucune promotion retournée par l\'API');
    }
    
    return response.data || [];
  } catch (error) {
    const userMessage = getHumanReadableError(error);
    throw new Error(userMessage);
  }
};

export const getPromotionById = async (id: string): Promise<ApiPromotion> => {
  try {
    // ✅ Utiliser le nouvel endpoint avec détails complets
    const response = await apiRequest<ApiPromotion>(`/fidelity/promotions/${id}`, 'GET');

     

    return response;
  } catch (error) {
    const userMessage = getHumanReadableError(error);
    throw new Error(userMessage);
  }
};

export const deletePromotion = async (id: string): Promise<void> => {
  try {
    await apiRequest<void>(`/fidelity/promotions/${id}`, 'DELETE');
  } catch (error) {
    const userMessage = validatePromotionError(error, 'delete');
    throw new Error(userMessage);
  }
};

export const activatePromotion = async (id: string): Promise<ApiPromotion> => {  try {
    const response = await apiRequest<ApiPromotion>(`/fidelity/promotions/${id}/activate`, 'PATCH');
    return response;
  } catch {
    throw new Error('Impossible d\'activer la promotion. Veuillez réessayer.');
  }
};

export const deactivatePromotion = async (id: string): Promise<ApiPromotion> => {  try {
    const response = await apiRequest<ApiPromotion>(`/fidelity/promotions/${id}/deactivate`, 'PATCH');
    return response;
  } catch {
    throw new Error('Impossible de désactiver la promotion. Veuillez réessayer.');
  }
};

// Utilitaires pour la conversion de données
export const convertPromoCardToFormData = (promoCard: PromoCardData): PromotionFormData => {
  return {
    title: promoCard.title || '',
    description: promoCard.description || '',
    discountType: promoCard.type === 'fixed' ? 'fixed' : 'percentage',
    discountValue: parseFloat(promoCard.discount?.replace(/[^\d.]/g, '') || '0'),
    targetType: 'all', // Par défaut
    startDate: new Date().toISOString().split('T')[0],
    expirationDate: promoCard.validUntil || '',
    isActive: promoCard.status === 'active'
  };
};

// === NOUVELLES FONCTIONS POUR DONNÉES UNIFIÉES ===

// ✅ Création de promotion avec données unifiées et File (comme menuService)
export const createPromotionFromUnified = async (
  unifiedData: UnifiedPromoFormData,
  imageFile: File | null = null,
  status: 'ACTIVE' | 'DRAFT' = 'ACTIVE'
): Promise<ApiPromotion> => {
 

  try {
    // ✅ EXACTEMENT COMME MENUSERVICE : FormData simple
    const formData = new FormData();

    // Convertir les données unifiées vers l'API avec les bonnes énumérations
    const apiData = mapUnifiedFormDataToApiPromotion(unifiedData, status);
 

    // ✅ CHAMPS DE BASE (comme menuService)
    formData.append('title', apiData.title);
    formData.append('description', String(apiData.description || '')); // ✅ CORRECTION : Forcer en string
    formData.append('discount_type', apiData.discount_type);
    formData.append('discount_value', apiData.discount_value.toString());
    formData.append('target_type', apiData.target_type);
    formData.append('start_date', apiData.start_date);
    formData.append('expiration_date', apiData.expiration_date);
    formData.append('status', status);

    // ✅ CHAMPS OPTIONNELS (utiliser les vraies données)
    if (apiData.min_order_amount !== undefined && apiData.min_order_amount !== null) {
      formData.append('min_order_amount', apiData.min_order_amount.toString());
    }
    if (apiData.max_usage_per_user !== undefined && apiData.max_usage_per_user !== null) {
      formData.append('max_usage_per_user', apiData.max_usage_per_user.toString());
    }
    if (apiData.max_total_usage !== undefined && apiData.max_total_usage !== null) {
      formData.append('max_total_usage', apiData.max_total_usage.toString());
    }
    if (apiData.max_discount_amount !== undefined && apiData.max_discount_amount !== null) {
      formData.append('max_discount_amount', apiData.max_discount_amount.toString());
    }

    
    formData.append('visibility', apiData.visibility || 'PUBLIC');

    // ✅ CORRECTION : Envoyer SEULEMENT les targets cochés avec "true" (pas les non-cochés)
    if (apiData.visibility === 'PRIVATE') {
      // Envoyer seulement les targets activés
      if (apiData.target_standard) {
        formData.append('target_standard', 'true');
        
      }
      if (apiData.target_premium) {
        formData.append('target_premium', 'true');
       
      }
      if (apiData.target_gold) {
        formData.append('target_gold', 'true');
         
      }
      
    } else {
      console.log('✅ [createPromotionFromUnified] Mode PUBLIC - aucun target spécifique envoyé');
    }

    // ✅ CHAMPS DE SÉLECTION (selon config Postman)
    if (apiData.targeted_dish_ids && apiData.targeted_dish_ids.length > 0) {
      formData.append('targeted_dish_ids', JSON.stringify(apiData.targeted_dish_ids)); 
    }

    // ✅ NOUVEAU CHAMP : targeted_category_ids (selon config Postman)
    if (apiData.targeted_category_ids && apiData.targeted_category_ids.length > 0) {
      formData.append('targeted_category_ids', JSON.stringify(apiData.targeted_category_ids)); 
    }

    // ✅ Restaurant_ids (restaurants sélectionnés)
    
    if (apiData.restaurant_ids && apiData.restaurant_ids.length > 0) {
      formData.append('restaurant_ids', JSON.stringify(apiData.restaurant_ids));
       
    } else {
      console.log('⚠️ [createPromotionFromUnified] Aucun restaurant_ids à ajouter');
    }

    if (apiData.offered_dishes && apiData.offered_dishes.length > 0) {
      formData.append('offered_dishes', JSON.stringify(apiData.offered_dishes)); 
    }

 
    // ✅ CHAMPS VISUELS
    if (apiData.background_color) {
      formData.append('background_color', apiData.background_color);
    }
    if (apiData.text_color) {
      formData.append('text_color', apiData.text_color);
    }

    // ✅ IMAGE : EXACTEMENT COMME MENUSERVICE
    if (imageFile && imageFile instanceof File) {
      formData.append('coupon_image_url', imageFile);
      
    }
 
    const formDataEntries: Record<string, string | File> = {};
    for (const [key, value] of formData.entries()) {
      formDataEntries[key] = value;
    } 
    
    const response = await apiRequest<ApiPromotion>('/fidelity/promotions', 'POST', formData);

   

    return response;

  } catch (error) {
    console.error('❌ [createPromotionFromUnified] Erreur lors de la création:', error);
    const userMessage = validatePromotionError(error, 'create');
    throw new Error(userMessage);
  }
};

// ✅ Mise à jour de promotion avec données unifiées et File (comme menuService)
export const updatePromotionFromUnified = async (
  id: string,
  unifiedData: UnifiedPromoFormData,
  imageFile: File | null = null,
  status: 'ACTIVE' | 'DRAFT' = 'ACTIVE'
): Promise<ApiPromotion> => {

  try {
   
    // ✅ EXACTEMENT COMME MENUSERVICE : FormData simple
    const formData = new FormData();

    // Convertir les données unifiées vers l'API avec les bonnes énumérations
    const apiData = mapUnifiedFormDataToApiPromotion(unifiedData, status);
 

    // ✅ CHAMPS DE BASE  
    formData.append('title', apiData.title);
    formData.append('description', String(apiData.description || '')); // ✅ CORRECTION : Forcer en string
    formData.append('discount_type', apiData.discount_type);
    formData.append('discount_value', apiData.discount_value.toString());
    formData.append('target_type', apiData.target_type);
    formData.append('start_date', apiData.start_date);
    formData.append('expiration_date', apiData.expiration_date);
    formData.append('status', status);

    // ✅ CHAMPS OPTIONNELS (utiliser les vraies données)
    if (apiData.min_order_amount !== undefined && apiData.min_order_amount !== null) {
      formData.append('min_order_amount', apiData.min_order_amount.toString());
    }
    if (apiData.max_usage_per_user !== undefined && apiData.max_usage_per_user !== null) {
      formData.append('max_usage_per_user', apiData.max_usage_per_user.toString());
    }
    if (apiData.max_total_usage !== undefined && apiData.max_total_usage !== null) {
      formData.append('max_total_usage', apiData.max_total_usage.toString());
    }
    if (apiData.max_discount_amount !== undefined && apiData.max_discount_amount !== null) {
      formData.append('max_discount_amount', apiData.max_discount_amount.toString());
    }

    // Champs de visibilité et cibles
    formData.append('visibility', apiData.visibility || 'PUBLIC');
     
    if (apiData.visibility === 'PRIVATE') {
      // Envoyer seulement les targets activés
      if (apiData.target_standard) {
        formData.append('target_standard', 'true');
        
      }
      if (apiData.target_premium) {
        formData.append('target_premium', 'true');
        
      }
      if (apiData.target_gold) {
        formData.append('target_gold', 'true');
       
      }
      
    } else {
      console.log('✅ [updatePromotionFromUnified] Mode PUBLIC - aucun target spécifique envoyé');
    }

    // ✅ CHAMPS DE SÉLECTION (selon config Postman)
    if (apiData.targeted_dish_ids && apiData.targeted_dish_ids.length > 0) {
      formData.append('targeted_dish_ids', JSON.stringify(apiData.targeted_dish_ids)); 
    }

    // ✅ NOUVEAU CHAMP : targeted_category_ids (selon config Postman)
    if (apiData.targeted_category_ids && apiData.targeted_category_ids.length > 0) {
      formData.append('targeted_category_ids', JSON.stringify(apiData.targeted_category_ids));
       
    }

   
    if (apiData.restaurant_ids && apiData.restaurant_ids.length > 0) {
      formData.append('restaurant_ids', JSON.stringify(apiData.restaurant_ids));
     
    } else {
      console.log('⚠️ [updatePromotionFromUnified] Aucun restaurant_ids à ajouter');
    }

    if (apiData.offered_dishes && apiData.offered_dishes.length > 0) {
      formData.append('offered_dishes', JSON.stringify(apiData.offered_dishes));
    
    }
 
    // ✅ CHAMPS VISUELS
    if (apiData.background_color) {
      formData.append('background_color', apiData.background_color);
    }
    if (apiData.text_color) {
      formData.append('text_color', apiData.text_color);
    }

    // ✅ IMAGE : EXACTEMENT COMME MENUSERVICE
    if (imageFile && imageFile instanceof File) {
      formData.append('coupon_image_url', imageFile);
     
    }

   
    const response = await apiRequest<ApiPromotion>(`/fidelity/promotions/${id}`, 'PATCH', formData);

 
    return response;

  } catch (error) {
    console.error('❌ [updatePromotionFromUnified] Erreur lors de la mise à jour:', error);
    const userMessage = validatePromotionError(error, 'update');
    throw new Error(userMessage);
  }
};

// === FONCTIONS DE TRANSIT DE DONNÉES ENTRE COMPOSANTS ===

// Conversion UnifiedPromoFormData vers PromoTransitData (CreatePromo → PersonalizedPromo)
export const convertUnifiedFormDataToTransitData = (formData: UnifiedPromoFormData): PromoTransitData => ({
  // Données de l'étape 1
  promoType: formData.discountType,
  discountType: formData.discountType,
  discountValue: formData.discountValue,  
  percentageValue: formData.percentageValue,
  fixedAmountValue: formData.fixedAmountValue,
  buyQuantity: formData.buyQuantity,
  getQuantity: formData.getQuantity,
  discountCeiling: formData.discountCeiling,
  productTarget: formData.productTarget,
  selectedMenus: formData.selectedMenus,
  selectedCategories: formData.selectedCategories,
  selectedRewardMenus: formData.selectedRewardMenus,
  selectedRestaurants: formData.selectedRestaurants,
  minOrderAmount: formData.minOrderAmount,
  maxUsagePerClient: formData.maxUsagePerClient,
  maxTotalUsage: formData.maxTotalUsage,
  selectedPublicTypes: formData.selectedPublicTypes,

  // Données de l'étape 2
  title: formData.title,
  description: formData.description,
  startDate: formData.startDate,
  expirationDate: formData.expirationDate,
  backgroundColor: formData.backgroundColor,
  textColor: formData.textColor,
  couponImageUrl: formData.couponImageUrl,

  // Métadonnées
  id: formData.id,
  currentUsage: formData.currentUsage,
  status: formData.status,
  isEditing: !!formData.id,

  // ✅ CHAMPS SUPPLÉMENTAIRES AJOUTÉS
  targetType: formData.targetType,
  targetedDishIds: formData.targetedDishIds,
  offeredDishes: formData.offeredDishes,
  maxUsagePerUser: formData.maxUsagePerUser,
  maxDiscountAmount: formData.maxDiscountAmount,
  targetStandard: formData.targetStandard,
  targetPremium: formData.targetPremium,
  targetGold: formData.targetGold,
  visibility: formData.visibility,
  restaurantIds: formData.selectedRestaurants, // Alias pour compatibilité
  isActive: formData.isActive,
  createdAt: formData.createdAt,
  updatedAt: formData.updatedAt,
  createdById: formData.createdById,
});

// Conversion PromoTransitData vers UnifiedPromoFormData (PersonalizedPromo)
export const convertTransitDataToUnifiedFormData = (transitData: PromoTransitData): UnifiedPromoFormData => {
  const baseData = createEmptyUnifiedFormData();

  // Mapping des données de l'étape 1
  baseData.discountType = transitData.discountType;
  baseData.percentageValue = transitData.percentageValue;
  baseData.fixedAmountValue = transitData.fixedAmountValue;
  baseData.buyQuantity = transitData.buyQuantity;
  baseData.getQuantity = transitData.getQuantity;
  baseData.discountCeiling = transitData.discountCeiling;
  baseData.productTarget = transitData.productTarget;
  baseData.targetType = transitData.productTarget;
  baseData.selectedMenus = transitData.selectedMenus;
  baseData.selectedCategories = transitData.selectedCategories;
  baseData.selectedRewardMenus = transitData.selectedRewardMenus;
  baseData.selectedRestaurants = transitData.selectedRestaurants;
  baseData.minOrderAmount = transitData.minOrderAmount;
  baseData.maxUsagePerClient = transitData.maxUsagePerClient;
  baseData.maxTotalUsage = transitData.maxTotalUsage;
  baseData.selectedPublicTypes = transitData.selectedPublicTypes;

  // Mapping des données de l'étape 2
  if (transitData.title) baseData.title = transitData.title;
  if (transitData.description) baseData.description = transitData.description;
  if (transitData.startDate) baseData.startDate = transitData.startDate;
  if (transitData.expirationDate) baseData.expirationDate = transitData.expirationDate;
  if (transitData.backgroundColor) baseData.backgroundColor = transitData.backgroundColor;
  if (transitData.textColor) baseData.textColor = transitData.textColor;
  if (transitData.couponImageUrl) baseData.couponImageUrl = transitData.couponImageUrl;

  // Métadonnées
  if (transitData.id) baseData.id = transitData.id;
  if (transitData.currentUsage !== undefined) baseData.currentUsage = transitData.currentUsage;
  if (transitData.status) baseData.status = transitData.status;

  // Calcul de discountValue selon le type
  switch (baseData.discountType) {
    case 'percentage':
      baseData.discountValue = parseFloat(baseData.percentageValue) || 0;
      break;
    case 'fixed':
      baseData.discountValue = parseFloat(baseData.fixedAmountValue) || 0;
      break;
    case 'buyXgetY':
      baseData.discountValue = parseFloat(baseData.buyQuantity) || 0;
      break;
  }

  return baseData;
};

// Fonction pour valider l'intégrité des données de transit
export const validateTransitData = (transitData: PromoTransitData): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Validation des champs obligatoires de l'étape 1
  if (!transitData.promoType || !transitData.discountType) {
    errors.push('Le type de promotion est requis');
  }

  // Validation selon le type de promotion
  switch (transitData.discountType) {
    case 'percentage':
      if (!transitData.percentageValue || parseFloat(transitData.percentageValue) <= 0) {
        errors.push('La valeur du pourcentage doit être supérieure à 0');
      }
      if (parseFloat(transitData.percentageValue) > 100) {
        errors.push('Le pourcentage ne peut pas dépasser 100%');
      }
      break;
    case 'fixed':
      if (!transitData.fixedAmountValue || parseFloat(transitData.fixedAmountValue) <= 0) {
        errors.push('Le montant fixe doit être supérieur à 0');
      }
      break;
    case 'buyXgetY':
      if (!transitData.buyQuantity || parseFloat(transitData.buyQuantity) <= 0) {
        errors.push('La quantité à acheter doit être supérieure à 0');
      }
      if (!transitData.getQuantity || parseFloat(transitData.getQuantity) <= 0) {
        errors.push('La quantité gratuite doit être supérieure à 0');
      }
      if (transitData.selectedRewardMenus.length === 0) {
        errors.push('Au moins un produit de récompense doit être sélectionné pour le type "Achetez X, Obtenez Y"');
      }
      break;
  }

  // Validation des cibles de produits
  if (transitData.productTarget === 'specific' && transitData.selectedMenus.length === 0) {
    errors.push('Au moins un produit doit être sélectionné pour une promotion ciblée');
  }
  if (transitData.productTarget === 'categories' && transitData.selectedCategories.length === 0) {
    errors.push('Au moins une catégorie doit être sélectionnée pour une promotion par catégories');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Fonction pour valider les données complètes avant soumission
export const validateCompletePromoData = (formData: UnifiedPromoFormData): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Validation des champs obligatoires
  if (!formData.title.trim()) {
    errors.push('Le titre est requis');
  }
  if (!formData.description.trim()) {
    errors.push('La description est requise');
  }
  if (!formData.startDate) {
    errors.push('La date de début est requise');
  }
  if (!formData.expirationDate) {
    errors.push('La date d\'expiration est requise');
  }

  // Validation des dates
  if (formData.startDate && formData.expirationDate) {
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.expirationDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
      errors.push('La date de début ne peut pas être dans le passé');
    }
    if (endDate <= startDate) {
      errors.push('La date d\'expiration doit être postérieure à la date de début');
    }
  }

  // Validation du transit data
  const transitValidation = validateTransitData(convertUnifiedFormDataToTransitData(formData));
  errors.push(...transitValidation.errors);

  return {
    isValid: errors.length === 0,
    errors
  };
};



// ✅ NOUVELLE FONCTION : Convertir ApiPromotion détaillée vers UnifiedPromoFormData pour l'édition
export const convertDetailedApiPromotionToUnifiedFormData = (apiPromo: ApiPromotion): UnifiedPromoFormData => {

 

  const baseData = createEmptyUnifiedFormData();

  // === CHAMPS DE BASE ===
  baseData.id = apiPromo.id;
  baseData.title = apiPromo.title || '';
  baseData.description = apiPromo.description || '';
  baseData.status = apiPromo.status || 'ACTIVE';
  baseData.currentUsage = apiPromo.current_usage || 0;

  // === DATES ===
  baseData.startDate = apiPromo.start_date ? formatDateForApi(apiPromo.start_date) : '';
  baseData.expirationDate = apiPromo.expiration_date ? formatDateForApi(apiPromo.expiration_date) : '';

  // === TYPE DE REMISE ===
  switch (apiPromo.discount_type) {
    case 'PERCENTAGE':
      baseData.discountType = 'percentage';
      baseData.percentageValue = apiPromo.discount_value?.toString() || '';
      baseData.discountValue = apiPromo.discount_value || 0;
      break;
    case 'FIXED_AMOUNT':
      baseData.discountType = 'fixed';
      baseData.fixedAmountValue = apiPromo.discount_value?.toString() || '';
      baseData.discountValue = apiPromo.discount_value || 0;
      break;
    case 'BUY_X_GET_Y':
      baseData.discountType = 'buyXgetY';
      baseData.buyQuantity = apiPromo.discount_value?.toString() || '';
      baseData.discountValue = apiPromo.discount_value || 0;
      // Pour BUY_X_GET_Y, on doit extraire getQuantity des offered_dishes
      if (apiPromo.offered_dishes && apiPromo.offered_dishes.length > 0) {
        baseData.getQuantity = apiPromo.offered_dishes[0].quantity?.toString() || '';
      }
      break;
  }

  // === TYPE DE CIBLE === 
  switch (apiPromo.target_type) {
    case 'ALL_PRODUCTS':
      baseData.productTarget = 'all';
      baseData.targetType = 'all';
      break;
    case 'SPECIFIC_PRODUCTS':
      baseData.productTarget = 'specific';
      baseData.targetType = 'specific';
      // Utiliser les données détaillées targeted_dishes (extraire seulement les IDs)
      if (apiPromo.targeted_dishes) {
        baseData.selectedMenus = apiPromo.targeted_dishes.map(dish => dish.id);
        
      }
      break;
    case 'CATEGORIES':
      baseData.productTarget = 'categories';
      baseData.targetType = 'categories';
      // Utiliser les données détaillées targeted_categories (extraire seulement les IDs)
      if (apiPromo.targeted_categories) {
        baseData.selectedCategories = apiPromo.targeted_categories.map(category => category.id);
        
      }
      break;
  }

  // === PRODUITS DE RÉCOMPENSE (pour BUY_X_GET_Y) ===
  if (apiPromo.offered_dishes && apiPromo.offered_dishes.length > 0) {
    // Extraire seulement les IDs des produits de récompense
    baseData.selectedRewardMenus = apiPromo.offered_dishes.map(offered => offered.dish_id);
  
  }

  // === RESTAURANTS SÉLECTIONNÉS - CORRECTION MAJEURE ===
 
  if (apiPromo.restaurants && apiPromo.restaurants.length > 0) {
    // ✅ PRIORITÉ : Utiliser le champ "restaurants" avec des objets complets
    baseData.selectedRestaurants = apiPromo.restaurants.map(restaurant => String(restaurant.id));
    
  } else if (apiPromo.restaurant_ids && apiPromo.restaurant_ids.length > 0) {
    // ✅ FALLBACK : Utiliser le champ "restaurant_ids" si disponible (compatibilité)
    baseData.selectedRestaurants = apiPromo.restaurant_ids.map(id => String(id));
    
  } else {
    baseData.selectedRestaurants = [];
    console.log('⚠️ [convertDetailedApiPromotionToUnifiedFormData] Aucun restaurant trouvé dans l\'API');
  }

  // === CONTRAINTES ===
  baseData.minOrderAmount = apiPromo.min_order_amount?.toString() || '';
  baseData.maxUsagePerClient = apiPromo.max_usage_per_user?.toString() || '';
  baseData.maxTotalUsage = apiPromo.max_total_usage?.toString() || '';
  baseData.discountCeiling = apiPromo.max_discount_amount?.toString() || '';

  // === VISIBILITÉ ET CIBLES ===
  baseData.visibility = apiPromo.visibility || 'PUBLIC';

  // Convertir les cibles utilisateur
  console.log('👥 [convertDetailedApiPromotionToUnifiedFormData] === CONVERSION DES UTILISATEURS CIBLÉS ===');
  const selectedPublicTypes: string[] = [];
  if (apiPromo.visibility === 'PUBLIC') {
    selectedPublicTypes.push('Public');
    
  } else {
    
    if (apiPromo.target_standard) selectedPublicTypes.push('Utilisateur Standard');
    if (apiPromo.target_premium) selectedPublicTypes.push('Utilisateur Premium');
    if (apiPromo.target_gold) selectedPublicTypes.push('Utilisateur Gold');
  }
  baseData.selectedPublicTypes = selectedPublicTypes;
 

  // === PERSONNALISATION VISUELLE ===
  baseData.backgroundColor = apiPromo.background_color || '#F17922';
  baseData.textColor = apiPromo.text_color || '#FFFFFF';
  baseData.couponImageUrl = apiPromo.coupon_image_url || '';
 
  return baseData;
};

// Export des fonctions utilitaires pour les tests
export {
  formatDateForApi,
  generateDescriptionFromApiPromo
};

// ✅ NOUVELLE FONCTION : Récupérer toutes les promotions avec détails complets
export const getAllPromotionsWithDetails = async (): Promise<ApiPromotion[]> => {
  try {
    console.log('🔍 [getAllPromotionsWithDetails] === RÉCUPÉRATION AVEC DÉTAILS COMPLETS ===');
    
    // Récupérer d'abord la liste basique
    const basicPromotions = await getAllPromotions();
    
    if (basicPromotions.length === 0) {
      console.log('⚠️ [getAllPromotionsWithDetails] Aucune promotion basique trouvée');
      return [];
    }
    
    // Vérifier si au moins une promotion a des restaurant_ids
    const hasRestaurantIds = basicPromotions.some(promo => 
      promo.restaurant_ids && promo.restaurant_ids.length > 0
    );
    
    if (hasRestaurantIds) {
      console.log('✅ [getAllPromotionsWithDetails] Les restaurant_ids sont déjà présents dans la liste');
      return basicPromotions;
    }
    
    
    // Si les restaurant_ids manquent, récupérer les détails complets pour chaque promotion
    const detailedPromotions = await Promise.allSettled(
      basicPromotions.map(async (promo) => {
        if (!promo.id) return promo;
        
        try {
          const detailed = await getPromotionById(promo.id);
          
          return detailed;
        } catch (error) {
          console.error(`❌ [getAllPromotionsWithDetails] Erreur pour la promo ${promo.id}:`, error);
          return promo; // Fallback vers la version basique
        }
      })
    );
    
    // Extraire les résultats réussis
    const results = detailedPromotions
      .filter((result): result is PromiseFulfilledResult<ApiPromotion> => 
        result.status === 'fulfilled'
      )
      .map(result => result.value);
     
    return results;
    
  } catch (error) {
    console.error('❌ [getAllPromotionsWithDetails] Erreur:', error);
    // Fallback vers la méthode basique
    return getAllPromotions();
  }
};