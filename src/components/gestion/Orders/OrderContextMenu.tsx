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
  onSetPreparationTime?: () => void; // ✅ Simplifié pour le menu contextuel
}

interface OrderContextMenuWithModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onAccept?: (orderId: string) => void;
  onReject?: (orderId: string) => void;
  onViewDetails: (order: Order) => void;
  onHideFromList?: (orderId: string) => void;
  onRemoveFromList?: (orderId: string) => void;
  onSetPreparationTime?: (orderId: string, preparationTime: number, deliveryTime: number) => void; // ✅ Version complète
}

const OrderContextMenu: React.FC<OrderContextMenuProps> = ({
  order,
  isOpen,
  onClose,
  onAccept,
  onReject,
  onViewDetails,
  onHideFromList,
  onRemoveFromList,
  onSetPreparationTime
}) => {
  const { canAcceptCommande, canRejectCommande, canViewCommande, canDeleteCommande } = useRBAC()
  const isAccepted = order.status !== 'NOUVELLE';

  const handleAccept = () => {
    if (onAccept) {
      onAccept(order.id);
      onClose();
    }
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
            {canAcceptCommande && onSetPreparationTime && (
              <button
                type="button"
                className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 text-orange-600 hover:bg-orange-50 cursor-pointer font-medium"
                onClick={() => {
                  console.log('🎯 [OrderContextMenu] Clic sur définir temps de préparation');
                  if (onSetPreparationTime) {
                    onSetPreparationTime();
                  }
                }}
              >
                <Clock size={16} />
                <span>Définir temps de préparation</span>
              </button>
            )}
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
  );
};

// Composant séparé pour le modal au niveau racine
export const OrderContextMenuWithModal: React.FC<OrderContextMenuWithModalProps> = (props) => {
  const [isPreparationTimeModalOpen, setIsPreparationTimeModalOpen] = useState(false);
  
  console.log('🔄 [OrderContextMenuWithModal] Re-render, isPreparationTimeModalOpen:', isPreparationTimeModalOpen);

  useEffect(() => {
    console.log('🔄 [OrderContextMenuWithModal] useEffect - isPreparationTimeModalOpen changed to:', isPreparationTimeModalOpen);
  }, [isPreparationTimeModalOpen]);

  const handleSetPreparationTime = (orderId: string, preparationTime: number, deliveryTime: number) => {
    if (props.onSetPreparationTime) {
      props.onSetPreparationTime(orderId, preparationTime, deliveryTime);
    }
    setIsPreparationTimeModalOpen(false);
  };

  return (
    <>
      <OrderContextMenu
        {...props}
        onSetPreparationTime={props.onSetPreparationTime ? () => {
          console.log('🎯 [OrderContextMenuWithModal] Ouverture du modal');
          console.log('📊 État avant:', isPreparationTimeModalOpen);
          setIsPreparationTimeModalOpen(true);
          console.log('📊 État après setIsPreparationTimeModalOpen(true)');
          props.onClose();
        } : undefined}
      />

      {/* Modal rendu au niveau racine */}
      <PreparationTimeModal
        isOpen={isPreparationTimeModalOpen}
        onClose={() => {
          console.log('🔒 [OrderContextMenuWithModal] Fermeture du modal');
          setIsPreparationTimeModalOpen(false);
        }}
        onConfirm={(preparationTime: number, deliveryTime: number) =>
          handleSetPreparationTime(props.order.id, preparationTime, deliveryTime)
        }
        orderReference={props.order.reference}
      />
    </>
  );
};

export default OrderContextMenu;
