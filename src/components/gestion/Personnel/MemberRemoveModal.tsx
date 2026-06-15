import React, { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import type { Member } from "./MemberView";

/**
 * Modal UNIQUE de retrait d'un membre (remplace MemberBlockModal +
 * MemberDeleteModal + le flux inline du drawer).
 *  - mode "suspend" : réversible (statut Suspendu), confirmation simple.
 *  - mode "delete"  : définitif/irréversible, exige de taper « supprimer ».
 */
interface MemberRemoveModalProps {
  open: boolean;
  mode: "suspend" | "delete";
  member: Member | null;
  onClose: () => void;
  onConfirm: () => void;
}

const MemberRemoveModal: React.FC<MemberRemoveModalProps> = ({
  open,
  mode,
  member,
  onClose,
  onConfirm,
}) => {
  const [confirmText, setConfirmText] = useState("");

  useEffect(() => {
    if (!open) setConfirmText("");
  }, [open]);

  if (mode === "suspend") {
    return (
      <Modal isOpen={open} onClose={onClose} title="Suspendre l'utilisateur">
        <div className="text-center text-[#484848] text-[15px] mb-6">
          {member?.fullname ? <b>{member.fullname}</b> : "L'utilisateur"} perdra
          l&apos;accès à la plateforme.
          <br />
          Cette action est <b>réversible</b> (vous pourrez le restaurer).
        </div>
        <div className="flex justify-center gap-4">
          <button
            type="button"
            className="bg-[#ECECEC] text-[#9796A1] cursor-pointer rounded-lg px-7 py-2 text-[13px] min-w-[120px]"
            onClick={onClose}
          >
            Annuler
          </button>
          <button
            type="button"
            className="bg-[#F17922] text-white cursor-pointer rounded-lg px-7 py-2 text-[13px] min-w-[120px] hover:bg-orange-600"
            onClick={onConfirm}
          >
            Suspendre
          </button>
        </div>
      </Modal>
    );
  }

  // mode === "delete" — définitif
  const canDelete = confirmText.trim().toLowerCase() === "supprimer";
  return (
    <Modal isOpen={open} onClose={onClose} title="Supprimer définitivement">
      <div className="text-center text-[#484848] text-[15px] mb-3">
        ⚠️ Suppression <b>définitive et irréversible</b> de{" "}
        {member?.fullname ? <b>{member.fullname}</b> : "l'utilisateur"}.
        <br />
        Le compte sera effacé. Préférez « Suspendre » en cas de doute.
      </div>
      <p className="text-center text-xs text-gray-600 mb-2">
        Tapez <b>supprimer</b> pour confirmer :
      </p>
      <input
        type="text"
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        placeholder="supprimer"
        className="w-full max-w-xs mx-auto block px-3 py-2 border border-gray-300 rounded-lg text-sm mb-5 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
      />
      <div className="flex justify-center gap-4">
        <button
          type="button"
          className="bg-[#ECECEC] text-[#9796A1] cursor-pointer rounded-lg px-7 py-2 text-[13px] min-w-[120px]"
          onClick={onClose}
        >
          Annuler
        </button>
        <button
          type="button"
          disabled={!canDelete}
          className="bg-red-600 text-white cursor-pointer rounded-lg px-7 py-2 text-[13px] min-w-[120px] hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          onClick={onConfirm}
        >
          Supprimer définitivement
        </button>
      </div>
    </Modal>
  );
};

export default MemberRemoveModal;
