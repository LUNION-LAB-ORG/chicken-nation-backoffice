"use client";

import React from "react";
import { Menu } from "lucide-react";

import { useDashboardStore } from "@/store/dashboardStore";
import { useGetMenuConfig } from "@/hooks/useMenuConfig";
import { useMobileNavStore } from "@/store/mobileNavStore";
import NotificationDropdown from "@/components/ui/NotificationDropdown";
import UserMenu from "@/components/gestion/header/UserMenu";

/**
 * App-bar compacte affichée uniquement sur téléphone (< md). Remplace le Header
 * web : hamburger (ouvre le drawer menu), titre de la section courante, cloche +
 * menu utilisateur. `pt-safe` pour passer sous l'encoche iOS.
 */
export default function MobileAppBar() {
  const activeTab = useDashboardStore((s) => s.activeTab);
  const { navigationItems } = useGetMenuConfig();
  const openMobileMenu = useMobileNavStore((s) => s.openMobileMenu);

  // Titre de section dérivé de l'onglet actif
  let key: string = activeTab ?? "dashboard";
  if (key === "orders" || key === "historique") key = "operations";
  if (key === "card_requests") key = "card_nation";

  const titleMap = new Map<string, string>();
  for (const item of navigationItems) {
    if (!titleMap.has(item.id)) titleMap.set(item.id, item.label);
    for (const sub of item.items ?? []) {
      const subKey = sub.id.includes("-") ? sub.id.split("-")[1] : sub.id;
      if (!titleMap.has(subKey)) titleMap.set(subKey, sub.label);
    }
  }
  const title = titleMap.get(key) ?? "Chicken Nation";

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-200 pt-safe">
      <div className="flex items-center gap-1 h-14 px-1.5">
        <button
          type="button"
          onClick={openMobileMenu}
          aria-label="Ouvrir le menu"
          className="p-2.5 rounded-xl active:bg-gray-100 shrink-0"
        >
          <Menu size={22} className="text-gray-800" />
        </button>

        <h1 className="flex-1 min-w-0 truncate text-[17px] font-bold bg-gradient-to-l from-[#FA6345] to-[#F17922] bg-clip-text text-transparent">
          {title}
        </h1>

        <div className="flex items-center shrink-0">
          <NotificationDropdown />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
