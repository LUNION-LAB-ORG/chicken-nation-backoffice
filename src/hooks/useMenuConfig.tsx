"use client";

import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  Users,
  Map,
  MessageSquare,
  Ticket,
  Boxes,
  Store,
  Megaphone,
  TrendingUp,
  LucideIcon,
  UserCog,
} from "lucide-react";

import { useRBAC } from "@/hooks/useRBAC";
import { useAuthStore } from "@/store/authStore";

export type CanAccessFn = () => boolean;

export interface NavigationItem {
  id: string;
  label: string;
  icon: LucideIcon;
  canAccess?: CanAccessFn;
  items?: NavigationItem[];
}
export const useGetMenuConfig = (): {
  navigationItems: NavigationItem[];
} => {
  const { user } = useAuthStore();

  const {
    canViewPlat,
    canViewCommande,
    canViewClient,
    canViewUtilisateur,
    canViewRestaurant,
    canViewOffreSpeciale,
  } = useRBAC();

  const navigationItems: NavigationItem[] = [
    {
      id: "dashboard",
      label: "Tableau de bord",
      icon: LayoutDashboard,
      canAccess: () =>
        ["ADMIN", "MANAGER", "MARKETING"].includes(user?.role ?? ""),
    },
    {
      id: "menus",
      label: "Menus",
      icon: BookOpen,
      canAccess: canViewPlat,
    },
    {
      id: "orders",
      label: "Commandes",
      icon: ClipboardList,
      canAccess: canViewCommande,
    },
    {
      id: "customers",
      label: "Clients",
      icon: Users,
      canAccess: canViewClient,
      items: [
        {
          id: "customers-clients",
          label: "Clients",
          icon: Users,
          canAccess: canViewClient,
        },
        {
          id: "customers-card_nation",
          label: "Carte de la nation",
          icon: Map,
          canAccess: canViewClient,
        },
      ],
    },
    {
      id: "messages_tickets",
      label: "Messages et tickets",
      icon: MessageSquare,
      canAccess: () => true,
      items: [
        {
          id: "messages_tickets-inbox",
          label: "Inbox",
          icon: Ticket,
        },
      ],
    },
    {
      id: "inventory",
      label: "Inventaires",
      icon: Boxes,
      canAccess: canViewPlat,
    },
    {
      id: "restaurants",
      label: "Restaurants",
      icon: Store,
      canAccess: canViewRestaurant,
    },
    {
      id: "personnel",
      label: "Personnel",
      icon: UserCog,
      canAccess: canViewUtilisateur,
    },
    {
      id: "promos",
      label: "Promotions",
      icon: Megaphone,
      canAccess: canViewOffreSpeciale,
    },
    {
      id: "marketing",
      label: "Marketing",
      icon: TrendingUp,
      canAccess: () =>
        ["ADMIN", "MANAGER", "MARKETING"].includes(user?.role ?? ""),
    },
  ];

  return { navigationItems };
};
