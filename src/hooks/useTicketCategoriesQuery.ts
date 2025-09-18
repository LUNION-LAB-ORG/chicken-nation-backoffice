import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import {
  getTicketCategories,
  getTicketCategoryById,
  createTicketCategory,
  updateTicketCategory,
  deleteTicketCategory,
  assignAgentToCategory,
  unassignAgentFromCategory,
  TicketCategory,
  CreateTicketCategoryRequest,
  UpdateTicketCategoryRequest,
  AgentAssignment,
  TicketCategoryFilters
} from '@/services/ticketCategoryService';

// ✅ Hook pour récupérer les catégories avec pagination
export const useTicketCategoriesQuery = (filters: TicketCategoryFilters = {}, enabled = true) => {
  return useQuery({
    queryKey: ['ticket-categories', filters],
    queryFn: () => getTicketCategories(filters),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Refetch toutes les 10 minutes
  });
};

// ✅ Hook pour récupérer les catégories avec pagination infinie
export const useTicketCategoriesInfiniteQuery = (filters: Omit<TicketCategoryFilters, 'page'> = {}, enabled = true) => {
  return useInfiniteQuery({
    queryKey: ['ticket-categories-infinite', filters],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await getTicketCategories({ ...filters, page: pageParam });
      return response;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage?.meta) return undefined;
      return lastPage.meta.page < lastPage.meta.totalPages ? lastPage.meta.page + 1 : undefined;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });
};

// ✅ Hook pour récupérer une catégorie par ID
export const useTicketCategoryQuery = (id: string | null, enabled = true) => {
  return useQuery({
    queryKey: ['ticket-category', id],
    queryFn: () => getTicketCategoryById(id!),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000,
  });
};

// ✅ Hook pour créer une catégorie
export const useCreateTicketCategoryMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTicketCategoryRequest) => {
      console.log('🎯 [useCreateTicketCategoryMutation] Mutation déclenchée avec:', data);
      return createTicketCategory(data);
    },
    onSuccess: (newCategory) => {
      console.log('🎉 [useCreateTicketCategoryMutation] Succès, invalidation des caches...');
      
      // Invalider les queries des catégories
      queryClient.invalidateQueries({ queryKey: ['ticket-categories'] });
      queryClient.invalidateQueries({ queryKey: ['ticket-categories-infinite'] });
      
      // Ajouter la nouvelle catégorie au cache
      queryClient.setQueryData(['ticket-category', newCategory.id], newCategory);
      
      console.log('✅ [useCreateTicketCategoryMutation] Catégorie créée avec succès:', newCategory);
    },
    onError: (error) => {
      console.error('❌ [useCreateTicketCategoryMutation] Erreur lors de la création de la catégorie:', error);
    },
  });
};

// ✅ Hook pour mettre à jour une catégorie
export const useUpdateTicketCategoryMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTicketCategoryRequest }) => 
      updateTicketCategory(id, data),
    onSuccess: (updatedCategory, { id }) => {
      // Mettre à jour le cache de la catégorie spécifique
      queryClient.setQueryData(['ticket-category', id], updatedCategory);
      
      // Invalider les queries des listes
      queryClient.invalidateQueries({ queryKey: ['ticket-categories'] });
      queryClient.invalidateQueries({ queryKey: ['ticket-categories-infinite'] });
      
      console.log('✅ Catégorie mise à jour avec succès:', updatedCategory);
    },
    onError: (error) => {
      console.error('❌ Erreur lors de la mise à jour de la catégorie:', error);
    },
  });
};

// ✅ Hook pour supprimer une catégorie
export const useDeleteTicketCategoryMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTicketCategory(id),
    onSuccess: (_, deletedId) => {
      // Supprimer du cache
      queryClient.removeQueries({ queryKey: ['ticket-category', deletedId] });
      
      // Invalider les queries des listes
      queryClient.invalidateQueries({ queryKey: ['ticket-categories'] });
      queryClient.invalidateQueries({ queryKey: ['ticket-categories-infinite'] });
      
      console.log('✅ Catégorie supprimée avec succès');
    },
    onError: (error) => {
      console.error('❌ Erreur lors de la suppression de la catégorie:', error);
    },
  });
};

// ✅ Hook pour attribuer un agent à une catégorie
export const useAssignAgentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assignment: AgentAssignment) => assignAgentToCategory(assignment),
    onSuccess: (_, { categoryId }) => {
      // Invalider les queries liées à cette catégorie
      queryClient.invalidateQueries({ queryKey: ['ticket-category', categoryId] });
      queryClient.invalidateQueries({ queryKey: ['ticket-categories'] });
      
      console.log('✅ Agent assigné avec succès');
    },
    onError: (error) => {
      console.error('❌ Erreur lors de l\'assignation de l\'agent:', error);
    },
  });
};

// ✅ Hook pour désassigner un agent d'une catégorie
export const useUnassignAgentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assignment: AgentAssignment) => unassignAgentFromCategory(assignment),
    onSuccess: (_, { categoryId }) => {
      // Invalider les queries liées à cette catégorie
      queryClient.invalidateQueries({ queryKey: ['ticket-category', categoryId] });
      queryClient.invalidateQueries({ queryKey: ['ticket-categories'] });
      
      console.log('✅ Agent désassigné avec succès');
    },
    onError: (error) => {
      console.error('❌ Erreur lors de la désassignation de l\'agent:', error);
    },
  });
};