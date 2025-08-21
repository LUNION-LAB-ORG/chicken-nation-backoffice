'use client';

import { create } from 'zustand';
import {
  Order,
  OrderQuery,
  OrderStatus,
  OrderType,
  getOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder
} from '@/services/orderService';
import { useQueryClient } from '@tanstack/react-query';

interface OrderState {
  orders: Order[];
  selectedOrder: Order | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
  filters: {
    status?: OrderStatus;
    type?: OrderType;
    customerId?: string;
    restaurantId?: string;
    startDate?: string;
    endDate?: string;
    minAmount?: number;
    maxAmount?: number;
    search?: string;
  };

  // Actions
  fetchOrders: (params?: OrderQuery) => Promise<void>;
  fetchOrderById: (id: string) => Promise<Order | null>;
  setSelectedOrder: (order: Order | null) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<Order | null>;
  deleteOrder: (id: string) => Promise<boolean>;
  setFilter: (key: string, value: string | number | undefined) => void;
  resetFilters: () => void;
  setCurrentPage: (page: number) => void;
  getOrderById: (id: string) => Order | null;
}

const defaultPagination = {
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  itemsPerPage: 10,
};

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  selectedOrder: null,
  pagination: defaultPagination,
  isLoading: false,
  error: null,
  filters: {},

  fetchOrders: async (params?: OrderQuery) => {

    set({ isLoading: true, error: null });
    try {

      const queryParams: OrderQuery = {
        page: params?.page || get().pagination.currentPage,
        limit: params?.limit || get().pagination.itemsPerPage,
        ...get().filters,
        ...params, // ✅ Les paramètres passés ont la priorité
      };


      const response = await getOrders(queryParams);


      if (response === null) {
        set({
          isLoading: false,
          error: "Erreur d'authentification. Redirection vers la page de connexion..."
        });
        return;
      }



      // ✅ Ne mettre à jour currentPage que si c'est une nouvelle page demandée
      const currentState = get();
      const shouldUpdateCurrentPage = params?.page !== undefined;

      set({
        orders: response.data,
        pagination: {
          currentPage: shouldUpdateCurrentPage ? (queryParams.page || 1) : currentState.pagination.currentPage,
          totalPages: response.meta.totalPages,
          totalItems: response.meta.totalItems,
          itemsPerPage: response.meta.itemsPerPage,
        },
        isLoading: false,
      });
    } catch (error) {
      console.error('Erreur lors du chargement des commandes:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Une erreur est survenue lors du chargement des commandes',
      });
    }
  },

  fetchOrderById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const order = await getOrderById(id);
      set({
        selectedOrder: order,
        isLoading: false,
      });
      return order;
    } catch (error) {
      console.error('Erreur lors du chargement de la commande:', error);


      set({
        isLoading: false,
        selectedOrder: null,
        error: error instanceof Error ? error.message : 'Une erreur est survenue lors du chargement de la commande'
      });

      return null;
    }
  },

  setSelectedOrder: (order: Order | null) => {
    set({ selectedOrder: order });
  },

  updateOrderStatus: async (id: string, status: OrderStatus) => {
    set({ isLoading: true, error: null });
    try {


      const updatedOrder = await updateOrderStatus(id, status);

      // Mettre à jour la commande dans la liste
      set(state => ({
        orders: state.orders.map(order =>
          order.id === id ? { ...order, status } : order
        ),
        selectedOrder: state.selectedOrder?.id === id ? { ...state.selectedOrder, status } : state.selectedOrder,
        isLoading: false
      }));

      // TODO : Notifier le TPE de la commande acceptée
      if (status === "ACCEPTED" && typeof window !== "undefined") {
        window.flutter_inappwebview.callHandler("printDocument", updatedOrder);
      }

      const queryClient = useQueryClient();

      await queryClient.invalidateQueries({
        queryKey: ['orders'],
        exact: false
      });
      return updatedOrder;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut de la commande:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Une erreur est survenue lors de la mise à jour du statut de la commande'
      });
      return null;
    }
  },

  deleteOrder: async (id: string) => {
    set({ isLoading: true, error: null });
    try {

      await deleteOrder(id);


      set(state => ({
        orders: state.orders.filter(order => order.id !== id),
        selectedOrder: state.selectedOrder?.id === id ? null : state.selectedOrder,
        isLoading: false
      }));

      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression de la commande:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Une erreur est survenue lors de la suppression de la commande'
      });
      return false;
    }
  },

  setFilter: (key: string, value: string | number | undefined) => {

    set(state => ({
      filters: {
        ...state.filters,
        [key]: value,
      },
      pagination: {
        ...state.pagination,
        currentPage: 1,
      }
    }));

    get().fetchOrders();
  },

  resetFilters: () => {
    set({
      filters: {},
      pagination: {
        ...get().pagination,
        currentPage: 1,
      }
    });
    get().fetchOrders();
  },

  setCurrentPage: (page: number) => {

    const currentState = get();

    // ✅ UI Optimiste : Mettre à jour immédiatement la page
    set(state => ({
      pagination: {
        ...state.pagination,
        currentPage: page, // ✅ Mise à jour immédiate pour l'UI
      },
      isLoading: true
    }));

    // ✅ Charger les données de la nouvelle page
    const queryParams = {
      page,
      limit: currentState.pagination.itemsPerPage,
      ...currentState.filters,
    };


    getOrders(queryParams).then(response => {
      if (response && response.data) {

        set({
          orders: response.data,
          pagination: {
            currentPage: page, // ✅ Confirmer la page
            totalPages: response.meta.totalPages,
            totalItems: response.meta.totalItems,
            itemsPerPage: response.meta.itemsPerPage,
          },
          isLoading: false,
          error: null
        });
      }
    }).catch(error => {
      console.error('[OrderStore] Erreur lors du changement de page:', error);
      // ✅ En cas d'erreur, revenir à la page précédente
      set({
        isLoading: false,
        error: error.message,
        pagination: {
          ...currentState.pagination,
          currentPage: currentState.pagination.currentPage
        }
      });
    });
  },

  getOrderById: (id: string) => {
    const order = get().orders.find(o => o.id === id);
    if (!order) return null;
    return order;
  },
}));
