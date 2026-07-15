"use client";

import { useState } from "react";
import { useConfirmPaymentMutation } from "../../queries/confirm-payment.mutation";
import { OrderStatus } from "../../types/order.types";
import { OrderTable } from "../../types/ordersTable.types";

interface ConfirmPaymentActionProps {
  order: OrderTable;
}

/**
 * Action admin « Confirmer le paiement » pour les commandes en attente de
 * paiement EN LIGNE (KKiaPay). Rejoue la vérification KKiaPay côté serveur à
 * partir d'une Référence de transaction saisie manuellement.
 *
 * Visibilité : uniquement si la commande est encore PENDING.
 *  - `order.rawStatus === OrderStatus.PENDING` : statut brut (source de vérité
 *    du workflow, cf. ordersTable.types — `status` n'est qu'un libellé).
 *  - Le contexte « paiement en ligne » est garanti par l'emplacement d'appel
 *    (branche ONLINE du tab Paiement du drawer). On ne filtre donc PLUS sur
 *    `paymentChannel === "Appli"` : une commande payée en ligne mais créée au
 *    call center (`auto=false` → channel "Restaurant") doit AUSSI pouvoir être
 *    réconciliée par l'admin.
 */
const ConfirmPaymentAction = ({ order }: ConfirmPaymentActionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const { mutate, isPending } = useConfirmPaymentMutation();

  if (order.rawStatus !== OrderStatus.PENDING) return null;

  const handleConfirm = () => {
    const trimmed = transactionId.trim();
    if (!trimmed || isPending) return;

    mutate(
      { id: order.id, transactionId: trimmed },
      {
        onSuccess: () => {
          setIsOpen(false);
          setTransactionId("");
        },
      }
    );
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="mt-6 w-full cursor-pointer bg-[#F17922] text-white rounded-xl py-3 px-4 font-medium hover:bg-[#F17972] transition-colors"
      >
        Confirmer le paiement
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              Confirmer le paiement KKiaPay
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              Commande #{order.reference || order.id.slice(0, 8)}
            </p>

            <label
              htmlFor="kkiapay-transaction-id"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Référence de transaction KKiaPay
            </label>
            <input
              id="kkiapay-transaction-id"
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="Ex : TRX-XXXXXXXX"
              autoFocus
              disabled={isPending}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all disabled:opacity-50"
            />
            <p className="text-xs text-gray-500 mt-1.5">
              Copie la Référence depuis la fiche transaction du dashboard KKiaPay.
            </p>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={isPending}
                className="w-full py-3 rounded-lg border border-gray-300 cursor-pointer disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!transactionId.trim() || isPending}
                className="w-full py-3 rounded-lg bg-[#F17922] text-white font-semibold cursor-pointer hover:bg-[#F17972] transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {isPending ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Vérification...
                  </>
                ) : (
                  "Confirmer"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ConfirmPaymentAction;
