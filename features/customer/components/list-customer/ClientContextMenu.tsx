import { useRBAC } from "@/hooks/useRBAC";
import { User } from "lucide-react";
import React from "react";
import { useClientActions } from "../../hooks/useClientActions";
import { Customer } from "../../types/customer.types";

interface ClientContextMenuProps {
  client: Customer;
  isOpen: boolean;
  onClose: () => void;
}

const ClientContextMenu: React.FC<ClientContextMenuProps> = ({
  client,
  isOpen,
  onClose,
}) => {
  const { handleViewClientProfile, isLoading } = useClientActions();

  // ✅ Appeler les fonctions RBAC avec ()
  const { canViewClient } = useRBAC();

  const handleViewProfile = () => {
    handleViewClientProfile(client);
    if (!isLoading) {
      onClose();
    }
  };

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        !(event.target as Element).closest(".client-context-menu") &&
        !(event.target as Element).closest(".menu-button")
      ) {
        if (!isLoading) {
          onClose();
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose, isLoading]);

  if (!isOpen) return null;

  return (
    <div className="client-context-menu w-56 bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
      <div className="py-1">
        {canViewClient() && (
          <button
            type="button"
            className="w-full px-4 py-2 text-left text-sm flex items-center font-semibold gap-2 text-[#888891] hover:bg-orange-50 cursor-pointer"
            onClick={handleViewProfile}
          >
            <User size={16} />
            <span>Voir le profil</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default ClientContextMenu;
