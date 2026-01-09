import { useRBAC } from "@/hooks/useRBAC";
import { User } from "lucide-react";
import React, { useCallback } from "react";
import { useClientActions } from "../../../hooks/useClientActions";
import { NationCard } from "../../types/carte-nation.types";
import { useDashboardStore } from "@/store/dashboardStore";

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
  const { canViewClient } = useRBAC();

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
        {canViewClient() && (
          <>
            <button
              type="button"
              className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 text-gray-700 hover:bg-orange-50"
              onClick={handleViewProfile}
            >
              <User size={16} className="text-gray-400" />
              <span>Profil du détenteur</span>
            </button>
            {/* Option supplémentaire spécifique à la carte */}
            <button
              type="button"
              className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 text-gray-700 hover:bg-orange-50"
              onClick={() => {
                handleToggleCardModal(carteNation, "viewCard");
                onClose();
              }}
            >
              <div className="w-4 h-4 border-2 border-gray-400 rounded-sm" />
              <span>Voir le visuel de la carte</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default CarteNationContextMenu;
