"use client";

import type { MouseEvent } from "react";
import { Phone } from "lucide-react";
import { useAuthStore } from "../../users/hook/authStore";
import { Action, Modules } from "../../users/types/auth.type";
import { useOutgoingCall } from "../hooks/useOutgoingCall";
import { useCallStore } from "../stores/callStore";
import { peutAppelerLivreur, titreBoutonAppel } from "../utils/appel-livreur";

interface Props {
  delivererId: string;
  nom: string;
  /** Ligne sous le nom dans le panneau d'appel (« Livreur · Angré »). */
  detail?: string | null;
  /** `pilule` : icône et « Appeler » ; `icone` : rond, pour une ligne de liste. */
  variante?: "pilule" | "icone";
  className?: string;
}

/**
 * Bouton « Appeler » un livreur dans son appli (demande du 24/10), comme les
 * appels Lunion Meet du backoffice : `POST /calls` avec
 * `{ targetKind: "DELIVERER", deliverer_id }`. Seulement pour les rôles que
 * le serveur autorise (admin, service client) qui ont aussi le droit de lire
 * les appels ; rien pour les autres. Le clic ne remonte pas (une ligne de
 * liste cliquable n'ouvre pas la fiche).
 */
export default function BoutonAppelerLivreur({
  delivererId,
  nom,
  detail,
  variante = "pilule",
  className = "",
}: Props) {
  const role = useAuthStore((s) => s.user?.role);
  const droitAppels = useAuthStore((s) => s.can(Modules.CALLS, Action.READ));
  const { call, starting } = useOutgoingCall();
  const occupe = useCallStore((s) => !!s.active || !!s.incoming);
  if (!peutAppelerLivreur(role, droitAppels)) return null;

  const titre = titreBoutonAppel(nom);
  const onClick = (e: MouseEvent) => {
    e.stopPropagation();
    void call({ targetKind: "DELIVERER", deliverer_id: delivererId, targetLabel: nom, peerDetail: detail });
  };

  if (variante === "icone") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={starting || occupe}
        title={titre}
        aria-label={titre}
        className={`inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#FFF0E4] text-[#F17922] transition-colors hover:bg-[#F17922] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
      >
        <Phone className="h-4 w-4" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={starting || occupe}
      title={titre}
      aria-label={titre}
      className={`inline-flex items-center gap-1.5 rounded-full bg-[#F17922] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#d95f0e] disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
    >
      <Phone className="h-3.5 w-3.5" />
      {starting ? "Appel…" : "Appeler"}
    </button>
  );
}
