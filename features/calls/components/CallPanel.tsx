"use client";

import { useEffect, useState } from "react";
import { useLunionRoom } from "@lunionlab/meet-react";
import { Mic, MicOff, Phone, PhoneOff } from "lucide-react";
import type { ActiveCall } from "../stores/callStore";
import { useCallActions } from "../hooks/useCallActions";
import { formatCallTime, roomStatusLabel } from "../utils/call-format";

/**
 * Panneau d'appel audio flottant. Monté uniquement quand un appel est actif.
 * Audio SEULEMENT : `video: false` (aucune caméra publiée), le flux distant est
 * joué dans des <audio> invisibles.
 */
export default function CallPanel({ call }: { call: ActiveCall }) {
  const { hangup } = useCallActions();
  const { status, participants, micEnabled, toggleMic, leave } = useLunionRoom({
    sfuUrl: call.access.url,
    room: call.access.room,
    name: call.myName,
    token: call.access.token,
    video: false,
    audio: true,
  });

  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (call.phase !== "connected") return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [call.phase]);

  const onHangup = () => {
    leave();
    hangup();
  };

  const timeLabel =
    call.phase === "calling"
      ? call.direction === "outgoing"
        ? "Appel en cours…"
        : "Connexion…"
      : formatCallTime(seconds);

  return (
    <div className="fixed bottom-6 right-6 z-[60] w-72 rounded-2xl bg-white shadow-2xl border border-slate-100 p-5">
      {participants.map((p) => (
        <audio
          key={p.id}
          autoPlay
          ref={(el) => {
            if (el) el.srcObject = p.stream;
          }}
        />
      ))}

      <div className="flex flex-col items-center gap-2 text-center">
        <div className="h-16 w-16 rounded-full bg-[#F17922]/10 flex items-center justify-center">
          <Phone className="h-7 w-7 text-[#F17922]" />
        </div>
        <div className="font-semibold text-slate-800 truncate max-w-full">{call.peerLabel}</div>
        <div className="text-sm text-slate-500">{timeLabel}</div>
        {status !== "connected" && (
          <div className="text-xs text-slate-400">{roomStatusLabel(status)}</div>
        )}

        <div className="flex items-center gap-4 mt-3">
          <button
            type="button"
            onClick={toggleMic}
            aria-label={micEnabled ? "Couper le micro" : "Activer le micro"}
            className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors ${
              micEnabled ? "bg-slate-100 text-slate-700" : "bg-red-100 text-red-600"
            }`}
          >
            {micEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </button>
          <button
            type="button"
            onClick={onHangup}
            aria-label="Raccrocher"
            className="h-12 w-12 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center"
          >
            <PhoneOff className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
