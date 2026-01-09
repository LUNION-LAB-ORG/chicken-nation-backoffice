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

  const navigationItems = [
    {
      id: "dashboard",
      label: "Tableau de bord",
      defaultIcon: "/icons/sidebar/home.png",
      whiteIcon: "/icons/sidebar/home-white.png",
      canAccess: () =>
        ["ADMIN", "MANAGER", "MARKETING"].includes(user?.role ?? ""),
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
      id: "customers",
      label: "Clients",
      defaultIcon: "/icons/sidebar/client.png",
      whiteIcon: "/icons/sidebar/client-white.png",
      canAccess: canViewClient,
      items: [
        {
          id: "customers-clients",
          label: "Clients",
          defaultIcon: "/icons/sidebar/client.png",
          whiteIcon: "/icons/sidebar/client-white.png",
          canAccess: canViewClient,
        },
        {
          id: "customers-card_nation",
          label: "Carte de la nation",
          defaultIcon: "/icons/sidebar/fidelisation.png",
          whiteIcon: "/icons/sidebar/fidelisation-white.png",
          canAccess: canViewClient,
        },
      ],
    },
    {
      id: "messages_tickets",
      label: "Messages et tickets",
      defaultIcon: "/icons/sidebar/message.png",
      whiteIcon: "/icons/sidebar/messages-white.png",
      canAccess: () => true,
      items: [
        {
          id: "messages_tickets-inbox",
          label: "Inbox",
          defaultIcon: "/icons/sidebar/message.png",
          whiteIcon: "/icons/sidebar/inbox.png",
        },
        // {
        //   id: "messages_tickets-rapport",
        //   label: "Rapport",
        // },
      ],
    },
    {
      id: "inventory",
      label: "Inventaires",
      defaultIcon: "/icons/sidebar/inventaire.png",
      whiteIcon: "/icons/sidebar/inventaire-white.png",
      canAccess: () => canViewPlat(),
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
    {
      id: "promos",
      label: "Promotions",
      defaultIcon: "/icons/sidebar/promotions.png",
      whiteIcon: "/icons/sidebar/promotions-white.png",
      canAccess: canViewOffreSpeciale,
    },
    {
      id: "marketing",
      label: "Marketing",
      defaultIcon: "/icons/marketing.png",
      whiteIcon: "/icons/marketing.png",
      canAccess: () =>
        ["ADMIN", "MANAGER", "MARKETING"].includes(user?.role ?? ""),
    },
  ];

  return { navigationItems };
};
