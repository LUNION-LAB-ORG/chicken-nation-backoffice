"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import { useReviewRequestMutation } from "../../queries/card-nation.mutation";
import { CardRequest, CardType } from "../../types/carte-nation.types";
import {
  getProfileTypeLabel,
  isStudentProfile,
  resolveCardLevel,
} from "../../utils/getCardLevelBadge";

interface ApproveCardModalProps {
  isOpen: boolean;
  request: CardRequest;
  onClose: () => void;
}

/**
 * Types de carte émettables. Le choix pilote le VISUEL généré :
 * Étudiant = liseré jaune ; Standard/VIP/VVIP = couleur du niveau.
 */
const CARD_TYPE_OPTIONS: {
  value: CardType;
  label: string;
  hint: string;
  dot: string;
}[] = [
  { value: "ETUDIANT", label: "Étudiant", hint: "Liseré jaune", dot: "#FFD24C" },
  { value: "STANDARD", label: "Standard", hint: "Orange", dot: "#F17922" },
  { value: "VIP", label: "VIP", hint: "Or", dot: "#D4AF37" },
  { value: "VVIP", label: "VVIP", hint: "Rouge", dot: "#C0392B" },
];

export function ApproveCardModal({
  isOpen,
  request,
  onClose,
}: ApproveCardModalProps) {
  const { mutateAsync: approveMutation, isPending } = useReviewRequestMutation();

  // Pré-sélection : étudiant déclaré → Étudiant ; sinon le niveau du client.
  const [cardType, setCardType] = useState<CardType>(
    isStudentProfile(request)
      ? "ETUDIANT"
      : ((resolveCardLevel(request) as CardType | null) ?? "STANDARD")
  );

  const handleApprove = async () => {
    await approveMutation({
      id: request.id,
      data: { status: "APPROVED", card_type: cardType },
    });
    onClose();
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-lg bg-emerald-100 p-2">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            Approuver la demande
          </h2>
        </div>

        <div className="mb-6">
          <div className="space-y-2 rounded-lg bg-gray-50 p-4">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Client :</span>
              <span className="text-sm font-medium text-gray-900">
                {request.customer?.first_name} {request.customer?.last_name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Étudiant :</span>
              <span className="text-sm font-medium text-gray-900">
                {isStudentProfile(request) ? "Oui" : "Non"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Profil :</span>
              <span className="text-sm font-medium text-gray-900">
                {getProfileTypeLabel(
                  request.profile_type ??
                    (isStudentProfile(request) ? "STUDENT" : null)
                )}
              </span>
            </div>
            {request.institution && (
              <div className="flex justify-between gap-4">
                <span className="shrink-0 text-sm text-gray-600">
                  Établissement :
                </span>
                <span
                  className="truncate text-sm font-medium text-gray-900"
                  title={request.institution}
                >
                  {request.institution}
                </span>
              </div>
            )}
            {request.nickname && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Surnom :</span>
                <span className="text-sm font-medium text-gray-900">
                  {request.nickname}
                </span>
              </div>
            )}
          </div>

          {/* Choix du TYPE de carte à émettre */}
          <div className="mt-5">
            <p className="mb-2 text-sm font-semibold text-gray-900">
              Type de carte à émettre
            </p>
            <div className="grid grid-cols-2 gap-2">
              {CARD_TYPE_OPTIONS.map((opt) => {
                const active = cardType === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setCardType(opt.value)}
                    disabled={isPending}
                    className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-left transition-colors disabled:opacity-50 ${
                      active
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span
                      className="h-3 w-3 shrink-0 rounded-full ring-2 ring-white"
                      style={{ backgroundColor: opt.dot }}
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-gray-900">
                        {opt.label}
                      </span>
                      <span className="block text-[11px] text-gray-500">
                        {opt.hint}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <p className="mt-4 text-sm text-emerald-700">
            La carte sera générée dans ce type et le client sera notifié
            («&nbsp;carte prête&nbsp;»).
          </p>
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
            onClick={handleApprove}
            disabled={isPending}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-emerald-600 py-3 font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
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
