"use client";

import Header from "@/components/gestion/header/Header";
import Sidebar from "@/components/gestion/sidebar";
import EditProfileModal from "@/components/ui/EditProfileModal";
import PasswordChangeModal from "@/components/ui/PasswordChangeModal";
import WelcomeBackModal from "@/components/ui/WelcomeBackModal";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { useWelcomeModals } from "@/hooks/useWelcomeModals";
import { useUIStore } from "@/store/uiStore";

import { NetworkToastTrigger } from "../../../common-component/NetworkToastTrigger";
import { useNotificationBootstrap } from "../../../features/websocket/hooks/useNotificationBootstrap";

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


  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
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
          ${isSidebarOpen && isMobile ? "opacity-50" : "opacity-100"}
        `}
      >
        <Header
          className={`fixed z-30 bg-white ${
            isSidebarOpen && !isMobile ? "left-64" : "left-0"
          } right-0 top-0`}
        />
     <NetworkToastTrigger />
        {children}
      </div>

      {/* Modales */}
      <WelcomeBackModal isOpen={showWelcomeBackModal} />
      <PasswordChangeModal isOpen={showPasswordChangeModal} />
      <EditProfileModal isOpen={showEditProfile} />
    </div>
  );
}
