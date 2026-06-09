"use client";

import React, { useEffect } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

export type ConfirmDialogVariant = "danger" | "default";

interface ConfirmDialogProps {
  /** Affichage du dialog. */
  isOpen: boolean;
  /** Fermeture sans confirmer (clic backdrop, ESC, bouton Annuler). */
  onClose: () => void;
  /** Action quand l'utilisateur valide. Asynchrone OK : le bouton reste en spinner. */
  onConfirm: () => void;
  /** Titre en gras, max 1 ligne. */
  title: string;
  /** Texte explicatif, peut être un node (ex: <p>…<b>X</b>…</p>). */
  description: React.ReactNode;
  /** Libellé bouton primaire. Défaut : "Confirmer". */
  confirmLabel?: string;
  /** Libellé bouton secondaire. Défaut : "Annuler". */
  cancelLabel?: string;
  /** "danger" → bouton rouge + icône warning. "default" → bouton orange marque. */
  variant?: ConfirmDialogVariant;
  /** Loading externe (mutation en cours). Désactive les boutons. */
  isLoading?: boolean;
}

/**
 * Dialog de confirmation. Remplacement de `window.confirm()` qui est :
 *  - non-stylable, hors charte
 *  - bloquant le thread JS, ce qui empêche tout async (mutation, toast, etc.)
 *
 * Usage :
 *   const [askDelete, setAskDelete] = useState(false);
 *   <ConfirmDialog
 *     isOpen={askDelete}
 *     onClose={() => setAskDelete(false)}
 *     onConfirm={() => { mutation.mutate(); setAskDelete(false); }}
 *     title="Supprimer ce paiement ?"
 *     description="Cette action recalculera le solde de la commande."
 *     variant="danger"
 *     isLoading={mutation.isPending}
 *   />
 */
export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  variant = "default",
  isLoading = false,
}: ConfirmDialogProps) {
  // Ferme à la touche Échap (UX standard des dialogs)
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const isDanger = variant === "danger";

  return (
    <div
      onClick={isLoading ? undefined : onClose}
      className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden"
      >
        {/* Icône + titre */}
        <div className="p-5 pb-3 flex items-start gap-3">
          <div
            className={`shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
              isDanger ? "bg-red-50 text-red-600" : "bg-orange-50 text-[#F17922]"
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3
              id="confirm-dialog-title"
              className="text-base font-bold text-gray-900"
            >
              {title}
            </h3>
            <div className="mt-1 text-sm text-gray-600 leading-relaxed">
              {description}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 py-4 bg-gray-50 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-sm font-semibold text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 ${
              isDanger
                ? "bg-red-600 hover:bg-red-700"
                : "bg-[#F17922] hover:bg-[#F17922]/90"
            }`}
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
