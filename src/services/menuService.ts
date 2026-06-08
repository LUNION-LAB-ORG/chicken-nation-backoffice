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
      dish_restaurants: validatedApiMenu.dish_restaurants || [],
      // Exclusions du plat (pour préremplir les sélecteurs en édition).
      excluded_supplement_ids: (validatedApiMenu as unknown as { excluded_supplement_ids?: string[] }).excluded_supplement_ids ?? [],
      excluded_restaurant_ids: (validatedApiMenu as unknown as { excluded_restaurant_ids?: string[] }).excluded_restaurant_ids ?? [],
      is_alway_epice: (validatedApiMenu as unknown as { is_alway_epice?: boolean }).is_alway_epice ?? false, // ✅ Nom corrigé sans "s"
      spice_level: (validatedApiMenu as unknown as { spice_level?: "ALWAYS" | "OPTIONAL" | "NEVER" }).spice_level ?? undefined,
      available_order_types: (validatedApiMenu as unknown as { available_order_types?: ("DELIVERY" | "PICKUP" | "TABLE")[] }).available_order_types ?? undefined,
      available_from: (validatedApiMenu as unknown as { available_from?: string | null }).available_from ?? undefined,
      available_until: (validatedApiMenu as unknown as { available_until?: string | null }).available_until ?? undefined,
      private: (validatedApiMenu as unknown as { private?: boolean }).private ?? false, // ✅ Nom corrigé sans "s"
      hubrise_sku: validatedApiMenu.hubrise_sku ?? undefined
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
export const getAllMenus = async (query?: { page: number; limit: number }): Promise<ValidatedMenuItem[]> => {
  try {
    let url = '/dishes/search';
    if (query) {
      url = url + `?page=${query.page}&limit=${query.limit}`
    }
    const responseData = await apiRequest<ApiMenuListResponse>(url, 'GET');

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


    // ✅ Validation du menu d'entrée selon le contexte
    const validatedMenu = isUpdate ? validateUpdateMenu(menu) : validateCreateMenu(menu);

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

      // ✅ Ajout du nouveau champ
      formData.append('is_alway_epice', (validatedMenu as unknown as { is_alway_epice?: boolean }).is_alway_epice ? 'true' : 'false');
      formData.append('private', (validatedMenu as unknown as { private?: boolean }).private ? 'true' : 'false');
      const spiceLevelUpdate = (validatedMenu as unknown as { spice_level?: string }).spice_level;
      if (spiceLevelUpdate) {
        formData.append('spice_level', spiceLevelUpdate);
      }
      const orderTypesUpdate = (validatedMenu as unknown as { available_order_types?: string[] }).available_order_types;
      if (Array.isArray(orderTypesUpdate)) {
        orderTypesUpdate.forEach((t) => { if (t) formData.append('available_order_types', t); });
      }
      const availFromUpdate = (validatedMenu as unknown as { available_from?: string | null }).available_from;
      const availUntilUpdate = (validatedMenu as unknown as { available_until?: string | null }).available_until;
      formData.append('available_from', availFromUpdate ?? '');
      formData.append('available_until', availUntilUpdate ?? '');
      const hubriseSkuUpdate = (validatedMenu as unknown as { hubrise_sku?: string }).hubrise_sku;
      if (hubriseSkuUpdate) {
        formData.append('hubrise_sku', hubriseSkuUpdate);
      }

      // ✅ Modèle "tout par défaut − exclusions" pour UPDATE.
      // On remplace ENTIÈREMENT les exclusions du plat (manage_exclusions=true
      // permet de TOUT vider si l'utilisateur n'exclut plus rien). Sources :
      //  - selectedRestaurants = restaurants qui NE vendent PAS le plat
      //  - dish_supplements    = suppléments RETIRÉS du plat
      formData.append('manage_exclusions', 'true');
      const cleanIdU = (id: string) => id.trim().replace(/[^a-zA-Z0-9\-_]/g, '');

      const exclRestoUpdate = (validatedMenu as unknown as { selectedRestaurants?: string[] }).selectedRestaurants ?? [];
      exclRestoUpdate.forEach((restaurantId) => {
        if (restaurantId && typeof restaurantId === 'string') {
          const c = cleanIdU(restaurantId);
          if (c.length > 0) formData.append('excluded_restaurant_ids', c);
        }
      });

      const exclSuppUpdate = (validatedMenu as unknown as { dish_supplements?: Array<{ supplement_id?: string }> }).dish_supplements ?? [];
      exclSuppUpdate.forEach((s) => {
        if (s && s.supplement_id && typeof s.supplement_id === 'string') {
          const c = cleanIdU(s.supplement_id);
          if (c.length > 0) formData.append('excluded_supplement_ids', c);
        }
      });

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

      // ✅ Ajout du nouveau champ
      formData.append('is_alway_epice', (validatedMenu as unknown as { is_alway_epice?: boolean }).is_alway_epice ? 'true' : 'false');
      formData.append('private', (validatedMenu as unknown as { private?: boolean }).private ? 'true' : 'false');
      const spiceLevelCreate = (validatedMenu as unknown as { spice_level?: string }).spice_level;
      if (spiceLevelCreate) {
        formData.append('spice_level', spiceLevelCreate);
      }
      const orderTypesCreate = (validatedMenu as unknown as { available_order_types?: string[] }).available_order_types;
      if (Array.isArray(orderTypesCreate)) {
        orderTypesCreate.forEach((t) => { if (t) formData.append('available_order_types', t); });
      }
      const availFromCreate = (validatedMenu as unknown as { available_from?: string | null }).available_from;
      const availUntilCreate = (validatedMenu as unknown as { available_until?: string | null }).available_until;
      formData.append('available_from', availFromCreate ?? '');
      formData.append('available_until', availUntilCreate ?? '');
      const hubriseSkuCreate = (validatedMenu as unknown as { hubrise_sku?: string }).hubrise_sku;
      if (hubriseSkuCreate) {
        formData.append('hubrise_sku', hubriseSkuCreate);
      }

      // ✅ Modèle "tout par défaut − exclusions" pour CREATE.
      // Les sélecteurs du formulaire désignent désormais ce qu'on RETIRE :
      //  - selectedRestaurants = restaurants qui NE vendent PAS le plat
      //  - dish_supplements    = suppléments RETIRÉS du plat
      // (vide = le plat a tout par défaut)
      const cleanId = (id: string) => id.trim().replace(/[^a-zA-Z0-9\-_]/g, '');

      const exclRestoSource = (validatedMenu as unknown as { selectedRestaurants?: string[] }).selectedRestaurants ?? [];
      exclRestoSource.forEach((restaurantId) => {
        if (restaurantId && typeof restaurantId === 'string') {
          const c = cleanId(restaurantId);
          if (c.length > 0) formData.append('excluded_restaurant_ids', c);
        }
      });

      const exclSuppSource = (validatedMenu as unknown as { dish_supplements?: Array<{ supplement_id?: string }> }).dish_supplements ?? [];
      exclSuppSource.forEach((s) => {
        if (s && s.supplement_id && typeof s.supplement_id === 'string') {
          const c = cleanId(s.supplement_id);
          if (c.length > 0) formData.append('excluded_supplement_ids', c);
        }
      });
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
