import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MenuItem } from '@/types';
import { Order } from '../../features/orders/types/ordersTable.types';

type SectionKey = 'orders' | 'menus' | 'marketing' | 'clients' | 'inventory' | 'program' | 'restaurants' | 'personnel' | 'ads' | 'promos' | 'loyalty' | 'apps' | 'messages-tickets';
type ViewType = 'list' | 'create' | 'edit' | 'view';
export type TabKey = 'dashboard' | SectionKey;

interface SectionState<T = unknown> {
  view: ViewType;
  selectedItem?: T;
  filters: Record<string, unknown>;
  pagination: {
    page: number;
    limit: number;
  };
  modals: Record<string, boolean>;
}

export type PeriodFilter = 'today' | 'week' | 'month' | 'lastMonth' | 'year';

interface DashboardState {
  // Navigation
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;

  // Restaurant context pour les vues spécialisées
  selectedRestaurantId: string | null;
  setSelectedRestaurantId: (restaurantId: string | null) => void;

  // Filtre de période pour les statistiques
  selectedPeriod: PeriodFilter;
  setSelectedPeriod: (period: PeriodFilter) => void;

  // État des sections
  orders: SectionState<Order>;
  menus: SectionState<MenuItem>;
  clients: SectionState;
  inventory: SectionState;
  program: SectionState;
  restaurants: SectionState;
  personnel: SectionState;
  ads: SectionState;
  promos: SectionState;
  loyalty: SectionState;
  apps: SectionState;

  // Actions génériques pour chaque section
  setSectionView: (section: SectionKey, view: ViewType) => void;
  setSelectedItem: <T>(section: SectionKey, item: T) => void;
  setFilter: (section: SectionKey, key: string, value: unknown) => void;
  resetFilters: (section: SectionKey) => void;
  setPagination: (section: SectionKey, page: number, limit: number) => void;
  toggleModal: (section: SectionKey, modalName: string) => void;
  resetSection: (section: SectionKey) => void;
}

const createInitialSectionState = <T>(): SectionState<T> => ({
  view: 'list',
  selectedItem: undefined,
  filters: {},
  pagination: {
    page: 1,
    limit: 10
  },
  modals: {}
});

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      // Navigation
      activeTab: 'dashboard',
      setActiveTab: (tab) => set({ activeTab: tab }),

      // Restaurant context
      selectedRestaurantId: null,
      setSelectedRestaurantId: (restaurantId) => set({ selectedRestaurantId: restaurantId }),

      // Filtre de période
      selectedPeriod: 'month' as PeriodFilter,
      setSelectedPeriod: (period) => set({ selectedPeriod: period }),

      // État initial des sections
      orders: createInitialSectionState<Order>(),
      menus: createInitialSectionState<MenuItem>(),
      clients: createInitialSectionState(),
      inventory: createInitialSectionState(),
      program: createInitialSectionState(),
      restaurants: createInitialSectionState(),
      personnel: createInitialSectionState(),
      ads: createInitialSectionState(),
      promos: createInitialSectionState(),
      loyalty: createInitialSectionState(),
      apps: createInitialSectionState(),

      // Actions génériques
      setSectionView: (section, view) => set((state) => ({
        [section]: { ...state[section], view }
      })),

      setSelectedItem: (section, item) => set((state) => ({
        [section]: { ...state[section], selectedItem: item }
      })),

      setFilter: (section, key, value) => set((state) => ({
        [section]: {
          ...state[section],
          filters: { ...state[section].filters, [key]: value }
        }
      })),

      resetFilters: (section) => set((state) => ({
        [section]: { ...state[section], filters: {} }
      })),

      setPagination: (section, page, limit) => set((state) => ({
        [section]: {
          ...state[section],
          pagination: { page, limit }
        }
      })),

      toggleModal: (section, modalName) => set((state) => ({
        [section]: {
          ...state[section],
          modals: {
            ...state[section].modals,
            [modalName]: !state[section].modals[modalName]
          }
        }
      })),

      resetSection: (section) => set(() => ({
        [section]: createInitialSectionState()
      }))
    }),
    {
      name: 'dashboard-storage',

      partialize: (state) => ({
        activeTab: state.activeTab,
        selectedRestaurantId: state.selectedRestaurantId,
        selectedPeriod: state.selectedPeriod,
        orders: {
          view: state.orders.view,
          selectedItem: state.orders.selectedItem,
          filters: state.orders.filters,
          pagination: state.orders.pagination
        },
        menus: {
          view: state.menus.view,
          selectedItem: state.menus.selectedItem,
          filters: state.menus.filters,
          pagination: state.menus.pagination
        },
        clients: {
          view: state.clients.view,
          selectedItem: state.clients.selectedItem,
          filters: state.clients.filters,
          pagination: state.clients.pagination
        },
        inventory: {
          view: state.inventory.view,
          selectedItem: state.inventory.selectedItem,
          filters: state.inventory.filters,
          pagination: state.inventory.pagination
        },
        program: {
          view: state.program.view,
          selectedItem: state.program.selectedItem,
          filters: state.program.filters,
          pagination: state.program.pagination
        },
        restaurants: {
          view: state.restaurants.view,
          selectedItem: state.restaurants.selectedItem,
          filters: state.restaurants.filters,
          pagination: state.restaurants.pagination
        },
        personnel: {
          view: state.personnel.view,
          selectedItem: state.personnel.selectedItem,
          filters: state.personnel.filters,
          pagination: state.personnel.pagination
        },
        ads: {
          view: state.ads.view,
          selectedItem: state.ads.selectedItem,
          filters: state.ads.filters,
          pagination: state.ads.pagination
        },
        promos: {
          view: state.promos.view,
          selectedItem: state.promos.selectedItem,
          filters: state.promos.filters,
          pagination: state.promos.pagination
        },
        loyalty: {
          view: state.loyalty.view,
          selectedItem: state.loyalty.selectedItem,
          filters: state.loyalty.filters,
          pagination: state.loyalty.pagination
        },
        apps: {
          view: state.apps.view,
          selectedItem: state.apps.selectedItem,
          filters: state.apps.filters,
          pagination: state.apps.pagination
        }
      })
    }
  )
);