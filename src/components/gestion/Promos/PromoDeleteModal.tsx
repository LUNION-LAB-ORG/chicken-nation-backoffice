import React from 'react'
import Modal from '@/components/ui/Modal'
import { ApiPromotion } from '@/services/promotionService'

interface PromoDeleteModalProps {
  open: boolean
  promo: ApiPromotion | null
  onClose: () => void
  onConfirm: () => void
}

const PromoDeleteModal: React.FC<PromoDeleteModalProps> = ({ open, promo, onClose, onConfirm }) => (
  <Modal isOpen={open} onClose={onClose} title="Supprimer la promotion">
    <div className="text-center text-[#484848] text-[16px] mb-6">
      Cette action supprimera définitivement la promotion &quot;{promo?.title}&quot; et toutes ses données associées.<br />
      Voulez-vous vraiment supprimer cette promotion ?
    </div>
    <div className="flex justify-center gap-4">
      <button className="bg-[#ECECEC] text-[#9796A1] cursor-pointer rounded-lg px-7 py-1 text-[13px] min-w-[120px]" onClick={onClose}>Annuler</button>
      <button className="bg-[#F04438] text-white cursor-pointer rounded-lg px-7 py-1 text-[13px] min-w-[120px]" onClick={onConfirm}>Supprimer</button>
    </div>
  </Modal>
)

export default PromoDeleteModal
