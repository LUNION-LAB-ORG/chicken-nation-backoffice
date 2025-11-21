"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useRBAC } from "@/hooks/useRBAC";
import { LogOut, ChevronDown, ChevronRight } from "lucide-react";

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}

interface SidebarIconProps {
  defaultIcon: string;
  whiteIcon: string;
  alt: string;
  active: boolean;
}

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMobile: boolean;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  // Nouveaux props pour gérer les sous-modules de Messages et tickets
  activeSubModule?: string;
  setActiveSubModule?: (subModule: string) => void;
}

const SidebarIcon: React.FC<SidebarIconProps> = ({
  defaultIcon,
  whiteIcon,
  alt,
  active,
}) => {
  return (
    <div className="relative w-5 h-5">
      <Image
        src={active ? whiteIcon : defaultIcon}
        alt={alt}
        width={20}
        height={20}
        className="absolute inset-0"
      />
    </div>
  );
};

const SidebarItem: React.FC<SidebarItemProps> = ({
  icon,
  label,
  active = false,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center cursor-pointer space-x-3 px-4 py-[10px] rounded-[14px]
        ${
          active
            ? "bg-gradient-to-r from-[#F17922] to-[#FA6345]"
            : "text-gray-600 hover:bg-gray-100"
        }
        transition-all duration-200
      `}
    >
      {icon}
      <span
        className={`text-sm  font-normal cursor-pointer ${
          active ? "text-white" : "text-gray-600"
        }`}
      >
        {label}
      </span>
    </button>
  );
};

export default function Sidebar({
  activeTab,
  setActiveTab,
  isMobile,
  isSidebarOpen,
  setIsSidebarOpen,
  activeSubModule,
  setActiveSubModule,
}: SidebarProps) {
  const router = useRouter();
  const { logout, user } = useAuthStore();
  const {
    canViewPlat,
    canViewCommande,
    canViewClient,
    canViewUtilisateur,
    canViewRestaurant,
    canViewOffreSpeciale,
  } = useRBAC();
  const [isClient, setIsClient] = useState(false);

  // États pour gérer l'expansion de la section Messages et tickets
  const [isMessagesExpanded, setIsMessagesExpanded] = useState(false);

  // Éviter l'erreur d'hydration en s'assurant que le composant est rendu côté client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Écouter l'événement du header pour activer automatiquement le sous-module "Inbox"
  useEffect(() => {
    const handleOpenInboxFromHeader = () => {
      setActiveTab("messages-tickets");
      setIsMessagesExpanded(true);
      if (setActiveSubModule) {
        setActiveSubModule("inbox");
      }
    };

    window.addEventListener("openInboxFromHeader", handleOpenInboxFromHeader);
    return () => {
      window.removeEventListener(
        "openInboxFromHeader",
        handleOpenInboxFromHeader
      );
    };
  }, [setActiveTab, setActiveSubModule]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };

  // Sous-modules pour Messages et tickets
  const messageSubModules = [
    // {
    //   id: "rapport",
    //   label: "Rapport",
    //   defaultIcon: "/icons/sidebar/rapport-dark.png",
    //   whiteIcon: "/icons/sidebar/rapport.png",
    // },
    {
      id: "inbox",
      label: "Inbox",
      defaultIcon: "/icons/sidebar/message.png",
      whiteIcon: "/icons/sidebar/inbox.png",
    },
    // {
    //   id: "tickets",
    //   label: "Tickets",
    //   defaultIcon: "/icons/sidebar/ticket-dark.png",
    //   whiteIcon: "/icons/sidebar/ticket.png",
    // },
  ];

  // Définir les éléments de navigation en fonction des permissions RBAC
  const navigationItems = [
    {
      id: "dashboard",
      label: "Tableau de bord",
      defaultIcon: "/icons/sidebar/home.png",
      whiteIcon: "/icons/sidebar/home-white.png",
      canAccess: () =>
        user?.role === "ADMIN" ||
        user?.role === "MANAGER" ||
        user?.role === "MARKETING", // Dashboard spécial
    },
    {
      id: "menus",
      label: "Menus",
      defaultIcon: "/icons/sidebar/menu.png",
      whiteIcon: "/icons/sidebar/menu-white.png",
      canAccess: canViewPlat,
    },
    {
      id: "orders",
      label: "Commandes",
      defaultIcon: "/icons/sidebar/commande.png",
      whiteIcon: "/icons/sidebar/commande-white.png",
      canAccess: canViewCommande,
    },
    {
      id: "clients",
      label: "Clients",
      defaultIcon: "/icons/sidebar/client.png",
      whiteIcon: "/icons/sidebar/client-white.png",
      canAccess: canViewClient,
    },
    // Nouvelle section Messages et tickets
    {
      id: "messages-tickets",
      label: "Messages et tickets",
      defaultIcon: "/icons/sidebar/message.png",
      whiteIcon: "/icons/sidebar/messages-white.png",
      canAccess: () => true,
      hasSubModules: true,
    },
    {
      id: "inventory",
      label: "Inventaires",
      defaultIcon: "/icons/sidebar/inventaire.png",
      whiteIcon: "/icons/sidebar/inventaire-white.png",
      canAccess: () => canViewPlat(), // Inventaire lié aux plats/catégories
    },
    {
      id: "restaurants",
      label: "Restaurants",
      defaultIcon: "/icons/sidebar/restaurants.png",
      whiteIcon: "/icons/sidebar/restaurants-white.png",
      canAccess: canViewRestaurant,
    },
    {
      id: "personnel",
      label: "Personnel",
      defaultIcon: "/icons/sidebar/client.png",
      whiteIcon: "/icons/sidebar/client-white.png",
      canAccess: canViewUtilisateur,
    },
    // {
    //   id: 'ads',
    //   label: 'Publicités',
    //   defaultIcon: '/icons/sidebar/publicites.png',
    //   whiteIcon: '/icons/sidebar/publicites-white.png',
    //   showForRoles: ['ADMIN']
    // },
    {
      id: "promos",
      label: "Promotions",
      defaultIcon: "/icons/sidebar/promotions.png",
      whiteIcon: "/icons/sidebar/promotions-white.png",
      canAccess: canViewOffreSpeciale,
    },
    {
      id: "loyalty",
      label: "Fidélisation",
      defaultIcon: "/icons/sidebar/fidelisation.png",
      whiteIcon: "/icons/sidebar/fidelisation-white.png",
      canAccess: () => false, // Désactivé pour l'instant
    },
    {
      id: "marketing",
      label: "Marketing",
      defaultIcon: "/icons/marketing.png",
      whiteIcon: "/icons/marketing.png",
      canAccess: () =>
        user?.role === "ADMIN" ||
        user?.role === "MANAGER" ||
        user?.role === "MARKETING",
    },
    // {
    //   id: 'apps',
    //   label: 'Apps et Widgets',
    //   defaultIcon: '/icons/sidebar/widget.png',
    //   whiteIcon: '/icons/sidebar/widget-white.png',
    //   showForRoles: ['ADMIN']
    // }
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <aside className="w-64 bg-white shadow-lg h-screen flex flex-col transition-transform duration-300 ease-in-out">
        {/* Logo */}
        <div className="p-4">
          <div className="flex space-x-2 items-start justify-start">
            <Image
              src="/icons/sidebar/logo-orange.png"
              alt="Chicken Nation"
              width={200}
              height={100}
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-2 px-2 flex-1 overflow-y-auto">
          <div className="space-y-1">
            {!isClient ? (
              // Pendant l'hydration, afficher un contenu statique
              <div className="space-y-1">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
                  <div
                    key={index}
                    className="w-full flex items-center space-x-3 px-4 py-[10px] rounded-[14px] opacity-0"
                  >
                    <div className="relative w-5 h-5 bg-gray-200 rounded"></div>
                    <span className="text-sm bg-gray-200 rounded h-4 w-20"></span>
                  </div>
                ))}
              </div>
            ) : (
              // Après l'hydration, afficher le contenu réel
              navigationItems.map((item) => {
                if (!item.canAccess()) {
                  return null;
                }

                // Gestion spéciale pour la section "Messages et tickets"
                if (item.hasSubModules && item.id === "messages-tickets") {
                  return (
                    <div key={item.id}>
                      {/* Element principal Messages et tickets */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();

                          const willExpand = !isMessagesExpanded;
                          setActiveTab(item.id);
                          setIsMessagesExpanded(willExpand);
                          if (willExpand && setActiveSubModule) {
                            setActiveSubModule("inbox");
                          }
                        }}
                        className={`
                          w-full flex items-center cursor-pointer space-x-3 px-4 py-[10px] rounded-[14px]
                          ${
                            activeTab === item.id
                              ? "bg-gradient-to-r from-[#F17922] to-[#FA6345]"
                              : "text-gray-600 hover:bg-gray-100"
                          }
                          transition-all duration-200
                        `}
                      >
                        <SidebarIcon
                          defaultIcon={item.defaultIcon}
                          whiteIcon={item.whiteIcon}
                          alt={item.label}
                          active={activeTab === item.id}
                        />
                        <span
                          className={`text-sm  -ml-6 font-normal cursor-pointer flex-1 ${
                            activeTab === item.id
                              ? "text-white"
                              : "text-gray-600"
                          }`}
                        >
                          {item.label}
                        </span>
                        {/* Icône d'expansion */}
                        {isMessagesExpanded ? (
                          <ChevronDown
                            size={16}
                            className={`transition-transform ${
                              activeTab === item.id
                                ? "text-white"
                                : "text-gray-400"
                            }`}
                          />
                        ) : (
                          <ChevronRight
                            size={16}
                            className={`transition-transform ${
                              activeTab === item.id
                                ? "text-white"
                                : "text-gray-400"
                            }`}
                          />
                        )}
                      </button>

                      {/* Sous-modules */}
                      {isMessagesExpanded && (
                        <div className="ml-6 mt-1 space-y-1">
                          {messageSubModules.map((subModule) => (
                            <button
                              key={subModule.id}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();

                                // Seulement fermer la sidebar si on navigue vers un sous-module différent
                                if (
                                  activeSubModule !== subModule.id &&
                                  isMobile
                                ) {
                                  setIsSidebarOpen(false);
                                }

                                setActiveTab("messages-tickets");
                                if (setActiveSubModule) {
                                  setActiveSubModule(subModule.id);
                                }
                              }}
                              className={`
                                w-full flex items-center cursor-pointer space-x-3 px-4 py-2 rounded-[10px]
                                ${
                                  activeSubModule === subModule.id
                                    ? "text-primary-500"
                                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                                }
                                transition-all duration-200
                              `}
                            >
                              <SidebarIcon
                                defaultIcon={subModule.defaultIcon}
                                whiteIcon={subModule.whiteIcon}
                                alt={subModule.label}
                                active={activeSubModule === subModule.id}
                              />
                              <span
                                className={`text-sm  ${
                                  activeSubModule === subModule.id
                                    ? "text-primary-500 font-medium"
                                    : ""
                                }`}
                              >
                                {subModule.label}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                // Éléments de navigation normaux
                return (
                  <SidebarItem
                    key={item.id}
                    icon={
                      <SidebarIcon
                        defaultIcon={item.defaultIcon}
                        whiteIcon={item.whiteIcon}
                        alt={item.label}
                        active={activeTab === item.id}
                      />
                    }
                    label={item.label}
                    active={activeTab === item.id}
                    onClick={() => {
                      if (isMobile || !isSidebarOpen) {
                        setIsSidebarOpen(false);
                      }
                      setActiveTab(item.id);
                    }}
                  />
                );
              })
            )}
          </div>
        </nav>

        {/* Bouton de déconnexion */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className={`
              w-full flex items-center cursor-pointer space-x-3 px-4 py-[10px] rounded-[14px]
              text-gray-600 hover:bg-gray-100
              transition-all duration-200
            `}
          >
            <div className="relative w-5 h-5 flex items-center justify-center">
              <LogOut size={20} className="text-[#F17922]" />
            </div>
            <span className="text-sm  font-normal cursor-pointer text-gray-600">
              Déconnexion
            </span>
          </button>
        </div>
      </aside>
    </div>
  );
}
