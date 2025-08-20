import { api } from './api';
import { formatImageUrl } from '@/utils/imageHelpers';
import { MenuItem } from '@/types';

// Points d'entrée de l'API pour les catégories
const CATEGORIES_ENDPOINT = '/categories';
 
export interface Category {
  id: string;
  name: string;
  description?: string;
  image?: string;
  productCount?: number;
}

// Interface pour les paramètres de requête avec pagination
export interface CategoryQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Interface pour la réponse paginée
export interface PaginatedCategoryResponse {
  data: Category[];
  meta: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

 
export interface CategoryWithDishes extends Category {
  dishes: MenuItem[];
}
 
export interface CreateCategoryDto {
  name: string;
  description?: string;
  image?: string;
}
 
export interface UpdateCategoryDto {
  name?: string;
  description?: string;
  image?: string;
}

/**
 * Récupère toutes les catégories (version simple)
 */
export const getAllCategories = async (): Promise<Category[]> => {
  try {
    const response = await api.get<Category[]>('/categories', false);
    return response;
  } catch (error) {
    console.error('Erreur lors de la récupération des catégories:', error);
    throw error;
  }
};

/**
 * ✅ Récupère toutes les catégories avec le nombre réel de produits/menus
 */
export const getAllCategoriesWithProductCount = async (): Promise<Category[]> => {
  try {
    console.log('🔄 Récupération des catégories avec calcul du nombre de produits...');
    
    // Récupérer toutes les catégories d'abord
    const categories = await api.get<Category[]>('/categories', false);
    
    if (!categories || !Array.isArray(categories)) {
      console.warn('⚠️ Aucune catégorie trouvée ou format invalide');
      return [];
    }

    // ✅ Calculer le nombre de produits pour chaque catégorie en parallèle
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        try {
          // Récupérer les menus de cette catégorie
          const menus = await getMenusByCategoryId(category.id);
          const productCount = menus ? menus.length : 0;
          
          console.log(`📊 Catégorie "${category.name}": ${productCount} produits`);
          
          return {
            ...category,
            productCount
          };
        } catch (error) {
          console.error(`❌ Erreur lors du calcul des produits pour la catégorie ${category.name}:`, error);
          // En cas d'erreur, retourner la catégorie avec productCount = 0
          return {
            ...category,
            productCount: 0
          };
        }
      })
    );

    console.log('✅ Catégories avec nombre de produits calculé:', categoriesWithCount.length);
    return categoriesWithCount;
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des catégories avec calcul des produits:', error);
    throw error;
  }
};

/**
 * Récupère les catégories avec pagination
 */
export const getCategories = async (params: CategoryQuery = {}): Promise<PaginatedCategoryResponse> => {
  try {
    const { page = 1, limit = 10, search, sortBy, sortOrder } = params;

    // Construire les paramètres de requête
    const queryParams = new URLSearchParams({
      page: String(page),
      limit: String(limit)
    });

    if (search) queryParams.append('search', search);
    if (sortBy) queryParams.append('sortBy', sortBy);
    if (sortOrder) queryParams.append('sortOrder', sortOrder);

    const url = `/categories?${queryParams}`;
    const response = await api.get<PaginatedCategoryResponse>(url, false);
    return response;
  } catch (error) {
    console.error('Erreur lors de la récupération des catégories paginées:', error);
    throw error;
  }
};

 
export const getCategoryById = async (id: string): Promise<Category> => {
  return api.get<Category>(`${CATEGORIES_ENDPOINT}/${id}`, false); 
};
 
export const getCategoryWithDishes = async (categoryId: string): Promise<CategoryWithDishes> => {
  try {
    const response = await api.get<CategoryWithDishes>(`${CATEGORIES_ENDPOINT}/${categoryId}`, true);
    const formattedResponse: CategoryWithDishes = {
      ...response as CategoryWithDishes,
      dishes: []
    };
    if (response && (response as CategoryWithDishes).dishes && Array.isArray((response as CategoryWithDishes).dishes)) {
      formattedResponse.dishes = (response as CategoryWithDishes).dishes.map((dish: MenuItem) => ({
        ...dish,
        image: formatImageUrl(dish.image)
      }));
    }
    if (response && (response as CategoryWithDishes).image) {
      formattedResponse.image = formatImageUrl((response as CategoryWithDishes).image);
    }
    return formattedResponse;
  } catch (error) {
    console.error('Erreur lors de la récupération de la catégorie avec ses plats:', error);
    throw error;
  }
};
 
export const getMenusByCategoryId = async (categoryId: string): Promise<MenuItem[]> => {
  try {
    const response = await api.get<CategoryWithDishes>(`/categories/${categoryId}`, true);
    if (response && response.dishes && Array.isArray(response.dishes)) {
      const formattedDishes = response.dishes.map(dish => ({
        ...dish,
        image: formatImageUrl(dish.image)
      }));
      return formattedDishes;
    }
    return [];
  } catch (error) {
    console.error(`Erreur lors de la récupération des plats pour la catégorie ${categoryId}:`, error);
    throw error;
  }
};
 
export const createCategory = async (formData: FormData): Promise<Category> => {
  return api.post<Category>(CATEGORIES_ENDPOINT, formData, true);  
};
 
export const updateCategory = async (id: string, formData: FormData): Promise<Category> => {
  if (!formData.has('id')) {
    formData.append('id', id);
  }
  return api.patch<Category>(`${CATEGORIES_ENDPOINT}/${id}`, formData, true); 
};

 
export const deleteCategory = async (id: string): Promise<void> => {
  return api.delete<void>(`${CATEGORIES_ENDPOINT}/${id}`, true); 
};
