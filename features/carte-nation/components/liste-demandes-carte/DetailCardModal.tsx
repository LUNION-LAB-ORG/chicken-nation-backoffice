"use client";

import { formatImageUrl } from "@/utils/imageHelpers";
import {
  AlertTriangle,
  CheckCircle2,
  ImageOff,
  Loader2,
  Trash2,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { dateToLocalString } from "../../../../utils/date/format-date";
import {
  useDeleteRequestMutation,
  useReviewRequestMutation,
} from "../../queries/card-nation.mutation";
import { CardRequest, CardType } from "../../types/carte-nation.types";
import {
  isStudentProfile,
  resolveCardLevel,
} from "../../utils/getCardLevelBadge";
import { getStatusBadgeRequestCard } from "../../utils/getStatusBadgeRequestCard";

type ActionMode = "approve" | "reject" | "delete" | null;

/** Types émettables — le choix pilote le visuel de la carte générée. */
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

const MIN_REASON = 10;

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  const shown = value != null && value.toString().trim() !== "" ? value : "—";
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <p className="break-words text-sm font-medium text-gray-800">{shown}</p>
    </div>
  );
}

interface DetailCardModalProps {
  request: CardRequest;
  onClose: () => void;
}

/**
 * Modale UNIQUE de gestion d'une demande de Carte de la Nation.
 * Photo + toutes les infos, et les actions (approuver / rejeter / supprimer)
 * ouvrent un panneau INLINE qui remplace la barre de boutons — pas de seconde
 * modale, pas de double confirmation.
 */
export function DetailCardModal({ request, onClose }: DetailCardModalProps) {
  const [mode, setMode] = useState<ActionMode>(null);
  const [reason, setReason] = useState("");
  const [cardType, setCardType] = useState<CardType>(
    isStudentProfile(request)
      ? "ETUDIANT"
      : ((resolveCardLevel(request) as CardType | null) ?? "STANDARD")
  );

  const { mutateAsync: review, isPending: isReviewing } =
    useReviewRequestMutation();
  const { mutateAsync: removeRequest, isPending: isDeleting } =
    useDeleteRequestMutation();
  const isBusy = isReviewing || isDeleting;

  const fullName = `${request.customer?.first_name ?? ""} ${request.customer?.last_name ?? ""}`.trim();
  const level = resolveCardLevel(request);
  const student = isStudentProfile(request);
  const isPending = request.status === "PENDING";
  const hasCard = !!request.nation_card;
  const reasonTooShort = reason.trim().length < MIN_REASON;

  const handleApprove = async () => {
    await review({
      id: request.id,
      data: { status: "APPROVED", card_type: cardType },
    });
    onClose();
  };

  const handleReject = async () => {
    if (reasonTooShort) return;
    await review({
      id: request.id,
      data: { status: "REJECTED", rejection_reason: reason.trim() },
    });
    onClose();
  };

  const handleDelete = async () => {
    await removeRequest(request.id);
    onClose();
  };

  const ghostBtn =
    "flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white/95 px-6 py-4 backdrop-blur">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Détail de la demande
            </h3>
            <p className="text-xs text-gray-500">Carte de la Nation</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            title="Fermer"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        {/* Corps : photo + infos */}
        <div className="grid gap-6 p-6 md:grid-cols-[220px_1fr]">
          <div className="flex flex-col items-center gap-3">
            {request.photo ? (
              <Image
                src={formatImageUrl(request.photo)}
                alt="Photo du titulaire"
                width={208}
                height={208}
                unoptimized
                className="h-52 w-52 rounded-2xl border border-gray-200 object-cover shadow-sm"
              />
            ) : (
              <div className="flex h-52 w-52 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 text-gray-400">
                <ImageOff className="mb-1 h-7 w-7" />
                <span className="text-xs">Pas de photo</span>
              </div>
            )}
            <div className="text-center">
              <p className="text-base font-semibold text-gray-900">
                {fullName || "—"}
              </p>
              <div className="mt-2 flex justify-center">
                {getStatusBadgeRequestCard(request.status)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-x-6 gap-y-4 self-start rounded-2xl bg-gray-50 p-5 sm:grid-cols-2">
            <InfoRow label="Téléphone" value={request.customer?.phone} />
            <InfoRow label="Email" value={request.customer?.email} />
            <InfoRow label="Étudiant" value={student ? "Oui" : "Non"} />
            <InfoRow label="Surnom" value={request.nickname} />
            <InfoRow label="Établissement" value={request.institution} />
            <InfoRow label="Niveau" value={level ?? undefined} />
            <InfoRow
              label="Soumise le"
              value={dateToLocalString(new Date(request.created_at))}
            />
            {request.nation_card?.card_number && (
              <InfoRow
                label="N° de carte"
                value={request.nation_card.card_number}
              />
            )}
          </div>
        </div>

        {/* Motif d'un rejet déjà prononcé */}
        {request.status === "REJECTED" && request.rejection_reason && (
          <div className="mx-6 mb-6 rounded-xl border border-red-100 bg-red-50 p-3">
            <p className="mb-1 text-xs font-semibold uppercase text-red-700">
              Motif du rejet
            </p>
            <p className="text-sm text-red-600">{request.rejection_reason}</p>
          </div>
        )}

        {/* Barre d'actions — remplacée par le panneau inline quand une action est ouverte */}
        <div className="sticky bottom-0 border-t border-gray-100 bg-white px-6 py-4">
          {mode === null && (
            <div className="flex flex-wrap gap-2">
              {isPending && (
                <>
                  <button
                    onClick={() => setMode("approve")}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Approuver
                  </button>
                  <button
                    onClick={() => setMode("reject")}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4" />
                    Rejeter
                  </button>
                </>
              )}
              <button
                onClick={() => setMode("delete")}
                className={`flex items-center justify-center gap-2 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 ${
                  isPending ? "px-4" : "flex-1"
                }`}
              >
                <Trash2 className="h-4 w-4" />
                Supprimer
              </button>
            </div>
          )}

          {/* Approbation : choix du type de carte + confirmation */}
          {mode === "approve" && (
            <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/60 p-4">
              <p className="mb-3 text-sm font-semibold text-emerald-900">
                Type de carte à émettre
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {CARD_TYPE_OPTIONS.map((opt) => {
                  const active = cardType === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setCardType(opt.value)}
                      disabled={isBusy}
                      className={`flex items-center gap-2 rounded-xl border-2 bg-white px-3 py-2.5 text-left transition-colors disabled:opacity-50 ${
                        active
                          ? "border-emerald-500 ring-2 ring-emerald-200"
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
              <p className="mt-3 text-xs text-emerald-800">
                La carte sera générée dans ce type et le client sera notifié
                («&nbsp;carte prête&nbsp;»).
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setMode(null)}
                  disabled={isBusy}
                  className={ghostBtn}
                >
                  Annuler
                </button>
                <button
                  onClick={handleApprove}
                  disabled={isBusy}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isReviewing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Traitement…
                    </>
                  ) : (
                    "Confirmer l'approbation"
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Rejet : motif obligatoire + confirmation */}
          {mode === "reject" && (
            <div className="rounded-2xl border-2 border-red-200 bg-red-50/60 p-4">
              <label
                htmlFor="rejection-reason"
                className="mb-2 block text-sm font-semibold text-red-900"
              >
                Motif du rejet <span className="text-red-600">*</span>
              </label>
              <textarea
                id="rejection-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={`Expliquez pourquoi cette demande est rejetée (min. ${MIN_REASON} caractères)…`}
                rows={3}
                disabled={isBusy}
                className="w-full resize-none rounded-xl border border-red-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-red-400 disabled:opacity-50"
              />
              <p className="mt-2 text-xs text-red-800">
                Le client sera notifié du refus et pourra soumettre une nouvelle
                demande.
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setMode(null)}
                  disabled={isBusy}
                  className={ghostBtn}
                >
                  Annuler
                </button>
                <button
                  onClick={handleReject}
                  disabled={isBusy || reasonTooShort}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isReviewing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Traitement…
                    </>
                  ) : (
                    "Confirmer le rejet"
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Suppression définitive */}
          {mode === "delete" && (
            <div className="rounded-2xl border-2 border-red-200 bg-red-50/60 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                <div className="text-sm text-red-800">
                  <p className="font-semibold">
                    Suppression définitive — action irréversible.
                  </p>
                  <p>
                    {hasCard
                      ? "La carte déjà générée pour cette demande sera SUPPRIMÉE elle aussi (image comprise)."
                      : "La demande et sa photo seront définitivement effacées."}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setMode(null)}
                  disabled={isBusy}
                  className={ghostBtn}
                >
                  Annuler
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isBusy}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Suppression…
                    </>
                  ) : (
                    "Confirmer la suppression"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
