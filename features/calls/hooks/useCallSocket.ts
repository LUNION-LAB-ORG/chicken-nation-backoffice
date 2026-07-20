"use client";

import { useEffect } from "react";
import { useSocketStore } from "../../websocket/stores/socketStore";
import { useCallStore } from "../stores/callStore";
import { incomingRing, ringbackTone } from "../utils/ringtone";
import type {
  ICallAcceptedEvent,
  ICallCancelledEvent,
  ICallEndedEvent,
  ICallTakenEvent,
  IIncomingCallEvent,
} from "../types/call.type";

/**
 * Écoute les événements d'appel sur le socket global (namespace /app) et pilote
 * le `callStore`. Monté une seule fois (dans CallOverlay, au niveau du layout).
 */
export function useCallSocket() {
  const socket = useSocketStore((s) => s.socket);
  const connect = useSocketStore((s) => s.connect);

  // Garantit que le socket partagé (/app) est établi, même si aucun autre
  // module ne l'a encore connecté sur cette page (idempotent, guardé côté store).
  useEffect(() => {
    connect();
  }, [connect]);

  useEffect(() => {
    if (!socket) return;
    const store = useCallStore.getState;

    const onIncoming = (e: IIncomingCallEvent) => {
      // Ne pas écraser un appel déjà en cours / une sonnerie déjà affichée.
      if (store().active || store().incoming) return;
      store().setIncoming(e);
      incomingRing.start();
    };
    const onAccepted = (e: ICallAcceptedEvent) => {
      if (store().active?.callId === e.callId) {
        store().patchActive({ phase: "connected", peerLabel: e.answeredByName });
        ringbackTone.stop(); // l'appelant : la tonalité d'attente s'arrête
      }
    };
    const onTaken = (e: ICallTakenEvent) => {
      store().clearIncomingIf(e.callId);
      incomingRing.stop();
    };
    const onCancelled = (e: ICallCancelledEvent) => {
      store().clearIncomingIf(e.callId);
      incomingRing.stop();
    };
    const onEnded = (e: ICallEndedEvent) => {
      store().endIfMatches(e.callId);
      store().clearIncomingIf(e.callId);
      incomingRing.stop();
      ringbackTone.stop();
    };

    socket.on("call:incoming", onIncoming);
    socket.on("call:accepted", onAccepted);
    socket.on("call:taken", onTaken);
    socket.on("call:cancelled", onCancelled);
    socket.on("call:ended", onEnded);

    return () => {
      socket.off("call:incoming", onIncoming);
      socket.off("call:accepted", onAccepted);
      socket.off("call:taken", onTaken);
      socket.off("call:cancelled", onCancelled);
      socket.off("call:ended", onEnded);
    };
  }, [socket]);
}
