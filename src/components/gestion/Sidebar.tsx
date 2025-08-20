"use client"

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore'
import { useRBAC } from '@/hooks/useRBAC';
import { LogOut } from 'lucide-react';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}

interface SidebarIconProps {
  defaultIcon: string;
  whiteIcon: string;
  alt: string;
  active: boolean;
}

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const SidebarIcon: React.FC<SidebarIconProps> = ({ defaultIcon, whiteIcon, alt, active }) => {
  return (
    <div className="relative w-5 h-5">
      <Image
        src={active ? whiteIcon : defaultIcon}
        alt={alt}
        width={20}
        height={20}
        className="absolute inset-0"
      />
    </div>
  );
};

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, active = false, onClick }) => {
  return (
    <button 
      onClick={onClick}
      className={`
        w-full flex items-center cursor-pointer space-x-3 px-4 py-[10px] rounded-[14px]
        ${active ? 'bg-gradient-to-r from-[#F17922] to-[#FA6345]' : 'text-gray-600 hover:bg-gray-100'}
        transition-all duration-200
      `}
    >
      {icon}
      <span className={`text-sm font-sofia-regular font-normal cursor-pointer ${active ? 'text-white' : 'text-gray-600'}`}>{label}</span>
    </button>
  );
};

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const router = useRouter();
  const { logout, user } = useAuthStore();
  const { canViewPlat, canViewCommande, canViewClient, canViewUtilisateur, canViewRestaurant, canViewOffreSpeciale } = useRBAC();
  const [isClient, setIsClient] = useState(false);

  // Éviter l'erreur d'hydration en s'assurant que le composant est rendu côté client
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  // Définir les éléments de navigation en fonction des permissions RBAC
  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Tableau de bord',
      defaultIcon: '/icons/sidebar/home.png',
      whiteIcon: '/icons/sidebar/home-white.png',
      canAccess: () => user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'MARKETING' // Dashboard spécial
    },
    {
      id: 'menus',
      label: 'Menus',
      defaultIcon: '/icons/sidebar/menu.png',
      whiteIcon: '/icons/sidebar/menu-white.png',
      canAccess: canViewPlat
    },
    {
      id: 'orders',
      label: 'Commandes',
      defaultIcon: '/icons/sidebar/commande.png',
      whiteIcon: '/icons/sidebar/commande-white.png',
      canAccess: canViewCommande
    },
    {
      id: 'clients',
      label: 'Clients',
      defaultIcon: '/icons/sidebar/client.png',
      whiteIcon: '/icons/sidebar/client-white.png',
      canAccess: canViewClient
    },
    {
      id: 'inventory',
      label: 'Inventaires',
      defaultIcon: '/icons/sidebar/inventaire.png',
      whiteIcon: '/icons/sidebar/inventaire-white.png',
      canAccess: () => canViewPlat() // Inventaire lié aux plats/catégories
    },
    {
      id: 'restaurants',
      label: 'Restaurants',
      defaultIcon: '/icons/sidebar/restaurants.png',
      whiteIcon: '/icons/sidebar/restaurants-white.png',
      canAccess: canViewRestaurant
    },
    {
      id: 'personnel',
      label: 'Personnel',
      defaultIcon: '/icons/sidebar/client.png',
      whiteIcon: '/icons/sidebar/client-white.png',
      canAccess: canViewUtilisateur
    },
    // {
    //   id: 'ads',
    //   label: 'Publicités',
    //   defaultIcon: '/icons/sidebar/publicites.png',
    //   whiteIcon: '/icons/sidebar/publicites-white.png',
    //   showForRoles: ['ADMIN']
    // },
    {
      id: 'promos',
      label: 'Promotions',
      defaultIcon: '/icons/sidebar/promotions.png',
      whiteIcon: '/icons/sidebar/promotions-white.png',
      canAccess: canViewOffreSpeciale
    },
    {
      id: 'loyalty',
      label: 'Fidélisation',
      defaultIcon: '/icons/sidebar/fidelisation.png',
      whiteIcon: '/icons/sidebar/fidelisation-white.png',
      canAccess: () => false // Désactivé pour l'instant
    },
    // {
    //   id: 'apps',
    //   label: 'Apps et Widgets',
    //   defaultIcon: '/icons/sidebar/widget.png',
    //   whiteIcon: '/icons/sidebar/widget-white.png',
    //   showForRoles: ['ADMIN']
    // }
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <aside className="w-64 bg-white shadow-lg h-screen flex flex-col transition-transform duration-300 ease-in-out">
        {/* Logo */}
        <div className="p-4">
          <div className="flex space-x-2 items-start justify-start">
            <Image src="/icons/sidebar/logo-orange.png" alt="Chicken Nation" width={200} height={100} />
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-2 px-2 flex-1 overflow-y-auto">
          <div className="space-y-1">
            {!isClient ? (
              // Pendant l'hydration, afficher un contenu statique
              <div className="space-y-1">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
                  <div key={index} className="w-full flex items-center space-x-3 px-4 py-[10px] rounded-[14px] opacity-0">
                    <div className="relative w-5 h-5 bg-gray-200 rounded"></div>
                    <span className="text-sm bg-gray-200 rounded h-4 w-20"></span>
                  </div>
                ))}
              </div>
            ) : (
              // Après l'hydration, afficher le contenu réel
              navigationItems.map((item) => {
                // ✅ RBAC: Vérifier les permissions au lieu des rôles hardcodés
                if (!item.canAccess()) {
                  return null;
                }

                return (
                  <SidebarItem
                    key={item.id}
                    icon={<SidebarIcon
                      defaultIcon={item.defaultIcon}
                      whiteIcon={item.whiteIcon}
                      alt={item.label}
                      active={activeTab === item.id}
                    />}
                    label={item.label}
                    active={activeTab === item.id}
                    onClick={() => setActiveTab(item.id)}
                  />
                );
              })
            )}
          </div>
        </nav>

        {/* Bouton de déconnexion */}
        <div className="p-4 border-t border-gray-200">
          <button 
            onClick={handleLogout}
            className={`
              w-full flex items-center cursor-pointer space-x-3 px-4 py-[10px] rounded-[14px]
              text-gray-600 hover:bg-gray-100
              transition-all duration-200
            `}
          >
            <div className="relative w-5 h-5 flex items-center justify-center">
              <LogOut size={20} className="text-[#F17922]" />
            </div>
            <span className="text-sm font-sofia-regular font-normal cursor-pointer text-gray-600">Déconnexion</span>
          </button>
        </div>
      </aside>
    </div>
  );
}