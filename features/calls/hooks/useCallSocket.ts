"use client";

import { useEffect } from "react";
import { toast } from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useSocketStore } from "../../websocket/stores/socketStore";
import { useAuthStore } from "../../users/hook/authStore";
import { useCallStore } from "../stores/callStore";
import { callsApi } from "../apis/calls.api";
import { incomingRing, ringbackTone } from "../utils/ringtone";
import {
  closeCallNotification,
  showCallNotification,
  startTitleFlash,
  stopTitleFlash,
} from "../utils/notifications";
import type {
  ICallAcceptedEvent,
  ICallCancelledEvent,
  ICallEndedEvent,
  ICallRejectedEvent,
  ICallTakenEvent,
  IIncomingCallEvent,
} from "../types/call.type";

const stopAlerts = () => {
  incomingRing.stop();
  closeCallNotification();
  stopTitleFlash();
};

/**
 * Écoute les événements d'appel sur le socket global (namespace /app) et pilote
 * le `callStore`. Monté une seule fois (dans CallOverlay, au niveau du layout).
 * Alerte aussi hors-onglet : notification système + flash du titre. À la
 * (re)connexion du socket, resynchronise les appels qui sonnent encore.
 */
export function useCallSocket() {
  const socket = useSocketStore((s) => s.socket);
  const connect = useSocketStore((s) => s.connect);
  const queryClient = useQueryClient();

  // Garantit que le socket partagé (/app) est établi, même si aucun autre
  // module ne l'a encore connecté sur cette page (idempotent, guardé côté store).
  useEffect(() => {
    connect();
  }, [connect]);

  // Retour sur l'onglet : on coupe les alertes "hors-onglet" (la modale suffit).
  useEffect(() => {
    const onVisible = () => {
      if (!document.hidden) {
        stopTitleFlash();
        closeCallNotification();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  // Démontage de l'overlay (logout, sortie de /gestion) : plus de sonnerie fantôme.
  useEffect(() => () => stopAlerts(), []);

  useEffect(() => {
    if (!socket) return;
    const store = useCallStore.getState;
    const refreshHistory = () =>
      queryClient.invalidateQueries({ queryKey: ["calls"] });

    // Timeout de sonnerie côté récepteur : après 45 s sans réponse, l'appel
    // disparaît (refus silencieux serveur → bascule en manqué si dernier).
    let ringTimeout: ReturnType<typeof setTimeout> | null = null;
    const clearRingTimeout = () => {
      if (ringTimeout) {
        clearTimeout(ringTimeout);
        ringTimeout = null;
      }
    };

    const presentIncoming = (e: IIncomingCallEvent) => {
      // Occupé (déjà en appel ou déjà en train de sonner) : refus automatique
      // silencieux — l'appelant ne sonne pas dans le vide sur un poste occupé.
      if (store().active || store().incoming) {
        if (store().incoming?.callId !== e.callId && store().active?.callId !== e.callId) {
          void callsApi.reject(e.callId).catch(() => {});
        }
        return;
      }
      store().setIncoming(e);
      incomingRing.start();
      clearRingTimeout();
      ringTimeout = setTimeout(() => {
        if (store().incoming?.callId === e.callId) {
          store().setIncoming(null);
          stopAlerts();
          void callsApi.reject(e.callId).catch(() => {});
          refreshHistory();
        }
      }, 45_000);
      if (document.hidden) {
        // Hors-onglet : notification système (sonore, au cas où l'audio de la
        // page serait bloqué) + titre clignotant. Cliquer = revenir à l'onglet.
        showCallNotification(
          `📞 ${e.callerName} vous appelle`,
          `Appel ${e.targetLabel} — cliquez pour répondre`,
          { silent: false },
        );
        startTitleFlash("📞 Appel entrant…");
      }
    };

    const onIncoming = (e: IIncomingCallEvent) => presentIncoming(e);

    const onAccepted = (e: ICallAcceptedEvent) => {
      if (store().active?.callId === e.callId) {
        store().patchActive({ phase: "connected", peerLabel: e.answeredByName });
        ringbackTone.stop(); // l'appelant : la tonalité d'attente s'arrête
      } else {
        // Décroché AVANT le retour HTTP de POST /calls : useOutgoingCall consommera.
        store().setEarlyAccepted({ callId: e.callId, byName: e.answeredByName });
      }
      refreshHistory();
    };
    const onRejected = (e: ICallRejectedEvent) => {
      if (store().active?.callId === e.callId) {
        toast(`${e.rejectedBy} n'est pas disponible`, { icon: "📵" });
      }
    };
    const onTaken = (e: ICallTakenEvent) => {
      store().clearIncomingIf(e.callId);
      stopAlerts();
      clearRingTimeout();
      refreshHistory();
    };
    const onCancelled = (e: ICallCancelledEvent) => {
      store().clearIncomingIf(e.callId);
      stopAlerts();
      clearRingTimeout();
      refreshHistory();
    };
    const onEnded = (e: ICallEndedEvent) => {
      store().endIfMatches(e.callId);
      store().clearIncomingIf(e.callId);
      stopAlerts();
      ringbackTone.stop();
      clearRingTimeout();
      refreshHistory();
    };

    // Resynchro : à la (re)connexion, rattrape un appel qui sonne encore pour
    // moi (émis pendant que le socket était coupé / avant le chargement).
    const onConnect = () => {
      void callsApi
        .ringing()
        .then((ringing) => {
          if (ringing.length > 0) presentIncoming(ringing[0]);
        })
        .catch(() => {});

      // Restauration : un rechargement de page perd l'état en mémoire alors
      // que l'appel est toujours EN COURS côté serveur → on le récupère avec
      // un jeton frais et le panneau réapparaît (la room est re-rejointe).
      if (!store().active) {
        void callsApi
          .active()
          .then((restored) => {
            if (restored && !store().active) {
              store().setActive({
                callId: restored.callId,
                access: restored.access,
                direction: restored.direction,
                phase: restored.phase,
                peerLabel: restored.peerLabel,
                myName: useAuthStore.getState().user?.fullname ?? "Moi",
              });
            }
          })
          .catch(() => {});
      }
    };
    if (socket.connected) onConnect();

    socket.on("connect", onConnect);
    socket.on("call:incoming", onIncoming);
    socket.on("call:accepted", onAccepted);
    socket.on("call:rejected", onRejected);
    socket.on("call:taken", onTaken);
    socket.on("call:cancelled", onCancelled);
    socket.on("call:ended", onEnded);

    return () => {
      clearRingTimeout();
      socket.off("connect", onConnect);
      socket.off("call:incoming", onIncoming);
      socket.off("call:accepted", onAccepted);
      socket.off("call:rejected", onRejected);
      socket.off("call:taken", onTaken);
      socket.off("call:cancelled", onCancelled);
      socket.off("call:ended", onEnded);
    };
  }, [socket, queryClient]);
}
