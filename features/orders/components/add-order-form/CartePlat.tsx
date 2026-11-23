"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Plus, SlidersHorizontal } from "lucide-react";
import { formatImageUrl } from "@/utils/imageHelpers";
import { Dish } from "../../../menus/types/dish.types";
import InfoBulle from "./InfoBulle";

/** « 10 000 XOF » : même écriture que le panier. */
export const prixPlat = (montant: number | null | undefined): string =>
  `${Number(montant ?? 0).toLocaleString("fr-FR")} XOF`;

/** Prix payé aujourd'hui : la promotion s'il y en a une. */
export const prixDuJour = (dish: Dish): number =>
  dish.is_promotion && dish.promotion_price ? dish.promotion_price : dish.price;

interface BoutonAjoutProps {
  dish: Dish;
  /** Plat ordinaire : une unité au panier. Plat composable : sa fenêtre. */
  onAjouter: () => void;
  onOuvrir: () => void;
  taille?: "normal" | "petit";
}

/**
 * Bouton de la carte. Un plat composable a des choix obligatoires : son
 * bouton ouvre la fenêtre au lieu d'ajouter, et le dit.
 */
export const BoutonAjout: React.FC<BoutonAjoutProps> = ({ dish, onAjouter, onOuvrir, taille = "normal" }) => {
  const dimension = taille === "petit" ? "h-8 w-8" : "h-9 w-9";
  return dish.composable ? (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onOuvrir();
      }}
      title="Choisir les options"
      aria-label={`Choisir les options de ${dish.name}`}
      className={`flex ${dimension} shrink-0 items-center justify-center rounded-full border-2 border-[#F17922] bg-white text-[#F17922] transition hover:bg-[#F17922] hover:text-white`}
    >
      <SlidersHorizontal className="h-4 w-4" />
    </button>
  ) : (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onAjouter();
      }}
      title="Ajouter au panier, sans supplément"
      aria-label={`Ajouter ${dish.name} au panier`}
      className={`flex ${dimension} shrink-0 items-center justify-center rounded-full bg-[#F17922] text-white shadow-sm transition hover:bg-[#F17922]/85`}
    >
      <Plus className="h-4 w-4" />
    </button>
  );
};

interface CartePlatProps {
  dish: Dish;
  /** Quantité de ce plat déjà au panier : rappelée sur la carte. */
  auPanier?: number;
  /** Clic sur la carte : la fenêtre du plat (quantité, épicé, suppléments). */
  onOuvrir: () => void;
  /** « + » : une unité au panier, sans passer par la fenêtre. */
  onAjouter: () => void;
  onSurvol?: () => void;
}

/**
 * Bulle d'un plat : son nom et sa description. `null` sans description, la
 * carte n'en affiche pas.
 */
export const bulleDuPlat = (dish: Dish, ajout?: React.ReactNode): React.ReactNode | null =>
  dish.description?.trim() || ajout ? (
    <>
      <p className="font-bold">{dish.name}</p>
      {dish.description?.trim() && <p className="mt-0.5 text-gray-200">{dish.description.trim()}</p>}
      {ajout}
    </>
  ) : null;

/**
 * Carte d'un plat dans la grille du menu : photo, nom, prix. La description
 * s'affiche dans une bulle au survol.
 */
const CartePlat: React.FC<CartePlatProps> = ({ dish, auPanier = 0, onOuvrir, onAjouter, onSurvol }) => {
  const promotion = !!(dish.is_promotion && dish.promotion_price);
  return (
    <InfoBulle contenu={bulleDuPlat(dish)} className="h-full">
    <motion.div
      role="button"
      tabIndex={0}
      className={`relative flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border bg-white transition-all hover:border-[#F17922] hover:shadow-md ${
        auPanier > 0 ? "border-[#F17922]/70" : "border-gray-200"
      }`}
      whileTap={{ scale: 0.98 }}
      onMouseEnter={onSurvol}
      onClick={onOuvrir}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onOuvrir();
        }
      }}
    >
      <div className="relative">
        <Image
          src={formatImageUrl(dish.image ?? undefined)}
          alt={dish.name}
          width={240}
          height={160}
          className="h-28 w-full object-cover"
        />
        {auPanier > 0 && (
          <span
            className="absolute left-2 top-2 rounded-full bg-[#F17922] px-2 py-0.5 text-[11px] font-bold text-white shadow-sm"
            title="Déjà au panier"
          >
            x{auPanier}
          </span>
        )}
        {promotion && (
          <span className="absolute right-2 top-2 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-bold text-[#F17922] shadow-sm">
            Promo
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3">
        <h5 className="text-[13px] font-bold leading-snug text-gray-800">
          {dish.name}
          {dish.is_alway_epice && (
            <span className="ml-1" title="Toujours épicé">
              🌶️
            </span>
          )}
        </h5>
        <div className="mt-auto flex items-end justify-between gap-2 pt-2.5">
          <div className="min-w-0 leading-tight">
            {promotion && <p className="text-[11px] text-gray-400 line-through">{prixPlat(dish.price)}</p>}
            <p className="text-sm font-bold text-[#F17922]">{prixPlat(prixDuJour(dish))}</p>
          </div>
          <BoutonAjout dish={dish} onAjouter={onAjouter} onOuvrir={onOuvrir} />
        </div>
      </div>
    </motion.div>
    </InfoBulle>
  );
};

export default CartePlat;
