"use client";

import { Loader2, XCircle } from "lucide-react";
import { useState } from "react";
import { useReviewRequestMutation } from "../../queries/carte-nation/card-nation.mutation";
import { CardRequest } from "../../types/carte-nation.types";

interface RejectCardModalProps {
  isOpen: boolean;
  request: CardRequest;
  onClose: () => void;
}

export function RejectCardModal({
  isOpen,
  request,
  onClose,
}: RejectCardModalProps) {
  const error = "";
  const [reason, setReason] = useState("");

  const { mutateAsync: rejectMutaion, isPending } = useReviewRequestMutation();
  const handleReject = async () => {
    await rejectMutaion({
      id: request.id,
      data: {
        status: "REJECTED",
        rejection_reason: reason,
      },
    });
    onClose();
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 rounded-lg">
            <XCircle className="w-6 h-6 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            Rejeter la demande
          </h2>
        </div>

        <div className="mb-6">
          <p className="text-gray-700 mb-4">
            Vous êtes sur le point de rejeter la demande de carte Nation pour :
          </p>
          <div className="p-4 bg-gray-50 rounded-lg space-y-2 mb-4">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Client :</span>
              <span className="text-sm font-medium text-gray-900">
                {request.customer?.first_name} {request.customer?.last_name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Institution :</span>
              <span className="text-sm font-medium text-gray-900">
                {request.institution}
              </span>
            </div>
          </div>

          <div>
            <label
              htmlFor="rejection-reason"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Raison du rejet <span className="text-red-600">*</span>
            </label>
            <textarea
              id="rejection-reason"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
              }}
              placeholder="Expliquez pourquoi cette demande est rejetée (min. 10 caractères)..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            />
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <p className="mt-2 text-xs text-gray-500">
              Le client recevra cette raison par email et pourra soumettre une
              nouvelle demande.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isPending}
            className="w-full cursor-pointer py-3 rounded-lg border border-gray-300 font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Annuler
          </button>
          <button
            onClick={handleReject}
            disabled={isPending}
            className="w-full cursor-pointer py-3 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Traitement...
              </>
            ) : (
              "Rejeter"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
