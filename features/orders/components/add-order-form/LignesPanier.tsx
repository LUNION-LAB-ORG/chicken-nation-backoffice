"use client";

import React from "react";
import Image from "next/image";
import { Edit2, Minus, Plus, Trash } from "lucide-react";
import { formatImageUrl } from "@/utils/imageHelpers";
import { Dish } from "../../../menus/types/dish.types";
import { OrderItemFormData } from "../../types/order-form.types";

export interface LignePanier {
  /** Rang de la ligne dans le panier : c'est lui que les gestes renvoient. */
  index: number;
  item: OrderItemFormData;
  dish: Dish;
  total: number;
  /** « Sauce : Piquante · Format : Menu » d'un plat composable. */
  composition: string | null;
}

interface LignesPanierProps {
  lignes: LignePanier[];
  onModifier: (index: number) => void;
  onRetirer: (index: number) => void;
  onQuantite: (index: number, quantite: number) => void;
}

/**
 * Lignes du panier, affichées dans le panneau à côté du formulaire. La
 * quantité se change ici, sans rouvrir la fenêtre du plat.
 */
const LignesPanier: React.FC<LignesPanierProps> = ({ lignes, onModifier, onRetirer, onQuantite }) => {
  if (lignes.length === 0) {
    return (
      <div className="px-4 py-8 text-center">
        <div className="mb-2 text-3xl">🛒</div>
        <p className="text-sm font-semibold text-[#595959]">Votre panier est vide</p>
        <p className="mt-1 text-xs text-gray-400">Sélectionnez une catégorie puis ajoutez des plats</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-gray-100">
      {lignes.map(({ index, item, dish, total, composition }) => {
        const supplements = item.supplements.reduce((somme, s) => somme + s.quantity, 0);
        return (
          <li key={index} className="flex gap-3 px-4 py-3">
            {dish.image && (
              <Image
                src={formatImageUrl(dish.image)}
                alt={dish.name}
                width={48}
                height={48}
                className="h-12 w-12 shrink-0 rounded-lg object-cover"
              />
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-1">
                <p className="min-w-0 flex-1 text-[13px] font-bold leading-snug text-[#595959]">{dish.name}</p>
                <button
                  type="button"
                  onClick={() => onModifier(index)}
                  title="Modifier l'article"
                  aria-label={`Modifier ${dish.name}`}
                  className="-mt-0.5 shrink-0 rounded-lg p-1.5 text-[#F17922] transition-colors hover:bg-[#F17922]/10"
                >
                  <Edit2 size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => onRetirer(index)}
                  title="Retirer du panier"
                  aria-label={`Retirer ${dish.name} du panier`}
                  className="-mr-1.5 -mt-0.5 shrink-0 rounded-lg p-1.5 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <Trash size={15} />
                </button>
              </div>

              {(item.epice || supplements > 0) && (
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  {item.epice && (
                    <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-500">
                      🌶️ Épicé
                    </span>
                  )}
                  {supplements > 0 && (
                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-600">
                      +{supplements} supp.
                    </span>
                  )}
                </div>
              )}
              {composition !== null && (
                <p className="mt-1 text-[11px] leading-snug text-gray-500">
                  {composition || "Composition enregistrée"}
                </p>
              )}

              <div className="mt-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-0.5 rounded-full border border-gray-200 p-0.5">
                  <button
                    type="button"
                    onClick={() => onQuantite(index, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    aria-label={`Diminuer la quantité de ${dish.name}`}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-[#595959] transition hover:bg-[#F17922] hover:text-white disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent disabled:hover:text-gray-300"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="min-w-[28px] text-center text-sm font-bold text-gray-800">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => onQuantite(index, item.quantity + 1)}
                    aria-label={`Augmenter la quantité de ${dish.name}`}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-[#595959] transition hover:bg-[#F17922] hover:text-white"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="text-sm font-bold text-[#F17922]">{total.toLocaleString()} XOF</p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default LignesPanier;
