"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { LogOut, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";

import { useGetMenuConfig } from "@/hooks/useMenuConfig";
import { TabKey, useDashboardStore } from "@/store/dashboardStore";
import { useMobileNavStore } from "@/store/mobileNavStore";
import { useAuthStore } from "../../../../features/users/hook/authStore";
import SidebarNavigation from "../sidebar/SidebarNavigation";

/**
 * Drawer du menu complet (téléphones < md). Réutilise `SidebarNavigation` ;
 * overlay sombre tap-to-close ; se ferme à la navigation. Ouvert depuis
 * l'app-bar (hamburger) et la barre d'onglets (« Plus »).
 */
export default function MobileMenuDrawer() {
  const router = useRouter();
  const { isMobileMenuOpen, closeMobileMenu } = useMobileNavStore();
  const { navigationItems } = useGetMenuConfig();
  const { activeTab, setActiveTab } = useDashboardStore();
  const logout = useAuthStore((s) => s.logout);

  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);

  // Verrou du scroll de la page quand le drawer est ouvert
  useEffect(() => {
    if (isMobileMenuOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  const handleNavigationChange = (id: string) => {
    const itemID = id.includes("-") ? id.split("-")[1] : id;
    setActiveTab(itemID as TabKey);
    closeMobileMenu();
  };

  const handleLogout = async () => {
    closeMobileMenu();
    await logout();
    router.push("/");
  };

  const normalizedActive =
    activeTab === "card_requests" ? "card_nation" : activeTab ?? "";

  return (
    <AnimatePresence>
      {isMobileMenuOpen && (
        <motion.div
          key="mobile-drawer"
          className="md:hidden fixed inset-0 z-50"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 1 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeMobileMenu}
            aria-hidden="true"
          />

          <motion.aside
            className="absolute top-0 left-0 h-full w-[85%] max-w-[320px] bg-white shadow-2xl flex flex-col pt-safe"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
          >
            <div className="flex items-center justify-between p-4">
              <Image
                src="/icons/sidebar/logo-orange.png"
                alt="Chicken Nation"
                width={150}
                height={75}
                priority
              />
              <button
                type="button"
                onClick={closeMobileMenu}
                aria-label="Fermer le menu"
                className="p-2 rounded-lg active:bg-gray-100"
              >
                <X size={22} className="text-gray-700" />
              </button>
            </div>

            <nav className="px-2 flex-1 overflow-y-auto">
              <SidebarNavigation
                isClient={isClient}
                navigationItems={navigationItems}
                activeTab={normalizedActive}
                onNavigationChange={handleNavigationChange}
              />
            </nav>

            <div className="p-4 border-t border-gray-200 pb-safe">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-[14px] text-gray-600 active:bg-gray-100"
              >
                <LogOut size={20} className="text-[#F17922]" />
                <span className="text-sm">Déconnexion</span>
              </button>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
