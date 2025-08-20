import React from 'react'
import Modal from '@/components/ui/Modal'
import type { Member } from './MemberView'

interface MemberDeleteModalProps {
  open: boolean
  member: Member | null
  onClose: () => void
  onConfirm: () => void
}

const MemberDeleteModal: React.FC<MemberDeleteModalProps> = ({ open, onClose, onConfirm }) => (
  <Modal isOpen={open} onClose={onClose} title="Supprimer l’utilisateur">
    <div className="text-center text-[#484848] text-[16px] mb-6">
      L&apos;utilisateur perdra totalement tout accès à la plateforme.<br />
      Voulez vous vraiment supprimer cet utilisateur ?
    </div>
    <div className="flex justify-center gap-4">
      <button type="button" className="bg-[#ECECEC] text-[#9796A1] cursor-pointer rounded-lg px-7 py-1 text-[13px]  min-w-[120px]" onClick={onClose}>Non</button>
      <button type="button" className="bg-[#F17922] text-white cursor-pointer rounded-lg px-7 py-1 text-[13px] min-w-[120px]" onClick={onConfirm}>Oui</button>
    </div>
  </Modal>
)

export default MemberDeleteModal
