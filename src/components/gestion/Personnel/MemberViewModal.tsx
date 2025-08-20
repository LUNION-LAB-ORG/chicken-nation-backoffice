import React, { useState } from 'react'
import type { Member } from './MemberView'
import Image from 'next/image'


interface MemberViewModalProps {
  open: boolean
  member: Member | null
  onClose: () => void
  onDelete?: (memberId: string) => void
}

const MemberViewModal: React.FC<MemberViewModalProps> = ({ open, member, onClose, onDelete }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  if (!open || !member) return null

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true)
  }

  const handleDeleteConfirm = () => {
    if (deleteConfirmText.toLowerCase() === 'supprimer' && onDelete) {
      onDelete(member.id)
      setShowDeleteConfirm(false)
      setDeleteConfirmText('')
      onClose()
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false)
    setDeleteConfirmText('')
  }

  function getAvatarUrl(member: Member) {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';
    if (!member.image) return '/icons/avatar.png';
    if (member.image.startsWith('http')) return member.image;
    return `${API_BASE_URL}/${member.image}`;
  }

  return (
    <div className="fixed right-0 bottom-0 h-[94vh] w-full lg:w-[55vw] px-1 lg:px-2
     bg-white z-[130] rounded-tl-3xl  shadow-2xl flex flex-col
     overflow-y-auto animate-slideInModal" style={{ top: 'auto' }}>

      <div className="flex items-center px-2 py-6">
        <button className="mr-4 cursor-pointer" onClick={onClose}>
          <Image src="/icons/close.png" alt="Fermer" width={28} height={28} />
        </button>
        <span className="text-[#F17922] text-md lg:text-lg font-semibold">Personnel - Chicken Nation</span>
      </div>
      {/* Titre + rôle */}
      <div className="flex flex-row justify-between items-center px-10 mb-8">
        <span className="text-[#5D5C5C] text-sm lg:text-2xl font-bold">{member.fullname}</span>
        <span className={
          member.role === 'SuperAdmin'
            ? "bg-[#E5F9EB] text-[#34C759] text-base font-bold px-6 py-1.5 lg:pr-32 rounded-full"
            : "bg-[#FBDBA7] text-[#7A3502] text-base font-bold px-6 py-1.5 lg:pr-32 rounded-full"
        }>{member.role}</span>
      </div>
      <div className="text-[#F17922] px-10 text-sm lg:text-base font-semibold mb-2">Informations basiques</div>

      <div className="flex flex-row items-center gap-20 lg:gap-50 px-10 ">
        <span className="text-[#9796A1] text-base font-semibold">Photo de profil</span>
        <Image src={getAvatarUrl(member)} alt="avatar" width={60} height={60} className="w-24 h-24 rounded-full border border-[#F17922]/20 bg-[#FFF6E9] object-contain" />
      </div>

      <div className="px-10 py-6 flex-1 flex flex-col relative">
        <div className="mb-8">
          <div className="mb-3 flex flex-col gap-2">
            <div className="flex flex-row items-center gap-26 lg:gap-64 border-t border-b border-[#ECECEC] py-2">
              <span className="text-[#9796A1]">E-mail</span>
              <span className="font-semibold text-[#232323]">{member.email}</span>
            </div>
            <div className="flex flex-row items-center gap-19 lg:gap-57 border-b border-[#ECECEC] py-2">
              <span className="text-[#9796A1]">Téléphone</span>
              <span className="font-semibold text-start text-[#9796A1]">{member.phone}</span>
            </div>
            <div className="flex flex-row items-center gap-24 lg:gap-62 border-b border-[#ECECEC] py-2">
              <span className="text-[#9796A1]">Adresse</span>
              <span className="font-semibold text-start text-[#9796A1]">{member.address}</span>
            </div>
          </div>
        </div>
        <div className="mb-8">
          <div className='flex flex-row items-center justify-between mb-6'>
          <div className="text-[#F17922] text-sm font-semibold">Activités</div>
          {/* <div className='text-[#71717A] cursor-pointer text-sm font-semibold'>Voir plus</div> */}
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <span className="mt-1 text-[#F17922] text-lg">★</span>
              <div>
                <div className="text-[#F17922] font-semibold">Nouveau produit créé</div>
                <div className="text-[#71717a] text-sm"><span className="font-semibold">SuperAdmin</span> a ajouté le produit <span className="font-semibold">Piments</span></div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-1 text-[#F17922] text-lg">★</span>
              <div>
                <div className="text-[#F17922] font-semibold">Nouvelle catégorie créée</div>
                <div className="text-[#71717a] text-sm"><span className="font-semibold">SuperAdmin</span> a créé la catégorie <span className="font-semibold">Ingrédients</span></div>
              </div>
            </div>
          </div>
        </div>


        <div className="pointer-events-none absolute left-0 bottom-0 w-full h-16 bg-gradient-to-t from-white/90 to-transparent z-20" />
      </div>

      {/* Section de suppression - visible en bas */}
      {onDelete && (
        <div className="px-10 py-4 border-t border-[#ECECEC] bg-gray-50">
          {!showDeleteConfirm ? (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleDeleteClick}
                className="px-6 py-2 bg-red-600 cursor-pointer text-white text-sm font-medium rounded-xl hover:bg-red-700 transition-colors duration-200"
              >
                Zone dangereuse
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-red-600 font-medium mb-2">
                  ⚠️ Suppression définitive de l&apos;utilisateur
                </p>
                <p className="text-xs text-gray-600 mb-4">
                  Cette action est irréversible. L&apos;utilisateur perdra définitivement accès à la plateforme.
                </p>
                <p className="text-xs text-gray-800 mb-3"> Pour confirmer, tapez <span className="font-bold">supprimer</span> ci-dessous :
                </p>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full max-w-xs mx-auto px-3 py-2 cursor-pointer border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Tapez 'supprimer'"
                />
              </div>
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={handleDeleteCancel}
                  className="px-4 py-2 text-xs cursor-pointer bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={deleteConfirmText.toLowerCase() !== 'supprimer'}
                  className="px-4 py-2 text-xs bg-red-600 text-white cursor-pointer rounded-xl hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  Supprimer définitivement
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default MemberViewModal
