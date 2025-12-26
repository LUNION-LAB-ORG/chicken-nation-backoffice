import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { getOrders, getOrderById, updatePreparationTime, OrderQuery, PaginatedResponse } from '@/services/orderService';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../../socket';
import { Order } from '../../features/orders/types/order.types';

interface UseOrdersQueryParams {
  activeFilter: string;
  selectedRestaurant?: string;
  searchQuery?: string;
  selectedDate?: Date | null;
}

interface UseOrdersQueryReturn {
  // Données
  orders: Order[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  isLoading: boolean;
  error: Error | null;

  // Actions
  setCurrentPage: (page: number) => void;
  refetch: () => void;
}

// ✅ Hook pour récupérer une commande par ID
export function useOrderByIdQuery(orderId: string | null) {
  return useQuery<Order>({
    queryKey: ['order', orderId],
    queryFn: async () => {
      if (!orderId) throw new Error('Order ID is required');
      return await getOrderById(orderId);
    },
    enabled: !!orderId, // Ne pas exécuter si orderId est null/undefined
    staleTime: 60000, // 1 minute - Les détails de commande sont plus stables
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ✅ Hook de mutation pour mettre à jour le temps de préparation
export function useUpdatePreparationTimeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, preparationTime }: { orderId: string; preparationTime: number }) =>
      updatePreparationTime(orderId, preparationTime),
    onSuccess: (updatedOrder, { orderId }) => {
      // Mettre à jour le cache de la commande spécifique
      queryClient.setQueryData(['order', orderId], updatedOrder);

      // Invalider les listes de commandes pour forcer un refresh
      queryClient.invalidateQueries({ queryKey: ['orders'] });

      console.log('✅ [useUpdatePreparationTimeMutation] Temps de préparation mis à jour:', updatedOrder);
    },
    onError: (error) => {
      console.error('❌ [useUpdatePreparationTimeMutation] Erreur:', error);
    },
  });
}
