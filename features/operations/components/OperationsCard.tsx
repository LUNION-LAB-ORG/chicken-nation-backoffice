"use client";

import React from "react";
import {
  AlertCircle,
  ArrowRight,
  Clock,
  Globe,
  MapPin,
  Phone,
  Sparkles,
  Store,
  User,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";

// ⚠️ Import RELATIF entre features : `@/` pointe sur src/, `features/` est à la racine.
import { OrderType, type Order } from "../../orders/types/order.types";
import { useAuthStore } from "../../users/hook/authStore";
import { useMaintenant } from "../hooks/use-maintenant";
import { useTickingElapsed } from "../hooks/use-ticking-elapsed";
import {
  formatElapsed,
  getReferenceAtISO,
  getUrgencyLevel,
  getUrgencyProgress,
  URGENCY_COLORS,
} from "../utils/card-urgency";
import {
  actionPaiement,
  adresseCourte,
  commandeProgrammee,
  formatPrix,
  libelleStatutCarte,
  nomClientCarte,
  restaurantDeLaCarte,
} from "../utils/carte-operations";
import { getStatusBadgeClasses, getTypeMeta } from "../utils/status-colors";
import {
  COULEURS_CANAL,
  libelleCanal,
  type LibelleCanal,
} from "../../orders/utils/canal-commande";

/** Icône de la pastille d'origine, une par canal. */
const ICONE_CANAL: Record<LibelleCanal, LucideIcon> = {
  "Site web": Globe,
  Appli: Zap,
  Manuel: Sparkles,
};

interface Props {
  order: Order;
  onClick: () => void;
  /** Callback pour le bouton "Faire le paiement" en bas de la card (ouvre le drawer au tab Paiement) */
  onPayClick?: () => void;
  showWarningBadge?: boolean;
  warningLabel?: string;
  /** Cache le ring d'urgence pour les cards groupées dans une course */
  hideUrgencyRing?: boolean;
  /**
   * Ligne de suivi, sur une seule ligne à côté du minuteur : course qui
   * attend cette commande en cuisine, livreur et son état.
   */
  extra?: React.ReactNode;
}

/**
 * Card commande avec minuteur d'urgence et pastilles, la carte que les
 * équipes connaissent : mêmes informations, même ordre (`utils/carte-operations.ts`).
 *
 * Demande du 24/10 : la carte ne grossit plus quand une information
 * s'ajoute. Chaque information tient sur UNE ligne, coupée proprement (texte
 * entier en infobulle, détail au tiroir) ; la commande programmée et la
 * ligne de suivi se partagent la ligne à côté du minuteur, qui existe
 * toujours.
 */
export const OperationsCard: React.FC<Props> = ({
  order,
  onClick,
  onPayClick,
  showWarningBadge,
  warningLabel,
  hideUrgencyRing = false,
  extra,
}) => {
  const urgency = getUrgencyLevel(order);
  const progress = getUrgencyProgress(order);
  const refAtISO = getReferenceAtISO(order);
  const elapsedSec = useTickingElapsed(refAtISO);
  const elapsedLabel = elapsedSec !== null ? formatElapsed(elapsedSec) : null;
  const maintenant = useMaintenant(30_000);
  const colors = URGENCY_COLORS[urgency];
  const typeMeta = getTypeMeta(order.type);
  const statusBadgeCls = getStatusBadgeClasses(order.status);
  const statut = libelleStatutCarte(order.status);
  const canal = libelleCanal(order);
  const IconeCanal = ICONE_CANAL[canal];
  const programmee = commandeProgrammee(order, maintenant);
  const client = nomClientCarte(order);
  const adresse = order.type === OrderType.DELIVERY ? adresseCourte(order) : "";
  const pastilles = [statut, typeMeta?.label, canal, showWarningBadge ? (warningLabel ?? "Attention") : null]
    .filter(Boolean)
    .join(" · ");
  // Un compte BACKOFFICE (admin, call center) voit les commandes de TOUS les
  // restaurants sur le même tableau : sans le nom du restaurant sur la carte,
  // impossible de savoir d'où vient chacune. Un compte RESTAURANT n'en a pas
  // besoin (il ne voit que le sien).
  const typeDuMembre = useAuthStore((s) => s.user?.type);
  const restaurant = restaurantDeLaCarte(order, typeDuMembre);
  // À côté du minuteur, la ligne existe toujours : rien ne pousse la carte.
  const ligneSuivie = !hideUrgencyRing || !!programmee || !!extra;

  return (
    /*
     * Bloc cliquable et non <button> : la carte contient le bouton « Faire le
     * paiement », et un bouton dans un bouton est du HTML invalide (React le
     * signale et le navigateur peut réordonner l'arbre). Clavier : Entrée ou
     * Espace sur la carte elle-même, jamais quand la touche vient du bouton
     * intérieur.
     */
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget || (e.key !== "Enter" && e.key !== " ")) return;
        e.preventDefault();
        onClick();
      }}
      className={`group w-full bg-white rounded-2xl border text-left p-3 transition-all hover:shadow-md cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F17922] ${
        urgency === "danger"
          ? "border-red-300 shadow-red-100"
          : urgency === "warn"
            ? "border-amber-200"
            : "border-gray-200 hover:border-[#F17922]"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Ring d'urgence */}
        {!hideUrgencyRing && (
          <div className="shrink-0">
            <UrgencyRing progress={progress} color={colors.ring} label={elapsedLabel} />
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Ligne 1 : ref + prix */}
          <div className="flex h-5 items-center justify-between gap-2">
            <span className="text-sm font-bold text-gray-900 truncate" title={order.reference}>
              {order.reference}
            </span>
            <span className="text-sm font-bold text-[#F17922] tabular-nums shrink-0">
              {formatPrix(order.amount)}
            </span>
          </div>

          {/*
            Ligne de suivi, UNE ligne : commande programmée (« Plus tard ·
            20h00 », l'information qui décide s'il faut s'en occuper
            MAINTENANT), puis la course qui l'attend en cuisine ou le livreur.
            Ce qui ne tient pas est coupé ; le tiroir a tout.
          */}
          {ligneSuivie && (
            <div className="mt-1 flex h-6 min-w-0 items-center gap-1.5 overflow-hidden">
              {programmee && (
                <span
                  className={`inline-flex shrink-0 items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg border ${
                    programmee.plusTard
                      ? "bg-[#FDF3E7] text-[#8A4B00] border-[#F3D5B0]"
                      : "bg-[#EAF7F0] text-[#1E8E5A] border-[#CDEBD9]"
                  }`}
                  title={programmee.titre}
                >
                  <Clock className="w-3 h-3" />
                  {programmee.texte}
                </span>
              )}
              {extra && <div className="flex min-w-0 overflow-hidden">{extra}</div>}
            </div>
          )}
        </div>
      </div>

      {/*
        Rangée unique de pastilles : statut · type · origine · retard. Une
        seule ligne, jamais de retour à la ligne (le texte entier est dans
        l'infobulle de la rangée).
      */}
      <div className="mt-2 flex h-[26px] items-center gap-1 overflow-hidden" title={pastilles}>
        {/* Statut (border-2, en évidence) : couleurs alignées sur la page Commandes */}
        <span
          className={`inline-flex shrink-0 items-center text-xs font-bold px-2 py-1 rounded-lg border-2 ${statusBadgeCls}`}
        >
          {statut}
        </span>
        {/* Type (border, en évidence) */}
        {typeMeta && (
          <span
            className={`inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold px-1.5 py-1 rounded-lg border ${typeMeta.cls}`}
          >
            <typeMeta.Icon className="w-3 h-3" />
            {typeMeta.label}
          </span>
        )}
        {/* Source : le canal (Site web, Appli, Manuel) */}
        <span
          className={`inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold px-1.5 py-1 rounded-lg border ${COULEURS_CANAL[canal]}`}
        >
          <IconeCanal className="w-3 h-3" />
          {canal}
        </span>
        {/* Warning (rare, ex. "En retard") */}
        {showWarningBadge && (
          <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold px-1.5 py-1 rounded-lg bg-red-50 text-red-700 border border-red-200">
            <AlertCircle className="w-3 h-3" />
            {warningLabel ?? "Attention"}
          </span>
        )}
      </div>

      {/* Infos en PLEINE LARGEUR, une ligne chacune */}
      <div className="mt-2 space-y-0.5">
        {/* Ligne restaurant : comptes BACKOFFICE uniquement (multi-restaurants). */}
        {restaurant && (
          <div className="flex h-4 items-center gap-1.5 text-xs" title={restaurant}>
            <Store className="w-3 h-3 shrink-0 text-[#F17922]" />
            <span className="truncate font-semibold text-gray-800">{restaurant}</span>
          </div>
        )}

        {/* Client */}
        <div
          className="flex h-4 items-center gap-1.5 text-xs text-gray-700"
          title={[client, order.phone].filter(Boolean).join(" · ")}
        >
          <User className="w-3 h-3 shrink-0 text-gray-400" />
          <span className="truncate font-medium">{client}</span>
          {order.phone && (
            <span className="flex items-center gap-0.5 text-[10px] text-gray-400 shrink-0">
              <Phone className="w-2.5 h-2.5" />
              {order.phone}
            </span>
          )}
        </div>

        {/* Adresse (delivery) */}
        {adresse && (
          <div className="flex h-4 items-center gap-1.5 text-xs text-gray-500" title={adresse}>
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{adresse}</span>
          </div>
        )}
      </div>

      {/* Footer : bouton "Faire le paiement" ou label "Paiement en attente" si !paied */}
      <PaymentAction order={order} onPay={onPayClick} />
    </div>
  );
};

// ─── Action paiement : bouton ou label selon le contexte ─────────────────────

/**
 * Footer de la card (`actionPaiement`) : rien si payée ; « Faire le
 * paiement » pour une commande à payer à la livraison déjà récupérée ou
 * livrée (ouvre le drawer sur Paiement) ; sinon « Paiement en attente ».
 * Même hauteur dans les deux cas.
 */
function PaymentAction({ order, onPay }: { order: Order; onPay?: () => void }) {
  const action = actionPaiement(order);
  if (!action) return null;

  if (action === "payer") {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onPay?.();
        }}
        className="w-full mt-3 h-8 inline-flex items-center justify-center gap-1.5 px-3 text-xs font-bold rounded-lg bg-[#F17922] text-white hover:bg-[#D96A1D] transition shadow-sm"
      >
        <Wallet className="w-3.5 h-3.5" />
        Faire le paiement
        <ArrowRight className="w-3 h-3" />
      </button>
    );
  }

  return (
    <div className="mt-3 h-8 px-3 inline-flex items-center justify-center gap-1.5 w-full text-[11px] font-semibold rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
      <Clock className="w-3 h-3" />
      Paiement en attente
    </div>
  );
}

// ─── Ring d'urgence : compte-à-rebours visuel ─────────────────────────────────

function UrgencyRing({
  progress,
  color,
  label,
}: {
  progress: number;
  color: string;
  label: string | null;
}) {
  const size = 48;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (progress / 100) * circ;
  // Le label ticking peut faire jusqu'à 5 char ("1m59s"), on réduit un peu au-delà de 4 char.
  const text = label ?? "";
  const textClass = text.length >= 5 ? "text-[9px]" : "text-[10px]";
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#F1F5F9" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
        />
      </svg>
      <div className={`absolute ${textClass} font-bold tabular-nums`} style={{ color }}>
        {text}
      </div>
    </div>
  );
}
