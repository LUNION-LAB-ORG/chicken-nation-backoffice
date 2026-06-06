"use client";

import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { useWelcomeModals } from "@/hooks/useWelcomeModals";
import { useNotificationBootstrap } from "../../../features/websocket/hooks/useNotificationBootstrap";
import { useUIStore } from "@/store/uiStore";
import WelcomeBackModal from "@/components/ui/WelcomeBackModal";
import PasswordChangeModal from "@/components/ui/PasswordChangeModal";
import EditProfileModal from "@/components/ui/EditProfileModal";
import Sidebar from "@/components/gestion/sidebar";
import Header from "@/components/gestion/header/Header";
import MobileAppBar from "@/components/gestion/mobile/MobileAppBar";
import MobileBottomNav from "@/components/gestion/mobile/MobileBottomNav";
import MobileMenuDrawer from "@/components/gestion/mobile/MobileMenuDrawer";
import { useMobileNavStore } from "@/store/mobileNavStore";
import { CaptureContactModal } from "../../../features/base-donnees/components/CaptureContactModal";

export default function GestionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Redirection sur la page d'authentification si pas authentifié et sauvegarder l'ID du restaurant
  useAuthRedirect();
  // Responsive
  useResponsiveLayout();
  // Gestion du modal de bienvenue
  useWelcomeModals();

  // Sounds
  useNotificationBootstrap(); // Sons gérés UNE SEULE FOIS ici

  // États UI depuis le store
  const {
    isSidebarOpen,
    isMobile,
    showPasswordChangeModal,
    showEditProfile,
    showWelcomeBackModal,
  } = useUIStore();
  const { isCaptureOpen, closeCapture } = useMobileNavStore();

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-screen bg-white shadow-lg z-40
          transition-all duration-300 ease-in-out
          ${isSidebarOpen ? "w-64" : "w-0"}
          ${isMobile ? "w-0" : ""}
        `}
      >
        <div
          className={`${isSidebarOpen ? "w-64" : "w-0"} overflow-hidden h-full`}
        >
          <Sidebar />
        </div>
      </aside>

      {/* Main content */}
      <div
        className={`
          flex-1 flex flex-col min-w-0
          transition-all duration-300 ease-in-out
          ${isSidebarOpen && !isMobile ? "ml-64" : ""}
        `}
      >
        {/* App-bar mobile (téléphones < md) */}
        <MobileAppBar />
        {/* Header web (desktop ≥ md) */}
        <Header
          className={`hidden md:block fixed z-30 bg-white ${
            isSidebarOpen && !isMobile ? "left-64" : "left-0"
          } right-0 top-0`}
        />
        {children}
      </div>

      {/* Chrome mobile (téléphones < md) */}
      <MobileBottomNav />
      <MobileMenuDrawer />

      {/* Capture client Glovo/Yango — accessible depuis la barre d'onglets ET la page Commandes */}
      <CaptureContactModal isOpen={isCaptureOpen} onClose={closeCapture} />

      {/* Modales */}
      <WelcomeBackModal isOpen={showWelcomeBackModal} />
      <PasswordChangeModal isOpen={showPasswordChangeModal} />
      <EditProfileModal isOpen={showEditProfile} />
    </div>
  );
}
