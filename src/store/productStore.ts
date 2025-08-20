import { create } from 'zustand';
import { Product, CreateProductDto, UpdateProductDto, getAllProducts, createProduct, updateProduct } from '@/services/productService';

// Interface pour les paramètres de requête
interface ProductQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  available?: boolean;
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
interface ProductFilters {
  search?: string;
  category?: string;
  available?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

const defaultPagination: Pagination = {
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  itemsPerPage: 10,
};

const defaultFilters: ProductFilters = {
  search: '',
  category: '',
  available: undefined,
  sortBy: 'name',
  sortOrder: 'asc',
};

// Interface du store
interface ProductStore {
  // État
  products: Product[];
  pagination: Pagination;
  filters: ProductFilters;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchProducts: (params?: ProductQuery) => Promise<void>;
  setCurrentPage: (page: number) => void;
  setFilter: (key: keyof ProductFilters, value: string | boolean | undefined) => void;
  resetFilters: () => void;
  createProduct: (product: Partial<Product>) => Promise<Product>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<Product>;
  refreshProducts: () => Promise<void>;
}

// Fonction pour simuler une réponse paginée (à adapter selon votre API)
const createPaginatedResponse = (data: Product[], page: number, limit: number, filters: ProductFilters): PaginatedResponse<Product> => {
  // Filtrer les données
  let filteredData = data;

  // Filtre par recherche
  if (filters.search && filters.search.trim()) {
    const searchLower = filters.search.toLowerCase();
    filteredData = filteredData.filter(product => 
      product.name?.toLowerCase().includes(searchLower) ||
      product.description?.toLowerCase().includes(searchLower) ||
      product.category?.toLowerCase().includes(searchLower)
    );
  }

  // Filtre par catégorie
  if (filters.category && filters.category !== 'all') {
    filteredData = filteredData.filter(product => product.category === filters.category);
  }

  // Filtre par disponibilité
  if (filters.available !== undefined) {
    filteredData = filteredData.filter(product => product.available === filters.available);
  }

  // Tri
  if (filters.sortBy) {
    filteredData.sort((a, b) => {
      const aValue = a[filters.sortBy as keyof Product];
      const bValue = b[filters.sortBy as keyof Product];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return filters.sortOrder === 'desc' ? -comparison : comparison;
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        const comparison = aValue - bValue;
        return filters.sortOrder === 'desc' ? -comparison : comparison;
      }
      
      return 0;
    });
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

export const useProductStore = create<ProductStore>((set, get) => ({
  // État initial
  products: [],
  pagination: defaultPagination,
  filters: defaultFilters,
  isLoading: false,
  error: null,

  // ✅ Récupérer les produits avec pagination
  fetchProducts: async (params?: ProductQuery) => {
    set({ isLoading: true, error: null });
    try {
      const queryParams: ProductQuery = {
        page: params?.page || get().pagination.currentPage,
        limit: params?.limit || get().pagination.itemsPerPage,
        ...get().filters,
        ...params, // ✅ Les paramètres passés ont la priorité
      };

      console.log('[ProductStore] Chargement des produits avec params:', queryParams);

      // ✅ Pour l'instant, on récupère tous les produits et on fait la pagination côté client
      // TODO: Adapter quand l'API supportera la pagination côté serveur
      const allProducts = await getAllProducts();

      // ✅ Debug : vérifier la structure des données
      console.log('[ProductStore] Données brutes de l\'API:', allProducts);
      console.log('[ProductStore] Premier élément:', allProducts[0]);

      const response = createPaginatedResponse(
        allProducts,
        queryParams.page || 1,
        queryParams.limit || 10,
        {
          search: queryParams.search,
          category: queryParams.category,
          available: queryParams.available,
          sortBy: queryParams.sortBy,
          sortOrder: queryParams.sortOrder,
        }
      );

      console.log('[ProductStore] Produits chargés:', {
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
        products: response.data,
        pagination: {
          currentPage: shouldUpdateCurrentPage ? (queryParams.page || 1) : currentState.pagination.currentPage,
          totalPages: response.meta.totalPages,
          totalItems: response.meta.totalItems,
          itemsPerPage: response.meta.itemsPerPage,
        },
        isLoading: false,
      });
    } catch (error) {
      console.error('[ProductStore] Erreur lors du chargement des produits:', error);
      set({
        error: error instanceof Error ? error.message : 'Erreur lors du chargement des produits',
        isLoading: false,
      });
    }
  },

  // ✅ Changer de page avec UI optimiste
  setCurrentPage: (page: number) => {
    console.log('[ProductStore] Changement de page vers:', page);
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
    get().fetchProducts({ page, limit: currentState.pagination.itemsPerPage });
  },

  // ✅ Définir un filtre
  setFilter: (key: keyof ProductFilters, value: string | boolean | undefined) => {
    console.log(`[ProductStore] Filtre ${key}:`, value);
    set(state => ({
      filters: {
        ...state.filters,
        [key]: value,
      }
    }));
  },

  // ✅ Réinitialiser les filtres
  resetFilters: () => {
    console.log('[ProductStore] Réinitialisation des filtres');
    set({ filters: defaultFilters });
  },

  // ✅ Créer un produit
  createProduct: async (product: CreateProductDto) => {
    try {
      const newProduct = await createProduct(product);
      console.log('[ProductStore] Produit créé:', newProduct);
      
      // Recharger les produits
      await get().refreshProducts();
      
      return newProduct;
    } catch (error) {
      console.error('[ProductStore] Erreur lors de la création:', error);
      throw error;
    }
  },

  // ✅ Mettre à jour un produit
  updateProduct: async (id: string, product: UpdateProductDto) => {
    try {
      const updatedProduct = await updateProduct(id, product);
      console.log('[ProductStore] Produit mis à jour:', updatedProduct);
      
      // Recharger les produits
      await get().refreshProducts();
      
      return updatedProduct;
    } catch (error) {
      console.error('[ProductStore] Erreur lors de la mise à jour:', error);
      throw error;
    }
  },

  // ✅ Rafraîchir les produits
  refreshProducts: async () => {
    const currentState = get();
    await get().fetchProducts({ 
      page: currentState.pagination.currentPage, 
      limit: currentState.pagination.itemsPerPage 
    });
  },
}));
