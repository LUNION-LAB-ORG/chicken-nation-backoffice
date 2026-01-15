"use client";

import { useGetMenuConfig } from "@/hooks/useMenuConfig";
import { useAuthStore } from "../../../../features/users/hook/authStore";
import { TabKey, useDashboardStore } from "@/store/dashboardStore";
import { useUIStore } from "@/store/uiStore";
import { LogOut } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import SidebarNavigation from "./SidebarNavigation";

export default function Sidebar() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const { activeTab, setActiveTab } = useDashboardStore();
  const { isMobile, isSidebarOpen, setIsSidebarOpen } = useUIStore();
  const { navigationItems } = useGetMenuConfig();

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const handleNavigationChange = (id: string) => {
    let itemID: string;
    if (id.includes("-")) {
      itemID = id.split("-")[1];
    } else {
      itemID = id;
    }
    setActiveTab(itemID as TabKey);

    if (isMobile || !isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <>
      <aside className="w-64 bg-white shadow-lg h-screen flex flex-col">
        {/* Logo */}
        <div className="p-4">
          <Image
            src="/icons/sidebar/logo-orange.png"
            alt="Chicken Nation"
            width={200}
            height={100}
          />
        </div>

        {/* Navigation */}
        <nav className="mt-2 px-2 flex-1 overflow-y-auto">
          <SidebarNavigation
            isClient={isClient}
            navigationItems={navigationItems}
            activeTab={
              activeTab === "reviews"
                ? "clients"
                : activeTab === "card_requests"
                ? "card_nation"
                : activeTab
            }
            onNavigationChange={handleNavigationChange}
          />
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-[10px] rounded-[14px] text-gray-600 hover:bg-gray-100"
          >
            <LogOut size={20} className="text-[#F17922]" />
            <span className="text-sm">Déconnexion</span>
          </button>
        </div>
      </aside>
    </>
  );
}
