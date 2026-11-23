"use client";

import React from "react";
import Image from "next/image";
import { History, Loader2, RotateCcw } from "lucide-react";
import { formatImageUrl } from "@/utils/imageHelpers";
import { Dish } from "../../../menus/types/dish.types";
import { useHabitudesClientQuery } from "../../queries/habitudes.query";
import { DepartPlat, LigneDerniereCommande } from "../../types/habitudes.types";
import { dateCourte, departHabitude, texteFois } from "../../utils/habitudes";
import { BoutonAjout, bulleDuPlat, prixDuJour, prixPlat } from "./CartePlat";
import InfoBulle from "./InfoBulle";

interface MenusHabituelsProps {
  /** Client choisi pour la commande. Sans lui, rien ne s'affiche. */
  customerId?: string;
  /** Plats que l'agent peut ajouter aujourd'hui (prix, suppléments du jour). */
  platParId: (dishId: string) => Dish | undefined;
  /** Quantité déjà au panier, par plat. */
  quantiteParPlat: Record<string, number>;
  /** Ouvre la fenêtre du plat sur la dernière façon de le commander. */
  onChoisir: (dish: Dish, depart: DepartPlat) => void;
  /** « + » : une unité au panier, sans supplément. */
  onAjouter: (dish: Dish) => void;
  /** Remet au panier les lignes de la dernière commande. */
  onRemettre: (lignes: LigneDerniereCommande[]) => void;
  /** Reprise en cours (vérification des plats à options). */
  remiseEnCours: boolean;
  /** Modification d'une commande : sa dernière commande peut être celle-ci, on ne la propose pas. */
  sansDerniereCommande?: boolean;
}

/**
 * Ce que le client commande d'habitude, dès qu'il est choisi : ses plats les
 * plus commandés, en tuiles compactes (description et date de la dernière
 * fois dans une bulle au survol), et sa dernière commande à remettre au
 * panier d'un geste. Rien ne s'affiche pour un nouveau client ou sans
 * historique.
 */
const MenusHabituels: React.FC<MenusHabituelsProps> = ({
  customerId,
  platParId,
  quantiteParPlat,
  onChoisir,
  onAjouter,
  onRemettre,
  remiseEnCours,
  sansDerniereCommande = false,
}) => {
  const { data } = useHabitudesClientQuery(customerId);
  if (!customerId || !data) return null;

  // Un plat absent du catalogue de l'écran ne peut pas s'ajouter : on le saute.
  const plats = data.plats.flatMap((habitude) => {
    const dish = platParId(habitude.dish_id);
    return dish ? [{ habitude, dish }] : [];
  });
  const derniere = sansDerniereCommande ? null : data.derniere;
  if (plats.length === 0 && !derniere) return null;

  const reprenables = derniere?.lignes.filter((ligne) => ligne.disponible && platParId(ligne.dish_id)) ?? [];

  return (
    // Conteneur de requête : le nombre de colonnes suit la largeur du bloc.
    // ⚠️ Aucune fenêtre (`fixed`) dedans.
    <section className="rounded-2xl bg-[#FFF8F3] p-3 ring-1 ring-[#F17922]/15 sm:p-4 @container/habitudes">
      <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-800">
        <History className="h-4 w-4 text-[#F17922]" />
        Menus habituels du client
      </h4>

      {plats.length > 0 && (
        <div className="grid grid-cols-1 gap-2 @lg/habitudes:grid-cols-2 @3xl/habitudes:grid-cols-3 @6xl/habitudes:grid-cols-4">
          {plats.map(({ habitude, dish }) => {
            const ouvrir = () => onChoisir(dish, departHabitude(dish, habitude));
            const auPanier = quantiteParPlat[dish.id] ?? 0;
            return (
              <InfoBulle
                key={dish.id}
                contenu={bulleDuPlat(
                  dish,
                  <p className="mt-1 text-gray-400">Dernière fois le {dateCourte(habitude.derniere_le)}</p>,
                )}
              >
              <div
                role="button"
                tabIndex={0}
                onClick={ouvrir}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    ouvrir();
                  }
                }}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border bg-white p-2 pr-2.5 transition hover:border-[#F17922] hover:shadow-sm ${
                  auPanier > 0 ? "border-[#F17922]/70" : "border-transparent"
                }`}
              >
                <div className="relative shrink-0">
                  <Image
                    src={formatImageUrl(dish.image ?? undefined)}
                    alt={dish.name}
                    width={56}
                    height={56}
                    className="h-14 w-14 rounded-lg object-cover"
                  />
                  {auPanier > 0 && (
                    <span className="absolute -left-1.5 -top-1.5 rounded-full bg-[#F17922] px-1.5 py-px text-[10px] font-bold text-white shadow-sm">
                      x{auPanier}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold text-gray-800">{dish.name}</p>
                  <p className="mt-0.5 text-xs">
                    <span className="font-bold text-[#F17922]">{prixPlat(prixDuJour(dish))}</span>
                    <span className="text-gray-400"> · {texteFois(habitude.fois)}</span>
                  </p>
                </div>
                <BoutonAjout dish={dish} onAjouter={() => onAjouter(dish)} onOuvrir={ouvrir} taille="petit" />
              </div>
              </InfoBulle>
            );
          })}
        </div>
      )}

      {derniere && (
        <div
          className={`flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl bg-white px-3 py-2.5 ${
            plats.length > 0 ? "mt-3" : ""
          }`}
        >
          <RotateCcw className="h-4 w-4 shrink-0 text-[#F17922]" />
          <p className="min-w-0 flex-1 basis-56 text-xs leading-relaxed text-gray-600">
            <span className="font-semibold text-gray-800">Dernière commande du {dateCourte(derniere.le)}</span>
            {" : "}
            {derniere.lignes.map((ligne, i) => (
              <React.Fragment key={`${ligne.dish_id}-${i}`}>
                {i > 0 && ", "}
                <span
                  className={ligne.disponible ? undefined : "text-gray-400 line-through"}
                  title={ligne.disponible ? undefined : "Ce plat n'est plus au menu"}
                >
                  {ligne.quantity} x {ligne.nom}
                </span>
              </React.Fragment>
            ))}
          </p>
          {reprenables.length > 0 && (
            <button
              type="button"
              onClick={() => onRemettre(derniere.lignes)}
              disabled={remiseEnCours}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#F17922] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#F17922]/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {remiseEnCours && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Remettre au panier
            </button>
          )}
        </div>
      )}
    </section>
  );
};

export default MenusHabituels;
