"use client"

import { Menu, ChevronDown, LogOut } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { formatImageUrl } from '@/utils/imageHelpers';
import EditMember from '@/components/gestion/Personnel/EditMember';
import NotificationDropdown from '@/components/ui/NotificationDropdown';
import MessageModal from '@/components/ui/MessageModal';
import { useMessageStore } from '@/store/messageStore';
import { User } from '@/types/auth'; 

interface HeaderProps {
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
  className?: string;
}

export default function Header({ toggleSidebar, isSidebarOpen, className }: HeaderProps) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { stats, fetchStats } = useMessageStore();

  // Éviter l'erreur d'hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Charger les statistiques des messages au montage
  useEffect(() => {
    fetchStats();
    // Recharger les stats toutes les 30 secondes
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

 

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Fermer le dropdown quand on clique ailleurs
  const handleClickOutside = () => {
    setIsDropdownOpen(false);
  };

  return (
    <header className={`bg-white border-b border-gray-200 shadow-3xl ${className}`}>
      <div className="flex items-center justify-between h-14 flex-row">
        {/* Menu Hamburger */}
        <button
          onClick={toggleSidebar}
          className="p-4 hover:bg-orange-100 rounded-lg transition-colors duration-200"
          aria-label={isSidebarOpen ? "Fermer le menu" : "Ouvrir le menu"}>
          <Menu size={20} className="text-gray-800" />
        </button> 
        {/* Espace flexible pour les petits écrans */}
        <div className="flex-1 md:hidden"></div>

        {/* Icones  à droite */}
        <div className="flex items-end justify-end  px-4 space-x-8">
          {/* Notifications */}
          <NotificationDropdown />

          <button
            type="button"
            onClick={() => setShowMessageModal(true)}
            className="relative p-2 rounded-lg cursor-pointer hover:bg-orange-50 transition-colors"
            title="Messages"
          >
            <Image src="/icons/header/mail.png" alt="Mail" width={24} height={24} className="text-gray-600" />
            {/* Badge de notification pour les messages non lus */}
            {stats && stats.unread_messages > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                {stats.unread_messages > 99 ? '99+' : stats.unread_messages}
              </span>
            )}
          </button>

          <button
            className="hidden md:block relative p-2 rounded-lg cursor-pointer hover:bg-orange-50 transition-colors"
            title="Paramètres"
            onClick={() => setShowEditProfile(true)}
          >
            <Image src="/icons/header/setting.png" alt="Settings" width={24} height={24} className="text-gray-600" />
          </button>

          {/* Menu Utilisateur */}
          <div className="relative">
            <button
              onClick={toggleDropdown}
              className="flex items-center space-x-3 p-2 cursor-pointer rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <span className="text-sm text-gray-700">
                  {!isClient ? 'Utilisateur' : (user?.fullname || 'Utilisateur')}
                </span>
              </div>
              <div className="w-8 h-8 bg-gray-200 rounded-full cursor-pointer  overflow-hidden">
                <Image
                  src={formatImageUrl(user?.image || undefined) || "/icons/header/default-avatar.png"}
                  alt={!isClient ? "Utilisateur" : (user?.fullname || "Utilisateur")}
                  width={32}
                  height={32}
                  className="w-full h-full cursor-pointer  object-cover"
                  unoptimized={!user?.image || user?.image?.startsWith('/icons/')}
                />
              </div>
              <ChevronDown
                size={16}
                className={`text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
              />

            </button>

            {/* Menu déroulant */}
            {isDropdownOpen && (
              <>
                {/* Overlay pour fermer le menu */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={handleClickOutside}
                />

                {/* Menu */}
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden">
                        <Image
                          src={formatImageUrl(user?.image || undefined) || "/icons/header/default-avatar.png"}
                          alt={!isClient ? "Utilisateur" : (user?.fullname || "Utilisateur")}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                          unoptimized={!user?.image || user?.image?.startsWith('/icons/')}
                        />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {!isClient ? 'Utilisateur' : (user?.fullname || 'Utilisateur')}
                        </p>
                        <p className="text-sm text-gray-500 capitalize">Profil</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditProfile(true);
                        setIsDropdownOpen(false);
                      }}
                      className="w-full flex items-center cursor-pointer space-x-3 px-3 py-2 text-left text-gray-700 hover:bg-orange-50 rounded-md transition-colors"
                    >
                      <Image src="/icons/header/setting.png" alt="Profil" width={16} height={16} className="text-gray-500" />
                      <span className="text-sm">Modifier le profil</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-3 cursor-pointer  px-3 py-2 text-left text-gray-700 hover:bg-orange-50 rounded-md transition-colors"
                    >
                      <LogOut size={16} className="text-gray-500" />
                      <span className="text-sm">Déconnexion</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal de modification de profil */}
      {showEditProfile && user && (
        <EditMember
          existingMember={{
        
            id: user.id,
            fullname: user.fullname,
            email: user.email,
            role: user.role,
            type: user.type || '',  
            image: user.image || undefined,
            phone: user.phone || '',
            address: user.address || '',
           
            entity_status: user.entity_status as 'NEW' | 'ACTIVE' | 'INACTIVE' | 'DELETED' | undefined,
            restaurant: user.restaurant_id || undefined,
            restaurant_id: user.restaurant_id || undefined,
            created_at: user.created_at,
            updated_at: user.updated_at,
            password_is_updated: user.password_is_updated,

          }}
          onCancel={() => setShowEditProfile(false)}
          onSuccess={(updatedUserFromEdit) => {  
            setShowEditProfile(false);
         
            useAuthStore.getState().setUser(updatedUserFromEdit as User); 
          }}
        />
      )}

      {/* Modal de messages */}
      <MessageModal
        isOpen={showMessageModal}
        onClose={() => setShowMessageModal(false)}
      />
    </header>
  );
}