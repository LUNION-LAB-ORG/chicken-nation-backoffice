"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { Dish } from "../../../menus/types/dish.types";
import { useHabitudesClientQuery } from "../../queries/habitudes.query";
import { DepartPlat, LigneDerniereCommande } from "../../types/habitudes.types";
import { dateCourte, departHabitude, texteFois } from "../../utils/habitudes";
import CartePlat from "./CartePlat";

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
 * plus commandés, en grille comme le menu, et sa dernière commande à remettre
 * au panier d'un geste. Rien ne s'affiche pour un nouveau client ou sans
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
    <div className="rounded-2xl border-2 border-[#F17922]/25 bg-[#FFF8F3] p-4 @container/habitudes">
      <h4 className="mb-3 text-sm font-semibold text-[#595959]">⭐ Menus habituels du client</h4>

      {plats.length > 0 && (
        <div className="grid grid-cols-2 gap-3 @lg/habitudes:grid-cols-3 @3xl/habitudes:grid-cols-4 @5xl/habitudes:grid-cols-6">
          {plats.map(({ habitude, dish }) => (
            <CartePlat
              key={dish.id}
              dish={dish}
              auPanier={quantiteParPlat[dish.id] ?? 0}
              mention={texteFois(habitude.fois)}
              onOuvrir={() => onChoisir(dish, departHabitude(dish, habitude))}
              onAjouter={() => onAjouter(dish)}
            />
          ))}
        </div>
      )}

      {derniere && (
        <div
          className={`flex flex-wrap items-center gap-x-3 gap-y-2 ${
            plats.length > 0 ? "mt-3 border-t border-[#F17922]/15 pt-3" : ""
          }`}
        >
          <p className="min-w-0 flex-1 basis-60 text-xs leading-relaxed text-gray-600">
            <span className="font-semibold text-[#595959]">Dernière commande du {dateCourte(derniere.le)}</span>
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
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#F17922] bg-white px-3 py-1.5 text-xs font-semibold text-[#F17922] transition hover:bg-[#F17922] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {remiseEnCours && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Remettre au panier
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MenusHabituels;
