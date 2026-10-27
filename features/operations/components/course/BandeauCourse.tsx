"use client";

import React from "react";
import { Hourglass, Package } from "lucide-react";

import type { IOrderGroup } from "../../types/operations.types";
import { ligneDepart, ligneRetenue } from "../../utils/ligne-retenue";
import {
  courseDeCommande,
  etiquetteMotif,
  type CommandeOperations,
  type CourseOperations,
} from "../../utils/suivi-course";
import { EtatCourseLivreur, useEtatCourseLivreur } from "./EtatCourseLivreur";

interface Props {
  group: IOrderGroup;
  /** Toutes les commandes affichées (livraisons commencées, coordonnées). */
  commandes: readonly CommandeOperations[];
  maintenant: Date;
  /**
   * « Confirmer la récupération » (demande du 24/10 au soir) : présent pour
   * qui peut la confirmer, quand quelqu'un est là pour prendre les sacs.
   */
  onConfirmer?: (course: CourseOperations) => void;
}

/**
 * En-tête d'une course sur l'écran Opérations, visible dès la création de la
 * course (une seule commande comprise) : référence, nombre de commandes à
 * remettre, code de retrait en grand, livreur et son état, et la retenue en
 * une ligne courte quand il y en a une.
 *
 * Demande du 27/10 : sous la retenue, l'attente du livreur avant son départ
 * (« Départ au plus tard 12 h 44 »). Pas de liste des commandes en plus : celles
 * de la course sont les cartes du groupe, celles qui la rejoindront sont
 * nommées par la ligne de la retenue.
 *
 * Demande du 24/10 (« reste simple ») : plus de phrase d'ajout (« CMD-C
 * ajoutée à la course de Koffi : remettre avec le code 123 ») ni de fusion
 * (« Courses CRS-A et CRS-B fusionnées ») : la carte montre déjà les
 * commandes regroupées et le code. Le motif du regroupement reste en petit.
 *
 * Demande du 24/10 au soir : plus de saisie du code. Le livreur dit son
 * code, la caissière le compare à la case « Code » et touche « Confirmer la
 * récupération » sous la retenue ; la fenêtre « Récupération · code »
 * s'ouvre.
 */
export const BandeauCourse: React.FC<Props> = ({ group, commandes, maintenant, onConfirmer }) => {
  const course = group.orders.map((o) => courseDeCommande(o as CommandeOperations)).find(Boolean) ?? null;
  if (!course) return null;

  const n = group.orders.length;
  const motif = etiquetteMotif(course.motif_regroupement);
  const retenue = ligneRetenue(course, maintenant);
  const depart = ligneDepart(course, maintenant);

  return (
    <div className="space-y-2 px-1 pt-1">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F17922]">
            <Package className="h-4 w-4 text-white" aria-hidden />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#F17922]">Course</div>
            <div className="truncate text-sm font-bold text-gray-900">{course.reference ?? "Course"}</div>
            <div className="text-[11px] text-gray-600">
              {n} commande{n > 1 ? "s" : ""} à remettre
              {motif && <span className="text-gray-400"> · {motif}</span>}
            </div>
          </div>
        </div>

        {course.pickup_code && (
          <div className="shrink-0 rounded-xl border-2 border-[#F17922] bg-white px-3 py-1.5 text-center shadow-md">
            <div className="text-[9px] font-semibold uppercase tracking-wider text-gray-500">Code</div>
            <div className="font-mono text-2xl font-bold leading-none text-[#F17922]">{course.pickup_code}</div>
          </div>
        )}
      </div>

      <EtatCourseLivreur
        course={course}
        commandes={commandes}
        service={group.deliveryService}
        maintenant={maintenant}
      />

      {retenue && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-2.5 py-2 text-amber-900">
          <Hourglass className="mt-px h-4 w-4 shrink-0" aria-hidden />
          <div className="min-w-0">
            <p className="text-[12px] font-semibold leading-snug">{retenue}</p>
            {depart && <p className="text-[12px] leading-snug">{depart}</p>}
          </div>
        </div>
      )}

      {onConfirmer && (
        <BoutonConfirmerRecuperation
          course={course}
          commandes={commandes}
          service={group.deliveryService}
          maintenant={maintenant}
          onClick={() => onConfirmer(course)}
        />
      )}
    </div>
  );
};

/**
 * Plein vert quand le livreur est au restaurant, contour orange sinon (sa
 * position peut avoir du retard sur le livreur qui est devant la caissière).
 * Toujours actif : la fenêtre dit s'il manque quelque chose. Le même bouton
 * est au pied du tiroir de la commande.
 */
export function BoutonConfirmerRecuperation({
  course,
  commandes,
  service,
  maintenant,
  onClick,
}: {
  course: CourseOperations;
  commandes: readonly CommandeOperations[];
  service?: string | null;
  maintenant: Date;
  onClick: () => void;
}) {
  const { etat } = useEtatCourseLivreur(course, commandes, service, maintenant);
  const auRestaurant = etat.etat === "AU_COMPTOIR";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl px-3 py-2 text-sm font-bold transition ${
        auRestaurant
          ? "bg-green-600 text-white hover:bg-green-700"
          : "border-2 border-[#F17922] bg-white text-[#F17922] hover:bg-orange-50"
      }`}
    >
      Confirmer la récupération
    </button>
  );
}
