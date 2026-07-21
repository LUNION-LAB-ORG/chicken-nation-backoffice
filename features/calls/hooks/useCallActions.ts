"use client";

import { toast } from "react-hot-toast";
import { callsApi } from "../apis/calls.api";
import { useCallStore } from "../stores/callStore";
import { incomingRing } from "../utils/ringtone";
import {
  closeCallNotification,
  requestNotificationPermission,
  stopTitleFlash,
} from "../utils/notifications";
import { useInvalidateCallsQuery } from "../queries/index.query";
import { useAuthStore } from "../../users/hook/authStore";

/** Actions sur un appel entrant/en cours : décrocher, refuser, raccrocher. */
export function useCallActions() {
  const setActive = useCallStore((s) => s.setActive);
  const setIncoming = useCallStore((s) => s.setIncoming);
  const user = useAuthStore((s) => s.user);
  const invalidate = useInvalidateCallsQuery();

  const stopAlerts = () => {
    incomingRing.stop();
    closeCallNotification();
    stopTitleFlash();
  };

  const accept = async () => {
    const inc = useCallStore.getState().incoming;
    if (!inc) return;
    stopAlerts();
    // Geste utilisateur → bon moment pour demander la permission notifications.
    void requestNotificationPermission();
    try {
      const res = await callsApi.answer(inc.callId);
      if (res.taken || !res.access) {
        toast("Appel déjà pris par un collègue");
        setIncoming(null);
        return;
      }
      setActive({
        callId: inc.callId,
        access: res.access,
        direction: "incoming",
        phase: "connected",
        peerLabel: inc.callerName,
        myName: user?.fullname ?? "Moi",
      });
      setIncoming(null);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Impossible de décrocher");
      setIncoming(null);
    } finally {
      invalidate();
    }
  };

  const reject = async () => {
    const inc = useCallStore.getState().incoming;
    if (!inc) return;
    stopAlerts();
    setIncoming(null);
    try {
      await callsApi.reject(inc.callId);
    } catch {
      /* non bloquant */
    } finally {
      invalidate();
    }
  };

  const hangup = async () => {
    const act = useCallStore.getState().active;
    if (!act) return;
    setActive(null);
    stopAlerts();
    try {
      await callsApi.hangup(act.callId);
    } catch {
      /* non bloquant */
    } finally {
      invalidate();
    }
  };

  return { accept, reject, hangup };
}
