"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { formatImageUrl } from "@/utils/imageHelpers";
import BadgeDisponibilite from "./BadgeDisponibilite";

export interface ProduitConsulte {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  available: boolean;
  hubrise_sku?: string;
  spice_level?: string;
  available_order_types?: string[];
}

const FAMILLES: Record<string, string> = {
  FOOD: "Sauces",
  DRINK: "Boissons",
  ACCESSORY: "Suppléments",
};

const LIBELLES_EPICE: Record<string, string> = {
  ALWAYS: "Toujours épicé",
  OPTIONAL: "Au choix du client",
  NEVER: "Jamais épicé",
};

const LIBELLES_MODES: Record<string, string> = {
  DELIVERY: "Livraison",
  PICKUP: "À emporter",
  TABLE: "Sur place",
};

/**
 * Fiche d'un produit de l'inventaire, en lecture seule.
 *
 * Le niveau épicé, les modes de commande et le SKU HubRise ne s'affichaient que
 * dans la fenêtre de modification. Un profil qui consulte l'inventaire sans
 * pouvoir le modifier les retrouve ici, sans aucun contrôle qui écrive.
 */
export default function FicheSupplement({
  produit,
  onClose,
}: {
  produit: ProduitConsulte;
  onClose: () => void;
}) {
  // Liste vide ou absente : le produit est proposé dans tous les modes.
  const modes = produit.available_order_types?.length
    ? produit.available_order_types
    : ["DELIVERY", "PICKUP", "TABLE"];

  const lignes: [string, ReactNode][] = [
    ["Famille", FAMILLES[produit.category] ?? produit.category ?? "Non renseignée"],
    [
      "Prix",
      produit.price === 0
        ? "Gratuit"
        : `${produit.price.toLocaleString("fr-FR")} XOF`,
    ],
    ["Disponibilité", <BadgeDisponibilite key="dispo" disponible={produit.available} />],
    [
      "Niveau épicé",
      produit.spice_level
        ? (LIBELLES_EPICE[produit.spice_level] ?? produit.spice_level)
        : "Non renseigné",
    ],
    ["Disponible pour", modes.map((m) => LIBELLES_MODES[m] ?? m).join(", ")],
    ["SKU HubRise", produit.hubrise_sku || "Aucun"],
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#FFF6E9]">
          <Image
            src={produit.image ? formatImageUrl(produit.image) : "/images/plat.png"}
            alt={produit.name || "Image du produit"}
            width={80}
            height={80}
            className="h-full w-full object-cover"
          />
        </div>
        <p className="text-[16px] font-semibold text-[#595959]">
          {produit.name}
        </p>
      </div>

      <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
        {lignes.map(([libelle, valeur]) => (
          <div key={libelle}>
            <dt className="text-[12px] font-medium text-gray-400">{libelle}</dt>
            <dd className="mt-0.5 text-[14px] text-gray-700">{valeur}</dd>
          </div>
        ))}
      </dl>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="h-[32px] min-w-[160px] cursor-pointer rounded-[10px] bg-[#ECECEC] px-12 text-[13px] text-[#9796A1] hover:bg-gray-100"
        >
          Fermer
        </button>
      </div>
    </div>
  );
}
