"use client";

import React, { useState } from "react";
import { HandCoins, Loader2 } from "lucide-react";

import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { paiementDataSelect } from "../../constantes/paiement-data-select";
import { usePaiementConfirmMutation } from "../../queries/paiement-confirm.mutation";
import { usePaiementRefuseMutation } from "../../queries/paiement-refuse.mutation";
import { OrderStatus } from "../../types/order.types";
import { PaiementStatus, type Paiement } from "../../types/paiement.types";
import { OrderTable } from "../../types/ordersTable.types";
import { peutConfirmer } from "../../utils/encaissement-livreur";

/**
 * ENCAISSEMENT LIVREUR À CONFIRMER (livreur Chicken Nation ou Turbo).
 *
 * Le livreur a encaissé le client à la livraison : un paiement EN ATTENTE a
 * été créé et la commande est restée « récupérée ». Ce bloc affiche le
 * montant et le moyen déclarés, avec deux gestes (18/11) :
 *  - « Confirmer l'encaissement » : le paiement passe réussi, la commande est
 *    marquée payée et se TERMINE ;
 *  - « Refuser » : la déclaration est fausse (mauvais moyen, mauvais montant,
 *    ou la caisse a déjà encaissé). Elle ne compte plus, la commande ne bouge
 *    pas, et la caisse peut encaisser le bon montant.
 *
 * Une déclaration qui ferait dépasser le prix de la commande (déjà encaissée
 * en caisse ou payée en ligne) ne se confirme plus : seul le refus reste. Le
 * bloc reste donc visible sur une commande payée ou annulée tant qu'une
 * déclaration attend : sans lui, elle restait en attente pour toujours.
 *
 * S'auto-masque s'il n'y a aucun paiement en attente.
 */
export default function PendingCollectionAction({
  order,
  className = "",
}: {
  order: OrderTable;
  className?: string;
}) {
  const { mutate: confirmer, isPending: confirmation } = usePaiementConfirmMutation();
  const { mutate: refuser, isPending: refus } = usePaiementRefuseMutation();
  const [aRefuser, setARefuser] = useState<Paiement | null>(null);
  const occupe = confirmation || refus;

  const paiements = order.paiements ?? [];
  const pendings = paiements.filter((p) => p.status === PaiementStatus.PENDING);
  if (pendings.length === 0) return null;
  // Commande annulée : l'encaissement est un LITIGE, jamais une confirmation
  // (le serveur refuse). Le refus reste possible pour clore la déclaration.
  const annulee = order.rawStatus === OrderStatus.CANCELLED;

  const libelleMoyen = (p: Paiement) =>
    paiementDataSelect.find((opt) => opt.source === p.source)?.label ?? p.source ?? "Espèces";

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
            const confirmable = !annulee && peutConfirmer(order.amount, paiements, p);
            return (
              <div
                key={p.id}
                className="mt-3 rounded-xl border border-amber-200/70 bg-white px-3.5 py-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm">
                    <span className="font-black tabular-nums text-gray-900">
                      {p.amount.toLocaleString()} XOF
                    </span>
                    <span className="ml-2 text-xs font-semibold text-gray-500">
                      {libelleMoyen(p)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={occupe}
                      onClick={() => setARefuser(p)}
                      className="inline-flex h-9 items-center rounded-xl border border-gray-300 bg-white px-4 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Refuser
                    </button>
                    {confirmable && (
                      <button
                        type="button"
                        disabled={occupe}
                        onClick={() => confirmer(p.id)}
                        className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#F17922] px-4 text-xs font-semibold text-white transition hover:bg-[#F17922]/90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {confirmation ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Confirmation...
                          </>
                        ) : (
                          "Confirmer l'encaissement"
                        )}
                      </button>
                    )}
                  </div>
                </div>
                {!confirmable && (
                  <p className="mt-1.5 text-[11px] font-semibold text-amber-800">
                    {annulee
                      ? "Commande annulée : ce paiement ne peut pas être confirmé."
                      : "Ce paiement serait de trop : la commande a déjà reçu son montant."}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <ConfirmDialog
        isOpen={aRefuser !== null}
        onClose={() => setARefuser(null)}
        onConfirm={() => {
          if (!aRefuser) return;
          refuser(aRefuser.id, { onSettled: () => setARefuser(null) });
        }}
        title="Refuser ce paiement ?"
        description={
          aRefuser ? (
            <>
              <b>{aRefuser.amount.toLocaleString()} XOF</b> ({libelleMoyen(aRefuser)}), déclaré par le livreur.
              <br />
              Il ne comptera pas dans ce que la commande a reçu.
            </>
          ) : null
        }
        confirmLabel="Refuser"
        cancelLabel="Annuler"
        variant="danger"
        isLoading={refus}
      />
    </div>
  );
}
