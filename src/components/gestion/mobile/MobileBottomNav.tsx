"use client";

import React from "react";
import {
  BarChart3,
  ClipboardList,
  Home,
  LayoutGrid,
  LucideIcon,
} from "lucide-react";

import { TabKey, useDashboardStore } from "@/store/dashboardStore";
import { useMobileNavStore } from "@/store/mobileNavStore";
import { useAuthStore } from "../../../../features/users/hook/authStore";
import { Action, Modules } from "../../../../features/users/types/auth.type";

type NavItem = {
  key: string;
  label: string;
  Icon: LucideIcon;
  onClick: () => void;
  active?: boolean;
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

  const isOrders =
    activeTab === "operations" ||
    activeTab === "orders" ||
    activeTab === "historique";

  const items: NavItem[] = [];

  if (can(Modules.DASHBOARD, Action.READ)) {
    items.push({
      key: "dashboard",
      label: "Accueil",
      Icon: Home,
      active: activeTab === "dashboard",
      onClick: () => setActiveTab("dashboard" as TabKey),
    });
  }
  if (can(Modules.COMMANDES, Action.READ)) {
    items.push({
      key: "operations",
      label: "Commandes",
      Icon: ClipboardList,
      active: isOrders,
      onClick: () => setActiveTab("operations" as TabKey),
    });
  }
  if (can(Modules.COMMANDES, Action.READ)) {
    items.push({
      key: "stats_orders",
      label: "Stats",
      Icon: BarChart3,
      active: activeTab === "stats_orders",
      onClick: () => setActiveTab("stats_orders" as TabKey),
    });
  }
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
              className={`flex-1 flex flex-col items-center justify-center gap-1 active:bg-gray-50 transition-colors ${
                it.active ? "text-[#F17922]" : "text-gray-500"
              }`}
            >
              <Icon
                size={22}
                className={it.active ? "text-[#F17922]" : "text-gray-400"}
              />
              <span className="text-[11px] font-medium">{it.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
