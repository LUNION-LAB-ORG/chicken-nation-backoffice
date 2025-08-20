'use client';

import { create } from 'zustand';
import { Customer, CustomerQuery, getCustomers, getCustomerById } from '@/services/customerService';
// import { PaginatedResponse } from '@/services/customerService'; // Non utilisé actuellement

interface CustomerState {
  customers: Customer[];
  selectedCustomer: Customer | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
  filters: {
    showConnectedOnly: boolean;
    search: string;
    status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | undefined;
  };
  
  // Actions
  fetchCustomers: (params?: CustomerQuery) => Promise<void>;
  fetchCustomerById: (id: string) => Promise<Customer | null>;
  setSelectedCustomer: (customer: Customer | null) => void;
  setShowConnectedOnly: (value: boolean) => void;
  setSearch: (value: string) => void;
  setStatus: (value: 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | undefined) => void;
  setCurrentPage: (page: number) => void;
  getCustomerById: (id: string) => Customer | null;
}

const defaultPagination = {
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  itemsPerPage: 10,
};

export const useCustomerStore = create<CustomerState>((set, get) => ({
  customers: [],
  selectedCustomer: null,
  pagination: defaultPagination,
  isLoading: false,
  error: null,
  filters: {
    showConnectedOnly: false,
    search: '',
    status: undefined,
  },

  fetchCustomers: async (params?: CustomerQuery) => {
    set({ isLoading: true, error: null });
    try {
      // ✅ Préparer les paramètres de requête avec priorité aux params passés
      const queryParams: CustomerQuery = {
        page: params?.page || get().pagination.currentPage,
        limit: params?.limit || get().pagination.itemsPerPage,
        ...get().filters,
        ...params, // ✅ Les paramètres passés ont la priorité
      };

      // Ajouter le filtre isConnected si nécessaire
      if (get().filters.showConnectedOnly) {
        queryParams.status = 'ACTIVE';
      } else if (get().filters.status) {
        queryParams.status = get().filters.status;
      }

      // Ajouter la recherche si définie
      if (get().filters.search) {
        queryParams.search = get().filters.search;
      }

      console.log('[CustomerStore] Chargement des clients avec params:', queryParams);

     
      const response = await getCustomers(queryParams);


      // Si la réponse est null (erreur d'authentification générée)
      if (response === null) {
        set({
          isLoading: false,
          error: "Erreur d'authentification. Redirection vers la page de connexion..."
        });
        return;
      }

      console.log('[CustomerStore] Clients chargés:', {
        count: response.data.length,
        totalItems: response.meta.totalItems,
        currentPage: response.meta.currentPage,
        totalPages: response.meta.totalPages,
        requestedPage: queryParams.page
      });

      // ✅ Ne mettre à jour currentPage que si c'est une nouvelle page demandée
      const currentState = get();
      const shouldUpdateCurrentPage = params?.page !== undefined;

      // ✅ Le backend envoie maintenant toujours un objet avec pagination
      if (response.data && response.meta) {
        set({
          customers: response.data,
          pagination: {
            currentPage: shouldUpdateCurrentPage ? (queryParams.page || 1) : currentState.pagination.currentPage,
            totalPages: response.meta.totalPages,
            totalItems: response.meta.totalItems,
            itemsPerPage: response.meta.itemsPerPage,
          },
          isLoading: false,
        });
        return;
      }

      // Si le format est inattendu
      set({
        customers: [],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: 8,
        },
        isLoading: false,
        error: 'Format de réponse invalide du serveur'
      });
      return;
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Une erreur est survenue lors du chargement des clients',
      });
    }
  },

  fetchCustomerById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
     
      const customer = await getCustomerById(id);
    
      
      // Si la réponse est null (erreur d'authentification générée)
      if (customer === null) {
        set({
          isLoading: false,
          selectedCustomer: null,
          error: "Erreur d'authentification. Redirection vers la page de connexion..."
        });
        return null;
      }
      
      set({
        selectedCustomer: customer,
        isLoading: false,
      });
      return customer;
    } catch (error) {
      console.error('Erreur lors du chargement du client:', error);
      // Si c'est une 404, on recharge la liste des clients
      if (error instanceof Error && error.message.includes('404')) {
        get().fetchCustomers(); // Recharger la liste
      }
      set({
        isLoading: false,
        selectedCustomer: null,
        error: error instanceof Error ? error.message : 'Une erreur est survenue lors du chargement du client'
      });
      return null;
    }
  },

  setSelectedCustomer: (customer: Customer | null) => {
    set({ selectedCustomer: customer });
  },

  setShowConnectedOnly: (value: boolean) => {
    set((state) => ({
      filters: {
        ...state.filters,
        showConnectedOnly: value,
      },
      pagination: {
        ...state.pagination,
        currentPage: 1, // Réinitialiser la page lors du changement de filtre
      }
    }));
    get().fetchCustomers();
  },

  setSearch: (value: string) => {
    set((state) => ({
      filters: {
        ...state.filters,
        search: value,
      },
      pagination: {
        ...state.pagination,
        currentPage: 1,
      }
    }));
    // Debounce pour éviter trop d'appels API pendant la frappe
    const debounceTimer = setTimeout(() => {
      get().fetchCustomers();
    }, 500);
    return () => clearTimeout(debounceTimer);
  },

  setStatus: (value: 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | undefined) => {
    set((state) => ({
      filters: {
        ...state.filters,
        status: value,
      },
      pagination: {
        ...state.pagination,
        currentPage: 1,
      }
    }));
    get().fetchCustomers();
  },

  setCurrentPage: (page: number) => {
    console.log('[CustomerStore] Changement de page vers:', page);
    const currentState = get();

    // ✅ Validation : vérifier que la page demandée est valide
    if (page < 1 || page > currentState.pagination.totalPages) {
      console.warn(`Page ${page} invalide. Pages disponibles: 1-${currentState.pagination.totalPages}`);
      return;
    }

    // ✅ Ne pas refaire l'appel si on est déjà sur cette page
    if (page === currentState.pagination.currentPage) {
      return;
    }

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

    console.log('[CustomerStore] Chargement page avec params:', queryParams);
    getCustomers(queryParams).then(response => {
      if (response && response.data) {
        console.log('[CustomerStore] Page chargée avec succès');
        set({
          customers: response.data,
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
      console.error('[CustomerStore] Erreur lors du changement de page:', error);
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

  getCustomerById: (id: string) => {
    const customer = get().customers.find(c => c.id === id);
    if (!customer) return null;
    return customer;
  },
}));
