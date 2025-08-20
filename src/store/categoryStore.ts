import { create } from 'zustand';
import { Category, getAllCategoriesWithProductCount, createCategory, updateCategory, deleteCategory } from '@/services/categoryService';

// Interface pour les paramètres de requête
interface CategoryQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Interface pour la réponse paginée
interface PaginatedResponse<T> {
  data: T[];
  meta: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

// Interface pour la pagination
interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

// Interface pour les filtres
interface CategoryFilters {
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

const defaultPagination: Pagination = {
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  itemsPerPage: 10,
};

const defaultFilters: CategoryFilters = {
  search: '',
  sortBy: 'name',
  sortOrder: 'asc',
};

// Interface du store
interface CategoryStore {
  // État
  categories: Category[];
  pagination: Pagination;
  filters: CategoryFilters;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCategories: (params?: CategoryQuery) => Promise<void>;
  setCurrentPage: (page: number) => void;
  setFilter: (key: keyof CategoryFilters, value: string | undefined) => void;
  resetFilters: () => void;
  createCategory: (formData: FormData) => Promise<Category>;
  updateCategory: (id: string, formData: FormData) => Promise<Category>;
  deleteCategory: (id: string) => Promise<void>;
  refreshCategories: () => Promise<void>;
}

// Fonction pour simuler une réponse paginée (à adapter selon votre API)
const createPaginatedResponse = (data: Category[], page: number, limit: number, search?: string): PaginatedResponse<Category> => {
  // Filtrer par recherche si nécessaire
  let filteredData = data;
  if (search && search.trim()) {
    const searchLower = search.toLowerCase();
    filteredData = data.filter(category => 
      category.name?.toLowerCase().includes(searchLower) ||
      category.description?.toLowerCase().includes(searchLower)
    );
  }

  const totalItems = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  return {
    data: paginatedData,
    meta: {
      currentPage: page,
      totalPages,
      totalItems,
      itemsPerPage: limit,
    },
  };
};

export const useCategoryStore = create<CategoryStore>((set, get) => ({
  // État initial
  categories: [],
  pagination: defaultPagination,
  filters: defaultFilters,
  isLoading: false,
  error: null,

  // ✅ Récupérer les catégories avec pagination
  fetchCategories: async (params?: CategoryQuery) => {
    set({ isLoading: true, error: null });
    try {
      const queryParams: CategoryQuery = {
        page: params?.page || get().pagination.currentPage,
        limit: params?.limit || get().pagination.itemsPerPage,
        ...get().filters,
        ...params, // ✅ Les paramètres passés ont la priorité
      };

      console.log('[CategoryStore] Chargement des catégories avec params:', queryParams);

      // ✅ Pour l'instant, on récupère toutes les catégories et on fait la pagination côté client
      // TODO: Adapter quand l'API supportera la pagination côté serveur
      const allCategories = await getAllCategoriesWithProductCount();

      // ✅ Debug : vérifier la structure des données
      console.log('[CategoryStore] Données brutes de l\'API:', allCategories);
      console.log('[CategoryStore] Premier élément:', allCategories[0]);

      const response = createPaginatedResponse(
        allCategories,
        queryParams.page || 1,
        queryParams.limit || 10,
        queryParams.search
      );

      console.log('[CategoryStore] Catégories chargées:', {
        count: response.data.length,
        totalItems: response.meta.totalItems,
        currentPage: response.meta.currentPage,
        totalPages: response.meta.totalPages,
        requestedPage: queryParams.page
      });

      // ✅ Ne mettre à jour currentPage que si c'est une nouvelle page demandée
      const currentState = get();
      const shouldUpdateCurrentPage = params?.page !== undefined;

      set({
        categories: response.data,
        pagination: {
          currentPage: shouldUpdateCurrentPage ? (queryParams.page || 1) : currentState.pagination.currentPage,
          totalPages: response.meta.totalPages,
          totalItems: response.meta.totalItems,
          itemsPerPage: response.meta.itemsPerPage,
        },
        isLoading: false,
      });
    } catch (error) {
      console.error('[CategoryStore] Erreur lors du chargement des catégories:', error);
      set({
        error: error instanceof Error ? error.message : 'Erreur lors du chargement des catégories',
        isLoading: false,
      });
    }
  },

  // ✅ Changer de page avec UI optimiste
  setCurrentPage: (page: number) => {
    console.log('[CategoryStore] Changement de page vers:', page);
    const currentState = get();

    // ✅ Validation
    if (page < 1 || page > currentState.pagination.totalPages) {
      console.warn(`Page ${page} invalide. Pages disponibles: 1-${currentState.pagination.totalPages}`);
      return;
    }

    if (page === currentState.pagination.currentPage) {
      return;
    }

    // ✅ UI Optimiste : Mettre à jour immédiatement la page
    set(state => ({
      pagination: {
        ...state.pagination,
        currentPage: page,
      },
      isLoading: true
    }));

    // ✅ Charger les données de la nouvelle page
    get().fetchCategories({ page, limit: currentState.pagination.itemsPerPage });
  },

  // ✅ Définir un filtre
  setFilter: (key: keyof CategoryFilters, value: string | undefined) => {
    console.log(`[CategoryStore] Filtre ${key}:`, value);
    set(state => ({
      filters: {
        ...state.filters,
        [key]: value,
      }
    }));
  },

  // ✅ Réinitialiser les filtres
  resetFilters: () => {
    console.log('[CategoryStore] Réinitialisation des filtres');
    set({ filters: defaultFilters });
  },

  // ✅ Créer une catégorie
  createCategory: async (formData: FormData) => {
    try {
      const newCategory = await createCategory(formData);
      console.log('[CategoryStore] Catégorie créée:', newCategory);
      
      // Recharger les catégories
      await get().refreshCategories();
      
      return newCategory;
    } catch (error) {
      console.error('[CategoryStore] Erreur lors de la création:', error);
      throw error;
    }
  },

  // ✅ Mettre à jour une catégorie
  updateCategory: async (id: string, formData: FormData) => {
    try {
      const updatedCategory = await updateCategory(id, formData);
      console.log('[CategoryStore] Catégorie mise à jour:', updatedCategory);
      
      // Recharger les catégories
      await get().refreshCategories();
      
      return updatedCategory;
    } catch (error) {
      console.error('[CategoryStore] Erreur lors de la mise à jour:', error);
      throw error;
    }
  },

  // ✅ Supprimer une catégorie
  deleteCategory: async (id: string) => {
    try {
      await deleteCategory(id);
      console.log('[CategoryStore] Catégorie supprimée:', id);
      
      // Recharger les catégories
      await get().refreshCategories();
    } catch (error) {
      console.error('[CategoryStore] Erreur lors de la suppression:', error);
      throw error;
    }
  },

  // ✅ Rafraîchir les catégories
  refreshCategories: async () => {
    const currentState = get();
    await get().fetchCategories({ 
      page: currentState.pagination.currentPage, 
      limit: currentState.pagination.itemsPerPage 
    });
  },
}));
