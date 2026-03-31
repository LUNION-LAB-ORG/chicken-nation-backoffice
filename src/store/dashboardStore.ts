import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { MenuItem } from '@/types';
import { OrderTable } from '../../features/orders/types/ordersTable.types';

// --- TYPES ---
export type TabKey =
  'dashboard' | 'orders' | 'menus' | 'marketing' | 'clients' | 'inventory'
  | 'restaurants' | 'personnel' | 'promos' | 'loyalty' | 'voucher'
  | 'inbox' | 'card_requests' | 'card_nation' | 'reviews'
  // Statistiques détaillées
  | 'stats_products' | 'stats_orders' | 'stats_clients'
  | 'stats_delivery' | 'stats_marketing' | 'stats_retention_callbacks'
  // Intégrations
  | 'hubrise'
  // Paramètres
  | 'settings';

export type ViewType = 'list' | 'create' | 'edit' | 'view';

export type PeriodFilter = 'today' | 'week' | 'month' | 'lastMonth' | 'year';

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

export interface DashboardState {
  // Navigation & Global Context
  activeTab: TabKey | null;
  selectedRestaurantId: string | null;
  selectedPeriod: PeriodFilter;

  // Sections existantes
  dashboard: SectionState;
  marketing: SectionState;
  inbox: SectionState;
  orders: SectionState<OrderTable>;
  menus: SectionState<MenuItem>;
  clients: SectionState<string>;
  inventory: SectionState;
  restaurants: SectionState;
  personnel: SectionState;
  promos: SectionState;
  loyalty: SectionState;
  voucher: SectionState;
  card_requests: SectionState;
  card_nation: SectionState;
  reviews: SectionState;
  // Sections Statistiques détaillées
  stats_products: SectionState;
  stats_orders: SectionState;
  stats_clients: SectionState;
  stats_delivery: SectionState;
  stats_marketing: SectionState;
  // Intégrations
  hubrise: SectionState;

  // Actions
  setActiveTab: (tab: TabKey) => void;
  setSelectedRestaurantId: (id: string | null) => void;
  setSelectedPeriod: (period: PeriodFilter) => void;
  setSectionView: (section: TabKey, view: ViewType) => void;
  setSelectedItem: <T>(section: TabKey, item: T) => void;
  setFilter: (section: TabKey, key: string, value: unknown) => void;
  resetFilters: (section: TabKey) => void;
  setPagination: (section: TabKey, page: number, limit: number) => void;
  toggleModal: (section: TabKey, modalName: string) => void;
  resetSection: (section: TabKey) => void;
}

// --- HELPERS ---

const createInitialSectionState = <T>(): SectionState<T> => ({
  view: 'list',
  selectedItem: undefined,
  filters: {},
  pagination: { page: 1, limit: 10 },
  modals: {}
});

const SECTION_KEYS: TabKey[] = [
  'dashboard', 'orders', 'menus', 'marketing', 'clients', 'inventory',
  'restaurants', 'personnel', 'promos', 'loyalty', 'voucher', 'inbox',
  'card_requests', 'card_nation', 'reviews',
  // Statistiques
  'stats_products', 'stats_orders', 'stats_clients', 'stats_delivery', 'stats_marketing',
  // Intégrations
  'hubrise',
];

// --- STORE ---
export const useDashboardStore = create<DashboardState>()(
  persist(
    immer((set) => ({
      // État Initial
      activeTab: null,
      selectedRestaurantId: null,
      selectedPeriod: 'month',

      dashboard: createInitialSectionState(),
      marketing: createInitialSectionState(),
      inbox: createInitialSectionState(),
      orders: createInitialSectionState<OrderTable>(),
      menus: createInitialSectionState<MenuItem>(),
      clients: createInitialSectionState(),
      inventory: createInitialSectionState(),
      restaurants: createInitialSectionState(),
      personnel: createInitialSectionState(),
      promos: createInitialSectionState(),
      loyalty: createInitialSectionState(),
      voucher: createInitialSectionState(),
      card_requests: createInitialSectionState(),
      card_nation: createInitialSectionState(),
      reviews: createInitialSectionState(),
      // Statistiques
      stats_products: createInitialSectionState(),
      stats_orders: createInitialSectionState(),
      stats_clients: createInitialSectionState(),
      stats_delivery: createInitialSectionState(),
      stats_marketing: createInitialSectionState(),
      // Intégrations
      hubrise: createInitialSectionState(),

      // Actions Globales
      setActiveTab: (tab) => set((state) => {
        state.activeTab = tab
      }),
      setSelectedRestaurantId: (id) => set((state) => { state.selectedRestaurantId = id }),
      setSelectedPeriod: (period) => set((state) => { state.selectedPeriod = period }),

      // Actions de Sections (Optimisées avec Immer)
      setSectionView: (section, view) => set((state) => {
        state[section].view = view;
      }),

      setSelectedItem: (section, item) => set((state) => {
        state[section].selectedItem = item;
      }),

      setFilter: (section, key, value) => set((state) => {
        state[section].filters[key] = value;
      }),

      resetFilters: (section) => set((state) => {
        state[section].filters = {};
      }),

      setPagination: (section, page, limit) => set((state) => {
        state[section].pagination = { page, limit };
      }),

      toggleModal: (section, modalName) =>
        set((state) => {
          const sectionState = state[section];

          sectionState.modals ??= {};
          sectionState.modals[modalName] =
            !sectionState.modals[modalName];
        }),

      resetSection: (section) => set((state) => {
        state[section] = createInitialSectionState();
      }),
    })),
    {
      name: 'dashboard-storage',
      storage: createJSONStorage(() => localStorage),
      // Nettoyage dynamique pour la persistance
      partialize: (state) => {
        const persistedSections = {};

        SECTION_KEYS.forEach((key) => {
          if (state[key]) {
            // On extrait 'modals' pour ne PAS les sauvegarder
            const { modals, ...rest } = state[key];
            persistedSections[key] = rest;
          }
        });

        return {
          activeTab: state.activeTab,
          selectedRestaurantId: state.selectedRestaurantId,
          selectedPeriod: state.selectedPeriod,
          ...persistedSections,
        };
      },
    }
  )
);