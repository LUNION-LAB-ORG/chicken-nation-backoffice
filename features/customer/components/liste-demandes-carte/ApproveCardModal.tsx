"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { CardRequest } from "../../types/carte-nation.types";
import { useReviewRequestMutation } from "../../queries/carte-nation/card-nation.mutation";

interface ApproveCardModalProps {
  isOpen: boolean;
  request: CardRequest;
  onClose: () => void;
}

export function ApproveCardModal({
  isOpen,
  request,
  onClose,
}: ApproveCardModalProps) {
  const { mutateAsync: approveMutaion, isPending } = useReviewRequestMutation();

  const handleApprove = async () => {
    await approveMutaion({
      id: request.id,
      data: {
        status: "APPROVED",
      },
    });
    onClose();
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            Approuver la demande
          </h2>
        </div>

        <div className="mb-6">
          <p className="text-gray-700 mb-4">
            Vous êtes sur le point d&apos;approuver la demande de carte Nation
            pour :
          </p>
          <div className="p-4 bg-gray-50 rounded-lg space-y-2">
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
            {request.nickname && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Surnom :</span>
                <span className="text-sm font-medium text-gray-900">
                  {request.nickname}
                </span>
              </div>
            )}
          </div>
          <p className="text-sm text-emerald-700 mt-4">
            Une carte Nation sera automatiquement générée et envoyée au client.
          </p>
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
            onClick={handleApprove}
            disabled={isPending}
            className="w-full cursor-pointer py-3 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Traitement...
              </>
            ) : (
              "Approuver"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
