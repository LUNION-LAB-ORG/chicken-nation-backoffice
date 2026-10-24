"use client";

import React from "react";

import type { Order } from "../../orders/types/order.types";
import type { IOrderGroup } from "../types/operations.types";
import { libelleStatut, nomClient, preteDepuis } from "../utils/carte-commande";
import { ligneRetenue } from "../utils/ligne-retenue";
import type { CommandeOperations, CourseOperations } from "../utils/suivi-course";
import { BandeauCourse, type LigneAction } from "./course/BandeauCourse";
import { useEtatCourseLivreur } from "./course/EtatCourseLivreur";
import { BoutonConfirmerRecuperation } from "./FenetreRecuperation";

interface Props {
  group: IOrderGroup & { course: CourseOperations };
  /** Commandes de la course encore au restaurant : prêtes, puis en cuisine. */
  lignes: readonly Order[];
  /** Toutes les commandes de l'écran (état du livreur, livraisons commencées). */
  commandes: readonly Order[];
  maintenant: Date;
  onCardClick: (order: Order) => void;
  /** Rôle admis par le serveur pour confirmer la récupération. */
  peutConfirmer: boolean;
  onConfirmer: (course: CourseOperations) => void;
  /** Restaurant en tête (compte du siège sur « Tous »). */
  restaurant?: string | null;
}

/**
 * Groupe d'une course dans la colonne « Prêtes » (demande du 24/10 au soir).
 * Toute course a son groupe, même avec une seule commande ; une course
 * retenue sans commande prête a son en-tête seul.
 *
 *  - en-tête : code en grand, livreur et état, ligne d'action s'il le faut ;
 *  - une ligne de 36 px par commande : référence, client, et le statut
 *    seulement s'il n'est pas « Prête » ; toucher : tiroir ;
 *  - « Confirmer la récupération » pour qui peut la confirmer, dès qu'un
 *    livreur a accepté ou que Turbo a la course (personne à qui remettre
 *    pendant la recherche).
 */
export const OrdersGroupCard: React.FC<Props> = ({
  group,
  lignes,
  commandes,
  maintenant,
  onCardClick,
  peutConfirmer,
  onConfirmer,
  restaurant,
}) => {
  const course = group.course;
  const { etat, appli } = useEtatCourseLivreur(
    course,
    commandes as unknown as CommandeOperations[],
    group.deliveryService,
    maintenant,
  );

  // Une seule ligne d'action, la plus utile.
  const retenue = ligneRetenue(course, maintenant);
  const attente = preteDepuis(
    lignes.filter((o) => o.status === "READY").map((o) => o.ready_at),
    maintenant,
  );
  const action: LigneAction | null =
    etat.etat === "PARTI_SANS_SAC"
      ? { texte: etat.libelle, ton: "rouge" }
      : retenue
        ? { texte: retenue, ton: "ambre" }
        : attente
          ? { texte: attente, ton: "rouge" }
          : null;

  const quelquUn = !!course.deliverer_id || !!course.turbo_escalated_at;

  return (
    <div className="rounded-2xl border-2 border-orange-200 bg-white shadow-sm overflow-hidden">
      <BandeauCourse
        code={course.pickup_code}
        etat={etat}
        appliFermee={appli?.cas === "FERMEE" ? appli.libelle.toLowerCase() : null}
        restaurant={restaurant}
        action={action}
      />

      {lignes.length > 0 && (
        <ul className="border-t border-orange-100 divide-y divide-gray-100">
          {lignes.map((o) => {
            const client = nomClient(o);
            return (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => onCardClick(o)}
                  title={`${o.reference} · ${client}`}
                  className="flex h-9 w-full items-center gap-2 px-3 text-left text-xs hover:bg-orange-50 focus:outline-none focus-visible:bg-orange-50"
                >
                  <span className="shrink-0 font-bold text-gray-900">{o.reference}</span>
                  <span className="min-w-0 truncate text-gray-600">{client}</span>
                  {o.status !== "READY" && (
                    <span className="ml-auto shrink-0 font-semibold text-amber-700">{libelleStatut(o.status)}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {peutConfirmer && quelquUn && (
        <div className="border-t border-orange-100 p-2">
          <BoutonConfirmerRecuperation auRestaurant={etat.etat === "AU_COMPTOIR"} onClick={() => onConfirmer(course)} />
        </div>
      )}
    </div>
  );
};
