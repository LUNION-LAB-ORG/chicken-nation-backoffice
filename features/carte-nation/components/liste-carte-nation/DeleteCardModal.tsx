"use client";

import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { useDeleteCardMutation } from "../../queries/card-nation.mutation";
import { NationCard } from "../../types/carte-nation.types";

interface DeleteCardModalProps {
  isOpen: boolean;
  card: NationCard;
  onClose: () => void;
}

/**
 * Confirmation de SUPPRESSION DÉFINITIVE d'une carte générée (+ son image S3).
 * ⚠️ Irréversible — pour un retrait réversible, utiliser « Révoquer » (statut REVOKED).
 */
export function DeleteCardModal({ isOpen, card, onClose }: DeleteCardModalProps) {
  const { mutateAsync: deleteMutation, isPending } = useDeleteCardMutation();
  const fullName = `${card.customer?.first_name ?? ""} ${card.customer?.last_name ?? ""}`.trim();

  const handleDelete = async () => {
    await deleteMutation(card.id);
    onClose();
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-lg bg-red-100 p-2">
            <Trash2 className="h-6 w-6 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Supprimer la carte</h2>
        </div>

        <p className="mb-4 text-gray-700">
          Supprimer définitivement la carte{" "}
          <span className="font-mono font-semibold">{card.card_number}</span>
          {fullName ? (
            <>
              {" "}
              de <span className="font-semibold">{fullName}</span>
            </>
          ) : null}{" "}
          ?
        </p>

        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <div className="text-sm text-red-700">
            <p className="font-semibold">Action irréversible.</p>
            <p>
              La carte et son visuel seront effacés. Pour un retrait réversible,
              utilisez plutôt «&nbsp;Révoquer&nbsp;».
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isPending}
            className="w-full cursor-pointer rounded-lg border border-gray-300 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-red-600 py-3 font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Suppression...
              </>
            ) : (
              "Supprimer définitivement"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
