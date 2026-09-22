"use client";

import React from "react";
import { CheckCircle, Info, Truck } from "lucide-react";

import { useOrderActions } from "../../../orders/hooks/useOrderActions";
import { format } from "date-fns";
// ⚠️ Import RELATIF entre features : `@/` pointe sur src/, `features/` est à la racine.
import { AVANCE_PREPARATION_MS, momentSouhaite } from "../../../orders/utils/momentSouhaite";
import { OrderStatus, type Order } from "../../../orders/types/order.types";
import { DrawerCancelAction } from "./DrawerCancelAction";

interface Props {
  order: Order;
}

/**
 * Bouton d'action principal pour les commandes Chicken Nation — footer du drawer.
 *
 * L'encaissement espèce est maintenant géré dans le tab "Paiement" dédié,
 * ce composant ne gère plus que les transitions ACCEPTED → IN_PROGRESS → READY
 * + des infos d'état pour les autres statuts.
 */
export const DrawerActionsChickenNation: React.FC<Props> = ({ order }) => {
  const { handleOrderUpdateStatus, isLoading } = useOrderActions();
  const pickup = (order as unknown as { delivery?: { course?: { pickup_code: string } } }).delivery?.course?.pickup_code;
  /**
   * La préparation ne s'ouvre qu'une heure avant l'heure souhaitée.
   *
   * Le serveur applique la même règle et refuserait de toute façon : ce
   * blocage-ci sert à l'expliquer AVANT le clic, plutôt que de laisser
   * découvrir un refus. Les deux calculs partagent le même utilitaire, pour
   * qu'aucun ne dérive de l'autre.
   */
  const moment = momentSouhaite(order.date, order.time);
  const ouverture = moment ? new Date(moment.getTime() - AVANCE_PREPARATION_MS) : null;
  const tropTot = !!ouverture && Date.now() < ouverture.getTime();


  if (order.status === OrderStatus.ACCEPTED) {
    return (
      <div className="space-y-2">
        <button
          onClick={() => handleOrderUpdateStatus(order.id, OrderStatus.IN_PROGRESS)}
          disabled={isLoading || tropTot}
          title={
            tropTot && ouverture
              ? `Commande programmée : la préparation s'ouvre à ${format(ouverture, "HH'h'mm")}`
              : undefined
          }
          className="w-full py-3 bg-[#F17922] hover:bg-[#e06816] text-white font-semibold rounded-xl transition disabled:bg-gray-300"
        >
          {isLoading ? "…" : "Commencer la préparation"}
        </button>
        {tropTot && ouverture && (
          <p className="text-[11px] text-[#8A4B00] text-center">
            Commande programmée pour {format(moment!, "HH'h'mm")} · préparation à partir de{" "}
            {format(ouverture, "HH'h'mm")}
          </p>
        )}
        <DrawerCancelAction order={order} />
      </div>
    );
  }

  if (order.status === OrderStatus.IN_PROGRESS) {
    return (
      <div className="space-y-2">
        <button
          onClick={() => handleOrderUpdateStatus(order.id, OrderStatus.READY)}
          disabled={isLoading}
          className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition disabled:bg-gray-300"
        >
          <CheckCircle className="w-4 h-4" />
          {isLoading ? "…" : "Marquer comme prête"}
        </button>
        <DrawerCancelAction order={order} />
      </div>
    );
  }

  if (order.status === OrderStatus.READY) {
    return (
      <div className="space-y-2">
        <div className="flex items-start gap-3 rounded-xl bg-orange-50 border border-orange-200 px-3 py-3">
          <Truck className="w-5 h-5 text-[#F17922] shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">En attente du livreur</p>
            {pickup && (
              <p className="text-xs text-gray-600 mt-0.5">
                Code retrait :{" "}
                <span className="font-mono font-bold text-[#F17922] text-base">{pickup}</span>
              </p>
            )}
            <p className="text-[11px] text-gray-500 mt-1">
              Le livreur dictera le code à la caissière dès son arrivée.
            </p>
          </div>
        </div>
        <DrawerCancelAction order={order} />
      </div>
    );
  }

  if (order.status === OrderStatus.PICKED_UP || order.status === OrderStatus.COLLECTED) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-blue-50 border border-blue-200 px-3 py-2">
        <Info className="w-4 h-4 text-blue-600 shrink-0" />
        <p className="text-xs text-blue-800">
          Commande récupérée par le livreur — suivi via le module Courses.
        </p>
      </div>
    );
  }

  if (order.status === OrderStatus.COMPLETED) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 px-3 py-2">
        <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
        <p className="text-xs text-green-800">
          Commande terminée
          {order.paied ? " — paiement enregistré ✓" : ""}
        </p>
      </div>
    );
  }

  return null;
};
