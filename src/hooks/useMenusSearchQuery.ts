import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { searchMenus, MenuSearchQuery } from '@/services/menuService';
import { ValidatedMenuItem } from '@/schemas/menuSchemas';

interface UseMenusSearchQueryParams {
  searchQuery?: string;
  categoryId?: string;
  restaurantId?: string;
  available?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface UseMenusSearchQueryReturn {
  // Données
  menus: ValidatedMenuItem[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  isLoading: boolean;
  error: Error | null;
  
  // Actions
  setCurrentPage: (page: number) => void;
  refetch: () => void;
}

export function useMenusSearchQuery({
  searchQuery,
  categoryId,
  restaurantId,
  available,
  sortBy,
  sortOrder
}: UseMenusSearchQueryParams): UseMenusSearchQueryReturn {
  const [currentPage, setCurrentPageState] = useState(1);
  const queryClient = useQueryClient();

  // ✅ Construire les filtres API - recherche côté serveur
  const buildApiFilters = useCallback((): MenuSearchQuery => {
    const apiFilters: MenuSearchQuery = {};

    // ✅ Si on a une recherche, on utilise SEULEMENT le paramètre search (pas de pagination)
    if (searchQuery && searchQuery.trim()) {
      apiFilters.search = searchQuery.trim();
      // Pas de page/limit pour la recherche pour avoir tous les résultats
      return apiFilters;
    }

    // ✅ Sinon on utilise la pagination normale avec les autres filtres
    apiFilters.page = currentPage;
    apiFilters.limit = 10;

    if (categoryId) {
      apiFilters.categoryId = categoryId;
    }

    if (restaurantId) {
      apiFilters.restaurantId = restaurantId;
    }

    if (available !== undefined) {
      apiFilters.available = available;
    }

    if (sortBy) {
      apiFilters.sortBy = sortBy;
    }

    if (sortOrder) {
      apiFilters.sortOrder = sortOrder;
    }

    return apiFilters;
  }, [currentPage, searchQuery, categoryId, restaurantId, available, sortBy, sortOrder]);

  // ✅ Clé de requête unique basée sur tous les filtres
  const queryKey = [
    'menus-search',
    searchQuery ? 'search' : 'list', // Différencier recherche vs liste
    searchQuery || currentPage, // Utiliser soit la recherche soit la page
    categoryId,
    restaurantId,
    available,
    sortBy,
    sortOrder
  ].filter(Boolean);

  // ✅ Query TanStack
  const {
    data,
    isLoading,
    error
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const filters = buildApiFilters();
      const result = await searchMenus(filters);
      return result;
    },
    staleTime: 30000, // 30 secondes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // ✅ Reset page à 1 quand les filtres changent (sauf en mode recherche)
  const isPageChangeRef = useRef(false);
  
  // ✅ Retourner à la page 1 quand les filtres changent
  const setCurrentPage = useCallback((page: number) => {
    isPageChangeRef.current = true; // Marquer comme changement de page intentionnel
    setCurrentPageState(page);
  }, []);

  // ✅ Reset page quand les filtres changent (pas lors du changement de page ou en recherche)
  useEffect(() => {
    // Si on est en mode recherche, pas de reset de page
    if (searchQuery && searchQuery.trim()) {
      return;
    }

    // Si c'est un changement de page intentionnel, ne pas reset
    if (isPageChangeRef.current) {
      isPageChangeRef.current = false;
      return;
    }
    
    // Sinon, reset à la page 1 car les filtres ont changé
    if (currentPage !== 1) {
      setCurrentPageState(1);
    }
  }, [searchQuery, categoryId, restaurantId, available, sortBy, sortOrder, currentPage]);

  // ✅ Invalider le cache pour forcer un refresh
  const forceRefetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['menus-search'] });
  }, [queryClient]);

  // ✅ Recherche côté serveur - pas de filtrage côté client
  const menus = data?.data || [];

  return {
    menus: menus,
    totalItems: data?.meta?.totalItems || 0,
    totalPages: data?.meta?.totalPages || 0,
    currentPage: currentPage,
    isLoading,
    error: error as Error | null,
    setCurrentPage,
    refetch: forceRefetch
  };
} 