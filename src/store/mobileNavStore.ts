import { create } from "zustand";

/**
 * État de la navigation mobile (téléphones < md).
 * - `isMobileMenuOpen` : drawer du menu complet (ouvert depuis l'app-bar ou « Plus »)
 * - `isCaptureOpen`    : sheet de capture client Glovo/Yango (ouvert depuis la barre
 *   d'onglets OU le bouton in-page de la page Commandes → même flux partout)
 */
interface MobileNavState {
  isMobileMenuOpen: boolean;
  isCaptureOpen: boolean;
  openMobileMenu: () => void;
  closeMobileMenu: () => void;
  toggleMobileMenu: () => void;
  openCapture: () => void;
  closeCapture: () => void;
}

export const useMobileNavStore = create<MobileNavState>((set) => ({
  isMobileMenuOpen: false,
  isCaptureOpen: false,
  openMobileMenu: () => set({ isMobileMenuOpen: true }),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),
  toggleMobileMenu: () =>
    set((s) => ({ isMobileMenuOpen: !s.isMobileMenuOpen })),
  openCapture: () => set({ isCaptureOpen: true }),
  closeCapture: () => set({ isCaptureOpen: false }),
}));
