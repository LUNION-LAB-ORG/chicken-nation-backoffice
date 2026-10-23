"use client";

import React from "react";
import { CheckCircle2, GitMerge, Hourglass, Package, PlusCircle, Route } from "lucide-react";

import type { IOrderGroup } from "../../types/operations.types";
import { useAvisDeCourse } from "../../hooks/use-avis-courses";
import {
  courseDeCommande,
  estAjouteeARemettre,
  etiquetteMotif,
  texteAjout,
  texteRetenue,
  texteToutEstPret,
  type CommandeOperations,
} from "../../utils/suivi-course";
import { EtatCourseLivreur } from "./EtatCourseLivreur";

interface Props {
  group: IOrderGroup;
  /** Toutes les commandes affichées (livraisons commencées, coordonnées). */
  commandes: readonly CommandeOperations[];
  maintenant: Date;
}

/**
 * En-tête d'une course sur l'écran Opérations, visible dès la création de la
 * course (une seule commande comprise) : référence, code de retrait en grand,
 * motif du regroupement, livreur et son état, retenue au comptoir, commandes
 * ajoutées à remettre, courses fusionnées.
 */
export const BandeauCourse: React.FC<Props> = ({ group, commandes, maintenant }) => {
  const course = group.orders.map((o) => courseDeCommande(o as CommandeOperations)).find(Boolean) ?? null;
  const avis = useAvisDeCourse(group.courseId);
  if (!course) return null;

  const n = group.orders.length;
  const apresRetrait = course.statut === "IN_DELIVERY";
  const motif = etiquetteMotif(course.motif_regroupement);
  const retenue = texteRetenue(course, maintenant);
  const toutPret = retenue ? null : texteToutEstPret(course);
  const ajoutees = group.orders
    .filter((o) => estAjouteeARemettre(o as CommandeOperations))
    .map((o) => o.reference);
  // Après le retrait, seules les commandes ajoutées restent au comptoir.
  const texteAjoutees =
    ajoutees.length > 0 ? texteAjout(course, n === 1 && apresRetrait ? [] : ajoutees) : null;
  const avisAffiches = avis.filter((a) => a.type === "FUSION" || (a.type === "AJOUT" && !texteAjoutees));

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

      {motif && (
        <div className="inline-flex items-center gap-1 rounded-lg border border-orange-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-[#C2570C]">
          <Route className="h-3 w-3" aria-hidden />
          {motif}
        </div>
      )}

      <EtatCourseLivreur
        course={course}
        commandes={commandes}
        service={group.deliveryService}
        maintenant={maintenant}
      />

      {texteAjoutees && (
        <Ligne Icone={PlusCircle} classes="border-green-300 bg-green-50 text-green-900" fort>
          {texteAjoutees}
        </Ligne>
      )}

      {retenue && (
        <Ligne Icone={Hourglass} classes="border-amber-300 bg-amber-50 text-amber-900">
          {retenue}
        </Ligne>
      )}

      {toutPret && (
        <Ligne Icone={CheckCircle2} classes="border-green-300 bg-green-50 text-green-900">
          {toutPret}
        </Ligne>
      )}

      {avisAffiches.map((a) => (
        <Ligne
          key={`${a.at}-${a.texte}`}
          Icone={a.type === "FUSION" ? GitMerge : PlusCircle}
          classes="border-purple-200 bg-purple-50 text-purple-900"
        >
          {a.texte}
        </Ligne>
      ))}
    </div>
  );
};

function Ligne({
  Icone,
  classes,
  fort,
  children,
}: {
  Icone: React.ComponentType<{ className?: string }>;
  classes: string;
  fort?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex items-start gap-2 rounded-xl border px-2.5 py-2 ${classes}`}>
      <Icone className="mt-0.5 h-4 w-4 shrink-0" />
      <p className={`text-[12px] leading-snug ${fort ? "font-bold" : "font-semibold"}`}>{children}</p>
    </div>
  );
}
