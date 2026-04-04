"use client";

import {
  BarChart3,
  Bell,
  BookOpen,
  Boxes,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  LucideIcon,
  Megaphone,
  MessageCircleMore,
  MessageSquare,
  Newspaper,
  Star,
  Store,
  BadgePercent,
  Settings,
  ShoppingCart,
  TicketCheck,
  TicketPercent,
  Truck,
  UserCog,
  Users,
  Tag,
  BadgeDollarSign,
  Link2,
  Phone,
} from "lucide-react";

import { useAuthStore } from "../../features/users/hook/authStore";
import { Modules, Action } from "../../features/users/types/auth.type";
import { useUnreadCounts } from "../../features/messagerie/hooks/useUnreadCounts";

export type CanAccessFn = () => boolean;

export interface NavigationItem {
  id: string;
  label: string;
  icon: LucideIcon;
  canAccess?: CanAccessFn;
  badge?: number;
  items?: NavigationItem[];
}

export const useGetMenuConfig = (): {
  navigationItems: NavigationItem[];
} => {
  const can = useAuthStore((state) => state.can);
  const unread = useUnreadCounts();

  const navigationItems: NavigationItem[] = [
    {
      id: "dashboard",
      label: "Tableau de bord",
      icon: LayoutDashboard,
      canAccess: () => can(Modules.DASHBOARD, Action.READ),
    },
    {
      id: "menus",
      label: "Menus",
      icon: BookOpen,
      canAccess: () => can(Modules.MENUS, Action.READ),
    },
    {
      id: "orders",
      label: "Commandes",
      icon: ClipboardList,
      canAccess: () => can(Modules.COMMANDES, Action.READ),
    },
    {
      id: "customers",
      label: "Clients",
      icon: Users,
      canAccess: () => can(Modules.CLIENTS, Action.READ),
      items: [
        {
          id: "customers-clients",
          label: "Clients",
          icon: Users,
          canAccess: () => can(Modules.CLIENTS, Action.READ),
        },
        {
          id: "customers-reviews",
          label: "Notes et avis",
          icon: Star,
          canAccess: () => can(Modules.COMMENTAIRES, Action.READ),
        },
        {
          id: "customers-card_nation",
          label: "Carte de la nation",
          icon: CreditCard,
          canAccess: () => can(Modules.CARD_NATION, Action.READ),
        },
        {
          id: "customers-stats_retention_callbacks",
          label: "Rétention clients",
          icon: Phone,
          canAccess: () => can(Modules.CLIENTS, Action.READ),
        },
      ],
    },
    {
      id: "messages_tickets",
      label: "Messages et tickets",
      icon: MessageSquare,
      canAccess: () => can(Modules.MESSAGES, Action.READ),
      badge: unread.total > 0 ? unread.total : undefined,
      items: [
        {
          id: "messages_tickets-inbox",
          label: "Inbox",
          icon: MessageCircleMore,
          canAccess: () => can(Modules.MESSAGES, Action.READ),
          badge: unread.conversations > 0 ? unread.conversations : undefined,
        },
        {
          id: "messages_tickets-tickets",
          label: "Tickets",
          icon: TicketCheck,
          canAccess: () => can(Modules.MESSAGES, Action.READ),
          badge: unread.tickets > 0 ? unread.tickets : undefined,
        },
      ],
    },
    {
      id: "inventory",
      label: "Inventaires",
      icon: Boxes,
      canAccess: () => can(Modules.INVENTAIRE, Action.READ),
    },
    {
      id: "restaurants",
      label: "Restaurants",
      icon: Store,
      canAccess: () => can(Modules.RESTAURANTS, Action.READ),
    },
    {
      id: "personnel",
      label: "Personnel",
      icon: UserCog,
      canAccess: () => can(Modules.PERSONNELS, Action.READ),
    },
    {
      id: "fidelisation",
      label: "Fidélisation",
      icon: Tag,
      canAccess: () => can(Modules.PROMOTIONS, Action.READ),
      items: [
        {
          id: "fidelisation-promos",
          label: "Promotion",
          icon: Megaphone,
          canAccess: () => can(Modules.PROMOTIONS, Action.READ),
        },
        {
          id: "fidelisation-voucher",
          label: "Bons",
          icon: TicketPercent,
          canAccess: () => can(Modules.PROMOTIONS, Action.READ),
        },
        {
          id: "fidelisation-loyalty",
          label: "Point de fidélisation",
          icon: BadgeDollarSign,
          canAccess: () => can(Modules.FIDELITE, Action.READ),
        },
        {
          id: "fidelisation-promo_code",
          label: "Codes promo",
          icon: BadgePercent,
          canAccess: () => can(Modules.PROMOTIONS, Action.READ),
        },
        {
          id: "fidelisation-news",
          label: "Nouveautés",
          icon: Newspaper,
          canAccess: () => can(Modules.MARKETING, Action.READ),
        },
        {
          id: "fidelisation-marketing",
          label: "Clics & Deeplinks",
          icon: Link2,
          canAccess: () => can(Modules.MARKETING, Action.READ),
        },
      ],
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
      canAccess: () => can(Modules.SETTINGS, Action.READ),
    },
    {
      id: "statistiques",
      label: "Statistiques",
      icon: BarChart3,
      canAccess: () => can(Modules.DASHBOARD, Action.READ),
      items: [
        {
          id: "statistiques-stats_products",
          label: "Produits & Catégories",
          icon: BookOpen,
          canAccess: () => can(Modules.MENUS, Action.READ),
        },
        {
          id: "statistiques-stats_orders",
          label: "Commandes",
          icon: ShoppingCart,
          canAccess: () => can(Modules.COMMANDES, Action.READ),
        },
        {
          id: "statistiques-stats_clients",
          label: "Clients",
          icon: Users,
          canAccess: () => can(Modules.CLIENTS, Action.READ),
        },
        {
          id: "statistiques-stats_delivery",
          label: "Livraison",
          icon: Truck,
          canAccess: () => can(Modules.COMMANDES, Action.READ),
        },
        {
          id: "statistiques-stats_marketing",
          label: "Marketing & Promos",
          icon: Megaphone,
          canAccess: () => can(Modules.MARKETING, Action.READ),
        },
      ],
    },
    {
      id: "settings",
      label: "Paramètres",
      icon: Settings,
      canAccess: () => can(Modules.SETTINGS, Action.READ),
    },
  ];

  return { navigationItems };
};
