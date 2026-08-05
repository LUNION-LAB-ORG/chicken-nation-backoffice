"use client";

import React from "react";
import {
  BarChart3,
  BookOpen,
  ClipboardList,
  Home,
  LayoutGrid,
  LucideIcon,
  MessageCircleMore,
} from "lucide-react";

import { TabKey, useDashboardStore } from "@/store/dashboardStore";
import { useMobileNavStore } from "@/store/mobileNavStore";
import { useAuthStore } from "../../../../features/users/hook/authStore";
import { Action, Modules } from "../../../../features/users/types/auth.type";
import { useUnreadCounts } from "../../../../features/messagerie";

type NavItem = {
  key: string;
  label: string;
  Icon: LucideIcon;
  onClick: () => void;
  active?: boolean;
  /** Nombre de non-lus affiché en pastille sur l'icône. */
  badge?: number;
};

/**
 * Barre d'onglets façon application native, affichée uniquement sur téléphone
 * (< md). Destinations filtrées par permission. `pb-safe` pour passer au-dessus
 * de la barre d'accueil iOS. (La capture client n'est PAS ici : c'est une action
 * secondaire, disponible sur la page Commandes.)
 */
export default function MobileBottomNav() {
  const activeTab = useDashboardStore((s) => s.activeTab);
  const setActiveTab = useDashboardStore((s) => s.setActiveTab);
  const can = useAuthStore((s) => s.can);
  const openMobileMenu = useMobileNavStore((s) => s.openMobileMenu);
  const unread = useUnreadCounts();

  const isOrders =
    activeTab === "operations" ||
    activeTab === "orders" ||
    activeTab === "historique";

  // Destinations possibles, par ordre de priorité, filtrées par permission.
  const destinations: NavItem[] = [];

  if (can(Modules.DASHBOARD, Action.READ)) {
    destinations.push({
      key: "dashboard",
      label: "Accueil",
      Icon: Home,
      active: activeTab === "dashboard",
      onClick: () => setActiveTab("dashboard" as TabKey),
    });
  }
  if (can(Modules.COMMANDES, Action.READ)) {
    destinations.push({
      key: "operations",
      label: "Commandes",
      Icon: ClipboardList,
      active: isOrders,
      onClick: () => setActiveTab("operations" as TabKey),
    });
  }
  if (can(Modules.MESSAGES, Action.READ)) {
    destinations.push({
      key: "inbox",
      label: "Messages",
      Icon: MessageCircleMore,
      active: activeTab === "inbox" || activeTab === "tickets",
      badge: unread.total > 0 ? unread.total : undefined,
      onClick: () => setActiveTab("inbox" as TabKey),
    });
  }
  if (can(Modules.MENUS, Action.READ)) {
    destinations.push({
      key: "menus",
      label: "Menus",
      Icon: BookOpen,
      active: activeTab === "menus",
      onClick: () => setActiveTab("menus" as TabKey),
    });
  }
  if (can(Modules.DASHBOARD, Action.READ) && can(Modules.COMMANDES, Action.READ)) {
    destinations.push({
      key: "stats_orders",
      label: "Stats",
      Icon: BarChart3,
      active: activeTab === "stats_orders",
      onClick: () => setActiveTab("stats_orders" as TabKey),
    });
  }

  // Au plus 4 entrées : 3 destinations prioritaires + « Plus » (le reste via le drawer).
  const items: NavItem[] = destinations.slice(0, 3);
  items.push({
    key: "more",
    label: "Plus",
    Icon: LayoutGrid,
    onClick: openMobileMenu,
  });

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 pb-safe">
      <div className="flex items-stretch justify-around h-16">
        {items.map((it) => {
          const Icon = it.Icon;
          return (
            <button
              key={it.key}
              type="button"
              onClick={it.onClick}
              className={`flex-1 min-w-[44px] flex flex-col items-center justify-center gap-1 active:bg-gray-50 transition-colors ${
                it.active ? "text-[#F17922]" : "text-gray-500"
              }`}
            >
              <span className="relative">
                <Icon
                  size={22}
                  className={it.active ? "text-[#F17922]" : "text-gray-400"}
                />
                {!!it.badge && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-[#F17922] text-white text-[10px] font-semibold flex items-center justify-center">
                    {it.badge > 99 ? "99+" : it.badge}
                  </span>
                )}
              </span>
              <span className="text-[11px] font-medium">{it.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
