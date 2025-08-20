import { MenuItem, SupplementItem } from '@/types';
import { apiRequest } from './api';
import { formatImageUrl } from '@/utils/imageHelpers';
import {
  validateMenuItem,
  validateCreateMenu,
  validateUpdateMenu,
  validateApiMenuData,
  sanitizeMenuInput,
  ApiMenuData,
  ValidatedMenuItem
} from '@/schemas/menuSchemas';
// import { z } from 'zod'; // Non utilisé actuellement

// ✅ TYPES STRICTS POUR LE SERVICE
export interface Menu {
  id: string;
  name: string;
  description?: string;
  price: number;
  categoryId: string;
  restaurantId: string;
  image?: string;
  available?: boolean;
  supplements?: {
    ingredients?: SupplementItem[];
    accompagnements?: SupplementItem[];
    boissons?: SupplementItem[];
  };
}

// ✅ INTERFACE POUR LA RECHERCHE DE MENUS
export interface MenuSearchQuery {
  search?: string;
  page?: number;
  limit?: number;
  categoryId?: string;
  restaurantId?: string;
  available?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ✅ INTERFACE POUR LA RÉPONSE PAGINÉE DE RECHERCHE
export interface PaginatedMenuResponse {
  data: ValidatedMenuItem[];
  meta: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
  };
}

// ✅ TYPES API SÉCURISÉS - Plus de unknown ou any
interface ApiMenuListResponse {
  data: ApiMenuData[];
}

interface ApiMenuResponse {
  data: ApiMenuData;
}

interface ApiMenuCategoryData {
  id: string;
  name: string;
  description?: string;
}

interface ApiMenuCategoriesResponse {
  data: ApiMenuCategoryData[];
}

// ✅ FONCTION DE FORMATAGE SÉCURISÉE AVEC VALIDATION
export const formatMenuFromApi = (apiMenu: unknown): ValidatedMenuItem => {
  try {
    // ✅ Validation des données API avec Zod
    const validatedApiMenu = validateApiMenuData(apiMenu);

    // ✅ Validation obligatoire de l'ID
    if (!validatedApiMenu.id) {
      throw new Error('ID manquant dans les données du menu');
    }

    // ✅ Sanitisation des chaînes de caractères
    const sanitizedName = sanitizeMenuInput(validatedApiMenu.name || '');
    const sanitizedDescription = sanitizeMenuInput(validatedApiMenu.description || '');
    const sanitizedRestaurant = sanitizeMenuInput(validatedApiMenu.restaurant || '');

    // ✅ Validation du prix
    const price = validatedApiMenu.price?.toString() || '0';
    if (!/^\d+(\.\d{1,2})?$/.test(price)) {
      throw new Error('Format de prix invalide');
    }

    // ✅ Validation de l'image
    const imageUrl = formatImageUrl(validatedApiMenu.image);

    // ✅ Construction sécurisée de l'objet MenuItem
    const menuItem: MenuItem = {
      id: validatedApiMenu.id as string,
      name: sanitizedName,
      description: sanitizedDescription,
      restaurant: sanitizedRestaurant || 'Restaurant non spécifié', // ✅ Valeur par défaut
      restaurantId: validatedApiMenu.restaurant_id || '', // ✅ Chaîne vide par défaut
      price: price, // ✅ Déjà converti en string
      categoryId: validatedApiMenu.category_id || '', // ✅ Chaîne vide par défaut
      isAvailable: validatedApiMenu.available !== false, // ✅ true par défaut
      isNew: validatedApiMenu.is_new || false,
      ingredients: validatedApiMenu.ingredients || [],
      image: imageUrl || '/images/default-menu.png',
      supplements: {
        boissons: undefined,
        sauces: undefined,
        portions: undefined,
        ACCESSORY: [],
        FOOD: [],
        DRINK: []
      }, // ✅ Initialisé avec la structure attendue par le schéma
      reviews: validatedApiMenu.reviews || [], // ✅ Tableau vide par défaut
      totalReviews: validatedApiMenu.total_reviews || 0, // ✅ 0 par défaut
      promotion_price: validatedApiMenu.promotion_price?.toString(),
      is_promotion: validatedApiMenu.is_promotion || false,
      // ✅ Ajout des champs optionnels pour compatibilité API
      dish_supplements: validatedApiMenu.dish_supplements || [],
      dish_restaurants: validatedApiMenu.dish_restaurants || []
    };

    // ✅ Validation finale avec le schéma MenuItem
    return validateMenuItem(menuItem);

  } catch (error) {
    console.error('Erreur lors du formatage du menu:', error);
    throw new Error(`Données de menu invalides: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
};

// ✅ RECHERCHE SÉCURISÉE DE MENUS CÔTÉ SERVEUR
export const searchMenus = async (params: MenuSearchQuery = {}): Promise<PaginatedMenuResponse> => {
  try {
    const { search, page = 1, limit = 10, categoryId, restaurantId, available, sortBy, sortOrder } = params;

    // ✅ Construire les paramètres de requête
    const queryParams = new URLSearchParams();
    queryParams.append('page', page.toString());
    queryParams.append('limit', limit.toString());
    
    if (search && search.trim()) {
      queryParams.append('search', search.trim());
    }
    
    if (categoryId) {
      queryParams.append('categoryId', categoryId);
    }
    
    if (restaurantId) {
      queryParams.append('restaurantId', restaurantId);
    }
    
    if (available !== undefined) {
      queryParams.append('available', available.toString());
    }
    
    if (sortBy) {
      queryParams.append('sortBy', sortBy);
    }
    
    if (sortOrder) {
      queryParams.append('sortOrder', sortOrder);
    }

    // ✅ Appel API sécurisé avec l'endpoint de recherche
    const responseData = await apiRequest<{
      data: ApiMenuData[];
      meta: {
        totalItems: number;
        totalPages: number;
        currentPage: number;
        itemsPerPage: number;
      };
    }>(`/dishes/search?${queryParams}`, 'GET');

    // ✅ Validation de la structure de réponse
    if (!responseData) {
      throw new Error('Aucune donnée reçue du serveur');
    }

    const menus = responseData.data || [];
    const meta = responseData.meta || {
      totalItems: 0,
      totalPages: 0,
      currentPage: 1,
      itemsPerPage: limit
    };

    // ✅ Validation que menus est un tableau
    if (!Array.isArray(menus)) {
      throw new Error('Format de réponse invalide: attendu un tableau');
    }

    // ✅ Formatage sécurisé avec gestion d'erreurs individuelles
    const formattedMenus: ValidatedMenuItem[] = [];

    for (const menu of menus) {
      try {
        const formattedMenu = formatMenuFromApi(menu);
        formattedMenus.push(formattedMenu);
      } catch (menuError) {
        // ✅ SÉCURITÉ: Log minimal en production
        if (process.env.NODE_ENV === 'development') {
          const menuId = (menu && typeof menu === 'object' && 'id' in menu) ? (menu as { id: unknown }).id : 'inconnu';
          console.warn(`Menu ignoré lors de la recherche (ID: ${menuId}):`, menuError);
        }
        // Continue avec les autres menus au lieu de faire échouer toute la requête
      }
    }

    return {
      data: formattedMenus,
      meta
    };
  } catch (error) {
    console.error('Erreur lors de la recherche de menus:', error);
    throw new Error(`Impossible de rechercher les menus: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
};

// ✅ RÉCUPÉRATION SÉCURISÉE DE TOUS LES MENUS
export const getAllMenus = async (): Promise<ValidatedMenuItem[]> => {
  try {
    const responseData = await apiRequest<ApiMenuListResponse>('/dishes', 'GET');

    // ✅ Validation de la structure de réponse
    if (!responseData) {
      throw new Error('Aucune donnée reçue du serveur');
    }

    const menus = responseData.data || responseData;

    // ✅ Validation que menus est un tableau
    if (!Array.isArray(menus)) {
      throw new Error('Format de réponse invalide: attendu un tableau');
    }

    // ✅ Formatage sécurisé avec gestion d'erreurs individuelles
    const formattedMenus: ValidatedMenuItem[] = [];

    for (const menu of menus) {
      try {
        const formattedMenu = formatMenuFromApi(menu);
        formattedMenus.push(formattedMenu);
      } catch (menuError) {
        // ✅ SÉCURITÉ: Log minimal en production
        if (process.env.NODE_ENV === 'development') {
          const menuId = (menu && typeof menu === 'object' && 'id' in menu) ? (menu as { id: unknown }).id : 'inconnu';
          console.warn(`Menu ignoré (ID: ${menuId}):`, menuError);
        }
        // Continue avec les autres menus au lieu de faire échouer toute la requête
      }
    }

    return formattedMenus;
  } catch (error) {
    console.error('Erreur lors de la récupération des menus:', error);
    throw new Error(`Impossible de récupérer les menus: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
};


// ✅ RÉCUPÉRATION SÉCURISÉE D'UN MENU PAR ID
export const getMenuById = async (id: string): Promise<ApiMenuData> => {
  try {
    // ✅ Validation de l'ID
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      throw new Error('ID de menu invalide');
    }

    // ✅ Sanitisation de l'ID pour éviter les injections
    const sanitizedId = id.trim().replace(/[^a-zA-Z0-9\-_]/g, '');
    if (sanitizedId !== id.trim()) {
      throw new Error('ID de menu contient des caractères invalides');
    }

    const menuData = await apiRequest<ApiMenuResponse>(`/dishes/${sanitizedId}`, 'GET');

    // ✅ Validation de la réponse
    if (!menuData) {
      throw new Error('Aucune donnée reçue du serveur');
    }

    const data = menuData.data || menuData;

    // ✅ Validation des données avec Zod
    return validateApiMenuData(data);

  } catch (error) {
    console.error(`Erreur lors de la récupération du menu ${id}:`, error);
    throw new Error(`Impossible de récupérer le menu: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
};

// ✅ CRÉATION SÉCURISÉE D'UN NOUVEAU MENU
export const createMenu = async (menuData: FormData): Promise<ValidatedMenuItem> => {
  try {
    // ✅ Validation des données FormData
    if (!menuData || !(menuData instanceof FormData)) {
      throw new Error('Données de menu invalides');
    }

    // ✅ Validation des champs obligatoires
    const requiredFields = ['name', 'price', 'category_id'];
    for (const field of requiredFields) {
      const value = menuData.get(field);
      if (!value || (typeof value === 'string' && value.trim().length === 0)) {
        throw new Error(`Champ obligatoire manquant: ${field}`);
      }
    }

    // ✅ Validation et sanitisation du nom
    const name = menuData.get('name') as string;
    if (name && name.length > 100) {
      throw new Error('Nom du menu trop long (max 100 caractères)');
    }

    // ✅ Validation du prix
    const price = menuData.get('price') as string;
    if (price && !/^\d+(\.\d{1,2})?$/.test(price)) {
      throw new Error('Format de prix invalide');
    }

    // ✅ Validation de l'image si présente
    const imageFile = menuData.get('image') as File;
    if (imageFile && imageFile instanceof File) {
      if (imageFile.size > 5 * 1024 * 1024) { // 5MB max
        throw new Error('Image trop volumineuse (max 5MB)');
      }
      if (!imageFile.type.startsWith('image/')) {
        throw new Error('Type de fichier invalide (images uniquement)');
      }
    }

    const result = await apiRequest<ApiMenuResponse>('/dishes', 'POST', menuData, true);

    // ✅ Validation de la réponse
    if (!result) {
      throw new Error('Aucune réponse du serveur');
    }

    const menuResult = result.data || result;
    return formatMenuFromApi(menuResult);

  } catch (error) {
    console.error('Erreur lors de la création du menu:', error);
    throw new Error(`Impossible de créer le menu: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
};

// ✅ MISE À JOUR SÉCURISÉE D'UN MENU
export const updateMenu = async (id: string, menuData: FormData): Promise<ValidatedMenuItem> => {
  try {
    // ✅ Validation de l'ID
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      throw new Error('ID de menu invalide');
    }

    // ✅ Sanitisation de l'ID
    const sanitizedId = id.trim().replace(/[^a-zA-Z0-9\-_]/g, '');
    if (sanitizedId !== id.trim()) {
      throw new Error('ID de menu contient des caractères invalides');
    }

    // ✅ Validation des données FormData
    if (!menuData || !(menuData instanceof FormData)) {
      throw new Error('Données de menu invalides');
    }

    // ✅ Validation des champs si présents
    const name = menuData.get('name') as string;
    if (name && name.length > 100) {
      throw new Error('Nom du menu trop long (max 100 caractères)');
    }

    const price = menuData.get('price') as string;
    if (price && !/^\d+(\.\d{1,2})?$/.test(price)) {
      throw new Error('Format de prix invalide');
    }

    // ✅ Validation de l'image si présente
    const imageFile = menuData.get('image') as File;
    if (imageFile && imageFile instanceof File) {
      if (imageFile.size > 5 * 1024 * 1024) { // 5MB max
        throw new Error('Image trop volumineuse (max 5MB)');
      }
      if (!imageFile.type.startsWith('image/')) {
        throw new Error('Type de fichier invalide (images uniquement)');
      }
    }

    const result = await apiRequest<ApiMenuResponse>(`/dishes/${sanitizedId}`, 'PATCH', menuData, true);

    // ✅ Validation de la réponse
    if (!result) {
      throw new Error('Aucune réponse du serveur');
    }

    const menuResult = result.data || result;
    return formatMenuFromApi(menuResult);

  } catch (error) {
    console.error('Erreur lors de la mise à jour du menu:', error);
    throw new Error(`Impossible de mettre à jour le menu: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
};


// ✅ CONVERSION SÉCURISÉE MENU → FORMDATA
export const menuToFormData = (menu: ValidatedMenuItem, isUpdate: boolean = false): FormData => {
  try {
    // ✅ DEBUG: Vérifier les données avant validation
    console.log('🔍 DEBUG menuService - Menu avant validation:', {
      selectedRestaurants: (menu as unknown as { selectedRestaurants?: string[] }).selectedRestaurants,
      dish_supplements: (menu as unknown as { dish_supplements?: unknown[] }).dish_supplements
    });

    // ✅ Validation du menu d'entrée selon le contexte
    const validatedMenu = isUpdate ? validateUpdateMenu(menu) : validateCreateMenu(menu);

    // ✅ DEBUG: Vérifier les données après validation
    console.log('🔍 DEBUG menuService - Menu après validation:', {
      selectedRestaurants: (validatedMenu as unknown as { selectedRestaurants?: string[] }).selectedRestaurants,
      dish_supplements: (validatedMenu as unknown as { dish_supplements?: unknown[] }).dish_supplements
    });

    const formData = new FormData();

    if (isUpdate) {
      // ✅ POUR UPDATE: Validation et sanitisation des champs
      const sanitizedName = sanitizeMenuInput(validatedMenu.name || '');
      const sanitizedDescription = sanitizeMenuInput(validatedMenu.description || '');

      if (sanitizedName.length === 0) {
        throw new Error('Nom du menu requis');
      }

      formData.append('name', sanitizedName);
      formData.append('description', sanitizedDescription);
      formData.append('price', (validatedMenu.price || 0).toString());
      formData.append('category_id', validatedMenu.categoryId || '');

      // ✅ Gestion sécurisée de l'image
      if (validatedMenu.image && typeof validatedMenu.image === 'object') {
        const imageFile = validatedMenu.image as File;
        if (imageFile.size > 5 * 1024 * 1024) {
          throw new Error('Image trop volumineuse (max 5MB)');
        }
        if (!imageFile.type.startsWith('image/')) {
          throw new Error('Type de fichier invalide');
        }
        formData.append('image', imageFile);
      } else if (validatedMenu.image && typeof validatedMenu.image === 'string' && validatedMenu.image.startsWith('data:image')) {
        const blob = dataURLtoBlob(validatedMenu.image);
        formData.append('image', blob, 'image.jpg');
      }

      // ✅ Gestion sécurisée des promotions
      formData.append('is_promotion', validatedMenu.is_promotion ? 'true' : 'false');
      if (validatedMenu.is_promotion && validatedMenu.promotion_price) {
        const promoPrice = validatedMenu.promotion_price.toString();
        if (!/^\d+(\.\d{1,2})?$/.test(promoPrice)) {
          throw new Error('Prix de promotion invalide');
        }
        formData.append('promotion_price', promoPrice);
      } else {
        formData.append('promotion_price', '0');
      }

      // Pour UPDATE: NE PAS envoyer restaurants et supplements ici
      // Ils sont gérés séparément par les services dédiés

  } else {
    // ✅ POUR CREATE: Validation et sanitisation des champs
    const sanitizedName = sanitizeMenuInput(validatedMenu.name || '');
    const sanitizedDescription = sanitizeMenuInput(validatedMenu.description || '');

    if (sanitizedName.length === 0) {
      throw new Error('Nom du menu requis');
    }

    formData.append('name', sanitizedName);
    formData.append('description', sanitizedDescription);
    formData.append('price', (validatedMenu.price || 0).toString());
    formData.append('category_id', validatedMenu.categoryId || '');

    // ✅ Gestion sécurisée de l'image
    if (validatedMenu.image && typeof validatedMenu.image === 'object' && (validatedMenu.image as unknown) instanceof File) {
      const imageFile = validatedMenu.image as File;
      if (imageFile.size > 5 * 1024 * 1024) {
        throw new Error('Image trop volumineuse (max 5MB)');
      }
      if (!imageFile.type.startsWith('image/')) {
        throw new Error('Type de fichier invalide');
      }
      formData.append('image', imageFile);
    } else if (validatedMenu.image && typeof validatedMenu.image === 'string' && validatedMenu.image.startsWith('data:image')) {
      const blob = dataURLtoBlob(validatedMenu.image);
      formData.append('image', blob, 'image.jpg');
    }

    // ✅ Gestion sécurisée des promotions
    formData.append('is_promotion', validatedMenu.is_promotion ? 'true' : 'false');
    if (validatedMenu.is_promotion && validatedMenu.promotion_price) {
      const promoPrice = validatedMenu.promotion_price.toString();
      if (!/^\d+(\.\d{1,2})?$/.test(promoPrice)) {
        throw new Error('Prix de promotion invalide');
      }
      formData.append('promotion_price', promoPrice);
    } else {
      formData.append('promotion_price', '0');
    }

    // ✅ Ajout sécurisé des restaurants pour CREATE
    // Gérer les restaurants multiples depuis selectedRestaurants ou restaurantId unique
    const restaurantIds: string[] = [];

    const menuWithRestaurants = validatedMenu as unknown as { selectedRestaurants?: string[] };
    if (menuWithRestaurants.selectedRestaurants && Array.isArray(menuWithRestaurants.selectedRestaurants)) {
      // Cas des restaurants multiples
      menuWithRestaurants.selectedRestaurants.forEach((restaurantId: string) => {
        if (restaurantId && typeof restaurantId === 'string') {
          const sanitizedRestaurantId = restaurantId.trim().replace(/[^a-zA-Z0-9\-_]/g, '');
          if (sanitizedRestaurantId.length > 0) {
            restaurantIds.push(sanitizedRestaurantId);
          }
        }
      });
    } else if (validatedMenu.restaurantId && validatedMenu.restaurantId.trim() !== '') {
      // Cas d'un seul restaurant
      const sanitizedRestaurantId = validatedMenu.restaurantId.trim().replace(/[^a-zA-Z0-9\-_]/g, '');
      if (sanitizedRestaurantId.length > 0) {
        restaurantIds.push(sanitizedRestaurantId);
      }
    }

    // Ajouter tous les restaurants au FormData
    restaurantIds.forEach(restaurantId => {
      formData.append('restaurant_ids', restaurantId);
    });

    // ✅ DEBUG: Vérifier les restaurants ajoutés
    console.log('🔍 DEBUG menuService - Restaurants ajoutés:', restaurantIds);

    // ✅ Ajout sécurisé des suppléments pour CREATE
    const supplementsAdded: Array<{id: string, quantity: number}> = [];
    const menuWithSupplements = validatedMenu as unknown as { dish_supplements?: Array<{ supplement_id?: string; quantity?: number }> };
    if (menuWithSupplements.dish_supplements && Array.isArray(menuWithSupplements.dish_supplements)) {
      menuWithSupplements.dish_supplements.forEach((supplement) => {
        if (supplement.supplement_id && typeof supplement.supplement_id === 'string') {
          const sanitizedSupplementId = supplement.supplement_id.trim().replace(/[^a-zA-Z0-9\-_]/g, '');
          if (sanitizedSupplementId.length > 0) {
            formData.append('supplement_ids', sanitizedSupplementId);

            // ✅ Ajouter la quantité pour chaque supplément
            const quantity = supplement.quantity && typeof supplement.quantity === 'number' && supplement.quantity > 0
              ? Math.min(Math.max(1, Math.floor(supplement.quantity)), 10)
              : 1;
            formData.append('supplement_quantities', quantity.toString());

            supplementsAdded.push({ id: sanitizedSupplementId, quantity });
          }
        }
      });
    } else if (validatedMenu.supplements) {
      (['ACCESSORY', 'FOOD', 'DRINK'] as const).forEach(type => {
        const supplements = validatedMenu.supplements?.[type];
        if (supplements && Array.isArray(supplements)) {
          supplements.forEach(supplement => {
            if (supplement.id && typeof supplement.id === 'string') {
              const sanitizedSupplementId = supplement.id.trim().replace(/[^a-zA-Z0-9\-_]/g, '');
              if (sanitizedSupplementId.length > 0) {
                formData.append('supplement_ids', sanitizedSupplementId);

                // ✅ Ajouter la quantité pour chaque supplément
                const quantity = supplement.quantity && typeof supplement.quantity === 'number' && supplement.quantity > 0
                  ? Math.min(Math.max(1, Math.floor(supplement.quantity)), 10)
                  : 1;
                formData.append('supplement_quantities', quantity.toString());
              }
            }
          });
        }
      });
    }

    // ✅ DEBUG: Vérifier les suppléments ajoutés
    console.log('🔍 DEBUG menuService - Suppléments ajoutés:', supplementsAdded);
  }

  return formData;

  } catch (error) {
    console.error('Erreur lors de la conversion menu vers FormData:', error);
    throw new Error(`Impossible de convertir les données du menu: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
};


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

// ✅ SUPPRESSION SÉCURISÉE D'UN MENU
export const deleteMenu = async (id: string): Promise<void> => {
  try {
    // ✅ Validation de l'ID
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      throw new Error('ID de menu invalide');
    }

    // ✅ Sanitisation de l'ID
    const sanitizedId = id.trim().replace(/[^a-zA-Z0-9\-_]/g, '');
    if (sanitizedId !== id.trim()) {
      throw new Error('ID de menu contient des caractères invalides');
    }

    await apiRequest<void>(`/dishes/${sanitizedId}`, 'DELETE');

    console.log(`Menu supprimé avec succès (ID: ${sanitizedId})`);
  } catch (error) {
    console.error(`Erreur lors de la suppression du menu ${id}:`, error);
    throw new Error(`Impossible de supprimer le menu: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
};


// ✅ RÉCUPÉRATION SÉCURISÉE DES CATÉGORIES DE MENU
export const getAllMenuCategories = async (): Promise<ApiMenuCategoryData[]> => {
  try {
    const data = await apiRequest<ApiMenuCategoriesResponse>('/menu-categories', 'GET');

    // ✅ Validation de la réponse
    if (!data) {
      throw new Error('Aucune donnée reçue du serveur');
    }

    const categories = data.data || [];

    // ✅ Validation que categories est un tableau
    if (!Array.isArray(categories)) {
      throw new Error('Format de réponse invalide: attendu un tableau');
    }

    return categories;
  } catch (error) {
    console.error('Erreur lors de la récupération des catégories de menu:', error);
    throw new Error(`Impossible de récupérer les catégories: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
};

// ✅ MISE À JOUR SÉCURISÉE DE LA DISPONIBILITÉ D'UN MENU
export const updateMenuAvailability = async (id: string, available: boolean): Promise<ValidatedMenuItem> => {
  try {
    // ✅ Validation de l'ID
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      throw new Error('ID de menu invalide');
    }

    // ✅ Validation du paramètre available
    if (typeof available !== 'boolean') {
      throw new Error('Paramètre de disponibilité invalide');
    }

    // ✅ Sanitisation de l'ID
    const sanitizedId = id.trim().replace(/[^a-zA-Z0-9\-_]/g, '');
    if (sanitizedId !== id.trim()) {
      throw new Error('ID de menu contient des caractères invalides');
    }

    const formData = new FormData();
    formData.append('available', available ? '1' : '0');

    const result = await apiRequest<ApiMenuResponse>(`/dishes/${sanitizedId}`, 'PATCH', formData);

    // ✅ Validation de la réponse
    if (!result) {
      throw new Error('Aucune réponse du serveur');
    }

    const menuResult = result.data || result;
    return formatMenuFromApi(menuResult);

  } catch (error) {
    console.error(`Erreur lors de la mise à jour de la disponibilité du menu ${id}:`, error);
    throw new Error(`Impossible de mettre à jour la disponibilité: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
};
