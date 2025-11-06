"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Sidebar from "@/components/gestion/Sidebar";
import Header from "@/components/gestion/Header";
import { useAuthStore } from "@/store/authStore";
import { useDashboardStore } from "@/store/dashboardStore";
import type { TabKey } from "@/store/dashboardStore";

import EditMember from "@/components/gestion/Personnel/EditMember";
import { User as ServiceUser } from "@/services/userService";
import { User } from "@/types/auth";
import Image from "next/image";
import { usePendingOrdersSound } from "@/hooks/usePendingOrdersSound";
import { useMessagesSound } from "@/hooks/useMessagesSound";

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F17922]"></div>
  </div>
);

// ✅ PERFORMANCE: Lazy loading des composants lourds
const Dashboard = dynamic(() => import("@/components/gestion/Dashboard"), {
  loading: () => (
    <LoadingSpinner/>
  ),
});

const Menus = dynamic(() => import("@/components/gestion/Menus"), {
  loading: () => (
    <LoadingSpinner/>
  ),
});

const Orders = dynamic(() => import("@/components/gestion/Orders"), {
  loading: () => (
    <LoadingSpinner/>
  ),
});

const Clients = dynamic(() => import("@/components/gestion/Clients"), {
  loading: () => (
    <LoadingSpinner/>
  ),
});

const Inventory = dynamic(() => import("@/components/gestion/Inventory"), {
  loading: () => (
    <LoadingSpinner/>
  ),
});

const Personnel = dynamic(() => import("@/components/gestion/Personnel"), {
  loading: () => (
    <LoadingSpinner/>
  ),
});

const Restaurants = dynamic(() => import("@/components/gestion/Restaurants"), {
  loading: () => (
    <LoadingSpinner/>
  ),
});

const Ads = dynamic(() => import("@/components/gestion/Ads"), {
  loading: () => (
    <LoadingSpinner/>
  ),
});

const Promos = dynamic(() => import("@/components/gestion/Promos"), {
  loading: () => (
    <LoadingSpinner/>
  ),
});

const Loyalty = dynamic(() => import("@/components/gestion/Loyalty"), {
  loading: () => (
    <LoadingSpinner/>
  ),
});

const Apps = dynamic(() => import("@/components/gestion/Apps"), {
  loading: () => (
    <LoadingSpinner/>
  ),
});
 
const RapportModule = dynamic(() => import("@/components/gestion/MessagesEtTickets/Rapport"), {
  loading: () => (
    <LoadingSpinner/>
  ),
});

const InboxModule = dynamic(() => import("@/components/gestion/MessagesEtTickets/Inbox"), {
  loading: () => (
    <LoadingSpinner/>
  ),
});

const TicketsModule = dynamic(() => import("@/components/gestion/MessagesEtTickets/Tickets"), {
  loading: () => (
    <LoadingSpinner/>
  ),
});

const MarketingModule = dynamic(() => import("@/components/gestion/Marketing"), {
  loading: () => (
    <LoadingSpinner/>
  ),
});

export default function GestionPage() {
  const router = useRouter();
  const { isAuthenticated, user, setUser } = useAuthStore();
  const { activeTab, setActiveTab } = useDashboardStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showWelcomeBackModal, setShowWelcomeBackModal] = useState(false);
  
  // États pour gérer les sous-modules de Messages et Tickets
  const [activeSubModule, setActiveSubModule] = useState<string>("inbox");
  // Conversation initiale à sélectionner lorsque l'on ouvre l'inbox depuis le header
  const [initialConversationId, setInitialConversationId] = useState<string | null>(null);

  useEffect(() => {
    const handleOpenInboxFromHeader = (e: any) => {
      const conversationId = e?.detail?.conversationId || null;
      setActiveTab('messages-tickets');
      setActiveSubModule('inbox');
      setInitialConversationId(conversationId);
      // Ensure sidebar is visible on desktop
      setIsSidebarOpen(true);
    };

    window.addEventListener('openInboxFromHeader', handleOpenInboxFromHeader as EventListener);
    return () => window.removeEventListener('openInboxFromHeader', handleOpenInboxFromHeader as EventListener);
  }, [setActiveTab]);

  // S'assurer que quand on navigue vers Messages et Tickets, le sous-module par défaut soit "inbox"
  useEffect(() => {
    if (activeTab === 'messages-tickets' && !activeSubModule) {
      setActiveSubModule('inbox');
    }
  }, [activeTab, activeSubModule]);

  // Vérification d'authentification simplifiée
  useEffect(() => {
    // Si l'utilisateur n'est pas authentifié, rediriger vers la page de connexion
    if (!isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, router]);

  const { hasPendingOrders: _hasPendingOrders, isPlaying: _isPlaying, pendingOrdersCount: _pendingOrdersCount } =
    usePendingOrdersSound({
      activeFilter: "all",
      selectedRestaurant:
        user?.role !== "ADMIN" ? user?.restaurant_id : undefined,
      disabledSound: false,
    });

  // Hook pour les notifications sonores des messages
  const { hasUnreadMessages: _hasUnreadMessages, unreadMessagesCount: _unreadMessagesCount } =
    useMessagesSound({
      disabledSound: false,
    });

  // Vérification pour le changement de mot de passe et modal de bienvenue
  useEffect(() => {
    if (isAuthenticated && user && user.password_is_updated === false) {
      setShowPasswordChangeModal(true);
      setShowWelcomeBackModal(false);
    } else if (isAuthenticated && user && user.password_is_updated === true) {
      // Afficher la modal "Heureux de vous revoir" pour les utilisateurs existants
      setShowWelcomeBackModal(true);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 1080;
      setIsMobile(mobile);
      if (!mobile) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    // Initial check
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "menus":
        return <Menus />;
      case "orders":
        return <Orders />;
      case "clients":
        return <Clients setActiveTab={setActiveTab} />;
      case "inventory":
        return <Inventory />;
      case "restaurants":
        return <Restaurants />;
      case "personnel":
        return <Personnel />;
      case "marketing":
        return <MarketingModule />;
      case "messages-tickets":
        // Rendu conditionnel basé sur le sous-module actif
        switch (activeSubModule) {
          case "rapport":
            return <RapportModule />;
          case "inbox":
            return <InboxModule initialConversationId={initialConversationId} />;
          case "tickets":
            return <TicketsModule />;
          default:
            return <InboxModule initialConversationId={initialConversationId} />; // Par défaut, afficher Inbox
        }
      case "ads":
        return <Ads />;
      case "promos":
        return <Promos />;
      case "loyalty":
        return <Loyalty />;
      case "apps":
        return <Apps />;
      default:
        return <Dashboard />;
    }
  };

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
          <Sidebar
            activeTab={activeTab}
            isMobile={isMobile}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            setActiveTab={(tab: string) => setActiveTab(tab as TabKey)}
            activeSubModule={activeSubModule}
            setActiveSubModule={setActiveSubModule}
          />
        </div>
      </aside>

      {/* Main content wrapper */}
      <div
        className={`
        flex-1 flex flex-col min-w-0
        transition-all duration-300 ease-in-out
        ${isSidebarOpen && !isMobile ? "ml-64" : ""}
        ${isSidebarOpen && isMobile ? "opacity-50" : "opacity-100"}
      `}
      >
        {/* Fixed Header */}
        <Header
          toggleSidebar={toggleSidebar}
          isSidebarOpen={isSidebarOpen}
          className={`fixed z-30 bg-white ${
            isSidebarOpen && !isMobile ? "left-64" : "left-0"
          } right-0 top-0`}
        />

        {/* Modal "Heureux de vous revoir" pour les utilisateurs existants */}
        {showWelcomeBackModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-8 mx-4 max-w-md w-full transform animate-in fade-in zoom-in duration-300">
              <div className="text-center">
                {/* Icône de bienvenue */}
                <div className="mx-auto w-16  h-16 bg-gradient-to-br from-[#F17922] to-orange-500 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                
                {/* Titre et message */}
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Heureux de vous revoir !
                </h2>
                <p className="text-gray-600 mb-6">
                  Bon retour sur Chicken Nation. Bon service !
                </p>
                
                {/* Bouton OK */}
                <button
                  onClick={() => setShowWelcomeBackModal(false)}
                  className="w-full bg-gradient-to-r from-[#F17922] to-orange-500 cursor-pointer text-white font-semibold py-3 px-6 rounded-lg hover:from-orange-500 hover:to-[#F17922] transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                 Merci !
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable content */}
        <main className={`flex-1 pt-14 ${
          activeTab === "messages-tickets" ? "overflow-hidden" : "overflow-y-auto"
        }`}>
          {activeTab === "messages-tickets" ? (
            <div className="h-full">{renderContent()}</div>
          ) : (
            <div className="container mx-auto px-4">{renderContent()}</div>
          )}
        </main>
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
          onClick={toggleSidebar}
        />
      )}

      {/* Modal pour le changement de mot de passe */}
      {showPasswordChangeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full transform transition-all duration-300 ease-out scale-100 overflow-hidden">
            {/* Header avec gradient */}
            <div className="bg-gradient-to-r from-[#F17922] to-orange-500 px-8 py-6">
              <div className="flex flex-col items-center text-center">
                <div className="bg-white rounded-full p-4 mb-4 shadow-lg">
                  <Image
                    src="/images/mascot.png"
                    alt="Mascotte Chicken Nation"
                    width={80}
                    height={80}
                    className="object-contain"
                  />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Bienvenue chez Chicken Nation !
                </h2>
                <div className="w-16 h-1 bg-white/30 rounded-full"></div>
              </div>
            </div>

            {/* Contenu */}
            <div className="px-8 py-6">
              <div className="text-center mb-8">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-center mb-2">
                    <svg
                      className="w-6 h-6 text-amber-600 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-amber-800 font-semibold">
                      Sécurité requise
                    </span>
                  </div>
                  <p className="text-amber-700 text-sm">
                    Pour des raisons de sécurité, nous vous demandons de changer
                    le mot de passe qui vous a été communiqué.
                  </p>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-center mb-2">
                    <svg
                      className="w-5 h-5 text-orange-600 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-orange-800 font-medium text-sm">
                      Conseil de sécurité
                    </span>
                  </div>
                  <p className="text-orange-700 text-sm">
                    Choisissez un mot de passe fort avec au moins 8 caractères,
                    incluant des lettres, chiffres et symboles.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setShowPasswordChangeModal(false);
                    setShowEditProfile(true);
                  }}
                  className="w-full bg-gradient-to-r cursor-pointer from-[#F17922] to-orange-500 hover:from-[#F17922 hover:to-orange-600 text-white font-semibold py-4 px-6 rounded-xl shadow-lg transition-all duration-200 ease-in-out focus:outline-none focus:ring-4 focus:ring-orange-400/50 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Modifier mon mot de passe
                </button>

                <div className="text-center">
                  <p className="text-xs text-gray-500">
                    Cette étape est obligatoire
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal EditMember pour la modification du profil */}
      {showEditProfile && user && (
        <EditMember
          existingMember={user as ServiceUser}
          onCancel={() => setShowEditProfile(false)}
          onSuccess={(updatedUser: ServiceUser) => {
            // Mettre à jour l'utilisateur dans le store
            setUser(updatedUser as User);
            setShowEditProfile(false);
          }}
        />
      )}
    </div>
  );
}
