"use client";

import React, { useEffect } from "react";
import { AlertCircle, Check, Loader2, X } from "lucide-react";

import type { Course } from "../../courses/types/course.types";
import { DeliveryService } from "../../orders/types/order.types";
import { useApercuRecuperationQuery } from "../queries/apercu-recuperation.query";
import { useConfirmerRecuperationMutation } from "../queries/confirmer-recuperation.mutation";
import {
  commandesARemettre,
  courseRemiseDeLEcran,
  courseRemiseLue,
  etatRemise,
  libellePastille,
  remiseParCode,
  texteClientMontant,
  type CommandeDeLEcran,
  type CourseRemise,
  type EtatRemise,
  type LivraisonRemise,
} from "../utils/remise-par-code";
import type { CourseOperations } from "../utils/suivi-course";
import { ServiceBadge } from "./ServiceBadge";

interface Props {
  /** Course telle que l'écran la connaît (identifiant, code, référence, restaurant). */
  course: CourseOperations;
  /** Commandes de la course déjà à l'écran : lignes montrées avant la lecture de la course. */
  commandes: readonly CommandeDeLEcran[];
  /** Nom du restaurant de la course, si l'écran le connaît. */
  restaurantNom?: string | null;
  onClose: () => void;
}

/**
 * Fenêtre « Récupération · code 123 », ouverte par « Confirmer la
 * récupération » sur le groupe de la course (demande du 24/10 au soir : plus
 * de saisie du code). Mêmes mots et même aspect qu'avant ; le code est écrit
 * en grand, la caissière le compare à celui que le livreur lui dit.
 *
 *  - s'ouvre tout de suite avec les commandes de l'écran, puis lit la course
 *    (`GET /courses/operations/:id`, repli sur l'ancienne route à code si le
 *    serveur répond 404 de route) ;
 *  - retrait : « Valider la récupération » est désactivé tant que toutes ne
 *    sont pas prêtes ;
 *  - retrait complémentaire (course déjà récupérée, livreur encore au
 *    comptoir, commande ajoutée après le retrait) : les commandes déjà
 *    remises sont marquées « DÉJÀ REMISE », « Remettre au livreur » remet
 *    les commandes prêtes (`utils/remise-par-code.ts`) ;
 *  - un refus du serveur s'affiche ici avec SON texte, la course est relue.
 */
export const PickupValidationModal: React.FC<Props> = ({ course, commandes, restaurantNom, onClose }) => {
  const apercu = useApercuRecuperationQuery({
    id: course.id,
    pickup_code: course.pickup_code,
    restaurant_id: course.restaurant_id,
  });
  const { mutate: valider, isPending, error } = useConfirmerRecuperationMutation();

  useEffect(() => {
    const fermer = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", fermer);
    return () => window.removeEventListener("keydown", fermer);
  }, [onClose]);

  const lue = apercu.data as Course | undefined;
  // Livraisons annulées retirées, comme sur l'écran et pour le serveur.
  const source: CourseRemise = lue
    ? courseRemiseLue({ statut: lue.statut, deliveries: (lue.deliveries ?? []) as unknown as LivraisonRemise[] })
    : courseRemiseDeLEcran(course, commandes);
  const remise = remiseParCode(source);
  const aRemettre = commandesARemettre(source);
  const code = lue?.pickup_code ?? course.pickup_code ?? null;
  const reference = lue?.reference ?? course.reference ?? null;
  const restaurant = lue?.restaurant?.name ?? restaurantNom ?? null;
  const refus = error?.message ?? apercu.error?.message ?? null;
  const lecture = apercu.isFetching;

  const handleValidate = () => {
    if (!remise.peutValider || aRemettre.length === 0 || lecture || isPending) return;
    valider(
      {
        course: { id: course.id, pickup_code: code, restaurant_id: lue?.restaurant_id ?? course.restaurant_id },
        orderIds: aRemettre,
        statut: source.statut,
      },
      { onSuccess: () => onClose() },
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={code ? `Récupération · code ${code}` : "Récupération"}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="min-w-0">
            <h3 className="flex flex-wrap items-baseline gap-x-2 text-base font-bold text-gray-900">
              <span>Récupération{code ? " · code" : ""}</span>
              {code && (
                <span className="font-mono text-4xl leading-none tracking-[0.15em] text-[#F17922]">{code}</span>
              )}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {reference ? `Course ${reference}` : "Course"}
              {restaurant ? ` · ${restaurant}` : ""} · {source.deliveries.length} commande(s)
            </p>
          </div>
          <button onClick={onClose} aria-label="Fermer" className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {source.deliveries.map((d) => (
            <DeliveryStatusRow
              key={d.id}
              delivery={d}
              etat={etatRemise(d, remise.complementaire)}
              complementaire={remise.complementaire}
            />
          ))}
          {refus && (
            <div className="flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
              <span>{refus}</span>
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
          <div className="text-xs text-gray-600">
            {remise.ton === "vert" ? (
              <span className="text-green-700 font-medium">✓ {remise.bilan}</span>
            ) : (
              <span className="text-amber-700 font-medium">⚠ {remise.bilan}</span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-white"
            >
              Annuler
            </button>
            <button
              onClick={handleValidate}
              disabled={!remise.peutValider || aRemettre.length === 0 || lecture || isPending}
              className="px-4 py-2 text-sm bg-[#F17922] text-white font-semibold rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {lecture ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <Check className="w-4 h-4" />}
              {isPending ? "Validation…" : remise.bouton}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/** Pastille de la ligne : couleur et texte selon ce que la caisse doit faire. */
const PASTILLE: Record<Exclude<EtatRemise, "PAS_PRETE">, { cadre: string; badge: string }> = {
  A_REMETTRE: {
    cadre: "border-green-200 bg-green-50",
    badge: "text-green-800 bg-white border border-green-300",
  },
  DEJA_REMISE: {
    cadre: "border-gray-200 bg-gray-50",
    badge: "text-gray-600 bg-white border border-gray-300",
  },
  TERMINEE: {
    cadre: "border-gray-200 bg-gray-50",
    badge: "text-gray-600 bg-white border border-gray-300",
  },
};

function DeliveryStatusRow({
  delivery,
  etat,
  complementaire,
}: {
  delivery: LivraisonRemise;
  etat: EtatRemise;
  complementaire: boolean;
}) {
  const style =
    etat === "PAS_PRETE"
      ? { cadre: "border-amber-200 bg-amber-50", badge: "text-amber-800 bg-white border border-amber-300" }
      : PASTILLE[etat];
  return (
    <div className={`flex items-center justify-between gap-3 p-3 rounded-lg border ${style.cadre}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-900">{delivery.order.reference}</span>
          <ServiceBadge service={DeliveryService.CHICKEN_NATION} size="sm" />
        </div>
        <div className="text-xs text-gray-600 mt-0.5">{texteClientMontant(delivery)}</div>
      </div>
      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${style.badge}`}>
        {libellePastille(delivery, etat, complementaire)}
      </span>
    </div>
  );
}
