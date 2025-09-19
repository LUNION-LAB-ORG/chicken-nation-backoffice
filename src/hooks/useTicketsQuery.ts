import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import {
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket,
  updateTicketStatus,
  updateTicketPriority,
  assignTicket,
  escalateConversationToTicket,
  getTicketStats,
  sendTicketMessage,
  assignTicketToCurrentUser
} from '@/services/ticketService';
import {
  Ticket,
  TicketStatus,
  TicketPriority,
  CreateTicketRequest,
  UpdateTicketRequest,
  TicketFilters
} from '@/types/tickets';

// ✅ Hook pour récupérer les tickets avec filtres
export const useTicketsQuery = (filters: TicketFilters = {}, enabled = true) => {
  return useQuery({
    queryKey: ['tickets', filters],
    queryFn: () => getTickets(filters),
    enabled,
    staleTime: 5 * 1000, // 5 secondes
    refetchInterval: 10 * 1000, // Refetch toutes les 10 secondes
    refetchIntervalInBackground: true,
  });
};

// ✅ Hook pour récupérer les tickets avec pagination infinie
export const useTicketsInfiniteQuery = (filters: TicketFilters = {}, enabled = true) => {
  return useInfiniteQuery({
    queryKey: ['tickets-infinite', filters],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await getTickets({ ...filters, page: pageParam });
      return response;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage?.meta) return undefined;
      return lastPage.meta.page < lastPage.meta.totalPages ? lastPage.meta.page + 1 : undefined;
    },
    enabled,
    staleTime: 5 * 1000,
    refetchInterval: 10 * 1000,
    refetchIntervalInBackground: true,
  });
};

// ✅ Hook pour récupérer un ticket par ID
export const useTicketQuery = (id: string | null, enabled = true) => {
  return useQuery({
    queryKey: ['ticket', id],
    queryFn: () => getTicketById(id!),
    enabled: enabled && !!id,
    staleTime: 5 * 1000,
    refetchInterval: 10 * 1000,
  });
};

// ✅ Hook pour les statistiques des tickets
export const useTicketStatsQuery = (enabled = true) => {
  return useQuery({
    queryKey: ['ticket-stats'],
    queryFn: getTicketStats,
    enabled,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000, // Refetch toutes les 2 minutes
  });
};

// ✅ Hook pour créer un ticket
export const useCreateTicketMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTicketRequest) => createTicket(data),
    onMutate: async (variables) => {
      // Annuler les queries en cours pour éviter les conflits
      await queryClient.cancelQueries({ queryKey: ['tickets'] });

      // Snapshot de l'état actuel
      const previousTickets = queryClient.getQueryData(['tickets']);

      // Ajouter optimistiquement le ticket
      const optimisticTicket = {
        id: `temp-${Date.now()}`,
        title: variables.title,
        status: 'OPEN' as TicketStatus,
        priority: variables.priority,
        category: variables.category,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        clientId: variables.clientId,
        assignedToId: variables.assignedToId,
      } as unknown as Ticket;

      return { previousTickets, optimisticTicket };
    },
    onError: (err, variables, context) => {
      // Restaurer les données précédentes en cas d'erreur
      if (context?.previousTickets) {
        queryClient.setQueryData(['tickets'], context.previousTickets);
      }
    },
    onSuccess: (newTicket) => {
      // Invalider et refetch les queries
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['tickets-infinite'] });
      queryClient.invalidateQueries({ queryKey: ['ticket-stats'] });

      // Ajouter le nouveau ticket au cache
      queryClient.setQueryData(['ticket', newTicket.id], newTicket);

      console.log('✅ Ticket créé avec succès:', newTicket);
    },
  });
};

// ✅ Hook pour mettre à jour un ticket
export const useUpdateTicketMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTicketRequest }) =>
      updateTicket(id, data),
    onSuccess: (updatedTicket, { id }) => {
      // Mettre à jour le cache du ticket spécifique
      queryClient.setQueryData(['ticket', id], updatedTicket);

      // Invalider les queries des listes
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['tickets-infinite'] });
      queryClient.invalidateQueries({ queryKey: ['ticket-stats'] });

      console.log('✅ Ticket mis à jour avec succès:', updatedTicket);
    },
    onError: (error) => {
      console.error('❌ Erreur lors de la mise à jour du ticket:', error);
    },
  });
};

// ✅ Hook pour supprimer un ticket
export const useDeleteTicketMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTicket(id),
    onSuccess: (_, deletedId) => {
      // Supprimer du cache
      queryClient.removeQueries({ queryKey: ['ticket', deletedId] });

      // Invalider les queries des listes
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['tickets-infinite'] });
      queryClient.invalidateQueries({ queryKey: ['ticket-stats'] });

      console.log('✅ Ticket supprimé avec succès');
    },
    onError: (error) => {
      console.error('❌ Erreur lors de la suppression du ticket:', error);
    },
  });
};

// ✅ Hook pour mettre à jour le statut d'un ticket
export const useUpdateTicketStatusMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TicketStatus }) =>
      updateTicketStatus(id, status),
    onSuccess: (updatedTicket, { id }) => {
      // Mettre à jour le cache du ticket spécifique
      queryClient.setQueryData(['ticket', id], updatedTicket);

      // Invalider les queries des listes
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['tickets-infinite'] });
      queryClient.invalidateQueries({ queryKey: ['ticket-stats'] });

      console.log('✅ Statut du ticket mis à jour avec succès:', updatedTicket);
    },
    onError: (error) => {
      console.error('❌ Erreur lors de la mise à jour du statut:', error);
    },
  });
};

// ✅ Hook pour mettre à jour la priorité d'un ticket
export const useUpdateTicketPriorityMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, priority }: { id: string; priority: TicketPriority }) =>
      updateTicketPriority(id, priority),
    onSuccess: (updatedTicket, { id }) => {
      // Mettre à jour le cache du ticket spécifique
      queryClient.setQueryData(['ticket', id], updatedTicket);

      // Invalider les queries des listes
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['tickets-infinite'] });
      queryClient.invalidateQueries({ queryKey: ['ticket-stats'] });

      console.log('✅ Priorité du ticket mis à jour avec succès:', updatedTicket);
    },
    onError: (error) => {
      console.error('❌ Erreur lors de la mise à jour de la priorité:', error);
    },
  });
};

// ✅ Hook pour assigner un ticket
export const useAssignTicketMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, assignedToId }: { id: string; assignedToId: string }) =>
      assignTicket(id, assignedToId),
    onSuccess: (updatedTicket, { id }) => {
      // Mettre à jour le cache du ticket spécifique
      queryClient.setQueryData(['ticket', id], updatedTicket);

      // Invalider les queries des listes
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['tickets-infinite'] });

      console.log('✅ Ticket assigné avec succès:', updatedTicket);
    },
    onError: (error) => {
      console.error('❌ Erreur lors de l\'assignation du ticket:', error);
    },
  });
};

// ✅ Hook pour escalader une conversation en ticket
export const useEscalateConversationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      conversationId: string;
      title: string;
      priority: any;
      category: any;
      assignedToId?: string;
      description?: string;
    }) => escalateConversationToTicket(data),
    onSuccess: (newTicket) => {
      // Invalider et refetch les queries
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['tickets-infinite'] });
      queryClient.invalidateQueries({ queryKey: ['ticket-stats'] });

      // Ajouter le nouveau ticket au cache
      queryClient.setQueryData(['ticket', newTicket.id], newTicket);

      console.log('✅ Conversation escaladée en ticket avec succès:', newTicket);
    },
    onError: (error) => {
      console.error('❌ Erreur lors de l\'escalation:', error);
    },
  });
};/**

 * 📨 HOOKS POUR LES MESSAGES DE TICKETS
 */

// Hook pour envoyer un message dans un ticket
export const useSendTicketMessageMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ticketId, messageData }: {
      ticketId: string;
      messageData: {
        body: string;
        internal: boolean;
        authorId: string;
        meta?: string;
      }
    }) => sendTicketMessage(ticketId, messageData),

    onSuccess: (data, variables) => {
      console.log('✅ [useSendTicketMessageMutation] Message envoyé avec succès:', data);

      // Invalider les caches liés
      queryClient.invalidateQueries({ queryKey: ['ticket', variables.ticketId] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },

    onError: (error) => {
      console.error('❌ [useSendTicketMessageMutation] Erreur lors de l\'envoi du message:', error);
    }
  });
};

// Hook pour assigner le ticket à l'utilisateur actuel
export const useAssignTicketToCurrentUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ticketId, assigneeId }: { ticketId: string; assigneeId: string }) =>
      assignTicketToCurrentUser(ticketId, assigneeId),

    onSuccess: (data, { ticketId }) => {
      console.log('✅ [useAssignTicketToCurrentUserMutation] Ticket assigné avec succès');

      // Invalider les caches liés
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },

    onError: (error) => {
      console.error('❌ [useAssignTicketToCurrentUserMutation] Erreur lors de l\'assignation:', error);
    }
  });
};