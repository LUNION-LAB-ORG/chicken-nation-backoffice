"use client";

import React from "react";
import {
  AlertTriangle,
  Bike,
  CheckCircle2,
  Navigation,
  PackageX,
  Search,
  Send,
  Store,
  Truck,
  XCircle,
  type LucideIcon,
} from "lucide-react";

// ⚠️ Import RELATIF entre features : `@/` pointe sur src/, `features/` est à la racine.
import { useDelivererLivePosition } from "../../../maps/hooks/use-deliverer-live-socket";
import { PresenceAppliLigne } from "../../../livreurs/components/PresenceAppliLigne";
import type { PresenceAppli } from "../../../livreurs/utils/disponibilite";
import {
  appliDuLivreur,
  etatCourse,
  livraisonsCommencees,
  plusRecente,
  positionConnue,
  positionRestaurant,
  referencesARemettre,
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
  PARTI_SANS_SAC: PackageX,
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
 * « Koffi · En route, arrivée vers 12 h 38 », « Au restaurant », « Parti à
 * 12 h 45 », « Recherche d'un livreur », « Confiée à Turbo », et en rouge
 * « Parti à 12 h 20, CMD-B pas remise » quand il est parti sans un sac.
 *
 * Son appli (demande du 24/10) : « Appli fermée · vue il y a 6 min » (gris),
 * « En arrière-plan ». Sur une carte de commande (une ligne), seule l'appli
 * fermée est signalée : en arrière-plan pendant une livraison, c'est normal.
 */
/**
 * État de la course et appli de son livreur, avec la position en direct du
 * livreur qui vient au restaurant. Partagé par la ligne d'état et le groupe
 * de la course (couleur du bouton « Confirmer la récupération »).
 */
export function useEtatCourseLivreur(
  course: CourseOperations,
  commandes: readonly CommandeOperations[],
  service: string | null | undefined,
  maintenant: Date,
): { etat: EtatAffiche; appli: PresenceAppli | null } {
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
  const aRemettre = referencesARemettre(course.id, commandes);
  const etat = etatCourse(course, {
    maintenant,
    position,
    restaurant,
    livraisonsCommencees: livraisonsCommencees(course.id, commandes),
    resteARemettre: aRemettre.length > 0,
    referencesARemettre: aRemettre,
    service,
  });
  return { etat, appli: appliDuLivreur(course, maintenant) };
}

export { ICONES as ICONES_ETAT_COURSE, TONS as TONS_ETAT_COURSE };

export const EtatCourseLivreur: React.FC<Props> = ({ course, commandes, service, maintenant, compact }) => {
  const { etat, appli } = useEtatCourseLivreur(course, commandes, service, maintenant);
  const ton = TONS[etat.ton];
  const Icone = ICONES[etat.etat];

  if (compact) {
    // Appli fermée ou connexion coupée : dite aussi dans la version courte.
    const silence = appli?.cas === "FERMEE" || appli?.cas === "COUPURE" ? appli : null;
    return (
      <div
        className={`inline-flex max-w-full items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] font-semibold ${ton.cadre} ${ton.texte}`}
        title={silence?.raison}
      >
        <Icone className="h-3 w-3 shrink-0" aria-hidden />
        <span className="truncate">
          {etat.livreur ? `${etat.livreur} · ` : ""}
          {etat.libelle}
          {silence ? ` · ${silence.libelle.toLowerCase()}` : ""}
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
        {appli && <PresenceAppliLigne presence={appli} className="mt-0.5" />}
      </div>
    </div>
  );
};
