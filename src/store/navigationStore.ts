import { create } from 'zustand';

interface NavigationState {
  activeSubModule: string;
  initialConversationId: string | null;
  setActiveSubModule: (module: string) => void;
  setInitialConversationId: (id: string | null) => void;
  resetNavigation: () => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  activeSubModule: 'inbox',
  initialConversationId: null,
  setActiveSubModule: (module) => set({ activeSubModule: module }),
  setInitialConversationId: (id) => set({ initialConversationId: id }),
  resetNavigation: () => set({ activeSubModule: 'inbox', initialConversationId: null }),
}));
