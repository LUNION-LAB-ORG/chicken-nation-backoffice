"use client";

import { useEffect, useState } from "react";
import { Phone, PhoneOff } from "lucide-react";
import { useCallActions } from "../hooks/useCallActions";
import { useCallStore } from "../stores/callStore";
import { callsApi } from "../apis/calls.api";
import { CallStatus, type IIncomingCallEvent } from "../types/call.type";
import { getInitials } from "../utils/initials";
import { incomingRing } from "../utils/ringtone";
import { closeCallNotification, stopTitleFlash } from "../utils/notifications";

const KEYFRAMES = `
@keyframes cn-slide-up { from { transform: translateY(48px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
@keyframes cn-soft-pulse { 0%,100% { transform: scale(1) } 50% { transform: scale(1.07) } }
`;

export default function IncomingCallModal({ incoming }: { incoming: IIncomingCallEvent }) {
  const { accept, reject } = useCallActions();
  // Débounce : décrocher/refuser ne peut être cliqué qu'une fois.
  const [busy, setBusy] = useState(false);

  // Filet de convergence : si l'appel n'est plus en sonnerie côté serveur
  // (pris par un collègue, annulé) et que l'événement socket s'est perdu,
  // la modale se ferme quand même.
  useEffect(() => {
    const t = setInterval(async () => {
      try {
        const s = await callsApi.getStatus(incoming.callId);
        if (s.status !== CallStatus.RINGING) {
          incomingRing.stop();
          closeCallNotification();
          stopTitleFlash();
          useCallStore.getState().clearIncomingIf(incoming.callId);
        }
      } catch {
        /* réseau — le prochain tick réessaie */
      }
    }, 3_000);
    return () => clearInterval(t);
  }, [incoming.callId]);

  const onAccept = () => {
    if (busy) return;
    setBusy(true);
    void accept();
  };
  const onReject = () => {
    if (busy) return;
    setBusy(true);
    void reject();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Appel entrant de ${incoming.callerName}`}
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md sm:p-4"
    >
      <style>{KEYFRAMES}</style>
      <div className="w-full sm:w-[380px] rounded-t-[2rem] sm:rounded-[2rem] bg-gradient-to-b from-slate-900 to-slate-800 text-white shadow-2xl px-8 pt-9 pb-10 sm:pb-9 text-center animate-[cn-slide-up_.35s_cubic-bezier(.16,1,.3,1)]">
        {/* Badge appel entrant */}
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium text-slate-200">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
          </span>
          Appel entrant
        </div>

        {/* Avatar + anneaux animés */}
        <div className="relative mx-auto mt-7 mb-5 h-28 w-28">
          <span className="absolute inset-0 animate-ping rounded-full bg-[#F17922]/25" />
          <span
            className="absolute -inset-3 animate-ping rounded-full bg-[#F17922]/10"
            style={{ animationDelay: "300ms" }}
          />
          <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-[#F17922] to-[#d95f0e] text-4xl font-bold shadow-lg shadow-[#F17922]/30">
            {getInitials(incoming.callerName)}
          </div>
        </div>

        <div className="text-2xl font-semibold tracking-tight truncate">{incoming.callerName}</div>
        <div className="mt-1 text-sm text-slate-400">Appel · {incoming.targetLabel}</div>

        {/* Actions */}
        <div className="mt-9 flex items-center justify-between px-6">
          <button
            type="button"
            onClick={onReject}
            disabled={busy}
            aria-label="Refuser l'appel"
            className="group flex flex-col items-center gap-2 disabled:opacity-40"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 shadow-lg shadow-red-500/30 transition-transform group-active:scale-90 group-hover:bg-red-600">
              <PhoneOff className="h-7 w-7" />
            </span>
            <span className="text-xs text-slate-400">Refuser</span>
          </button>

          <button
            type="button"
            autoFocus
            onClick={onAccept}
            disabled={busy}
            aria-label="Répondre à l'appel"
            className="group flex flex-col items-center gap-2 disabled:opacity-40"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500 shadow-lg shadow-green-500/40 animate-[cn-soft-pulse_1.2s_ease-in-out_infinite] transition-transform group-active:scale-90 group-hover:bg-green-600">
              <Phone className="h-7 w-7" />
            </span>
            <span className="text-xs text-slate-400">Répondre</span>
          </button>
        </div>
      </div>
    </div>
  );
}
