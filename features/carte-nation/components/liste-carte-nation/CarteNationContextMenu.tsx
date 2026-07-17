import { CreditCard, Lock, RefreshCw, Trash2, Unlock, User } from "lucide-react";
import React, { useCallback } from "react";
import { useClientActions } from "../../../customer/hooks/useClientActions";
import { NationCard } from "../../types/carte-nation.types";
import { useDashboardStore } from "@/store/dashboardStore";
import { HasPermission } from "../../../users/components/HasPermission";
import { Action, Modules } from "../../../users/types/auth.type";

interface CarteNationContextMenuProps {
  carteNation: NationCard;
  isOpen: boolean;
  onClose: () => void;
}

const CarteNationContextMenu: React.FC<CarteNationContextMenuProps> = ({
  carteNation,
  isOpen,
  onClose,
}) => {
  const { toggleModal, setSelectedItem } = useDashboardStore();

  const { handleViewClientProfile } = useClientActions();

  const handleViewProfile = () => {
    // Note: On passe l'objet customer directement depuis la carte
    handleViewClientProfile(carteNation?.customer);
    onClose();
  };

  const handleToggleCardModal = useCallback(
    (carte: NationCard, modalName: string) => {
      toggleModal("card_nation", modalName);
      setSelectedItem("card_nation", carte);
    },
    [toggleModal, setSelectedItem]
  );
  if (!isOpen) return null;

  return (
    <div className="client-context-menu w-56 bg-white rounded-lg shadow-xl overflow-hidden border border-gray-200">
      <div className="py-1">
        <HasPermission module={Modules.CARD_NATION} action={Action.READ}>
          <>
            <button
              type="button"
              className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 text-gray-700 hover:bg-orange-50"
              onClick={handleViewProfile}
            >
              <User size={16} className="text-gray-400" />
              <span>Profil du détenteur</span>
            </button>
            <button
              type="button"
              className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 text-gray-700 hover:bg-orange-50"
              onClick={() => {
                handleToggleCardModal(carteNation, "viewCard");
                onClose();
              }}
            >
              <CreditCard size={16} className="text-gray-400" />
              <span>Voir le visuel de la carte</span>
            </button>
            {/* Régénère le visuel avec un type choisi (numéro et QR conservés) */}
            <button
              type="button"
              className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 text-gray-700 hover:bg-orange-50"
              onClick={() => {
                handleToggleCardModal(carteNation, "regenerate");
                onClose();
              }}
            >
              <RefreshCw size={16} className="text-[#F17922]" />
              <span>Régénérer la carte</span>
            </button>
            {carteNation.status != "ACTIVE" ? (
              <button
                type="button"
                className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 text-gray-700 hover:bg-orange-50"
                onClick={() => {
                  handleToggleCardModal(carteNation, "activate");
                  onClose();
                }}
              >
                <Unlock size={16} className="text-green-400" />
                <span>Activer</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 text-gray-700 hover:bg-orange-50"
                  onClick={() => {
                    handleToggleCardModal(carteNation, "suspend");
                    onClose();
                  }}
                >
                  <Lock size={16} className="text-orange-400" />
                  <span>Suspendre</span>
                </button>
                <button
                  type="button"
                  className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 text-gray-700 hover:bg-orange-50"
                  onClick={() => {
                    handleToggleCardModal(carteNation, "revoke");
                    onClose();
                  }}
                >
                  <Trash2 size={16} className="text-red-400" />
                  <span>Revoquer</span>
                </button>
              </>
            )}
          </>
        </HasPermission>
        {/* Suppression DÉFINITIVE (≠ révoquer, qui est réversible) */}
        <HasPermission module={Modules.CARD_NATION} action={Action.DELETE}>
          <button
            type="button"
            className="w-full border-t border-gray-100 px-4 py-2 text-left text-sm flex items-center gap-2 text-red-600 hover:bg-red-50"
            onClick={() => {
              handleToggleCardModal(carteNation, "deleteCard");
              onClose();
            }}
          >
            <Trash2 size={16} className="text-red-500" />
            <span>Supprimer définitivement</span>
          </button>
        </HasPermission>
      </div>
    </div>
  );
};

export default CarteNationContextMenu;
