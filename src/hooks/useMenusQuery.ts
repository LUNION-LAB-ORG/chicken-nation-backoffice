import React, { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAllMenus } from '@/services/menuService';
import { ValidatedMenuItem } from '@/schemas/menuSchemas';

interface UseMenusQueryReturn {
  menus: ValidatedMenuItem[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  isLoading: boolean;
  error: Error | null;
  setCurrentPage: (page: number) => void;
  refetch: () => void;
}

export function useMenusQuery({
  searchQuery = '',
  selectedCategory = '',
  selectedRestaurant = null,
  pageSize = 10
}: {
  searchQuery?: string;
  selectedCategory?: string;
  selectedRestaurant?: string | null;
  pageSize?: number;
} = {}): UseMenusQueryReturn {
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();

  // ✅ Query TanStack
  const {
    data: menusData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['menus', searchQuery, selectedCategory, selectedRestaurant],
    queryFn: () => getAllMenus(),
    staleTime: 30000, // 30 secondes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // ✅ Filtrages côté client (car pas d'API de filtrage côté serveur)
  const filteredMenus = React.useMemo(() => {
    if (!menusData) return [];

    let filtered = menusData;

    // Filtrage par recherche
    if (searchQuery && searchQuery.trim() !== '') {
      const searchTerm = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(menu =>
        menu.name.toLowerCase().includes(searchTerm) ||
        (menu.description && menu.description.toLowerCase().includes(searchTerm))
      );
    }

    // Filtrage par catégorie
    if (selectedCategory && selectedCategory !== '') {
      filtered = filtered.filter(menu => {
        if (typeof menu.category === 'string') {
          return menu.category === selectedCategory;
        } else if (menu.category && typeof menu.category === 'object' && 'name' in menu.category) {
          return menu.category.name === selectedCategory;
        } else if (menu.categoryId) {
          return menu.categoryId === selectedCategory;
        }
        return false;
      });
    }

    // Filtrage par restaurant
    if (selectedRestaurant && selectedRestaurant !== '') {
      filtered = filtered.filter(menu => {
        return menu.restaurantId === selectedRestaurant ||
               menu.restaurant === selectedRestaurant;
      });
    }

    return filtered;
  }, [menusData, searchQuery, selectedCategory, selectedRestaurant]);

  // ✅ Pagination côté client
  const paginatedMenus = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredMenus.slice(startIndex, endIndex);
  }, [filteredMenus, currentPage, pageSize]);

  const totalItems = filteredMenus.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  // ✅ Fonction pour forcer le rafraîchissement
  const forceRefetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['menus'] });
    refetch();
  }, [queryClient, refetch]);

  return {
    menus: paginatedMenus,
    totalItems,
    totalPages,
    currentPage,
    isLoading,
    error: error as Error | null,
    setCurrentPage,
    refetch: forceRefetch
  };
}
