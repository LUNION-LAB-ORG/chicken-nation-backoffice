"use client";

import { formatImageUrl } from "@/utils/imageHelpers";
import { ImageOff, XCircle } from "lucide-react";
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
      <p className="text-sm text-gray-800 break-words">{shown}</p>
    </div>
  );
}

interface DetailCardModalProps {
  request: CardRequest;
  onClose: () => void;
}

/**
 * Modale « Détail » d'une demande de Carte de la Nation.
 * Affiche la PHOTO du titulaire (contrôle backoffice) + toutes les infos de la
 * demande + le justificatif éventuel. Lecture seule (l'approbation/le rejet
 * restent sur les boutons dédiés de la liste).
 */
export function DetailCardModal({ request, onClose }: DetailCardModalProps) {
  const fullName = `${request.customer?.first_name ?? ""} ${request.customer?.last_name ?? ""}`.trim();
  const level = resolveCardLevel(request);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl"
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
            <DetailRow label="Surnom" value={request.nickname} />
            <DetailRow
              label="Profil"
              value={getProfileTypeLabel(
                request.profile_type ??
                  (isStudentProfile(request) ? "STUDENT" : null)
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

          {/* Justificatif étudiant (si fourni — mode V2) */}
          {request.student_card_file_url && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase text-gray-400">
                Justificatif étudiant
              </p>
              <Image
                src={formatImageUrl(request.student_card_file_url)}
                alt="Justificatif étudiant"
                width={480}
                height={300}
                unoptimized
                className="h-auto w-full rounded-xl border border-gray-200"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
