"use client";

import React, { useState } from "react";
import { XCircle } from "lucide-react";

import ModalShell from "./ModalShell";
import { useRejectLivreur } from "../../../../features/livreurs/hook/use-livreurs";

interface RejectLivreurModalProps {
  isOpen: boolean;
  onClose: () => void;
  livreurId: string;
  livreurNom: string;
}

const RejectLivreurModal: React.FC<RejectLivreurModalProps> = ({
  isOpen,
  onClose,
  livreurId,
  livreurNom,
}) => {
  const [reason, setReason] = useState("");
  const { mutate, isPending } = useRejectLivreur();

  const handleConfirm = () => {
    if (reason.trim().length < 3) return;
    mutate(
      { id: livreurId, payload: { reason: reason.trim() } },
      {
        onSuccess: () => {
          setReason("");
          onClose();
        },
      },
    );
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Refuser le livreur"
      icon={<XCircle className="w-5 h-5 text-[#EF4444]" />}
    >
      <p className="text-sm text-[#52525B] mb-4">
        Vous êtes sur le point de refuser <strong>{livreurNom}</strong>. Cette action est
        irréversible. Indiquez le motif — il pourra être affiché au livreur.
      </p>

      <label className="block text-sm font-medium text-[#18181B] mb-1.5">
        Motif du refus <span className="text-[#EF4444]">*</span>
      </label>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Ex. Documents illisibles, informations incohérentes…"
        rows={4}
        maxLength={500}
        className="w-full rounded-lg border border-[#E4E4E7] px-3 py-2 text-sm focus:outline-none focus:border-[#F17922] focus:ring-1 focus:ring-[#F17922]"
      />
      <p className="text-xs text-[#A1A1AA] mt-1">{reason.length} / 500 caractères</p>

      <div className="flex justify-end gap-2 mt-6">
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          className="px-4 py-2 text-sm font-medium text-[#52525B] rounded-lg hover:bg-[#F4F4F5] disabled:opacity-50"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={reason.trim().length < 3 || isPending}
          className="px-4 py-2 text-sm font-semibold text-white bg-[#EF4444] rounded-lg hover:bg-[#DC2626] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Envoi…" : "Refuser"}
        </button>
      </div>
    </ModalShell>
  );
};

export default RejectLivreurModal;
