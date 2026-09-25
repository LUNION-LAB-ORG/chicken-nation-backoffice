"use client";

import {
  BarChart3,
  Bell,
  BookOpen,
  Boxes,
  Calendar,
  ClipboardList,
  CreditCard,
  Database,
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
  TrendingUp,
  UserCog,
  Users,
  Tag,
  BadgeDollarSign,
  Link2,
  Phone,
  Gift,
  Handshake,
  Dices,
  ShieldCheck,
  ListChecks,
  ScrollText,
  Target,
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
  // `can` garde la même identité quand les droits sont relus (GET /auth/permissions) :
  // s'abonner aux permissions redessine le menu avec les droits à jour.
  useAuthStore((state) => state.user?.permissions);
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
      id: "operations",
      label: "Commandes",
      icon: ClipboardList,
      canAccess: () => can(Modules.COMMANDES, Action.READ),
    },
    {
      id: "courses",
      label: "Courses",
      icon: Truck,
      // Même permission que Livreurs : seul l'admin gère les courses
      canAccess: () => can(Modules.LIVREURS, Action.READ),
    },
    {
      id: "base_donnees",
      label: "Base de Données",
      icon: Database,
      // Le CRM aussi : un profil de consultation peut n'avoir que ce module.
      canAccess: () =>
        can(Modules.CLIENTS, Action.READ) || can(Modules.COMMENTAIRES, Action.READ) || can(Modules.CRM, Action.READ),
      items: [
        {
          id: "base_donnees-clients",
          label: "Clients",
          icon: Users,
          canAccess: () => can(Modules.CLIENTS, Action.READ),
        },
        {
          id: "base_donnees-reviews",
          label: "Notes et avis",
          icon: Star,
          canAccess: () => can(Modules.COMMENTAIRES, Action.READ),
        },
        {
          // Inscrits sans commande, clients inactifs (l'ancienne « Rétention clients »)
          // et clients Glovo/Yango (l'ancienne « Acquisition Glovo/Yango »).
          id: "base_donnees-crm",
          label: "CRM",
          icon: Target,
          canAccess: () => can(Modules.CRM, Action.READ),
        },
      ],
    },
    {
      id: "fidelisation",
      label: "Fidélisation",
      icon: Tag,
      // Pas CARD_NATION : le caissier l'a pour la caisse, sans avoir jamais eu ce menu.
      canAccess: () => can(Modules.PROMOTIONS, Action.READ) || can(Modules.FIDELITE, Action.READ),
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
          // Même droit que le serveur (voucher.controller : FIDELITE READ).
          canAccess: () => can(Modules.FIDELITE, Action.READ),
        },
        {
          id: "fidelisation-loyalty",
          label: "Points de fidélité",
          icon: BadgeDollarSign,
          canAccess: () => can(Modules.FIDELITE, Action.READ),
        },
        {
          id: "fidelisation-referral",
          label: "Parrainage",
          icon: Handshake,
          canAccess: () => can(Modules.FIDELITE, Action.READ),
        },
        {
          id: "fidelisation-gifts",
          label: "Cadeaux",
          icon: Gift,
          canAccess: () => can(Modules.FIDELITE, Action.READ),
        },
        {
          id: "fidelisation-games",
          label: "Jeux",
          icon: Dices,
          canAccess: () => can(Modules.FIDELITE, Action.READ),
        },
        {
          id: "fidelisation-promo_code",
          label: "Codes promo",
          icon: BadgePercent,
          canAccess: () => can(Modules.PROMOTIONS, Action.READ),
        },
        {
          id: "fidelisation-delivery_offers",
          label: "Offres de livraison",
          icon: Truck,
          canAccess: () => can(Modules.PROMOTIONS, Action.READ),
        },
        {
          id: "fidelisation-card_nation",
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
      // Visible si l'utilisateur a accès aux messages, aux appels OU aux
      // diffusions (ex : un manager sans MESSAGES doit quand même voir le
      // sous-menu Appel, et le marketing les Diffusions).
      canAccess: () =>
        can(Modules.MESSAGES, Action.READ) || can(Modules.CALLS, Action.READ) || can(Modules.DIFFUSIONS, Action.READ),
      badge: unread.total > 0 ? unread.total : undefined,
      items: [
        {
          id: "messages_tickets-inbox",
          label: "Messages",
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
        {
          id: "messages_tickets-diffusions",
          label: "Diffusions",
          icon: Megaphone,
          // ⚠️ DIFFUSIONS, et non MESSAGES : les rôles CAISSIER et CALL_CENTER
          // détiennent MESSAGES pour répondre aux clients. Écrire à toute la
          // base est une décision de marketing, pas un geste de caisse.
          canAccess: () => can(Modules.DIFFUSIONS, Action.READ),
        },
        {
          id: "messages_tickets-appel",
          label: "Appel",
          icon: Phone,
          canAccess: () => can(Modules.CALLS, Action.READ),
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
      id: "livreurs",
      label: "Livreurs",
      icon: Truck,
      canAccess: () => can(Modules.LIVREURS, Action.READ),
      items: [
        {
          id: "livreurs-livreurs",
          label: "Liste des livreurs",
          icon: Truck,
          canAccess: () => can(Modules.LIVREURS, Action.READ),
        },
        {
          id: "livreurs-planning_livreurs",
          label: "Planning",
          icon: Calendar,
          canAccess: () => can(Modules.LIVREURS, Action.READ),
        },
      ],
    },
    {
      id: "marketing_group",
      label: "Marketing",
      icon: TrendingUp,
      canAccess: () => can(Modules.MARKETING, Action.READ),
      items: [
        {
          id: "marketing_group-news",
          label: "Nouveautés",
          icon: Newspaper,
          canAccess: () => can(Modules.MARKETING, Action.READ),
        },
        {
          id: "marketing_group-marketing",
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
      // Son propre module : l'ouvrir en lecture n'ouvre pas Paramètres.
      canAccess: () => can(Modules.NOTIFICATIONS, Action.READ),
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
          // Même droit que le serveur (statistics-products : DASHBOARD READ).
          canAccess: () => can(Modules.DASHBOARD, Action.READ),
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
          // Même droit que le serveur (statistics-marketing : DASHBOARD READ).
          canAccess: () => can(Modules.DASHBOARD, Action.READ),
        },
      ],
    },
    {
      // Réservé à l'admin : seul le rôle ADMIN possède la permission AUDIT
      // (via Modules.ALL). Les autres rôles ne voient jamais ce groupe.
      id: "audits",
      label: "Audits",
      icon: ShieldCheck,
      canAccess: () => can(Modules.AUDIT, Action.READ),
      items: [
        {
          id: "audits-audit_actions",
          label: "Actions",
          icon: ListChecks,
          canAccess: () => can(Modules.AUDIT, Action.READ),
        },
        {
          id: "audits-audit_logs",
          label: "Logs",
          icon: ScrollText,
          canAccess: () => can(Modules.AUDIT, Action.READ),
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

  // Les sous-menus sont filtrés ici, pour la barre latérale comme pour le
  // tiroir mobile : un groupe n'affiche que ce que le compte peut ouvrir, et
  // disparaît s'il ne lui reste rien.
  const visibles = navigationItems
    .map((item) =>
      item.items ? { ...item, items: item.items.filter((sub) => !sub.canAccess || sub.canAccess()) } : item,
    )
    .filter((item) => !item.items || item.items.length > 0);

  return { navigationItems: visibles };
};
