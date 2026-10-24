"use client";

import React, { useEffect } from "react";
import { AlertCircle, Check, Hourglass, X } from "lucide-react";

import type { Course } from "../../courses/types/course.types";
import { useAuthStore } from "../../users/hook/authStore";
import { UserType } from "../../users/types/user.types";
import { useApercuRecuperationQuery } from "../queries/apercu-recuperation.query";
import { useConfirmerRecuperationMutation } from "../queries/confirmer-recuperation.mutation";
import { nomClient } from "../utils/carte-commande";
import {
  commandesARemettre,
  courseRemiseDeLEcran,
  etatRemise,
  libelleRemise,
  livreurDeLaFenetre,
  remiseParCode,
  type CommandeDeLEcran,
  type CourseRemise,
  type EtatRemise,
} from "../utils/remise-par-code";
import type { CourseOperations } from "../utils/suivi-course";

interface Props {
  /** Course telle que l'écran la connaît (identifiant, code, restaurant, livreur). */
  course: CourseOperations;
  /** Commandes de la course déjà à l'écran : lignes montrées avant la lecture de la course. */
  commandes: readonly CommandeDeLEcran[];
  /** Nom du restaurant de la course (compte du siège), si l'écran le connaît. */
  restaurantNom?: string | null;
  onClose: () => void;
}

/**
 * Fenêtre « Récupération » (demande du 24/10 au soir) : le livreur dit son
 * code, la caissière le compare au code affiché en grand, vérifie les
 * commandes et confirme. Plus de saisie.
 *
 *  - s'ouvre tout de suite avec les commandes connues de l'écran, puis lit
 *    la course (`GET /courses/operations/:id`, repli sur l'ancienne route à
 *    code tant que le serveur n'est pas à jour) : « Vérification… » pendant
 *    la lecture ;
 *  - confirme les commandes « à remettre » (`order_ids`) ; retrait
 *    complémentaire : « Remettre au livreur » ;
 *  - refus du serveur : son texte en rouge sous les lignes, la course est
 *    relue ; réussite : la fenêtre se ferme, message bref.
 *
 * Au-dessus du tiroir (z-[70]) : elle s'ouvre aussi depuis son pied.
 */
export function FenetreRecuperation({ course, commandes, restaurantNom, onClose }: Props) {
  const apercu = useApercuRecuperationQuery({
    id: course.id,
    pickup_code: course.pickup_code,
    restaurant_id: course.restaurant_id,
  });
  const confirmation = useConfirmerRecuperationMutation();
  const duSiege = useAuthStore((s) => s.user?.type) === UserType.BACKOFFICE;

  useEffect(() => {
    const fermer = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", fermer);
    return () => window.removeEventListener("keydown", fermer);
  }, [onClose]);

  const lue = apercu.data as Course | undefined;
  const source: CourseRemise = lue
    ? { statut: lue.statut, deliveries: lue.deliveries ?? [] }
    : courseRemiseDeLEcran(course, commandes);
  const remise = remiseParCode(source);
  const aRemettre = commandesARemettre(source);
  const code = lue?.pickup_code ?? course.pickup_code ?? null;
  const livreur = livreurDeLaFenetre(lue ?? course);
  const restaurant = duSiege ? (lue?.restaurant?.name ?? restaurantNom ?? null) : null;
  const refus = confirmation.error?.message ?? apercu.error?.message ?? null;

  const verification = apercu.isFetching;
  const envoi = confirmation.isPending;
  const actif = remise.peutValider && aRemettre.length > 0 && !verification && !envoi;

  const confirmer = () => {
    if (!actif) return;
    confirmation.mutate(
      {
        course: { id: course.id, pickup_code: code, restaurant_id: lue?.restaurant_id ?? course.restaurant_id },
        orderIds: aRemettre,
        statut: source.statut,
      },
      { onSuccess: onClose },
    );
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Récupération"
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-4">
          <h3 className="text-base font-bold text-gray-900">Récupération</h3>
          <button type="button" onClick={onClose} aria-label="Fermer" className="p-2 -mr-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-4">
          {code && (
            <div className="text-center">
              <p className="text-xs font-semibold text-gray-500">Code dit par le livreur</p>
              <p className="font-mono text-[64px] font-bold leading-none tracking-[0.25em] text-[#F17922] pl-[0.25em]">
                {code}
              </p>
            </div>
          )}
          {livreur && <p className="mt-2 text-center text-sm font-bold text-gray-900 truncate">{livreur}</p>}
          {restaurant && <p className="text-center text-xs text-gray-500 truncate">{restaurant}</p>}

          <ul className="mt-4 divide-y divide-gray-100 rounded-xl border border-gray-100">
            {source.deliveries.map((d) => {
              const etat = etatRemise(d, remise.complementaire);
              const libelle = libelleRemise(d, etat);
              return (
                <li key={d.id} className="flex h-10 items-center gap-2 px-3 text-sm">
                  <IconeEtat etat={etat} />
                  <span className="shrink-0 font-bold text-gray-900">{d.order.reference}</span>
                  <span className="min-w-0 truncate text-gray-600" title={nomClient(d.order)}>
                    {nomClient(d.order)}
                  </span>
                  {libelle && (
                    <span
                      className={`ml-auto shrink-0 text-xs font-semibold ${
                        etat === "PAS_PRETE" ? "text-amber-700" : "text-gray-500"
                      }`}
                    >
                      {libelle}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>

          <p className={`mt-3 text-sm font-semibold ${remise.ton === "vert" ? "text-green-700" : "text-amber-700"}`}>
            {remise.bilan}
          </p>

          {refus && (
            <div className="mt-2 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              <AlertCircle className="mt-px h-4 w-4 shrink-0" aria-hidden />
              <span>{refus}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2 border-t border-gray-100 bg-gray-50 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={confirmer}
            disabled={!actif}
            className="flex-[2] rounded-xl bg-[#F17922] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#D96A1D] disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {envoi ? "Confirmation…" : verification ? "Vérification…" : remise.bouton}
          </button>
        </div>
      </div>
    </div>
  );
}

function IconeEtat({ etat }: { etat: EtatRemise }) {
  if (etat === "A_REMETTRE") return <Check className="h-4 w-4 shrink-0 text-green-600" strokeWidth={3} aria-hidden />;
  if (etat === "PAS_PRETE") return <Hourglass className="h-4 w-4 shrink-0 text-amber-600" aria-hidden />;
  return <span className="mx-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-300" aria-hidden />;
}

/**
 * « Confirmer la récupération » du groupe d'une course et du pied du tiroir :
 * plein vert quand le livreur est au restaurant, contour orange sinon (sa
 * position peut avoir du retard sur le livreur qui est devant la caissière).
 * Toujours actif : la fenêtre dit s'il manque quelque chose.
 */
export function BoutonConfirmerRecuperation({
  auRestaurant,
  onClick,
  className = "",
}: {
  auRestaurant: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl px-3 py-2 text-sm font-bold transition ${
        auRestaurant
          ? "bg-green-600 text-white hover:bg-green-700"
          : "border-2 border-[#F17922] bg-white text-[#F17922] hover:bg-orange-50"
      } ${className}`}
    >
      Confirmer la récupération
    </button>
  );
}
