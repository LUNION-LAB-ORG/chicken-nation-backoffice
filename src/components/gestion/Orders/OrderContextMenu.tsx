import React, { useState, useEffect } from 'react';
import { X, Clock } from 'lucide-react';
import { Order } from './OrdersTable';
import Image from 'next/image';
import { useRBAC } from '@/hooks/useRBAC';
import PreparationTimeModal from './PreparationTimeModal';

interface OrderContextMenuProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onAccept?: (orderId: string) => void;      // ✅ Optionnel pour contrôle RBAC
  onReject?: (orderId: string) => void;      // ✅ Optionnel pour contrôle RBAC
  onViewDetails: (order: Order) => void;     // ✅ Toujours disponible (lecture)
  onHideFromList?: (orderId: string) => void; // ✅ Optionnel pour contrôle RBAC
  onRemoveFromList?: (orderId: string) => void; // ✅ Optionnel pour contrôle RBAC
}


const OrderContextMenu: React.FC<OrderContextMenuProps> = ({
  order,
  isOpen,
  onClose,
  onAccept,
  onReject,
  onViewDetails,
  onHideFromList,
  onRemoveFromList
}) => {
  const { canAcceptCommande, canRejectCommande, canViewCommande, canDeleteCommande } = useRBAC()
  const [isPreparationTimeModalOpen, setIsPreparationTimeModalOpen] = useState(false);
  const isAccepted = order.status !== 'NOUVELLE';

  const handleAccept = () => {
    if (onAccept) {
      onAccept(order.id);
      // ✅ Après acceptation, ouvrir le modal de temps de préparation directement
      setIsPreparationTimeModalOpen(true);
      onClose();
    }
  };

  const handleSetPreparationTime = (preparationTime: number) => {
    // Le modal gère déjà la sauvegarde via la mutation
    setIsPreparationTimeModalOpen(false);
  };

  const handleReject = () => {
    if (onReject) {
      onReject(order.id);
      onClose();
    }
  };

  const handleViewDetails = () => {
    onViewDetails(order);
    onClose();
  };

  const handleHideFromList = () => {
    if (onHideFromList) {
      onHideFromList(order.id);
      onClose();
    }
  };

  const handleRemoveFromList = () => {
    if (onRemoveFromList) {
      onRemoveFromList(order.id);
      onClose();
    }
  };



  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && !(event.target as Element).closest('.order-context-menu') &&
        !(event.target as Element).closest('.menu-button')) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="order-context-menu w-56 bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200"
      >
        <div className="py-1">

          {!isAccepted ? (
            <>
              {canAcceptCommande && (
                <button
                  type="button"
                  className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 text-[#F17922] hover:bg-gray-50 cursor-pointer"
                  onClick={handleAccept}
                >
                  <Image src="/icons/check.png" alt="Accepter" width={20} height={20} />
                  <span>Accepter la commande</span>
                </button>
              )}
              {canRejectCommande && (
                <button
                  type="button"
                  className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 text-red-600 hover:bg-gray-50 cursor-pointer"
                  onClick={handleReject}
                >
                  <X size={16} />
                  <span>Refuser</span>
                </button>
              )}
              {canViewCommande && (
                <button
                  type="button"
                  className="w-full px-4 py-2 text-left text-sm flex items-center font-semibold gap-2 text-[#888891] hover:bg-orange-50 cursor-pointer"
                  onClick={handleViewDetails}
                >
                  <span>Voir les détails</span>
                </button>
              )}
            </>
          ) : (
            <>
              {/* ✅ Bouton 'Définir temps de préparation' supprimé - Maintenant intégré dans 'Accepter' */}
              {canDeleteCommande && (
                <button
                  type="button"
                  className="w-full px-4 py-2 text-left text-sm flex items-center font-bold gap-2 text-[#888891] hover:bg-orange-50 cursor-pointer"
                  onClick={handleHideFromList}
                >
                  <span>Masquer de la liste</span>
                </button>
              )}
              {canDeleteCommande && (
                <button
                  type="button"
                  className="w-full px-4 py-2 text-left text-sm flex items-center font-bold gap-2 text-[#888891] hover:bg-orange-50 cursor-pointer"
                  onClick={handleRemoveFromList}
                >
                  <span>Retirer de la liste</span>
                </button>
              )}
              {canViewCommande && (
                <button
                  type="button"
                  className="w-full px-4 py-2 text-left text-sm flex items-center font-semibold gap-2 text-[#888891] hover:bg-orange-50 cursor-pointer"
                  onClick={handleViewDetails}
                >
                  <span>Voir les détails</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal de temps de préparation intégré directement */}
      <PreparationTimeModal
        isOpen={isPreparationTimeModalOpen}
        onClose={() => setIsPreparationTimeModalOpen(false)}
        onConfirm={handleSetPreparationTime}
        orderReference={order.reference}
        orderId={order.id}
      />
    </>
  );
};

export default OrderContextMenu;
