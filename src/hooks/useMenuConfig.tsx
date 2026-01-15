"use client";

import {
  BookOpen,
  Boxes,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  LucideIcon,
  Megaphone,
  MessageCircleMore,
  MessageSquare,
  Store,
  BadgePercent,
  TicketPercent,
  TrendingUp,
  UserCog,
  Users,
  Tag,
  BadgeDollarSign,
} from "lucide-react";

import { useAuthStore } from "../../features/users/hook/authStore";
import { Modules, Action } from "../../features/users/types/auth.type";

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
  const can = useAuthStore((state) => state.can);

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
          id: "customers-card_nation",
          label: "Carte de la nation",
          icon: CreditCard,
          canAccess: () => can(Modules.CARD_NATION, Action.READ),
        },
      ],
    },
    {
      id: "messages_tickets",
      label: "Messages et tickets",
      icon: MessageSquare,
      canAccess: () => can(Modules.MESSAGES, Action.READ),
      items: [
        {
          id: "messages_tickets-inbox",
          label: "Inbox",
          icon: MessageCircleMore,
          canAccess: () => can(Modules.MESSAGES, Action.READ),
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
          label: "Bons de réduction",
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
      ],
    },
    {
      id: "marketing",
      label: "Marketing",
      icon: TrendingUp,
      canAccess: () => can(Modules.MARKETING, Action.READ),
    },
  ];

  return { navigationItems };
};
