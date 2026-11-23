"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { formatImageUrl } from "@/utils/imageHelpers";
import { Dish } from "../../../menus/types/dish.types";

interface CartePlatProps {
  dish: Dish;
  /** Quantité de ce plat déjà au panier : rappelée sur la carte. */
  auPanier?: number;
  /** Mention sous le nom (« 5 fois » pour un menu habituel du client). */
  mention?: string;
  /** Clic sur la carte : la fenêtre du plat (quantité, épicé, suppléments). */
  onOuvrir: () => void;
  /** « + » : une unité au panier, sans passer par la fenêtre. */
  onAjouter: () => void;
  onSurvol?: () => void;
}

/**
 * Carte d'un plat : la même dans la grille du menu et dans les menus
 * habituels du client.
 */
const CartePlat: React.FC<CartePlatProps> = ({ dish, auPanier = 0, mention, onOuvrir, onAjouter, onSurvol }) => (
  <motion.div
    className={`relative flex cursor-pointer flex-col rounded-xl border-2 bg-white p-3 transition-all hover:border-[#F17922] ${
      auPanier > 0 ? "border-[#F17922]/60" : "border-[#D9D9D9]/50"
    }`}
    whileTap={{ scale: 0.98 }}
    onMouseEnter={onSurvol}
    onClick={onOuvrir}
  >
    {auPanier > 0 && (
      <span
        className="absolute left-2 top-2 z-10 rounded-full bg-[#F17922] px-2 py-0.5 text-[11px] font-bold text-white shadow-sm"
        title="Déjà au panier"
      >
        x{auPanier}
      </span>
    )}
    {dish.image && (
      <Image
        src={formatImageUrl(dish.image)}
        alt={dish.name}
        width={120}
        height={80}
        className="mb-2 h-24 w-full rounded-lg object-cover"
      />
    )}
    <h5 className="text-sm font-semibold leading-snug text-[#595959]">{dish.name}</h5>
    {mention && <p className="mt-0.5 text-[11px] font-semibold text-[#F17922]">{mention}</p>}
    <div className="mt-auto flex items-center justify-between gap-2 pt-1.5">
      <span className="text-sm font-bold text-[#F17922]">
        {dish.is_promotion && dish.promotion_price ? (
          <>
            <span className="mr-1 text-xs text-gray-400 line-through">{dish.price} XOF</span>
            {dish.promotion_price} XOF
          </>
        ) : (
          `${dish.price} XOF`
        )}
      </span>
      <span className="flex shrink-0 items-center gap-1.5">
        {dish.is_alway_epice && <span className="text-xs">🌶️</span>}
        {/* Un plat composable a des choix obligatoires : pas d'ajout direct. */}
        {!dish.composable && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAjouter();
            }}
            title="Ajouter au panier, sans supplément"
            aria-label={`Ajouter ${dish.name} au panier`}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F17922] text-white transition hover:bg-[#F17922]/85"
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </span>
    </div>
  </motion.div>
);

export default CartePlat;
