"use client";

import React from "react";
import { Ban, Check, RefreshCw, Store, Trash2, XCircle } from "lucide-react";

import {
  useDeleteLivreur,
  useReactivateLivreur,
  useValidateLivreur,
} from "../../hook/use-livreurs";
import type { Livreur } from "../../types/livreur.types";

interface WorkflowActionsProps {
  livreur: Livreur;
  onBack: () => void;
  onReject: () => void;
  onSuspend: () => void;
  onAssignRestaurant: () => void;
}

const WorkflowActions: React.FC<WorkflowActionsProps> = ({
  livreur,
  onBack,
  onReject,
  onSuspend,
  onAssignRestaurant,
}) => {
  const { mutate: validate, isPending: isValidating } = useValidateLivreur();
  const { mutate: reactivate, isPending: isReactivating } = useReactivateLivreur();
  const { mutate: deleteLivreur, isPending: isDeleting } = useDeleteLivreur();

  const isPending = livreur.status === "PENDING_VALIDATION";
  const isActive = livreur.status === "ACTIVE";
  const isSuspended = livreur.status === "SUSPENDED";
  const canValidate = isPending && !!livreur.piece_identite && !!livreur.permis_conduire;

  const handleDelete = () => {
    if (!confirm(`Supprimer définitivement ce compte livreur ?`)) return;
    deleteLivreur(livreur.id, { onSuccess: onBack });
  };

  return (
    <div className="mb-6">
      <p className="text-[18px] font-medium text-[#F17922] mb-3">Actions</p>

      <div className="flex flex-col gap-2">
        {isPending && (
          <button
            type="button"
            onClick={() => validate(livreur.id)}
            disabled={!canValidate || isValidating}
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#22C55E] rounded-lg hover:bg-[#16A34A] disabled:opacity-50 disabled:cursor-not-allowed"
            title={!canValidate ? "Documents obligatoires manquants" : undefined}
          >
            <Check className="w-4 h-4" />
            {isValidating ? "Validation…" : "Valider le livreur"}
          </button>
        )}

        {(isActive || isPending) && (
          <button
            type="button"
            onClick={onAssignRestaurant}
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#F17922] rounded-lg hover:bg-[#DC6718]"
          >
            <Store className="w-4 h-4" />
            {livreur.restaurant_id ? "Changer de restaurant" : "Affecter un restaurant"}
          </button>
        )}

        {isSuspended && (
          <button
            type="button"
            onClick={() => reactivate(livreur.id)}
            disabled={isReactivating}
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#22C55E] rounded-lg hover:bg-[#16A34A] disabled:opacity-50"
          >
            <RefreshCw className="w-4 h-4" />
            {isReactivating ? "Réactivation…" : "Réactiver"}
          </button>
        )}

        {isActive && (
          <button
            type="button"
            onClick={onSuspend}
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-[#EF4444] bg-white border border-[#EF4444]/30 rounded-lg hover:bg-[#EF4444]/5"
          >
            <Ban className="w-4 h-4" />
            Suspendre
          </button>
        )}

        {isPending && (
          <button
            type="button"
            onClick={onReject}
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-[#EF4444] bg-white border border-[#EF4444]/30 rounded-lg hover:bg-[#EF4444]/5"
          >
            <XCircle className="w-4 h-4" />
            Refuser
          </button>
        )}

        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-[#71717A] hover:text-[#EF4444] mt-4 disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4" />
          Supprimer définitivement
        </button>
      </div>
    </div>
  );
};

export default WorkflowActions;
