"use client"

import React, { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Checkbox from '@/components/ui/Checkbox'
import MemberActionsMenu from './MemberActionsMenu'
import MemberDeleteModal from './MemberDeleteModal'
import MemberBlockModal from './MemberBlockModal'
import MemberViewModal from './MemberViewModal'
import EditMember from './EditMember'
import { createPortal } from 'react-dom'
import { User, deleteUser, blockUser, restoreUser } from '@/services/userService';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { getHumanReadableError, getPersonnelSuccessMessage } from '@/utils/errorMessages';
import { useRBAC } from '@/hooks/useRBAC';

export interface Member {
  id: string;
  fullname: string; // Changed from name to fullname
  email: string;
  role: string;
  image?: string;
  restaurant?: string | { id: string; name: string }; // Simplified restaurant type
  phone?: string;
  address?: string;
  // status?: 'NEW' | 'ACTIVE' | 'INACTIVE' | 'DELETED'; // Removed status field
  entity_status?: 'NEW' | 'ACTIVE' | 'INACTIVE' | 'DELETED'; // Kept entity_status
}

interface MemberViewProps {
  members: Member[]
  onRefresh?: () => void;
  isReadOnly?: boolean;
}

const MemberView: React.FC<MemberViewProps> = ({ members, onRefresh, isReadOnly = false }) => {
  // Récupérer l'utilisateur connecté pour le filtrer de la liste
  const { user: currentUser } = useAuthStore();
  const { canUpdateUtilisateur, canDeleteUtilisateur } = useRBAC();

  // Filtrer l'utilisateur connecté de la liste pour éviter qu'il se bloque/supprime lui-même
  const filteredMembers = members.filter(member => {
    if (!currentUser) return true; // Si pas d'utilisateur connecté, afficher tous
    return member.id !== currentUser.id; // Exclure l'utilisateur connecté
  });

  const [selected, setSelected] = useState<string[]>([])
  const allChecked = selected.length === filteredMembers.length && filteredMembers.length > 0
  const toggleAll = () => setSelected(allChecked ? [] : filteredMembers.map(m => m.id))
  const toggleOne = (id: string) => setSelected(sel => sel.includes(id) ? sel.filter(i => i !== id) : [...sel, id])

  // Actions menu state
  const [menuOpenId, setMenuOpenId] = useState<string|null>(null)
  const [menuPosition, setMenuPosition] = useState<{top: number, left: number}|null>(null)
  // Modal states
  const [modal, setModal] = useState<{type: 'block'|'delete'|'edit', member: Member|null}|null>(null); // Added semicolon and fixed syntax
  const [editMember, setEditMember] = useState<Member|null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showMemberViewModal, setShowMemberViewModal] = useState(false)
  const menuBtnRefs = useRef<Record<string, HTMLSpanElement|null>>({})
  const menuRef = useRef<HTMLDivElement|null>(null)

  // Helper to open menu at correct position
  const handleMenuOpen = (memberId: string, event: React.MouseEvent) => {
    event.stopPropagation();

    if (menuOpenId === memberId) {
      // Si déjà ouvert sur ce membre, toggle (ferme)
      setMenuOpenId(null);
      setMenuPosition(null);
    } else {
      // Utiliser directement la position du clic pour le menu
      setMenuPosition({
        top: event.clientY,
        left: event.clientX
      });
      setMenuOpenId(memberId);
    }
  }

  // Close menu on scroll or click outside
  useEffect(() => {
    if (!menuOpenId) return
    // Handler pour click (détecte clic extérieur)
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && menuRef.current.contains(e.target as Node)) return;
      setMenuOpenId(null); setMenuPosition(null)
    }
    // Handler pour scroll/resize (ferme direct)
    const handleClose = () => { setMenuOpenId(null); setMenuPosition(null) }
    window.addEventListener('scroll', handleClose, true)
    window.addEventListener('resize', handleClose)
    window.addEventListener('click', handleClick)
    return () => {
      window.removeEventListener('scroll', handleClose, true)
      window.removeEventListener('resize', handleClose)
      window.removeEventListener('click', handleClick)
    }
  }, [menuOpenId])

  // Fonction pour rendre le statut avec icône et couleur
  const renderStatus = (status: Member['entity_status'] = 'ACTIVE') => { // Changed to only accept entity_status
    const statusConfig = {
      'NEW': {
        label: 'Nouveau',
        icon: '●',
        className: 'text-blue-500 bg-blue-50 border-blue-200'
      },
      'ACTIVE': {
        label: 'Actif',
        icon: '●',
        className: 'text-green-500 bg-green-50 border-green-200'
      },
      'INACTIVE': {
        label: 'Supprimé',
        icon: '⚠',
        className: 'text-red-500 bg-red-50 border-red-200'
      },
      'DELETED': {
        label: 'Supprimé',
        icon: '✕',
        className: 'text-red-500 bg-red-50 border-red-200'
      }
    };

    // Normaliser le statut et fournir une valeur par défaut
    const normalizedStatus = status || 'ACTIVE';
    const config = statusConfig[normalizedStatus as keyof typeof statusConfig] || statusConfig['ACTIVE'];

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${config.className}`}>
        <span className="text-sm">{config.icon}</span>
        {config.label}
      </span>
    );
  };

  function getImageUrl(member: Member) {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';
    if (!member.image) return '/icons/avatar.png';


    const cacheBuster = `?t=${Date.now()}`;

    if (member.image.startsWith('http')) {

      return `${member.image}${cacheBuster}`;
    }


    return `${API_BASE_URL}/${member.image}${cacheBuster}`;
  }


  function normalizeMemberImage(member: Member | null): (User & { image?: string }) | null {
    if (!member) return null;

    // Convertir Member en User
    const userMember: User & { image?: string } = {
      id: member.id,
      fullname: member.fullname, // Changed from member.name
      email: member.email,
      role: member.role,
      type: '', // Assuming type is not present or needed here, adjust if necessary
      restaurant: typeof member.restaurant === 'object' ? { ...member.restaurant, name: member.restaurant.name } : undefined,
      phone: member.phone || '',
      address: member.address || '',
      image: member.image,
      entity_status: member.entity_status // Added entity_status
    };

    return userMember;
  }

  // Fonctions de gestion des actions utilisateur
  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUser(userId);
      toast.success(getPersonnelSuccessMessage('delete'));
      if (onRefresh) {
        onRefresh();
      }
    } catch (error: unknown) {
      // console.error('Erreur lors de la suppression:', error);
      const userMessage = getHumanReadableError(error);
      toast.error(userMessage);
    }
  };

  const handleBlockUser = async (userId: string) => {
    try {
      await blockUser(userId);
      toast.success('Utilisateur bloqué avec succès');
      if (onRefresh) {
        onRefresh();
      }
    } catch (error: unknown) {
      // console.error('Erreur lors du blocage:', error);
      const userMessage = getHumanReadableError(error);
      toast.error(userMessage);
    }
  };

  const handleRestoreUser = async (userId: string) => {
    try {
      await restoreUser(userId);
      toast.success('Utilisateur restauré avec succès');
      if (onRefresh) {
        onRefresh();
      }
    } catch (error: unknown) {
      // console.error('Erreur lors de la restauration:', error);
      const userMessage = getHumanReadableError(error);
      toast.error(userMessage);
    }
  };

  // Fonction utilitaire pour mapper les statuts backend vers les statuts du menu
  const mapStatusForMenu = (status: Member['entity_status']): 'active' | 'blocked' | 'deleted' => { // Changed to only accept entity_status
    switch (status) {
      case 'NEW':
      case 'ACTIVE':
        return 'active';
      case 'INACTIVE':
        return 'blocked';
      case 'DELETED':
        return 'deleted';
      default:
        return 'active';
    }
  };

  return (
    <div className="w-full  min-h-screen mt-2">
      {/* Table desktop */}
      <table className="w-full bg-white border-separate border-spacing-0 hidden md:table">
        <thead className="border-b border-[#ECECEC]">
          <tr className="text-[#9796A1] text-[14px]">
            <th className="px-4 py-2 w-8 border-b-2 border-[#A1A1AA]/50">
              <Checkbox checked={allChecked} onChange={toggleAll} />
            </th>
            <th className="font-bold text-[#71717A]  px-0 py-2 text-left border-b-2  pl-10 border-[#A1A1AA]/50">Utilisateur</th>
            <th className="font-bold text-[#71717A] px-0 py-2 text-left border-b-2 border-[#A1A1AA]/50">Rôle</th>
            <th className="font-bold text-[#71717A] px-0 py-2 text-left border-b-2 border-[#A1A1AA]/50">Status</th>
            <th className="px-4 py-2 w-10 border-b-2 border-[#A1A1AA]/50">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredMembers.map((member) => {
            const memberStatus = member.entity_status || 'ACTIVE'; // Simplified to use only entity_status
            const isDisabled = memberStatus === 'DELETED' || memberStatus === 'INACTIVE';
            const rowClassName = `border-t border-[#ECECEC] relative hover:bg-[#FFF6E9]/60 transition cursor-pointer ${
              isDisabled ? 'bg-gray-50' : ''
            }`;
            const contentOpacity = isDisabled ? 'opacity-50' : '';

            return (
              <tr key={member.id} className={rowClassName}
                onClick={() => { setEditMember(member); setShowAddModal(false); setModal(null); setShowMemberViewModal(true); }}>
                <td className={`px-4 py-2 w-8 ${contentOpacity}`} onClick={e => e.stopPropagation()}>
                  {!isReadOnly && (
                    <Checkbox
                      checked={selected.includes(member.id)}
                      onChange={() => toggleOne(member.id)}
                    />
                  )}
                </td>
                <td className={`px-0 py-2 ${contentOpacity}`}>
                  <div className="flex ml-10 items-center gap-2 min-w-[180px]">
                    <div className="w-8 h-8 rounded-full bg-[#FFF6E9] flex items-center justify-center overflow-hidden ">
                      <Image src={getImageUrl(member)} alt={member.fullname} width={60} height={60} className="object-contain w-full h-full" unoptimized={getImageUrl(member).startsWith('/icons/')} />
                    </div>
                    <span className="text-sm lg:text-[15px] text-[#232323] font-normal">{member.fullname}</span>
                  </div>
                </td>
                <td className={`px-0 py-2 ${contentOpacity}`}>
                  <span className={
                    member.role === 'SuperAdmin'
                      ? "bg-[#E5F9EB] text-[#34C759] text-[14px] font-bold px-4 py-1 rounded-full inline-block min-w-[240px] text-start"
                      : "bg-[#FBDBA7] text-[#7A3502] text-[14px] font-bold px-4 py-1 rounded-full inline-block min-w-[240px] text-start"
                  }>
                    {member.role}
                  </span>
                </td>
                <td className={`px-0 py-2 ${contentOpacity}`}>
                  {renderStatus(member.entity_status)}
                </td>
                <td className={`px-0 py-2 text-[15px] text-[#232323] ${contentOpacity}`}>{member.email}</td>
                <td className="px-4 py-2 w-10 text-right relative" onClick={e => e.stopPropagation()}>
                  {!isReadOnly && (canUpdateUtilisateur || canDeleteUtilisateur) && (
                    <span
                      className="text-[#71717A] text-md lg:text-lg cursor-pointer select-none"
                      ref={el => { if (el) menuBtnRefs.current[member.id] = el; }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMenuOpen(member.id, e);
                      }}
                    >•••</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Cards mobile */}
      <div className="flex flex-col gap-4 md:hidden">
        {filteredMembers.map((member) => {
          const memberStatus = member.entity_status || 'ACTIVE';
          const isDisabled = memberStatus === 'DELETED' || memberStatus === 'INACTIVE';
          const contentOpacity = isDisabled ? 'opacity-50' : '';
          const cardBg = isDisabled ? 'bg-gray-50' : 'bg-white';

          return (
            <div key={member.id} className={`${cardBg} rounded-xl shadow-sm border border-[#ECECEC] p-4 flex items-center gap-4 cursor-pointer hover:bg-[#FFF6E9]/60 transition`}
              onClick={() => setModal({ type: 'edit', member })}>
              <div className={`w-14 h-14 rounded-full bg-[#FFF6E9] flex items-center justify-center overflow-hidden ${contentOpacity}`}>
                <Image src={getImageUrl(member)} alt={member.fullname} width={56} height={56}
                 className="object-cover w-full h-full" unoptimized={getImageUrl(member).startsWith('/icons/')} />
              </div>
              <div className={`flex-1 min-w-0 ${contentOpacity}`}>
                <div className="flex items-center flex-row justify-between gap-2">
                  <span className="text-[13px] text-[#232323] font-semibold truncate">{member.fullname}</span>
                  <span className={
                    member.role === 'SuperAdmin'
                      ? "bg-[#E5F9EB] text-[#34C759] text-[10px] font-bold px-2 py-0.5 rounded-full"
                      : "bg-[#FBDBA7] text-[#7A3502] text-[10px] font-bold px-2 py-0.5 rounded-full"
                  }>{member.role}</span>
                </div>
                <div className="text-[12px] text-[#71717A] truncate">{member.email}</div>
                {member.restaurant && member.role !== 'SuperAdmin' && (
                  <div className="text-[13px] text-[#F17922] mt-1 font-medium">
                    {typeof member.restaurant === 'string' ? member.restaurant : member.restaurant.name || 'Restaurant'}
                  </div>
                )}
              </div>
              {currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER') && (
                <span
                  className="text-[#71717A] text-lg cursor-pointer select-none px-2"
                  ref={el => { if (el) menuBtnRefs.current[member.id] = el; }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMenuOpen(member.id, e);
                  }}
                >•••</span>
              )}
            </div>
          );
        })}
      </div>


      {menuOpenId && menuPosition && typeof document !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`,
            zIndex: 9999,
            transform: 'translate(-50%, 10px)'
          }}
        >
          <MemberActionsMenu
            memberStatus={mapStatusForMenu(filteredMembers.find(m => m.id === menuOpenId)?.entity_status || 'ACTIVE')}
            onViewProfile={() => {
              setMenuOpenId(null);
              setMenuPosition(null);
              setModal({ type: 'edit', member: filteredMembers.find(m => m.id === menuOpenId)! })
            }}
            onBlock={() => {
              setMenuOpenId(null);
              setMenuPosition(null);
              setModal({ type: 'block', member: filteredMembers.find(m => m.id === menuOpenId)! })
            }}
            onUnblock={() => {
              setMenuOpenId(null);
              setMenuPosition(null);
              handleRestoreUser(menuOpenId!);
            }}
            onReactivate={() => {
              setMenuOpenId(null);
              setMenuPosition(null);
              handleRestoreUser(menuOpenId!);
            }}
            onClose={() => { setMenuOpenId(null); setMenuPosition(null) }}
          />
        </div>,
        document.body
      )}


      <MemberDeleteModal
        open={!!modal && modal.type === 'delete'}
        member={modal?.member || null}
        onClose={() => setModal(null)}
        onConfirm={() => {
          if (modal?.member) {
            handleDeleteUser(modal.member.id);
          }
          setModal(null)
        }}
      />

      <MemberBlockModal
        open={!!modal && modal.type === 'block'}
        member={modal?.member || null}
        onClose={() => setModal(null)}
        onConfirm={() => {
          if (modal?.member) {
            handleBlockUser(modal.member.id);
          }
          setModal(null)
        }}
      />

      <MemberViewModal
        open={!!modal && modal.type === 'edit'}
        member={modal?.member || null}
        onClose={() => setModal(null)}
        onDelete={handleDeleteUser}
      />

      {showAddModal && editMember && (
        <EditMember
          existingMember={normalizeMemberImage(editMember)!}
          onCancel={() => { setShowAddModal(false); setEditMember(null) }}
          onSuccess={() => {
            setShowAddModal(false);
            setEditMember(null);

            if (onRefresh) {
              onRefresh();
            }
          }}
        />
      )}

      {showMemberViewModal && (
        <MemberViewModal
          open={showMemberViewModal}
          member={editMember}
          onClose={() => setShowMemberViewModal(false)}
          onDelete={handleDeleteUser}
        />
      )}
    </div>
  )
}

export default MemberView
