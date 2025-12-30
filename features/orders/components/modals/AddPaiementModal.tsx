"use client";

import { useState } from "react";
import { CustomPaymentSelect } from "../CustomPaymentSelect";
import { useOrderActions } from "../../hooks/useOrderActions";
import { OrderTable } from "../../types/ordersTable.types";
import { PaiementMode } from "../../types/paiement.types";
import { usePaiementAddMutation } from "../../queries/paiement-add.mutation";
import { paiementDataSelect } from "../../constantes/paiement-data-select";

interface AddPaiementModalProps {
  isOpen: boolean;
  order: OrderTable;
}

export function AddPaiementModal({ isOpen, order }: AddPaiementModalProps) {
  const { handleToggleOrderModal } = useOrderActions();

  // Initialisation de la mutation
  const { mutate: addPaiement, isPending } = usePaiementAddMutation();

  // État local synchronisé avec les types attendus
  const [paiements, setPaiements] = useState<
    { mode: PaiementMode; source: string; amount: number }[]
  >([]);

  const totalAmount = paiements.reduce((sum, p) => sum + (p.amount || 0), 0);

  const removePaiement = (index: number) => {
    setPaiements(paiements.filter((_, i) => i !== index));
  };

  const handleSavePaiement = () => {
    // On formate les données comme attendu par la mutationFn
    addPaiement(
      {
        items: paiements,
        order: order,
      },
      {
        onSuccess: () => {
          handleToggleOrderModal(order, "add_paiement");
          setPaiements([]);
        },
      }
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#F17922] to-orange-600 px-6 py-5">
          <h2 className="text-2xl font-bold text-white">
            Ajouter des paiements
          </h2>
          <p className="text-orange-100 text-sm mt-1">
            Ajoutez un ou plusieurs modes de paiement pour la commande #
            {order.reference || order.id.slice(0, 8)}
          </p>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {paiements.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-orange-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
              </div>
              <p className="text-gray-500 text-sm">
                Aucun paiement ajouté pour le moment
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {paiements.map((p, i) => (
                <div
                  key={i}
                  className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-orange-200 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 space-y-4">
                      <CustomPaymentSelect
                        value={p.source}
                        onChange={(newMode) => {
                          const copy = [...paiements];
                          copy[i].source = newMode;
                          setPaiements(copy);
                        }}
                      />

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                          Montant (FCFA)
                        </label>
                        <input
                          type="number"
                          className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                          placeholder="0"
                          value={p.amount || ""}
                          onChange={(e) => {
                            const copy = [...paiements];
                            copy[i].amount = Number(e.target.value);
                            copy[i].mode = paiementDataSelect.find(
                              (opt) => opt.source === copy[i].source
                            )?.key;
                            setPaiements(copy);
                          }}
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => removePaiement(i)}
                      className="mt-7 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() =>
              setPaiements([
                ...paiements,
                { mode: PaiementMode.CASH, source: "", amount: 0 },
              ])
            }
            disabled={isPending || totalAmount >= order.amount}
            className="w-full mt-4 py-3 px-4 border-2 border-dashed border-[#F17922] rounded-xl text-orange-600 font-semibold hover:bg-orange-50 transition-all flex items-center justify-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Ajouter un paiement
          </button>

          {paiements.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-4">
                <span className="text-gray-700 font-semibold">Total saisi</span>
                <div className="text-right">
                  <span className="block text-2xl font-bold text-orange-600">
                    {totalAmount.toLocaleString("fr-FR")} FCFA
                  </span>
                  <span className="text-xs text-gray-500">
                    sur {order.amount.toLocaleString()} FCFA attendus
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex gap-3">
          <button
            onClick={() => handleToggleOrderModal(order, "add_paiement")}
            disabled={isPending}
            className="flex-1 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 transition-all disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleSavePaiement}
            disabled={
              paiements.length === 0 || isPending || totalAmount > order.amount
            }
            className="flex-1 py-3 bg-gradient-to-r from-[#F17922] to-orange-600 text-white font-semibold rounded-xl disabled:opacity-50 shadow-lg shadow-orange-500/30 flex items-center justify-center"
          >
            {isPending ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                Enregistrement...
              </>
            ) : (
              "Enregistrer le paiement"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
