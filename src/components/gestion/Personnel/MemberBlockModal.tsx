import React from 'react'
import Modal from '@/components/ui/Modal'
import type { Member } from './MemberView'

interface MemberBlockModalProps {
  open: boolean
  member: Member | null
  onClose: () => void
  onConfirm: () => void
}

const MemberBlockModal: React.FC<MemberBlockModalProps> = ({ open,   onClose, onConfirm }) => (
  <Modal isOpen={open} onClose={onClose} title="Supprimer l’utilisateur">
    <div className="text-center text-[#484848] text-[16px] mb-6">
      L&apos;utilisateur sera suspendu de la plateforme.<br />
      Voulez vous vraiment supprimer cet utilisateur ?
    </div>
    <div className="flex justify-center gap-4">
      <button className="bg-[#ECECEC] text-[#9796A1] cursor-pointer rounded-lg px-7 py-1 text-[13px]  min-w-[120px]" onClick={onClose}>Non</button>
      <button className="bg-[#F17922] text-white cursor-pointer rounded-lg px-7 py-1 text-[13px] min-w-[120px]" onClick={onConfirm}>Oui</button>
    </div>
  </Modal>
)

export default MemberBlockModal
