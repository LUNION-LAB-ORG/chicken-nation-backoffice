"use client";

import { useAuthStore } from "../../../../features/users/hook/authStore";
import { useUIStore } from "@/store/uiStore";
import { formatImageUrl } from "@/utils/imageHelpers";
import { ChevronDown, LogOut } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function UserMenu() {
  const { user, logout } = useAuthStore();
  const { setShowEditProfile } = useUIStore();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const displayName = user?.fullname || "Utilisateur";
  const avatarUrl = formatImageUrl(user?.image, "/icons/account.png");

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };

  const handleEditProfile = () => {
    setShowEditProfile(true);
    setIsDropdownOpen(false);
  };

  return (
    <>
      {/* Bouton Paramètres (desktop) */}
      <button
        className="hidden md:block relative p-2 rounded-lg cursor-pointer hover:bg-orange-50 transition-colors"
        title="Paramètres"
        onClick={() => setShowEditProfile(true)}
      >
        <Image
          src="/icons/header/setting.png"
          alt="Settings"
          width={24}
          height={24}
          className="text-gray-600"
        />
      </button>

      {/* Menu Utilisateur */}
      <div className="relative">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center space-x-3 p-2 cursor-pointer rounded-lg hover:bg-gray-50 transition-colors"
        >
          <span className="text-sm text-gray-700">{displayName}</span>
          <div className="w-8 h-8 bg-gray-200 rounded-full cursor-pointer overflow-hidden">
            <Image
              src={avatarUrl}
              alt={displayName}
              width={32}
              height={32}
              className="w-full h-full cursor-pointer object-cover"
              unoptimized={!user?.image || user?.image?.startsWith("/icons/")}
            />
          </div>
          <ChevronDown
            size={16}
            className={`text-gray-500 transition-transform ${
              isDropdownOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Dropdown */}
        {isDropdownOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsDropdownOpen(false)}
            />
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden">
                    <Image
                      src={avatarUrl}
                      alt={displayName}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                      unoptimized={
                        !user?.image || user?.image?.startsWith("/icons/")
                      }
                    />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{displayName}</p>
                    <p className="text-sm text-gray-500 capitalize">Profil</p>
                  </div>
                </div>
              </div>

              <div className="p-2">
                <button
                  onClick={handleEditProfile}
                  className="w-full flex items-center cursor-pointer space-x-3 px-3 py-2 text-left text-gray-700 hover:bg-orange-50 rounded-md transition-colors"
                >
                  <Image
                    src="/icons/header/setting.png"
                    alt="Profil"
                    width={16}
                    height={16}
                    className="text-gray-500"
                  />
                  <span className="text-sm">Modifier le profil</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 cursor-pointer px-3 py-2 text-left text-gray-700 hover:bg-orange-50 rounded-md transition-colors"
                >
                  <LogOut size={16} className="text-gray-500" />
                  <span className="text-sm">Déconnexion</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
