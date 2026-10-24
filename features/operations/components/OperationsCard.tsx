"use client";

import React from "react";
import { Globe, Sparkles, Zap, type LucideIcon } from "lucide-react";

// ⚠️ Import RELATIF entre features : `@/` pointe sur src/, `features/` est à la racine.
import type { Order } from "../../orders/types/order.types";
import { libelleCanal, type LibelleCanal } from "../../orders/utils/canal-commande";
import { useTickingElapsed } from "../hooks/use-ticking-elapsed";
import { formatElapsed, getReferenceAtISO, getUrgencyLevel, URGENCY_COLORS } from "../utils/card-urgency";
import { formatPrix, ligneTrois, nomClient } from "../utils/carte-commande";
import { getTypeMeta } from "../utils/status-colors";

/** Icône du canal, une par canal ; son nom est dans l'infobulle. */
const ICONE_CANAL: Record<LibelleCanal, LucideIcon> = {
  "Site web": Globe,
  Appli: Zap,
  Manuel: Sparkles,
};

interface Props {
  order: Order;
  onClick: () => void;
  /** Heure courante relue par la colonne (programmée, retenue). */
  maintenant: Date;
  /** Restaurant en tête de la deuxième ligne (compte du siège sur « Tous »). */
  restaurant?: string | null;
  /** Commande en cuisine attendue par une course retenue : « Attendue par Koffi, départ 12 h 44 ». */
  attente?: string | null;
}

/**
 * Carte d'une commande (En cuisine, et commandes sans course dans Prêtes),
 * demande du 24/10 au soir : hauteur fixe de trois lignes, jamais de retour à
 * la ligne (le texte entier est dans l'infobulle) :
 *
 *   ORD-241024-0012     14m3       12.500 F
 *   Aya Koné · À livrer                  ⚡
 *   Attendue par Koffi, départ 12 h 44
 *
 * Pas de bouton : toucher la carte ouvre le tiroir, où sont les gestes. Le
 * retard se lit à la couleur du minuteur et à la pastille de la colonne.
 */
export const OperationsCard: React.FC<Props> = ({ order, onClick, maintenant, restaurant, attente }) => {
  const elapsedSec = useTickingElapsed(getReferenceAtISO(order));
  const couleurs = URGENCY_COLORS[getUrgencyLevel(order)];
  const canal = libelleCanal(order);
  const IconeCanal = ICONE_CANAL[canal];
  const client = nomClient(order);
  const type = getTypeMeta(order.type)?.label ?? "";
  const ligne = ligneTrois(order, { maintenant, attente });
  const ligne2 = [restaurant, client, type].filter(Boolean).join(" · ");

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-[92px] w-full flex-col justify-between rounded-2xl border border-gray-200 bg-white px-3 py-2.5 text-left transition hover:border-[#F17922] hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F17922]"
    >
      <span className="flex w-full min-w-0 items-center gap-2">
        <span className="truncate text-sm font-bold text-gray-900" title={order.reference}>
          {order.reference}
        </span>
        {elapsedSec !== null && (
          <span
            className={`shrink-0 rounded-md border px-1.5 text-[11px] font-bold leading-[18px] tabular-nums ${couleurs.bg} ${couleurs.text} ${couleurs.border}`}
          >
            {formatElapsed(elapsedSec)}
          </span>
        )}
        <span className="ml-auto shrink-0 text-sm font-bold tabular-nums text-gray-900">{formatPrix(order.amount)}</span>
      </span>

      <span className="flex w-full min-w-0 items-center gap-1.5 text-xs">
        <span className="min-w-0 truncate" title={ligne2}>
          {restaurant && <span className="font-semibold text-[#F17922]">{restaurant} · </span>}
          <span className="font-medium text-gray-800">{client}</span>
          {type && <span className="text-gray-500"> · {type}</span>}
        </span>
        <span className="ml-auto shrink-0 text-gray-400" title={canal} aria-label={canal} role="img">
          <IconeCanal className="h-3.5 w-3.5" aria-hidden />
        </span>
      </span>

      <span
        className={`block w-full truncate text-xs ${ligne.ton === "ambre" ? "font-semibold text-amber-700" : "text-gray-500"}`}
        title={ligne.texte}
      >
        {ligne.texte}
      </span>
    </button>
  );
};

/** Place d'une carte pendant le chargement : même hauteur, la page ne saute pas. */
export const OperationsCardSquelette: React.FC = () => (
  <div className="h-[92px] w-full animate-pulse rounded-2xl border border-gray-100 bg-gray-100" aria-hidden />
);
