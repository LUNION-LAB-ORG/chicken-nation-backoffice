"use client";

import { CheckCircle2, PauseCircle, XCircle, Loader2 } from "lucide-react";
import { useUpdateCardStatusMutation } from "../../queries/card-nation.mutation";

type CardAction = "activate" | "suspend" | "revoke";

interface UpdateCardStatusModalProps {
  isOpen: boolean;
  cardId: string;
  customerName: string;
  action: CardAction;
  onClose: () => void;
}

const ACTION_CONFIG: Record<
  CardAction,
  {
    title: string;
    description: string;
    confirmLabel: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    note: string;
  }
> = {
  activate: {
    title: "Activer la carte",
    description: "Vous êtes sur le point de réactiver la carte Nation pour :",
    confirmLabel: "Activer",
    icon: CheckCircle2,
    color: "text-emerald-600",
    bgColor: "bg-emerald-100",
    note: "La carte sera immédiatement réactivée et utilisable par le client.",
  },
  suspend: {
    title: "Suspendre la carte",
    description:
      "Vous êtes sur le point de suspendre temporairement la carte Nation pour :",
    confirmLabel: "Suspendre",
    icon: PauseCircle,
    color: "text-amber-600",
    bgColor: "bg-amber-100",
    note: "La carte sera temporairement inutilisable jusqu’à réactivation.",
  },
  revoke: {
    title: "Révoquer la carte",
    description:
      "Vous êtes sur le point de révoquer définitivement la carte Nation pour :",
    confirmLabel: "Révoquer",
    icon: XCircle,
    color: "text-red-600",
    bgColor: "bg-red-100",
    note: "Cette action est irréversible. La carte ne pourra plus être utilisée.",
  },
};

export function UpdateCardStatusModal({
  isOpen,
  cardId,
  customerName,
  action,
  onClose,
}: UpdateCardStatusModalProps) {
  const { mutateAsync, isPending } = useUpdateCardStatusMutation();

  const config = ACTION_CONFIG[action];
  const Icon = config.icon;

  const handleConfirm = async () => {
    await mutateAsync({ id: cardId, action });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-lg ${config.bgColor}`}>
            <Icon className={`w-6 h-6 ${config.color}`} />
          </div>
          <h2 className="text-xl font-bold text-gray-900">{config.title}</h2>
        </div>

        <div className="mb-6">
          <p className="text-gray-700 mb-4">{config.description}</p>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Client :</span>
              <span className="text-sm font-medium text-gray-900">
                {customerName}
              </span>
            </div>
          </div>

          <p className={`text-sm mt-4 ${config.color}`}>{config.note}</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isPending}
            className="w-full py-3 rounded-lg border border-gray-300 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Annuler
          </button>

          <button
            onClick={handleConfirm}
            disabled={isPending}
            className={`w-full py-3 rounded-lg font-semibold text-white transition-colors flex items-center justify-center gap-2
              ${
                action === "activate"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : action === "suspend"
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "bg-red-600 hover:bg-red-700"
              }
            `}
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Traitement...
              </>
            ) : (
              config.confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
