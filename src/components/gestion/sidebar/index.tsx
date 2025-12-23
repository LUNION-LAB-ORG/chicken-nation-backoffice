"use client";

import { useGetMenuConfig } from "@/hooks/useMenuConfig";
import { useAuthStore } from "@/store/authStore";
import { TabKey, useDashboardStore } from "@/store/dashboardStore";
import { useNavigationStore } from "@/store/navigationStore";
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
  const { activeSubModule, setActiveSubModule } = useNavigationStore();
  const { isMobile, isSidebarOpen, setIsSidebarOpen } = useUIStore();
  const { navigationItems } = useGetMenuConfig();

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };

  const handleNavigationChange = (itemId: string, subModuleId?: string) => {
    setActiveTab(itemId as TabKey);

    if (subModuleId) {
      setActiveSubModule(subModuleId);
    }

    if (isMobile || !isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <>
      {isSidebarOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <div className="relative z-10 h-full flex flex-col overflow-hidden">
        <aside className="w-64 bg-white shadow-lg h-screen flex flex-col transition-transform duration-300 ease-in-out">
          {/* Logo */}
          <div className="p-4">
            <div className="flex space-x-2 items-start justify-start">
              <Image
                src="/icons/sidebar/logo-orange.png"
                alt="Chicken Nation"
                width={200}
                height={100}
              />
            </div>
          </div>

          {/* Navigation */}
          <nav className="mt-2 px-2 flex-1 overflow-y-auto">
            <SidebarNavigation
              isClient={isClient}
              navigationItems={navigationItems}
              activeTab={activeTab}
              activeSubModule={activeSubModule}
              onNavigationChange={handleNavigationChange}
            />
          </nav>

          {/* Déconnexion */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center cursor-pointer space-x-3 px-4 py-[10px] rounded-[14px] text-gray-600 hover:bg-gray-100 transition-all duration-200"
            >
              <div className="relative w-5 h-5 flex items-center justify-center">
                <LogOut size={20} className="text-[#F17922]" />
              </div>
              <span className="text-sm font-normal cursor-pointer text-gray-600">
                Déconnexion
              </span>
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}
