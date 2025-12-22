import { create } from 'zustand';

interface UIState {
    isSidebarOpen: boolean;
    isMobile: boolean;
    showPasswordChangeModal: boolean;
    showEditProfile: boolean;
    showWelcomeBackModal: boolean;
    setIsSidebarOpen: (open: boolean) => void;
    setIsMobile: (mobile: boolean) => void;
    setShowPasswordChangeModal: (show: boolean) => void;
    setShowEditProfile: (show: boolean) => void;
    setShowWelcomeBackModal: (show: boolean) => void;
    toggleSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
    isSidebarOpen: true,
    isMobile: false,
    showPasswordChangeModal: false,
    showEditProfile: false,
    showWelcomeBackModal: false,
    setIsSidebarOpen: (open) => set({ isSidebarOpen: open }),
    setIsMobile: (mobile) => set({ isMobile: mobile }),
    setShowPasswordChangeModal: (show) => set({ showPasswordChangeModal: show }),
    setShowEditProfile: (show) => set({ showEditProfile: show }),
    setShowWelcomeBackModal: (show) => set({ showWelcomeBackModal: show }),
    toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}));