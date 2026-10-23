"use client";

import React from "react";
import {
  AlertTriangle,
  Bike,
  CheckCircle2,
  Navigation,
  Search,
  Send,
  Store,
  Truck,
  XCircle,
  type LucideIcon,
} from "lucide-react";

// ⚠️ Import RELATIF entre features : `@/` pointe sur src/, `features/` est à la racine.
import { useDelivererLivePosition } from "../../../maps/hooks/use-deliverer-live-socket";
import {
  etatCourse,
  livraisonsCommencees,
  plusRecente,
  positionConnue,
  positionRestaurant,
  type CommandeOperations,
  type CourseOperations,
  type EtatAffiche,
  type EtatCourse,
} from "../../utils/suivi-course";

const ICONES: Record<EtatCourse, LucideIcon> = {
  RECHERCHE: Search,
  PROPOSEE: Send,
  TURBO: Truck,
  EN_ROUTE: Bike,
  AU_COMPTOIR: Store,
  PARTI: Navigation,
  EN_LIVRAISON: Navigation,
  TERMINEE: CheckCircle2,
  ANNULEE: XCircle,
  SANS_LIVREUR: AlertTriangle,
};

const TONS: Record<EtatAffiche["ton"], { cadre: string; pastille: string; texte: string }> = {
  vert: { cadre: "bg-green-50 border-green-200", pastille: "bg-green-600", texte: "text-green-800" },
  bleu: { cadre: "bg-blue-50 border-blue-200", pastille: "bg-blue-600", texte: "text-blue-800" },
  ambre: { cadre: "bg-amber-50 border-amber-200", pastille: "bg-amber-500", texte: "text-amber-900" },
  violet: { cadre: "bg-purple-50 border-purple-200", pastille: "bg-purple-600", texte: "text-purple-800" },
  gris: { cadre: "bg-gray-50 border-gray-200", pastille: "bg-gray-500", texte: "text-gray-700" },
  rouge: { cadre: "bg-red-50 border-red-200", pastille: "bg-red-600", texte: "text-red-800" },
};

interface Props {
  course: CourseOperations;
  /** Commandes affichées : livraisons déjà commencées, coordonnées du restaurant. */
  commandes: readonly CommandeOperations[];
  /** Service de livraison des commandes (TURBO d'origine). */
  service?: string | null;
  maintenant: Date;
  /** Une seule ligne, pour une carte de commande. */
  compact?: boolean;
}

/**
 * Livreur d'une course et son état, tenus à jour par les événements du
 * serveur et par la position en direct du livreur qui vient au restaurant :
 * « Koffi · En route, arrivée vers 12 h 38 », « Au comptoir », « Parti à
 * 12 h 45 », « Recherche d'un livreur », « Confiée à Turbo ».
 */
export const EtatCourseLivreur: React.FC<Props> = ({ course, commandes, service, maintenant, compact }) => {
  // Position en direct seulement pour un livreur qui vient au restaurant.
  const enApproche = course.statut === "ACCEPTED" && !!course.deliverer_id;
  const direct = useDelivererLivePosition(enApproche ? course.deliverer_id : null);

  const restaurant = positionRestaurant(
    course.restaurant,
    ...commandes.filter((c) => c.delivery?.course?.id === course.id).map((c) => c.restaurant),
  );
  const position = plusRecente(
    direct ? { lat: direct.lat, lng: direct.lng, ts: direct.ts } : null,
    positionConnue(course.deliverer),
  );
  const etat = etatCourse(course, {
    maintenant,
    position,
    restaurant,
    livraisonsCommencees: livraisonsCommencees(course.id, commandes),
    service,
  });
  const ton = TONS[etat.ton];
  const Icone = ICONES[etat.etat];

  if (compact) {
    return (
      <div className={`inline-flex max-w-full items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] font-semibold ${ton.cadre} ${ton.texte}`}>
        <Icone className="h-3 w-3 shrink-0" aria-hidden />
        <span className="truncate">
          {etat.livreur ? `${etat.livreur} · ` : ""}
          {etat.libelle}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2.5 rounded-xl border px-2.5 py-2 ${ton.cadre}`}>
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white ${ton.pastille}`}>
        <Icone className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0">
        {etat.livreur && <div className="truncate text-xs font-bold text-gray-900">{etat.livreur}</div>}
        <div className={`leading-snug ${etat.livreur ? "text-[12px] font-semibold" : "text-xs font-bold"} ${ton.texte}`}>
          {etat.libelle}
        </div>
      </div>
    </div>
  );
};
