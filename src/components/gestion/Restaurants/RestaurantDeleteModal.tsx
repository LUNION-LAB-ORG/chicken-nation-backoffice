import React from 'react'
import Modal from '@/components/ui/Modal'
import { Restaurant } from '@/services/restaurantService'

interface RestaurantDeleteModalProps {
  open: boolean
  restaurant: Restaurant | null
  onClose: () => void
  onConfirm: () => void
}

const RestaurantDeleteModal: React.FC<RestaurantDeleteModalProps> = ({ open, restaurant, onClose, onConfirm }) => (
  <Modal isOpen={open} onClose={onClose} title="Supprimer le restaurant">
    <div className="text-center text-[#484848] text-[16px] mb-6">
      Cette action supprimera définitivement le restaurant &quot;{restaurant?.name}&quot; et toutes ses données associées.<br />
      Voulez-vous vraiment supprimer ce restaurant ?
    </div>
    <div className="flex justify-center gap-4">
      <button type="button" className="bg-[#ECECEC] text-[#9796A1] cursor-pointer rounded-lg px-7 py-1 text-[13px] min-w-[120px]" onClick={onClose}>Annuler</button>
      <button type="button" className="bg-[#F17922] text-white cursor-pointer rounded-lg px-7 py-1 text-[13px] min-w-[120px]" onClick={onConfirm}>Supprimer</button>
    </div>
  </Modal>
)

export default RestaurantDeleteModal
