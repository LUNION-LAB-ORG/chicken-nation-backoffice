import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAllDishes, Dish } from '@/services/dishService';

// Réexporter le type Dish pour l'utilisation externe
export type { Dish };

// Interface pour les éléments bruts de l'API
interface RawDishItem {
  id: string;
  name: string;
  price: number;
  available: boolean;
  image?: string;
}

interface UseDishesQueryParams {
  searchQuery?: string;
  selectedCategory?: string;
  availableOnly?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface UseDishesQueryReturn {
  // Données
  dishes: Dish[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  isLoading: boolean;
  error: Error | null;
  
  // Actions
  setCurrentPage: (page: number) => void;
  refetch: () => void;
}

export function useDishesQuery({
  searchQuery,
  selectedCategory,
  availableOnly,
  sortBy = 'name',
  sortOrder = 'asc'
}: UseDishesQueryParams): UseDishesQueryReturn {
  const [currentPage, setCurrentPageState] = useState(1);
  const queryClient = useQueryClient();
  const isPageChangeRef = useRef(false);

  
  // ✅ Clé de requête unique basée sur tous les filtres
  const queryKey = [
    'dishes',
    currentPage,
    searchQuery,
    selectedCategory,
    availableOnly,
    sortBy,
    sortOrder
  ].filter(Boolean);

  // ✅ Query TanStack - Temporairement avec l'ancien service
  const {
    data,
    isLoading,
    error
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await getAllDishes();

      // Transformer les données dans le format attendu
      const allProducts: Dish[] = [];

      // Les données sont organisées par catégorie
      const categorizedData = response as unknown as Record<string, RawDishItem[]>;

      if (categorizedData.DRINK && Array.isArray(categorizedData.DRINK)) {
        categorizedData.DRINK.forEach((item: RawDishItem) => {
          allProducts.push({
            id: item.id,
            name: item.name,
            category: 'DRINK',
            category_id: '',
            price: item.price,
            stock: item.available ? 1 : 0,
            image: item.image || '/images/plat.png',
            available: item.available,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        });
      }

      if (categorizedData.FOOD && Array.isArray(categorizedData.FOOD)) {
        categorizedData.FOOD.forEach((item: RawDishItem) => {
          allProducts.push({
            id: item.id,
            name: item.name,
            category: 'FOOD',
            category_id: '',
            price: item.price,
            stock: item.available ? 1 : 0,
            image: item.image || '/images/plat.png',
            available: item.available,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        });
      }

      if (categorizedData.ACCESSORY && Array.isArray(categorizedData.ACCESSORY)) {
        categorizedData.ACCESSORY.forEach((item: RawDishItem) => {
          allProducts.push({
            id: item.id,
            name: item.name,
            category: 'ACCESSORY',
            category_id: '',
            price: item.price,
            stock: item.available ? 1 : 0,
            image: item.image || '/images/plat.png',
            available: item.available,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        });
      }

      // Appliquer les filtres côté client temporairement
      let filteredProducts = allProducts;

      if (selectedCategory) {
        filteredProducts = allProducts.filter(p => p.category === selectedCategory);
      }

      if (searchQuery && searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filteredProducts = filteredProducts.filter(p =>
          p.name.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query)
        );
      }

      // Simuler la pagination côté client
      const startIndex = (currentPage - 1) * 10;
      const paginatedProducts = filteredProducts.slice(startIndex, startIndex + 10);

      return {
        data: paginatedProducts,
        meta: {
          totalItems: filteredProducts.length,
          itemCount: paginatedProducts.length,
          itemsPerPage: 10,
          totalPages: Math.ceil(filteredProducts.length / 10),
          currentPage: currentPage
        }
      };
    },
    staleTime: 30000, // 30 secondes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // ✅ Retourner à la page 1 quand les filtres changent
  const setCurrentPage = useCallback((page: number) => {
    isPageChangeRef.current = true; // Marquer comme changement de page intentionnel
    setCurrentPageState(page);
  }, []);

  // ✅ Reset page quand les filtres changent (pas la page elle-même)
  useEffect(() => {
    if (isPageChangeRef.current) {
      isPageChangeRef.current = false;
      return; // Ne pas réinitialiser si c'est un changement de page intentionnel
    }
    if (currentPage !== 1) {
      setCurrentPageState(1);
    }
  }, [searchQuery, selectedCategory, availableOnly, sortBy, sortOrder, currentPage]);

  // ✅ Invalider le cache pour forcer un refresh
  const forceRefetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['dishes'] });
  }, [queryClient]);

  return {
    dishes: data?.data || [],
    totalItems: data?.meta?.totalItems || 0,
    totalPages: data?.meta?.totalPages || 1,
    currentPage,
    isLoading,
    error: error as Error | null,
    setCurrentPage,
    refetch: forceRefetch
  };
}
