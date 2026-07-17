"use client";

import { Loader2, RefreshCw, XCircle } from "lucide-react";
import { useState } from "react";
import { useRegenerateCardMutation } from "../../queries/card-nation.mutation";
import { CardLevel, NationCard } from "../../types/carte-nation.types";
import { CardVisualPicker } from "../CardVisualPicker";

interface RegenerateCardModalProps {
  isOpen: boolean;
  card: NationCard;
  onClose: () => void;
}

/**
 * Régénération du visuel d'une carte avec un TYPE choisi.
 * Le numéro de carte et le QR sont conservés : seule l'image change.
 */
export function RegenerateCardModal({
  isOpen,
  card,
  onClose,
}: RegenerateCardModalProps) {
  const { mutateAsync: regenerate, isPending } = useRegenerateCardMutation();

  // Pré-sélection : le visuel actuel de la carte (2 axes indépendants).
  const [level, setLevel] = useState<CardLevel>(
    (card.level as CardLevel | null) ?? "STANDARD"
  );
  const [isStudent, setIsStudent] = useState<boolean>(card.is_student === true);

  const fullName = `${card.customer?.first_name ?? ""} ${card.customer?.last_name ?? ""}`.trim();
  const currentLabel = `${card.level ?? "—"}${card.is_student ? " + Étudiant" : ""}`;

  const handleRegenerate = async () => {
    await regenerate({ id: card.id, visual: { level, is_student: isStudent } });
    onClose();
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-[#F17922]/10 p-2">
              <RefreshCw className="h-6 w-6 text-[#F17922]" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              Régénérer la carte
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            title="Fermer"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-5 space-y-2 rounded-xl bg-gray-50 p-4">
          <div className="flex justify-between gap-4">
            <span className="shrink-0 text-sm text-gray-600">Détenteur :</span>
            <span className="truncate text-sm font-medium text-gray-900">
              {fullName || "—"}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="shrink-0 text-sm text-gray-600">N° de carte :</span>
            <span className="truncate font-mono text-sm font-medium text-gray-900">
              {card.card_number}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="shrink-0 text-sm text-gray-600">Type actuel :</span>
            <span className="text-sm font-medium text-gray-900">
              {currentLabel}
            </span>
          </div>
        </div>

        {/* Nouveau visuel — 2 axes */}
        <p className="mb-2 text-sm font-semibold text-gray-900">
          Nouveau visuel de carte
        </p>
        <CardVisualPicker
          level={level}
          isStudent={isStudent}
          onLevelChange={setLevel}
          onStudentChange={setIsStudent}
          disabled={isPending}
          accent="orange"
        />

        <p className="mt-3 text-xs text-gray-500">
          Le numéro de carte et le QR sont conservés : seul le visuel change.
        </p>

        <div className="mt-5 flex gap-3">
          <button
            onClick={onClose}
            disabled={isPending}
            className="flex-1 cursor-pointer whitespace-nowrap rounded-lg border border-gray-300 px-3 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleRegenerate}
            disabled={isPending}
            className="flex flex-1 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-[#F17922] px-3 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#d96a1d] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Génération…
              </>
            ) : (
              "Régénérer"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
