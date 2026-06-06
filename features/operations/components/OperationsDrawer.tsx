"use client";

import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { X } from "lucide-react";

import { useOrderDetailQuery } from "../../orders/queries/order-detail.query";
import { DeliveryService, OrderType, PaymentMethod, type Order } from "../../orders/types/order.types";
import { useOrderActions } from "../../orders/hooks/useOrderActions";
import { Printer } from "lucide-react";
import { TYPE_LABEL } from "../utils/status-colors";
import { DrawerActionsChickenNation } from "./drawer/DrawerActionsChickenNation";
import { DrawerActionsClient } from "./drawer/DrawerActionsClient";
import { DrawerActionsTurbo } from "./drawer/DrawerActionsTurbo";
import { DrawerDetailsTab } from "./drawer/DrawerDetailsTab";
import { DrawerHistoriqueTab } from "./drawer/DrawerHistoriqueTab";
import { DrawerPaymentTab } from "./drawer/DrawerPaymentTab";
import { DrawerTabs, type DrawerTabKey } from "./drawer/DrawerTabs";

interface Props {
  order: Order | null;
  onClose: () => void;
  /** Tab à ouvrir par défaut à l'ouverture du drawer (ex. 'payment' après clic « Faire le paiement ») */
  initialTab?: DrawerTabKey;
}

/**
 * Drawer slide-in responsive (480 → 720 → 840 px) avec 3 tabs :
 *   - Détails    : hero, fiche client, articles + images + suppléments, récap, progression, infos
 *   - Historique : carnet de commandes précédentes du client (la commande actuelle est surlignée)
 *   - Paiement   : encaissement cash, visible uniquement pour OFFLINE non payée
 *
 * **Live refresh** : on consomme `useOrderDetailQuery(order.id)` ici pour que le
 * header et la logique `showPayment` suivent les changements temps réel.
 * `useOperationsSocketSync` (page parente) invalide `['order']` sur chaque event
 * socket → ce hook refetche → UI à jour sans fermer/rouvrir le drawer.
 */
export const OperationsDrawer: React.FC<Props> = ({ order, onClose, initialTab }) => {
  const isOpen = order !== null;
  const [tab, setTab] = useState<DrawerTabKey>(initialTab ?? "details");
  const { handlePrintOrder, isLoading } = useOrderActions();

  // Live : on récupère la version fraîche de la commande (invalidée par socket).
  // Fallback sur la prop tant que le fetch n'a pas encore résolu.
  const { data: fetched } = useOrderDetailQuery(order?.id ?? "");
  const live: Order | null = (fetched as Order | undefined) ?? order;

  // Réinitialise le tab à chaque (ré)ouverture — respecte `initialTab` si fourni
  // (ex. clic « Faire le paiement » → initialTab='payment').
  useEffect(() => {
    if (order) setTab(initialTab ?? "details");
  }, [order?.id, initialTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Le tab Paiement reste visible :
  //   - Pour les OFFLINE dès que la commande est PICKED_UP / COLLECTED / COMPLETED
  //     (formulaire d'encaissement OU historique si déjà payée)
  //   - Pour les ONLINE dès qu'au moins un paiement existe (consultation historique)
  // Plus de garde `!live.paied` : la tab affiche maintenant l'historique des
  // paiements une fois encaissés, donc pertinente même après clôture.
  const showPayment =
    !!live &&
    ((live.payment_method === PaymentMethod.OFFLINE &&
      ["PICKED_UP", "COLLECTED", "COMPLETED"].includes(live.status)) ||
      (live.paiements?.length ?? 0) > 0);

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px] transition-opacity"
        />
      )}
      <aside
        className={`fixed top-0 right-0 h-[100dvh] w-full max-w-[480px] lg:max-w-[720px] xl:max-w-[840px] bg-white shadow-2xl z-50 transform transition-transform duration-300 flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {live && (
          <>
            {/* Header sticky — pas de badge de service livraison ici
                (l'info reste dans le tab Détails : hero chip + champ « Service livraison ») */}
            <header className="px-4 pb-3 pt-[calc(1rem+env(safe-area-inset-top))] border-b border-gray-100 bg-white">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-gray-900 truncate">{live.reference}</h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {format(new Date(live.created_at), "dd MMM yyyy · HH:mm", { locale: fr })} ·{" "}
                    {TYPE_LABEL[live.type] ?? ""}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handlePrintOrder(live.id)}
                    disabled={isLoading}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#F17922] bg-orange-50 hover:bg-orange-100 disabled:opacity-50 rounded-lg transition"
                    title="Imprimer le ticket"
                  >
                    <Printer className="w-4 h-4" />
                    <span className="hidden sm:inline">Imprimer</span>
                  </button>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
            </header>

            {/* Tabs nav */}
            <DrawerTabs value={tab} onChange={setTab} showPayment={showPayment} />

            {/* Content scrollable */}
            <div className="flex-1 overflow-y-auto">
              {tab === "details" && <DrawerDetailsTab order={live} />}
              {tab === "historique" && <DrawerHistoriqueTab order={live} />}
              {tab === "payment" && showPayment && <DrawerPaymentTab order={live} />}
            </div>

            {/* Actions sticky footer
                Routage par type de commande :
                 - PICKUP / TABLE → DrawerActionsClient (séquence sans PICKED_UP)
                 - DELIVERY via CHICKEN_NATION → DrawerActionsChickenNation (module course interne)
                 - DELIVERY via Turbo/autre → DrawerActionsTurbo (workflow manuel) */}
            <footer className="px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] border-t border-gray-100 bg-gray-50/80">
              {live.type !== OrderType.DELIVERY ? (
                <DrawerActionsClient order={live} />
              ) : live.delivery_service === DeliveryService.CHICKEN_NATION ? (
                <DrawerActionsChickenNation order={live} />
              ) : (
                <DrawerActionsTurbo order={live} />
              )}
            </footer>
          </>
        )}
      </aside>
    </>
  );
};
