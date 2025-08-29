"use client";

import { Menu, ChevronDown, LogOut } from "lucide-react";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { formatImageUrl, isValidImageUrl } from "@/utils/imageHelpers";
import { MessagesResponse } from '@/types/messaging';
import EditMember from "@/components/gestion/Personnel/EditMember";
import NotificationDropdown from "@/components/ui/NotificationDropdown"; 
import { User } from "@/types/auth";
import { useConversationsQuery } from '@/hooks/useConversationsQuery';
import { useConversationsSocket } from '@/hooks/useConversationsSocket';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useQueryClient } from '@tanstack/react-query';
import { markMessagesAsRead } from '@/services/messageService';

interface HeaderProps {
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
  className?: string;
}

export default function Header({
  toggleSidebar,
  isSidebarOpen,
  className,
}: HeaderProps) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [isMessageDropdownOpen, setIsMessageDropdownOpen] = useState(false);
  // Messages réels récupérés via React Query
  const { data: conversationsData, isLoading: isLoadingConversations } = useConversationsQuery();

  // Activer l'écoute WebSocket pour actualiser en temps réel
  useConversationsSocket();

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const queryClient = useQueryClient();

  const conversations = conversationsData?.data || [];

  // Construire la liste des messages non lus à partir des conversations
  const currentUserId = user?.id;

  const unreadMessagesList = conversations
    .flatMap((c) => (c.messages || []).map((m) => ({ ...m, conversationId: c.id, customer: c.customer })))
    // Ne garder que les messages non lus ET qui ne sont pas envoyés par l'utilisateur courant
    .filter((m) => {
      const isUnread = m.isRead === false;
      const isFromCustomer = !!m.authorCustomer;
      const isFromOtherUser = !!m.authorUser && m.authorUser.id !== currentUserId;
      return isUnread && (isFromCustomer || isFromOtherUser);
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const totalUnread = unreadMessagesList.length;

  const formatTimestamp = (dateString?: string) => {
    if (!dateString) return '';
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: fr });
    } catch {
      return '';
    }
  };

  // Preview: prendre les derniers messages non lus
  const recentUnread = unreadMessagesList.slice(0, 6);
  const [isClient, setIsClient] = useState(false);

  // Éviter l'erreur d'hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fonction pour obtenir l'URL de l'avatar de manière consistante
  const getAvatarUrl = () => {
    if (!isClient || !user?.image) {
      return "/icons/header/default-avatar.png";
    }
    return formatImageUrl(user.image) || "/icons/header/default-avatar.png";
  };

  // Fonction pour obtenir le nom utilisateur de manière consistante
  const getUserDisplayName = () => {
    if (!isClient) {
      return "Utilisateur";
    }
    return user?.fullname || "Utilisateur";
  };

  // Suppression du code lié à fetchStats/messages

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Fermer le dropdown quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMessageDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClickOutside = () => setIsDropdownOpen(false);

  // Éviter le rendu avant l'hydratation complète
  if (!isClient) {
    return (
      <header className={`bg-white border-b border-gray-200 shadow-3xl ${className}`}>
        <div className="flex items-center justify-between h-14 flex-row">
          <button
            onClick={toggleSidebar}
            className="p-4 hover:bg-orange-100 rounded-lg transition-colors duration-200"
            aria-label="Menu"
          >
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
        {/* Menu Hamburger */}
        <button
          onClick={toggleSidebar}
          className="p-4 hover:bg-orange-100 rounded-lg transition-colors duration-200"
          aria-label={isSidebarOpen ? "Fermer le menu" : "Ouvrir le menu"}
        >
          <Menu size={20} className="text-gray-800" />
        </button>
        {/* Espace flexible pour les petits écrans */}
        <div className="flex-1 md:hidden"></div>

        {/* Icones  à droite */}
        <div className="flex items-end justify-end  px-4 space-x-8">
          {/* Notifications */}
          <NotificationDropdown />

          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMessageDropdownOpen((open) => !open)}
              className="relative p-2 rounded-lg cursor-pointer hover:bg-orange-50 transition-colors"
              title="Messages"
            >
              <Image
                src="/icons/header/mail.png"
                alt="Mail"
                width={24}
                height={24}
                className="text-gray-600"
              />
              {/* Badge de notification pour les messages non lus */}
              {totalUnread > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                  {totalUnread > 99 ? "99+" : totalUnread}
                </span>
              )}
            </button>
            {/* Dropdown messages */}
            {isMessageDropdownOpen && (
              <div ref={dropdownRef} className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Messages</h3>
                  {totalUnread > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        // Marquer localement comme lu toutes les conversations contenant des messages non lus
                        const convIds = Array.from(new Set(unreadMessagesList.map((m) => m.conversationId)));
                        convIds.forEach((id) => {
                          // Mettre à jour les messages localement (isRead=true)
                          queryClient.setQueryData<MessagesResponse>(['messages', id], (oldData) => {
                            if (!oldData) return oldData as any;
                            return {
                              ...oldData,
                              data: oldData.data.map((msg) => ({ ...msg, isRead: true }))
                            };
                          });
                        });

                        // Invalider légèrement pour rafraîchir si besoin (mais on reste local)
                        convIds.forEach((id) => queryClient.invalidateQueries({ queryKey: ['messages', id] }));
                        queryClient.invalidateQueries({ queryKey: ['conversations'] });
                      }}
                      className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                    >
                      Tout marquer comme lu
                    </button>
                  )}
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {isLoadingConversations ? (
                    <div className="p-4 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                      <p className="text-sm text-gray-500 mt-2">Chargement...</p>
                    </div>
                  ) : recentUnread.length === 0 ? (
                    <div className="p-4 text-center">
                      <p className="text-sm text-gray-500">Aucun nouveau message</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {recentUnread.map((msg) => {
                        const senderName = msg.authorCustomer
                          ? (msg.authorCustomer.name || `${msg.authorCustomer.first_name || ''} ${msg.authorCustomer.last_name || ''}`.trim())
                          : msg.authorUser
                          ? msg.authorUser.email || msg.authorUser.id
                          : 'Client';

                        const rawAvatar = msg.authorCustomer?.image || msg.authorUser?.image || null;
                        const avatarUrl = rawAvatar ? formatImageUrl(rawAvatar) : null;
                        
                        // Debug pour voir les URLs d'avatar
                        if (process.env.NODE_ENV === 'development') {
                          console.log('🖼️ [Header] Avatar debug:', {
                            messageId: msg.id,
                            senderName,
                            rawAvatar,
                            avatarUrl,
                            authorCustomer: !!msg.authorCustomer,
                            authorUser: !!msg.authorUser
                          });
                        }

                        return (
                          <div
                            key={msg.id}
                            onClick={() => {
                              setIsMessageDropdownOpen(false);
                              if (window && window.dispatchEvent) {
                                window.dispatchEvent(new CustomEvent('openInboxFromHeader', { detail: { conversationId: msg.conversationId } }));
                              }
                            }}
                            className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${!msg.isRead ? 'bg-orange-50' : ''}`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                                    {avatarUrl ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img 
                                        src={avatarUrl} 
                                        alt={senderName} 
                                        className="w-full h-full object-cover" 
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement;
                                          target.src = "/icons/header/default-avatar.png";
                                        }}
                                      />
                                    ) : (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img 
                                        src="/icons/header/default-avatar.png" 
                                        alt={senderName} 
                                        className="w-full h-full object-cover" 
                                      />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900">{senderName}</p>
                                    <p className="text-sm text-gray-600 line-clamp-2">{msg.body}</p>
                                    <p className="text-xs text-gray-400 mt-1">{formatTimestamp(msg.createdAt)}</p>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 ml-2">
                                <button
                                  type="button"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                      await markMessagesAsRead(msg.conversationId);
                                    } catch (err) {
                                      console.warn('Erreur mark as read', err);
                                    }
                                    queryClient.invalidateQueries({ queryKey: ['conversations'] });
                                    queryClient.invalidateQueries({ queryKey: ['messages', msg.conversationId] });
                                  }}
                                  className={`p-1 rounded-full transition-colors text-gray-400 hover:text-orange-500`}
                                  title={msg.isRead ? 'Marquer comme non lue' : 'Marquer comme lue'}
                                >
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

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
              onClick={toggleDropdown}
              className="flex items-center space-x-3 p-2 cursor-pointer rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <span className="text-sm text-gray-700">
                  {getUserDisplayName()}
                </span>
              </div>
              <div className="w-8 h-8 bg-gray-200 rounded-full cursor-pointer  overflow-hidden">
                <Image
                  src={getAvatarUrl()}
                  alt={getUserDisplayName()}
                  width={32}
                  height={32}
                  className="w-full h-full cursor-pointer  object-cover"
                  unoptimized={true}
                />
              </div>
              <ChevronDown
                size={16}
                className={`text-gray-500 transition-transform ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
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
                          src={getAvatarUrl()}
                          alt={getUserDisplayName()}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                          unoptimized={true}
                        />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {getUserDisplayName()}
                        </p>
                        <p className="text-sm text-gray-500 capitalize">
                          Profil
                        </p>
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
            type: user.type || "",
            image: user.image || undefined,
            phone: user.phone || "",
            address: user.address || "",

            entity_status: user.entity_status as
              | "NEW"
              | "ACTIVE"
              | "INACTIVE"
              | "DELETED"
              | undefined,
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

 
    </header>
  );
}
