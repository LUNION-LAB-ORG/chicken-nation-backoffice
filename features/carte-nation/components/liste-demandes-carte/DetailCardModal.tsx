"use client";

import { formatImageUrl } from "@/utils/imageHelpers";
import { CheckCircle2, ImageOff, Trash2, XCircle } from "lucide-react";
import Image from "next/image";
import { dateToLocalString } from "../../../../utils/date/format-date";
import { CardRequest } from "../../types/carte-nation.types";
import {
  getProfileTypeLabel,
  isStudentProfile,
  resolveCardLevel,
} from "../../utils/getCardLevelBadge";
import { getStatusBadgeRequestCard } from "../../utils/getStatusBadgeRequestCard";

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  const shown = value != null && value.toString().trim() !== "" ? value : "—";
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <p className="break-words text-sm text-gray-800">{shown}</p>
    </div>
  );
}

interface DetailCardModalProps {
  request: CardRequest;
  onClose: () => void;
  /** Ouvre la modale d'approbation (choix du type de carte). PENDING uniquement. */
  onApprove?: () => void;
  /** Ouvre la modale de rejet (motif obligatoire). PENDING uniquement. */
  onReject?: () => void;
  /** Ouvre la confirmation de suppression définitive. */
  onDelete?: () => void;
}

/**
 * Modale « Détail » d'une demande de Carte de la Nation.
 * Affiche la PHOTO du titulaire + toutes les infos de la demande, et permet
 * d'approuver / rejeter / supprimer sans repasser par la liste.
 */
export function DetailCardModal({
  request,
  onClose,
  onApprove,
  onReject,
  onDelete,
}: DetailCardModalProps) {
  const fullName = `${request.customer?.first_name ?? ""} ${request.customer?.last_name ?? ""}`.trim();
  const level = resolveCardLevel(request);
  const student = isStudentProfile(request);
  const isPending = request.status === "PENDING";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl border-b border-gray-100 bg-white px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Détail de la demande
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            title="Fermer"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          {/* Photo du titulaire */}
          <div className="flex flex-col items-center">
            {request.photo ? (
              <Image
                src={formatImageUrl(request.photo)}
                alt="Photo du titulaire"
                width={176}
                height={176}
                unoptimized
                className="h-44 w-44 rounded-2xl border border-gray-200 object-cover shadow-sm"
              />
            ) : (
              <div className="flex h-44 w-44 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 text-gray-400">
                <ImageOff className="mb-1 h-6 w-6" />
                <span className="text-xs">Pas de photo</span>
              </div>
            )}
            <p className="mt-3 text-base font-semibold text-gray-900">
              {fullName || "—"}
            </p>
            <div className="mt-2">{getStatusBadgeRequestCard(request.status)}</div>
          </div>

          {/* Infos */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-4 rounded-xl bg-gray-50 p-4">
            <DetailRow label="Téléphone" value={request.customer?.phone} />
            <DetailRow label="Email" value={request.customer?.email} />
            <DetailRow label="Étudiant" value={student ? "Oui" : "Non"} />
            <DetailRow label="Surnom" value={request.nickname} />
            <DetailRow
              label="Profil"
              value={getProfileTypeLabel(
                request.profile_type ?? (student ? "STUDENT" : null)
              )}
            />
            <DetailRow label="Établissement" value={request.institution} />
            <DetailRow label="Niveau" value={level ?? undefined} />
            <DetailRow
              label="Soumise le"
              value={dateToLocalString(new Date(request.created_at))}
            />
          </div>

          {/* Motif de rejet */}
          {request.status === "REJECTED" && request.rejection_reason && (
            <div className="rounded-xl border border-red-100 bg-red-50 p-3">
              <p className="mb-1 text-xs font-semibold uppercase text-red-700">
                Motif du rejet
              </p>
              <p className="text-sm text-red-600">{request.rejection_reason}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 flex flex-wrap gap-2 rounded-b-2xl border-t border-gray-100 bg-white px-6 py-4">
          {isPending && (
            <>
              <button
                onClick={onApprove}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
              >
                <CheckCircle2 className="h-4 w-4" />
                Approuver
              </button>
              <button
                onClick={onReject}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-200 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
              >
                <XCircle className="h-4 w-4" />
                Rejeter
              </button>
            </>
          )}
          <button
            onClick={onDelete}
            className={`flex items-center justify-center gap-2 rounded-lg border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 ${
              isPending ? "px-4" : "flex-1"
            }`}
            title="Supprimer définitivement la demande"
          >
            <Trash2 className="h-4 w-4" />
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}
