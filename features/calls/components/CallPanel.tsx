"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { useLunionRoom } from "@lunionlab/meet-react";
import { Maximize2, Mic, MicOff, Minus, PhoneOff } from "lucide-react";
import { useCallStore, type ActiveCall } from "../stores/callStore";
import { useCallActions } from "../hooks/useCallActions";
import { callsApi } from "../apis/calls.api";
import { CallStatus } from "../types/call.type";
import { formatCallTime, roomStatusLabel } from "../utils/call-format";
import { ringbackTone } from "../utils/ringtone";
import { getInitials } from "../utils/initials";

const KEYFRAMES = `
@keyframes cn-eq { 0%,100% { height: 30% } 50% { height: 100% } }
@keyframes cn-panel-in { from { transform: translateY(24px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
`;

/**
 * Panneau d'appel audio flottant. Audio SEULEMENT : `video: false` (aucune
 * caméra publiée), le flux distant est joué dans des <audio> invisibles.
 * Responsive : carte bas-droite sur desktop, pleine largeur en bas sur mobile.
 */
/**
 * Garde-fou : un appel sans accès room valide (payload corrompu/incomplet —
 * ex. restauration ayant reçu un corps vide) ne doit JAMAIS monter le hook
 * Lunion (crash `access.url` au 1er rendu). On l'évacue du store et on ne
 * rend rien ; les hooks Lunion vivent dans CallPanelInner, monté seulement
 * quand l'accès est valide.
 */
export default function CallPanel({ call }: { call: ActiveCall }) {
  const invalidAccess = !call.access?.url || !call.access?.token;
  useEffect(() => {
    if (invalidAccess) {
      useCallStore.getState().endIfMatches(call.callId);
    }
  }, [invalidAccess, call.callId]);
  if (invalidAccess) return null;
  return <CallPanelInner call={call} />;
}

function CallPanelInner({ call }: { call: ActiveCall }) {
  const { hangup } = useCallActions();
  const [minimized, setMinimized] = useState(false);
  const { status, participants, micEnabled, toggleMic, leave } = useLunionRoom({
    sfuUrl: call.access.url,
    room: call.access.room,
    name: call.myName,
    token: call.access.token,
    video: false,
    audio: true,
  });

  const connected = call.phase === "connected";

  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!connected) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [connected]);

  // Tonalité de retour d'appel pour l'appelant tant que ça sonne (non décroché).
  useEffect(() => {
    if (call.direction === "outgoing" && call.phase === "calling") {
      ringbackTone.start();
    } else {
      ringbackTone.stop();
    }
    return () => ringbackTone.stop();
  }, [call.direction, call.phase]);

  // Débounce : on ne peut cliquer « raccrocher » qu'une fois.
  const [ending, setEnding] = useState(false);
  const onHangup = () => {
    if (ending) return;
    setEnding(true);
    ringbackTone.stop();
    leave();
    hangup();
  };

  // Appelant : pas de réponse après 60 s → raccrochage automatique.
  const hangupRef = useRef(onHangup);
  hangupRef.current = onHangup;
  useEffect(() => {
    if (!(call.direction === "outgoing" && call.phase === "calling")) return;
    const t = setTimeout(() => {
      toast("Pas de réponse", { icon: "📞" });
      hangupRef.current();
    }, 60_000);
    return () => clearTimeout(t);
  }, [call.direction, call.phase]);

  // Filet de convergence : on interroge le statut serveur (3 s pendant la
  // sonnerie, 8 s en communication). Si un événement socket s'est perdu
  // (décroché, terminé), l'UI se met quand même à jour — et la tonalité s'arrête.
  useEffect(() => {
    const store = useCallStore.getState;
    const intervalMs = connected ? 8_000 : 3_000;
    const t = setInterval(async () => {
      try {
        const s = await callsApi.getStatus(call.callId);
        if (s.status === CallStatus.ONGOING && store().active?.phase === "calling") {
          ringbackTone.stop();
          store().patchActive({
            phase: "connected",
            peerLabel: s.answered_by?.fullname ?? call.peerLabel,
          });
        } else if (
          s.status === CallStatus.ENDED ||
          s.status === CallStatus.MISSED ||
          s.status === CallStatus.CANCELLED ||
          s.status === CallStatus.FAILED
        ) {
          ringbackTone.stop();
          store().endIfMatches(call.callId);
        }
      } catch {
        /* réseau — le prochain tick réessaie */
      }
    }, intervalMs);
    return () => clearInterval(t);
  }, [call.callId, call.peerLabel, connected]);

  const statusLabel = connected
    ? formatCallTime(seconds)
    : call.direction === "outgoing"
      ? "Appel en cours…"
      : "Connexion…";

  const audioTags = participants.map((p) => (
    <audio
      key={p.id}
      autoPlay
      ref={(el) => {
        if (el) el.srcObject = p.stream;
      }}
    />
  ));

  // ── Mode réduit : pilule compacte (l'appel continue, le hook reste monté) ──
  if (minimized) {
    return (
      <div className="fixed bottom-3 inset-x-3 sm:inset-x-auto sm:bottom-6 sm:right-6 z-[190] animate-[cn-panel-in_.25s_ease-out]">
        <style>{KEYFRAMES}</style>
        {audioTags}
        <div className="mx-auto flex w-fit max-w-full items-center gap-3 rounded-full bg-slate-900 text-white pl-4 pr-2 py-2 shadow-2xl border border-white/10">
          <span className={`h-2 w-2 rounded-full ${connected ? "bg-green-400" : "bg-amber-400 animate-pulse"}`} />
          <span className="text-sm font-medium truncate max-w-36">{call.peerLabel}</span>
          <span className="text-xs text-slate-400 tabular-nums">{statusLabel}</span>
          <button
            type="button"
            onClick={() => setMinimized(false)}
            aria-label="Agrandir l'appel"
            className="flex h-10 w-10 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onHangup}
            disabled={ending}
            aria-label="Raccrocher"
            className="flex h-10 w-10 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-red-500 hover:bg-red-600 disabled:opacity-50"
          >
            <PhoneOff className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // ── Carte complète ──
  return (
    <div className="fixed bottom-0 inset-x-0 sm:inset-x-auto sm:bottom-6 sm:right-6 z-[190] sm:w-80 animate-[cn-panel-in_.3s_cubic-bezier(.16,1,.3,1)]">
      <style>{KEYFRAMES}</style>
      {audioTags}
      <div className="rounded-t-3xl sm:rounded-3xl bg-slate-900 text-white shadow-2xl border border-white/10 p-5 pb-7 sm:pb-5">
        {/* Header : statut + réduire */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className={`h-2 w-2 rounded-full ${connected ? "bg-green-400" : "bg-amber-400 animate-pulse"}`} />
            {connected ? "En communication" : "Sonnerie…"}
            {status !== "connected" && connected && (
              <span className="text-slate-500">· {roomStatusLabel(status)}</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setMinimized(true)}
            aria-label="Réduire l'appel"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
          >
            <Minus className="h-4 w-4" />
          </button>
        </div>

        {/* Interlocuteur */}
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            {!connected && <span className="absolute inset-0 animate-ping rounded-full bg-[#F17922]/25" />}
            <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#F17922] to-[#d95f0e] text-lg font-bold">
              {getInitials(call.peerLabel)}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold truncate">{call.peerLabel}</div>
            <div className="text-sm text-slate-400 tabular-nums">{statusLabel}</div>
          </div>
          {/* Égaliseur (actif en communication) */}
          <div className="flex h-6 items-end gap-[3px]" aria-hidden>
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className={`w-1 rounded-full ${connected ? "bg-emerald-400/90 animate-[cn-eq_1s_ease-in-out_infinite]" : "bg-slate-700"}`}
                style={connected ? { animationDelay: `${i * 130}ms` } : { height: "30%" }}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={toggleMic}
            aria-label={micEnabled ? "Couper le micro" : "Activer le micro"}
            className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
              micEnabled ? "bg-white/10 hover:bg-white/20" : "bg-red-500/90 hover:bg-red-500"
            }`}
          >
            {micEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </button>
          <button
            type="button"
            onClick={onHangup}
            disabled={ending}
            aria-label="Raccrocher"
            className="flex h-12 w-14 items-center justify-center rounded-full bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30 disabled:opacity-50 active:scale-95 transition-transform"
          >
            <PhoneOff className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
