"use client";

import NotificationDropdown from "@/components/ui/NotificationDropdown";
import UserMenu from "./UserMenu";
import { useUIStore } from "@/store/uiStore";
import { Menu } from "lucide-react";
import { useEffect, useState } from "react";

interface HeaderProps {
  className?: string;
}

export default function Header({ className }: HeaderProps) {
  const { toggleSidebar, isSidebarOpen } = useUIStore();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <header
        className={`bg-white border-b border-gray-200 shadow-3xl ${className}`}
      >
        <div className="flex items-center justify-between h-14 flex-row">
          <button className="p-4 hover:bg-orange-100 rounded-lg transition-colors duration-200">
            <Menu size={20} className="text-gray-800" />
          </button>
          <div className="flex-1 md:hidden"></div>
          <div className="flex items-end justify-end px-4 space-x-8">
            <div className="flex items-center space-x-3 p-2 rounded-lg">
              <span className="text-sm text-gray-700">Chargement...</span>
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header
      className={`bg-white border-b border-gray-200 shadow-3xl ${className}`}
    >
      <div className="flex items-center justify-between h-14 flex-row">
        <button
          onClick={toggleSidebar}
          className="p-4 hover:bg-orange-100 rounded-lg transition-colors duration-200"
          aria-label={isSidebarOpen ? "Fermer le menu" : "Ouvrir le menu"}
        >
          <Menu size={20} className="text-gray-800" />
        </button>

        <div className="flex-1 md:hidden"></div>

        <div className="flex items-end justify-end px-4 space-x-8">
          <NotificationDropdown />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
