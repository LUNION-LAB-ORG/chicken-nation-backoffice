"use client";

import React from "react";
import { HandCoins, Loader2 } from "lucide-react";

import { paiementDataSelect } from "../../constantes/paiement-data-select";
import { usePaiementConfirmMutation } from "../../queries/paiement-confirm.mutation";
import { OrderStatus } from "../../types/order.types";
import { PaiementStatus } from "../../types/paiement.types";
import { OrderTable } from "../../types/ordersTable.types";

/**
 * ENCAISSEMENT LIVREUR À CONFIRMER (Turbo).
 *
 * Un livreur Turbo a encaissé le client à la livraison : le webhook a créé un
 * paiement EN ATTENTE et la commande est restée « récupérée ». Ce bloc affiche
 * le montant + moyen déclarés et le bouton de confirmation : le paiement passe
 * en SUCCESS, la commande est marquée payée et se TERMINE automatiquement.
 *
 * S'auto-masque s'il n'y a aucun paiement en attente (ou commande déjà payée).
 */
export default function PendingCollectionAction({
  order,
  className = "",
}: {
  order: OrderTable;
  className?: string;
}) {
  const { mutate: confirmer, isPending } = usePaiementConfirmMutation();

  const pendings = (order.paiements ?? []).filter(
    (p) => p.status === PaiementStatus.PENDING,
  );
  if (pendings.length === 0 || order.paied) return null;
  // Commande annulée : l'encaissement est un LITIGE, pas une confirmation —
  // le serveur refuse de toute façon (jamais paied=true sur une annulée).
  if (order.rawStatus === OrderStatus.CANCELLED) return null;

  return (
    <div
      className={`rounded-2xl border border-amber-200 bg-amber-50 p-4 ${className}`}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
          <HandCoins className="h-4.5 w-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold text-amber-800">
            Encaissement livreur à confirmer
          </p>
          <p className="mt-0.5 text-xs text-amber-700/90">
            Le livreur déclare avoir encaissé le client à la livraison. La
            confirmation marque la commande payée et la termine.
          </p>

          {pendings.map((p) => {
            const moyen =
              paiementDataSelect.find((opt) => opt.source === p.source)?.label ??
              p.source ??
              "Espèces";
            return (
              <div
                key={p.id}
                className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200/70 bg-white px-3.5 py-2.5"
              >
                <div className="text-sm">
                  <span className="font-black tabular-nums text-gray-900">
                    {p.amount.toLocaleString()} XOF
                  </span>
                  <span className="ml-2 text-xs font-semibold text-gray-500">
                    {moyen}
                  </span>
                </div>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => confirmer(p.id)}
                  className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#F17922] px-4 text-xs font-semibold text-white transition hover:bg-[#F17922]/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Confirmation...
                    </>
                  ) : (
                    "Confirmer l'encaissement"
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
