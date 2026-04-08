import { Trash2, User } from "lucide-react";
import React, { useState } from "react";
import { useClientActions } from "../../hooks/useClientActions";
import { Customer } from "../../types/customer.types";
import { Action, Modules } from "../../../users/types/auth.type";
import { HasPermission } from "../../../users/components/HasPermission";
import { useCustomerDeleteMutation } from "../../queries/customer-delete.mutation";
import toast from "react-hot-toast";

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
  const deleteMutation = useCustomerDeleteMutation();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleViewProfile = () => {
    handleViewClientProfile(client);
    if (!isLoading) {
      onClose();
    }
  };

  const handleDelete = () => {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    const fullName = `${client.first_name || ""} ${client.last_name || ""}`.trim();
    const displayName = fullName || client.phone || client.email || "ce client";

    deleteMutation.mutate(client.id, {
      onSuccess: () => {
        onClose();
        setShowConfirm(false);
      },
      onError: () => {
        setShowConfirm(false);
      },
    });
  };

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        !(event.target as Element).closest(".client-context-menu") &&
        !(event.target as Element).closest(".menu-button")
      ) {
        if (!isLoading && !deleteMutation.isPending) {
          onClose();
          setShowConfirm(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose, isLoading, deleteMutation.isPending]);

  if (!isOpen) return null;

  return (
    <div className="client-context-menu w-56 bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
      <div className="py-1">
        <HasPermission module={Modules.CLIENTS} action={Action.READ}>
          <button
            type="button"
            className="w-full px-4 py-2 text-left text-sm flex items-center font-semibold gap-2 text-[#888891] hover:bg-orange-50 cursor-pointer"
            onClick={handleViewProfile}
          >
            <User size={16} />
            <span>Voir le profil</span>
          </button>
        </HasPermission>

        <HasPermission module={Modules.CLIENTS} action={Action.DELETE}>
          <button
            type="button"
            className={`w-full px-4 py-2 text-left text-sm flex items-center font-semibold gap-2 cursor-pointer ${
              showConfirm
                ? "bg-red-50 text-red-600"
                : "text-red-500 hover:bg-red-50"
            }`}
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            <Trash2 size={16} />
            <span>
              {deleteMutation.isPending
                ? "Suppression..."
                : showConfirm
                ? "Confirmer la suppression"
                : "Supprimer le client"}
            </span>
          </button>
        </HasPermission>
      </div>
    </div>
  );
};

export default ClientContextMenu;
