"use client";

import React from "react";
import { CheckCircle2, Edit2, Eye, Printer, Trash2, X } from "lucide-react";

import type { ActionCommande } from "../../utils/order-actions-rules";

/** Libellé, icône et style de chaque action : un seul rendu pour la liste et le tiroir. */
const PRESENTATION: Record<
  ActionCommande,
  { libelle: string; Icone: React.ComponentType<{ size?: number }>; classe: string }
> = {
  accepter: {
    libelle: "Accepter la commande",
    Icone: CheckCircle2,
    classe: "text-[#F17922] hover:bg-gray-50 focus-visible:bg-gray-50",
  },
  refuser: {
    libelle: "Refuser",
    Icone: X,
    classe: "font-semibold text-red-600 hover:bg-gray-50 focus-visible:bg-gray-50",
  },
  imprimer: {
    libelle: "Imprimer",
    Icone: Printer,
    classe: "text-[#595959] hover:bg-orange-50 focus-visible:bg-orange-50",
  },
  voir: {
    libelle: "Voir les détails",
    Icone: Eye,
    classe: "text-[#595959] hover:bg-orange-50 focus-visible:bg-orange-50",
  },
  modifier: {
    libelle: "Modifier",
    Icone: Edit2,
    classe: "text-[#595959] hover:bg-orange-50 focus-visible:bg-orange-50",
  },
  annuler: {
    libelle: "Annuler la commande",
    Icone: X,
    classe: "text-red-600 hover:bg-red-50 focus-visible:bg-red-50",
  },
  supprimer: {
    libelle: "Supprimer",
    Icone: Trash2,
    classe: "text-red-600 hover:bg-red-50 focus-visible:bg-red-50",
  },
};

interface Props {
  /** Actions permises, déjà calculées par `actionsCommande()`. */
  actions: ActionCommande[];
  onAction: (action: ActionCommande) => void;
  /** Rôle ARIA des éléments (« menuitem » dans un menu accessible). */
  role?: "menuitem";
}

/** Éléments du menu d'actions d'une commande, dans l'ordre reçu. */
export const OrderActionItems: React.FC<Props> = ({ actions, onAction, role }) => (
  <>
    {actions.map((action) => {
      const { libelle, Icone, classe } = PRESENTATION[action];
      return (
        <button
          key={action}
          type="button"
          role={role}
          className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 cursor-pointer outline-none ${classe}`}
          onClick={() => onAction(action)}
        >
          <Icone size={16} />
          <span>{libelle}</span>
        </button>
      );
    })}
  </>
);
