"use client";

import type { MouseEvent } from "react";
import { Smartphone } from "lucide-react";
import { useAuthStore } from "../../users/hook/authStore";
import { Action, Modules } from "../../users/types/auth.type";
import { useOutgoingCall } from "../hooks/useOutgoingCall";
import { useCallStore } from "../stores/callStore";
import { detailClient, peutAppelerClient, titreBoutonAppelClient } from "../utils/appel-client";

interface Props {
  customerId: string;
  nom: string;
  /** Commande dont on veut parler (tiroir d'une commande). */
  orderId?: string | null;
  /** Référence de cette commande, pour la ligne sous le nom dans le panneau d'appel. */
  orderReference?: string | null;
  className?: string;
}

/**
 * « Appeler dans l'appli » : le service client appelle un client dans l'appli
 * Chicken Nation (demande du 26/11), comme les appels Lunion Meet du
 * back-office : `POST /calls` avec `{ targetKind: "CUSTOMER", customer_id,
 * order_id }`. Seulement pour les rôles que le serveur autorise (admin,
 * service client) qui ont aussi le droit de lire les appels ; rien pour les
 * autres. Quand l'appli du client ne sait pas prendre un appel, le serveur le
 * dit et le numéro reste à côté du bouton.
 */
export default function BoutonAppelerClient({
  customerId,
  nom,
  orderId,
  orderReference,
  className = "",
}: Props) {
  const role = useAuthStore((s) => s.user?.role);
  const droitAppels = useAuthStore((s) => s.can(Modules.CALLS, Action.READ));
  const { call, starting } = useOutgoingCall();
  const occupe = useCallStore((s) => !!s.active || !!s.incoming);
  if (!customerId || !peutAppelerClient(role, droitAppels)) return null;

  const titre = titreBoutonAppelClient(nom);
  const onClick = (e: MouseEvent) => {
    e.stopPropagation();
    void call({
      targetKind: "CUSTOMER",
      customer_id: customerId,
      order_id: orderId ?? undefined,
      targetLabel: nom,
      peerDetail: detailClient(orderReference),
    });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={starting || occupe}
      title={titre}
      aria-label={titre}
      className={`inline-flex items-center gap-1.5 rounded-full bg-[#F17922] px-3 py-1.5 text-xs font-semibold text-blanc shadow-sm transition-colors hover:bg-[#d95f0e] disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
    >
      <Smartphone className="h-3.5 w-3.5" />
      {starting ? "Appel…" : "Appeler dans l'appli"}
    </button>
  );
}
