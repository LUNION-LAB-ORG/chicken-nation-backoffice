"use client";

import React from "react";
import { AlertCircle, Check, X } from "lucide-react";

import type { Course, Delivery } from "../../courses/types/course.types";
import { DeliveryService, type OrderStatus } from "../../orders/types/order.types";
import { useValidatePickupMutation } from "../queries/validate-pickup.mutation";
import { etatRemise, remiseParCode, type EtatRemise } from "../utils/remise-par-code";
import { ServiceBadge } from "./ServiceBadge";

/**
 * Libellés alignés sur le mapper `orderMapper.ts` de la page Commandes —
 * aucune divergence tolérée : on affiche partout exactement ce que la page
 * Commandes affiche pour un statut donné.
 */
const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "EN ATTENTE",
  ACCEPTED: "NOUVELLE",
  IN_PROGRESS: "EN PRÉPARATION",
  READY: "PRÊT",
  PICKED_UP: "EN LIVRAISON",
  COLLECTED: "RÉCUPÉRÉE",
  COMPLETED: "TERMINÉE",
  CANCELLED: "ANNULÉE",
};

interface Props {
  course: Course;
  onClose: () => void;
}

/**
 * Modal affichée quand la caissière a saisi un pickup_code valide.
 * Liste toutes les commandes de la course + leur statut.
 *  - retrait : « Valider la récupération » est désactivé tant que toutes ne
 *    sont pas prêtes ;
 *  - retrait complémentaire (course déjà récupérée, livreur encore au
 *    comptoir, commande ajoutée après le retrait) : les commandes déjà
 *    remises sont marquées « Déjà remise », « Remettre au livreur » remet
 *    les commandes prêtes (`utils/remise-par-code.ts`).
 *
 * Le restaurant de la course est affiché : le même code peut exister dans un
 * autre restaurant (incident du 22/10). Un refus du serveur s'affiche ici
 * avec SON texte, en plus du toast.
 */
export const PickupValidationModal: React.FC<Props> = ({ course, onClose }) => {
  const { mutate: validate, isPending, error } = useValidatePickupMutation();

  const remise = remiseParCode(course);

  const handleValidate = () => {
    validate(course, {
      onSuccess: () => onClose(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-gray-900">
              Récupération · code <span className="font-mono text-[#F17922]">{course.pickup_code}</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Course {course.reference}
              {course.restaurant?.name ? ` · ${course.restaurant.name}` : ""} ·{" "}
              {course.deliveries.length} commande(s)
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {course.deliveries.map((d) => (
            <DeliveryStatusRow
              key={d.id}
              delivery={d}
              etat={etatRemise(d, remise.complementaire)}
              complementaire={remise.complementaire}
            />
          ))}
          {error && (
            <div className="flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
              <span>{error.message}</span>
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
              disabled={!remise.peutValider || isPending}
              className="px-4 py-2 text-sm bg-[#F17922] text-white font-semibold rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
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

function libellePastille(delivery: Delivery, etat: EtatRemise, complementaire: boolean): string {
  switch (etat) {
    case "A_REMETTRE":
      return complementaire ? "À REMETTRE" : "PRÊT";
    case "DEJA_REMISE":
      return "DÉJÀ REMISE";
    case "TERMINEE":
      return "TERMINÉE";
    default:
      return STATUS_LABEL[delivery.order.status as OrderStatus] ?? "INCONNU";
  }
}

function DeliveryStatusRow({
  delivery,
  etat,
  complementaire,
}: {
  delivery: Delivery;
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
        <div className="text-xs text-gray-600 mt-0.5">
          {delivery.order.fullname ?? "Client"} ·{" "}
          {delivery.order.amount.toLocaleString("fr-FR")} F
        </div>
      </div>
      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${style.badge}`}>
        {libellePastille(delivery, etat, complementaire)}
      </span>
    </div>
  );
}
