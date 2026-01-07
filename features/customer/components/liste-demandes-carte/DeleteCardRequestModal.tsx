"use client";

import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { CardRequest } from "../../types/carte-nation.types";
import { getStatusBadgeRequestCard } from "../../utils/getStatusBadgeRequestCard";

interface DeleteCardRequestModalProps {
  isOpen: boolean;
  request: CardRequest;
  onClose: () => void;
}

export function DeleteCardRequestModal({
  isOpen,
  request,
  onClose,
}: DeleteCardRequestModalProps) {
  const isLoading = false;

  if (!isOpen) return null;

  const handleDelete = async () => {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            Supprimer la demande
          </h2>
        </div>

        <div className="mb-6">
          <p className="text-gray-700 mb-4">
            Vous êtes sur le point de supprimer définitivement la demande de
            carte Nation pour :
          </p>
          <div className="p-4 bg-gray-50 rounded-lg space-y-2 mb-4">
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
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Statut :</span>
              <span className="text-sm font-medium text-gray-900">
                {getStatusBadgeRequestCard(request.status)}
              </span>
            </div>
          </div>

          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800 font-medium">
              ⚠️ Cette action est irréversible. Toutes les données associées
              seront perdues.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="w-full py-3 rounded-lg border border-gray-300 font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Annuler
          </button>
          <button
            onClick={handleDelete}
            disabled={isLoading}
            className="w-full py-3 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Suppression...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Supprimer
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
