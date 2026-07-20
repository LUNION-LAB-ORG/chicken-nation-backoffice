"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { callsApi } from "../apis/calls.api";
import { useCallStore } from "../stores/callStore";
import { useAuthStore } from "../../users/hook/authStore";
import type { CallTargetKind } from "../types/call.type";

/** Démarre un appel sortant et bascule le store en `active` (phase "calling"). */
export function useOutgoingCall() {
  const [starting, setStarting] = useState(false);
  const setActive = useCallStore((s) => s.setActive);
  const user = useAuthStore((s) => s.user);

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
