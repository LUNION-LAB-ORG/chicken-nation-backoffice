"use client";

import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { MoreVertical } from "lucide-react";

import { OrderActionItems } from "../../../orders/components/actions/OrderActionItems";
import { useDroitsCommande } from "../../../orders/hooks/useDroitsCommande";
import { useOrderActions } from "../../../orders/hooks/useOrderActions";
import type { Order } from "../../../orders/types/order.types";
import type { OrderTable } from "../../../orders/types/ordersTable.types";
import { actionsCommande, type ActionCommande } from "../../../orders/utils/order-actions-rules";
import { mapApiOrderToUiOrder } from "../../../orders/utils/orderMapper";

interface Props {
  order: Order;
  /**
   * « Modifier » : la page ferme le tiroir et ouvre « Modifier la commande »
   * (qui n'existe que sur l'onglet « Commandes »). Sans ce rappel, l'action
   * n'est pas proposée.
   */
  onEdit?: (commande: OrderTable) => void;
}

/**
 * Bouton ⋮ de l'en-tête du tiroir : les actions du menu de ligne de la liste,
 * avec les MÊMES règles de droits (`actionsCommande()`, module partagé). Le
 * tiroir retire seulement ce qu'il affiche déjà ailleurs (voir la règle
 * « tiroir » du module). Aucune action permise : le bouton ne s'affiche pas.
 */
export const DrawerActionsMenu: React.FC<Props> = ({ order, onEdit }) => {
  const [ouvert, setOuvert] = useState(false);
  const conteneurRef = useRef<HTMLDivElement>(null);
  const boutonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const droits = useDroitsCommande();
  const { handleDeleteOrder, handleToggleOrderModal } = useOrderActions();

  const actions = actionsCommande(order.status, droits, "tiroir", {
    dejaSupprimee: order.entity_status === "DELETED",
  }).filter(
    (action) => action !== "modifier" || !!onEdit,
  );

  const fermer = useCallback((rendreLeFocus: boolean) => {
    setOuvert(false);
    if (rendreLeFocus) boutonRef.current?.focus();
  }, []);

  const elements = useCallback(
    () =>
      Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? []),
    [],
  );

  // Focus sur le premier élément à l'ouverture.
  useEffect(() => {
    if (ouvert) elements()[0]?.focus();
  }, [ouvert, elements]);

  // Clic extérieur et Échap (même si le focus est ailleurs).
  useEffect(() => {
    if (!ouvert) return;
    const surClic = (e: MouseEvent | TouchEvent) => {
      if (!conteneurRef.current?.contains(e.target as Node)) fermer(false);
    };
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        fermer(true);
      }
    };
    document.addEventListener("mousedown", surClic);
    document.addEventListener("touchstart", surClic);
    document.addEventListener("keydown", surTouche);
    return () => {
      document.removeEventListener("mousedown", surClic);
      document.removeEventListener("touchstart", surClic);
      document.removeEventListener("keydown", surTouche);
    };
  }, [ouvert, fermer]);

  // Le statut change en direct : on referme si plus rien n'est permis.
  useEffect(() => {
    if (actions.length === 0) setOuvert(false);
  }, [actions.length]);

  if (actions.length === 0) return null;

  const surToucheMenu = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const liste = elements();
    if (liste.length === 0) return;
    const index = liste.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      liste[(index + 1) % liste.length]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      liste[(index - 1 + liste.length) % liste.length]?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      liste[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      liste[liste.length - 1]?.focus();
    } else if (e.key === "Tab") {
      fermer(false);
    }
  };

  const surAction = (action: ActionCommande) => {
    const commande = mapApiOrderToUiOrder(order);
    fermer(false);
    switch (action) {
      case "modifier":
        onEdit?.(commande);
        return;
      case "annuler":
        handleToggleOrderModal(commande, "to_cancel");
        return;
      case "supprimer":
        handleDeleteOrder(commande);
        return;
      default:
        // « tiroir » ne propose pas les autres actions (voir le module de règles).
        return;
    }
  };

  return (
    <div ref={conteneurRef} className="relative">
      <button
        ref={boutonRef}
        type="button"
        aria-label="Actions sur la commande"
        aria-haspopup="menu"
        aria-expanded={ouvert}
        aria-controls={ouvert ? menuId : undefined}
        title="Actions sur la commande"
        onClick={() => setOuvert((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && !ouvert) {
            e.preventDefault();
            setOuvert(true);
          }
        }}
        className={`p-2 rounded-lg transition ${ouvert ? "bg-gray-100" : "hover:bg-gray-100"}`}
      >
        <MoreVertical className="w-5 h-5 text-gray-500" />
      </button>

      {ouvert && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label="Actions sur la commande"
          onKeyDown={surToucheMenu}
          className="absolute right-0 top-full mt-1 z-30 w-56 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200"
        >
          <div className="py-1">
            <OrderActionItems actions={actions} onAction={surAction} role="menuitem" />
          </div>
        </div>
      )}
    </div>
  );
};
