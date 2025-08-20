import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CommentService, CommentFilters, Comment } from '@/services/commentService';

interface UseCommentsQueryParams {
  rating?: string; 
  restaurantId?: string;
}

interface UseCommentsQueryReturn {
  // Données
  comments: Comment[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  isLoading: boolean;
  error: Error | null;
  
  // Actions
  setCurrentPage: (page: number) => void;
  refetch: () => void;
}

export function useCommentsQuery({
  rating,
  restaurantId
}: UseCommentsQueryParams): UseCommentsQueryReturn {
  const [currentPage, setCurrentPageState] = useState(1);
  const queryClient = useQueryClient();

  // ✅ Construire les filtres API avec pagination côté serveur
  const buildApiFilters = useCallback((): CommentFilters => {
    const filters: CommentFilters = {
      page: currentPage,
      limit: 10
    };

 
    if (restaurantId) {
      filters.restaurantId = restaurantId;
    }

 
    if (rating && rating !== '') {
      const ratingValue = parseInt(rating);
      filters.min_rating = ratingValue;
      filters.max_rating = ratingValue;
    }

    return filters;
  }, [currentPage, restaurantId, rating]);

  
  const queryKey = [
    'comments',
    currentPage,
    restaurantId || 'all',
    rating
  ].filter(Boolean);

  // ✅ Query TanStack avec pagination côté serveur
  const {
    data,
    isLoading,
    error
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const apiFilters = buildApiFilters();

      try {
        const response = await CommentService.getAllComments(apiFilters);
        
       
        return response;
      } catch (error) {
        console.error('❌ [useCommentsQuery] Erreur dans le hook:', error);
        throw error;
      }
    },
    staleTime: 30000, // 30 secondes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // ✅ Reset page à 1 quand les filtres changent  
  const isPageChangeRef = useRef(false);
  
  // ✅ Retourner à la page 1 quand les filtres changent
  const setCurrentPage = useCallback((page: number) => {
    isPageChangeRef.current = true; 
    setCurrentPageState(page);
  }, []);

 
  useEffect(() => {
    // Si c'est un changement de page intentionnel, ne pas reset
    if (isPageChangeRef.current) {
      isPageChangeRef.current = false;
      return;
    }
    
    // Sinon, reset à la page 1 car les filtres ont changé
    if (currentPage !== 1) {
      setCurrentPageState(1);
    }
  }, [restaurantId, rating, currentPage]);

  // ✅ Invalider le cache pour forcer un refresh
  const forceRefetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['comments'] });
  }, [queryClient]);

  // ✅ Plus de filtrage côté client - tout est géré côté serveur
  const comments = data?.data || [];

  return {
    comments,
    totalItems: data?.meta?.totalItems || 0,
    totalPages: data?.meta?.totalPages || 0,
    currentPage: currentPage,
    isLoading,
    error: error as Error | null,
    setCurrentPage,
    refetch: forceRefetch
  };
}
