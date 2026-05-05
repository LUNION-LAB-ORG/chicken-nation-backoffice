"use client";

import React, { useState } from "react";
import { Ban } from "lucide-react";

import ModalShell from "./ModalShell";
import { useSuspendLivreur } from "../../../../features/livreurs/hook/use-livreurs";

interface SuspendLivreurModalProps {
  isOpen: boolean;
  onClose: () => void;
  livreurId: string;
  livreurNom: string;
}

const SuspendLivreurModal: React.FC<SuspendLivreurModalProps> = ({
  isOpen,
  onClose,
  livreurId,
  livreurNom,
}) => {
  const [reason, setReason] = useState("");
  const { mutate, isPending } = useSuspendLivreur();

  const handleConfirm = () => {
    mutate(
      { id: livreurId, payload: reason.trim() ? { reason: reason.trim() } : {} },
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
      title="Suspendre le livreur"
      icon={<Ban className="w-5 h-5 text-[#EF4444]" />}
    >
      <p className="text-sm text-[#52525B] mb-4">
        <strong>{livreurNom}</strong> ne pourra plus recevoir de courses. Vous pourrez
        le réactiver à tout moment. Le motif est facultatif.
      </p>

      <label className="block text-sm font-medium text-[#18181B] mb-1.5">
        Motif <span className="text-[#A1A1AA] font-normal">(facultatif)</span>
      </label>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Ex. Non-respect répété des horaires…"
        rows={3}
        maxLength={500}
        className="w-full rounded-lg border border-[#E4E4E7] px-3 py-2 text-sm focus:outline-none focus:border-[#F17922] focus:ring-1 focus:ring-[#F17922]"
      />

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
          disabled={isPending}
          className="px-4 py-2 text-sm font-semibold text-white bg-[#EF4444] rounded-lg hover:bg-[#DC2626] disabled:opacity-50"
        >
          {isPending ? "Envoi…" : "Suspendre"}
        </button>
      </div>
    </ModalShell>
  );
};

export default SuspendLivreurModal;
