import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAllCategoriesWithProductCount, Category } from '@/services/categoryService';

interface UseCategoriesQueryParams {
  searchQuery?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface UseCategoriesQueryReturn {
  // Données
  categories: Category[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  isLoading: boolean;
  error: Error | null;
  
  // Actions
  setCurrentPage: (page: number) => void;
  refetch: () => void;
}

export function useCategoriesQuery({
  searchQuery,
  sortBy = 'name',
  sortOrder = 'asc'
}: UseCategoriesQueryParams): UseCategoriesQueryReturn {
  const [currentPage, setCurrentPageState] = useState(1);
  const queryClient = useQueryClient();
  const isPageChangeRef = useRef(false);


  // ✅ Clé de requête unique basée sur tous les filtres
  const queryKey = [
    'categories',
    currentPage,
    searchQuery,
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
      const response = await getAllCategoriesWithProductCount();

      // Appliquer les filtres côté client temporairement
      let filteredCategories = response || [];

      if (searchQuery && searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filteredCategories = filteredCategories.filter(category =>
          category.name?.toLowerCase().includes(query) ||
          category.description?.toLowerCase().includes(query)
        );
      }

      // Simuler la pagination côté client
      const itemsPerPage = 10;
      const startIndex = (currentPage - 1) * itemsPerPage;
      const paginatedCategories = filteredCategories.slice(startIndex, startIndex + itemsPerPage);

      return {
        data: paginatedCategories,
        meta: {
          totalItems: filteredCategories.length,
          itemCount: paginatedCategories.length,
          itemsPerPage: itemsPerPage,
          totalPages: Math.ceil(filteredCategories.length / itemsPerPage),
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
  }, [searchQuery, sortBy, sortOrder, currentPage]);

  // ✅ Invalider le cache pour forcer un refresh
  const forceRefetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['categories'] });
  }, [queryClient]);

  return {
    categories: data?.data || [],
    totalItems: data?.meta?.totalItems || 0,
    totalPages: data?.meta?.totalPages || 1,
    currentPage,
    isLoading,
    error: error as Error | null,
    setCurrentPage,
    refetch: forceRefetch
  };
}
