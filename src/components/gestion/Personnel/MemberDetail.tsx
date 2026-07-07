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

/** Ligne label / valeur — même pattern que les sections du détail Livreurs. */
const Row: React.FC<{ label: string; value: React.ReactNode }> = ({
  label,
  value,
}) => (
  <div className="flex flex-row items-start justify-between py-2 border-b border-[#F4F4F5] last:border-b-0">
    <p className="text-sm text-[#71717A]">{label}</p>
    <p className="text-sm text-[#18181B] font-semibold text-right max-w-[60%] break-words">
      {value}
    </p>
  </div>
);

/**
 * Page détail d'un membre du personnel — layout 2 colonnes, même langage que
 * la page détail Livreurs (LivreurDetails).
 *
 * - Colonne gauche (3/5) : Profil + Coordonnées
 * - Colonne droite (2/5) : Affectation + Actions admin
 *
 * Le bouton retour est géré par le header du module (DashboardPageHeader).
 * Les modals restants sont des CONFIRMATIONS uniquement.
 */
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

  return (
    <>
      <div className="bg-white rounded-xl min-h-screen shadow-sm mt-4">
        <div className="flex flex-col md:flex-row gap-4 md:gap-12">
          {/* Colonne gauche : Profil + Coordonnées */}
          <div className="md:w-3/5 p-4 sm:p-6 h-auto">
            {/* Profil */}
            <div className="mb-6">
              <p className="text-[18px] font-medium text-[#F17922] mb-4">Profil</p>
              <div className="flex items-start gap-5">
                <div className="w-28 h-28 flex-shrink-0">
                  <Image
                    src={getAvatarUrl(member)}
                    alt={member.fullname}
                    width={112}
                    height={112}
                    className="w-28 h-28 rounded-full object-cover bg-[#FFF6E9] border border-[#F17922]/20"
                    unoptimized={!member.image || member.image.startsWith("/icons/")}
                  />
                </div>
                <div className="flex-1 min-w-0 pt-2">
                  <h1 className="text-2xl font-semibold text-[#18181B]">
                    {member.fullname}
                  </h1>
                  <p className="text-sm text-[#71717A] mt-1 break-words">
                    {member.email}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold text-[#7A3502] bg-[#FBDBA7]">
                      {ROLE_LABELS[member.role] ?? member.role}
                    </span>
                    <span
                      className={
                        isSuspended
                          ? "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold text-[#EF4444] bg-[#EF4444]/15"
                          : "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold text-[#22C55E] bg-[#22C55E]/15"
                      }
                    >
                      {isSuspended ? "Suspendu" : "Actif"}
                    </span>
                    {member.isPrincipal && (
                      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold text-[#9A7008] bg-[#FDF3D6]">
                        <Star size={12} /> Manager principal
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Coordonnées */}
            <div className="mb-6">
              <p className="text-[18px] font-medium text-[#F17922] mb-2">
                Coordonnées
              </p>
              <Row label="E-mail" value={member.email || "—"} />
              <Row label="Téléphone" value={member.phone || "—"} />
              <Row label="Adresse" value={member.address || "—"} />
            </div>
          </div>

          {/* Colonne droite : Affectation + Actions */}
          <div className="md:w-2/5 p-4 sm:p-6 pb-20 md:pb-6 bg-[#FBFBFB] h-auto">
            {/* Affectation */}
            <div className="mb-6">
              <p className="text-[18px] font-medium text-[#F17922] mb-2">
                Affectation
              </p>
              <Row
                label="Restaurant"
                value={restaurantName || "Back Office"}
              />
              <Row label="Rôle" value={ROLE_LABELS[member.role] ?? member.role} />
              {member.role === "MANAGER" && (
                <Row
                  label="Manager principal"
                  value={member.isPrincipal ? "Oui" : "Non"}
                />
              )}
            </div>

            {/* Actions admin */}
            {!isReadOnly && (
              <div className="mb-6">
                <p className="text-[18px] font-medium text-[#F17922] mb-3">
                  Actions
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={onEdit}
                    disabled={busy}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#F17922] rounded-lg hover:bg-[#e06816] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Pencil className="w-4 h-4" />
                    Modifier
                  </button>

                  <ResetPasswordButton
                    userId={member.id}
                    label="Réinitialiser le mot de passe"
                    className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-[#F17922] border border-[#F17922] rounded-lg hover:bg-orange-50 cursor-pointer"
                  />

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
                      className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-[#9A7008] border border-[#E5C55B] rounded-lg hover:bg-[#FDF3D6]/60 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <Star className="w-4 h-4" />
                      Définir comme manager principal
                    </button>
                  )}

                  {isSuspended ? (
                    <button
                      type="button"
                      onClick={() =>
                        run(() => restoreUser(member.id), "Utilisateur restauré")
                      }
                      disabled={busy}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#22C55E] rounded-lg hover:bg-[#16A34A] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Restaurer le compte
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirm("suspend")}
                      disabled={busy}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-[#F59E0B] border border-[#F59E0B] rounded-lg hover:bg-[#F59E0B]/10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <Ban className="w-4 h-4" />
                      Suspendre
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setConfirm("delete")}
                    disabled={busy}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#EF4444] rounded-lg hover:bg-[#DC2626] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    Supprimer définitivement
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

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
    </>
  );
};

export default MemberDetail;
