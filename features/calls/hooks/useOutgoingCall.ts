"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { callsApi } from "../apis/calls.api";
import { useCallStore } from "../stores/callStore";
import { useAuthStore } from "../../users/hook/authStore";
import { requestNotificationPermission } from "../utils/notifications";
import { useInvalidateCallsQuery } from "../queries/index.query";
import {
  detailDepuisServeur,
  LIVREUR,
  texteErreurAppelLivreur,
  texteSansConnexion,
} from "../utils/appel-livreur";
import type { IStartCallPayload } from "../types/call.type";

/** Démarre un appel sortant et bascule le store en `active` (phase "calling"). */
export function useOutgoingCall() {
  const [starting, setStarting] = useState(false);
  const setActive = useCallStore((s) => s.setActive);
  const user = useAuthStore((s) => s.user);
  const invalidate = useInvalidateCallsQuery();

  const call = async (
    args: IStartCallPayload & {
      targetLabel: string;
      /** Ligne sous le nom dans le panneau (un livreur : « Livreur · Angré »). */
      peerDetail?: string | null;
    },
  ) => {
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
        deliverer_id: args.deliverer_id,
      });
      const versLivreur = args.targetKind === LIVREUR;
      setActive({
        callId: res.call.id,
        access: res.access,
        direction: "outgoing",
        phase: "calling",
        peerLabel: res.targetLabel ?? args.targetLabel,
        // Un livreur : restaurant et course en cours lus par le serveur.
        peerDetail: detailDepuisServeur(res.livreur) ?? args.peerDetail ?? null,
        livreurId: versLivreur ? (res.livreur?.id ?? args.deliverer_id ?? null) : null,
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
        toast(texteSansConnexion(args.targetKind, res.targetLabel ?? args.targetLabel), {
          icon: "📞",
        });
      }
    } catch (error: unknown) {
      if (args.targetKind === LIVREUR) toast.error(texteErreurAppelLivreur(error));
      else toast.error(error instanceof Error ? error.message : "Impossible de démarrer l'appel");
    } finally {
      setStarting(false);
    }
  };

  return { call, starting };
}
