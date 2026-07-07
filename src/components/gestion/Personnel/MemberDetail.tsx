"use client";

import Image from "next/image";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { Pencil, Ban, RotateCcw, Trash2, Star } from "lucide-react";
import {
  getHumanReadableError,
  getPersonnelSuccessMessage,
} from "@/utils/errorMessages";
import {
  softDeleteUser,
  deleteUser,
  restoreUser,
  setPrincipalManager,
} from "../../../../features/users/services/user.service";
import type { Member } from "./MemberView";
import MemberRemoveModal from "./MemberRemoveModal";
import ResetPasswordButton from "./ReinitializePassWord";

interface MemberDetailProps {
  member: Member;
  /** Passe en vue d'édition (page, pas de modal). */
  onEdit: () => void;
  /** Rafraîchit la liste après une action. */
  onRefresh?: () => void;
  /** Retour à la liste (ex. après suppression). */
  onBack?: () => void;
  isReadOnly?: boolean;
}

// Libellés FR des rôles pour un affichage propre.
const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrateur",
  MANAGER: "Manager",
  ASSISTANT_MANAGER: "Assistant manager",
  CAISSIER: "Caissier",
  CUISINE: "Cuisine",
  CALL_CENTER: "Centre d'appel",
  MARKETING: "Marketing",
  COMPTABLE: "Comptable",
};

function getAvatarUrl(member: Member) {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";
  if (!member.image) return "/icons/avatar.png";
  if (member.image.startsWith("http")) return member.image;
  return `${API_BASE_URL}/${member.image}`;
}

const MemberDetail: React.FC<MemberDetailProps> = ({
  member,
  onEdit,
  onRefresh,
  onBack,
  isReadOnly = false,
}) => {
  const [confirm, setConfirm] = useState<"suspend" | "delete" | null>(null);
  const [busy, setBusy] = useState(false);

  const isSuspended =
    member.entity_status === "DELETED" || member.entity_status === "INACTIVE";
  const restaurantName =
    typeof member.restaurant === "object" && member.restaurant
      ? member.restaurant.name
      : typeof member.restaurant === "string"
      ? member.restaurant
      : "";
  const canSetPrincipal = member.role === "MANAGER" && !member.isPrincipal;

  const run = async (
    fn: () => Promise<unknown>,
    success: string,
    after?: () => void
  ) => {
    setBusy(true);
    try {
      await fn();
      toast.success(success);
      onRefresh?.();
      after?.();
    } catch (error: unknown) {
      toast.error(getHumanReadableError(error));
    } finally {
      setBusy(false);
    }
  };

  const info: Array<{ label: string; value: string }> = [
    { label: "E-mail", value: member.email || "—" },
    { label: "Téléphone", value: member.phone || "Non renseigné" },
    { label: "Adresse", value: member.address || "Non renseignée" },
    { label: "Restaurant", value: restaurantName || "Back Office" },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* En-tête identité */}
      <div className="bg-white border border-[#E4E4E7] rounded-2xl overflow-hidden">
        <div className="bg-[#FFF6E9] px-6 py-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <Image
            src={getAvatarUrl(member)}
            alt={member.fullname}
            width={80}
            height={80}
            className="w-20 h-20 rounded-full border-2 border-white shadow-sm object-cover bg-white shrink-0"
            unoptimized={!member.image || member.image.startsWith("/icons/")}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-[#5D5C5C] truncate">
                {member.fullname}
              </h2>
              {member.isPrincipal && (
                <span className="inline-flex items-center gap-1 bg-[#FDF3D6] text-[#9A7008] text-[11px] font-bold px-2 py-0.5 rounded-full">
                  <Star size={12} /> Manager principal
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="bg-[#FBDBA7] text-[#7A3502] text-xs font-bold px-3 py-1 rounded-full">
                {ROLE_LABELS[member.role] ?? member.role}
              </span>
              <span
                className={
                  isSuspended
                    ? "bg-[#FDECEA] text-[#C0392B] text-xs font-bold px-3 py-1 rounded-full"
                    : "bg-[#E5F9EB] text-[#1E8E5A] text-xs font-bold px-3 py-1 rounded-full"
                }
              >
                {isSuspended ? "Suspendu" : "Actif"}
              </span>
            </div>
          </div>
        </div>

        {/* Informations */}
        <div className="px-6 py-5">
          <div className="text-[#F17922] text-sm font-semibold mb-3">
            Informations
          </div>
          <dl className="divide-y divide-[#F1F3F5]">
            {info.map((row) => (
              <div
                key={row.label}
                className="flex flex-col sm:flex-row sm:items-center py-2.5 gap-0.5 sm:gap-4"
              >
                <dt className="text-[#9796A1] text-sm sm:w-40 shrink-0">
                  {row.label}
                </dt>
                <dd className="text-[#232323] font-semibold text-sm break-words">
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Barre d'actions */}
      {!isReadOnly && (
        <div className="mt-4 bg-white border border-[#E4E4E7] rounded-2xl px-4 py-4 flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onEdit}
            disabled={busy}
            className="inline-flex items-center gap-2 px-5 py-2 bg-[#F17922] text-white text-sm font-medium rounded-xl hover:bg-orange-600 transition-colors cursor-pointer disabled:opacity-60"
          >
            <Pencil size={16} /> Modifier
          </button>

          <ResetPasswordButton userId={member.id} />

          {canSetPrincipal && (
            <button
              type="button"
              onClick={() =>
                run(
                  () => setPrincipalManager(member.id),
                  "Manager principal défini"
                )
              }
              disabled={busy}
              className="inline-flex items-center gap-2 px-5 py-2 border border-[#F17922] text-[#F17922] text-sm font-medium rounded-xl hover:bg-orange-50 transition-colors cursor-pointer disabled:opacity-60"
            >
              <Star size={16} /> Définir principal
            </button>
          )}

          {isSuspended ? (
            <button
              type="button"
              onClick={() =>
                run(() => restoreUser(member.id), "Utilisateur restauré")
              }
              disabled={busy}
              className="inline-flex items-center gap-2 px-5 py-2 border border-[#1E8E5A] text-[#1E8E5A] text-sm font-medium rounded-xl hover:bg-green-50 transition-colors cursor-pointer disabled:opacity-60"
            >
              <RotateCcw size={16} /> Restaurer
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setConfirm("suspend")}
              disabled={busy}
              className="inline-flex items-center gap-2 px-5 py-2 border border-[#F17922] text-[#F17922] text-sm font-medium rounded-xl hover:bg-orange-50 transition-colors cursor-pointer disabled:opacity-60"
            >
              <Ban size={16} /> Suspendre
            </button>
          )}

          <button
            type="button"
            onClick={() => setConfirm("delete")}
            disabled={busy}
            className="inline-flex items-center gap-2 px-5 py-2 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-60 sm:ml-auto"
          >
            <Trash2 size={16} /> Supprimer définitivement
          </button>
        </div>
      )}

      {/* Confirmations (seuls modals conservés) */}
      <MemberRemoveModal
        open={!!confirm}
        mode={confirm === "delete" ? "delete" : "suspend"}
        member={confirm ? member : null}
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          const mode = confirm;
          setConfirm(null);
          if (mode === "delete") {
            run(
              () => deleteUser(member.id),
              getPersonnelSuccessMessage("delete"),
              onBack
            );
          } else if (mode === "suspend") {
            run(() => softDeleteUser(member.id), "Utilisateur suspendu");
          }
        }}
      />
    </div>
  );
};

export default MemberDetail;
