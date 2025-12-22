"use client";

import { useRBAC } from "@/hooks/useRBAC";
import { useAuthStore } from "@/store/authStore";

export const useGetMenuConfig = () => {
  const { user } = useAuthStore();
  const {
    canViewPlat,
    canViewCommande,
    canViewClient,
    canViewUtilisateur,
    canViewRestaurant,
    canViewOffreSpeciale,
  } = useRBAC();

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
    //   canAccess: canViewUtilisateur,
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

  return {
    navigationItems,
    messageSubModules,
  };
};
