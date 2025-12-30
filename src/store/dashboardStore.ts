import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { MenuItem } from '@/types';
import { OrderTable } from '../../features/orders/types/ordersTable.types';

// --- TYPES ---

export type SectionKey =
  | 'orders' | 'menus' | 'marketing' | 'clients' | 'inventory'
  | 'program' | 'restaurants' | 'personnel' | 'ads' | 'promos'
  | 'loyalty' | 'apps' | 'messages-tickets';

export type ViewType = 'list' | 'create' | 'edit' | 'view';

export type TabKey = 'dashboard' | SectionKey;

export type PeriodFilter = 'today' | 'week' | 'month' | 'lastMonth' | 'year';

interface SectionState<T = any> {
  view: ViewType;
  selectedItem?: T;
  filters: Record<string, any>;
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

  // Sections
  orders: SectionState<OrderTable>;
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

  // Actions
  setActiveTab: (tab: TabKey) => void;
  setSelectedRestaurantId: (id: string | null) => void;
  setSelectedPeriod: (period: PeriodFilter) => void;
  setSectionView: (section: SectionKey, view: ViewType) => void;
  setSelectedItem: <T>(section: SectionKey, item: T) => void;
  setFilter: (section: SectionKey, key: string, value: any) => void;
  resetFilters: (section: SectionKey) => void;
  setPagination: (section: SectionKey, page: number, limit: number) => void;
  toggleModal: (section: SectionKey, modalName: string) => void;
  resetSection: (section: SectionKey) => void;
}

// --- HELPERS ---

const createInitialSectionState = <T>(): SectionState<T> => ({
  view: 'list',
  selectedItem: undefined,
  filters: {},
  pagination: { page: 1, limit: 10 },
  modals: {}
});

const SECTION_KEYS: SectionKey[] = [
  'orders', 'menus', 'marketing', 'clients', 'inventory',
  'program', 'restaurants', 'personnel', 'ads', 'promos',
  'loyalty', 'apps'
];

// --- STORE ---

export const useDashboardStore = create<DashboardState>()(
  persist(
    immer((set) => ({
      // État Initial
      activeTab: null,
      selectedRestaurantId: null,
      selectedPeriod: 'month',

      orders: createInitialSectionState<OrderTable>(),
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
        state[section] = createInitialSectionState() as any;
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