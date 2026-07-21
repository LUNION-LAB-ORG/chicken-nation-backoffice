"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { callsApi } from "../apis/calls.api";
import { useCallStore } from "../stores/callStore";
import { useAuthStore } from "../../users/hook/authStore";
import { requestNotificationPermission } from "../utils/notifications";
import { useInvalidateCallsQuery } from "../queries/index.query";
import type { CallTargetKind } from "../types/call.type";

/** Démarre un appel sortant et bascule le store en `active` (phase "calling"). */
export function useOutgoingCall() {
  const [starting, setStarting] = useState(false);
  const setActive = useCallStore((s) => s.setActive);
  const user = useAuthStore((s) => s.user);
  const invalidate = useInvalidateCallsQuery();

  const call = async (args: {
    targetKind?: CallTargetKind;
    restaurantId?: string;
    targetUserId?: string;
    targetLabel: string;
  }) => {
    if (starting) return;
    const { active, incoming } = useCallStore.getState();
    if (active || incoming) {
      toast.error("Un appel est déjà en cours");
      return;
    }
    setStarting(true);
    // Geste utilisateur → bon moment pour demander la permission notifications.
    void requestNotificationPermission();
    try {
      const res = await callsApi.start({
        targetKind: args.targetKind,
        restaurantId: args.restaurantId,
        targetUserId: args.targetUserId,
      });
      setActive({
        callId: res.call.id,
        access: res.access,
        direction: "outgoing",
        phase: "calling",
        peerLabel: res.targetLabel ?? args.targetLabel,
        myName: user?.fullname ?? "Moi",
      });
      // Le receveur a décroché pendant le retour HTTP ? On rattrape l'événement
      // `call:accepted` mis de côté — sinon l'UI resterait sur « Appel en cours… ».
      const early = useCallStore.getState().earlyAccepted;
      if (early?.callId === res.call.id) {
        useCallStore.getState().patchActive({ phase: "connected", peerLabel: early.byName });
        useCallStore.getState().setEarlyAccepted(null);
      }
      invalidate();
      if (res.online === 0) {
        toast("Personne n'est connecté pour l'instant — ça sonne quand même.", {
          icon: "📞",
        });
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Impossible de démarrer l'appel");
    } finally {
      setStarting(false);
    }
  };

  return { call, starting };
}
