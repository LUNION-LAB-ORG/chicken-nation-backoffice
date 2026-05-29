"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useSocket } from "../../websocket/hooks/useSocket";
import type { IDelivererLive } from "../../livreurs/types/deliverer-live.type";
import { DELIVERER_LOCATION_LIVE_EVENT } from "../constantes/maps-events.constante";
import type { IDelivererLivePosition } from "../types/maps.type";

/**
 * Synchronise EN TEMPS RÉEL les positions GPS des livreurs dans le cache
 * TanStack Query de la Carte Live (`['deliverers','live-locations']`).
 *
 * À chaque event `deliverer:location:live`, on PATCHE en place la position du
 * livreur concerné (sans refetch) → les markers glissent au lieu de sauter
 * toutes les 15 s. Le polling REST reste actif en arrière-plan, mais comme
 * simple réconciliation (nouveaux livreurs / changement de disponibilité) :
 * le mouvement, lui, vient du socket.
 *
 * On ne touche QUE les champs de position — `availability`, `active_course`,
 * `queue_rank`… restent ceux du dernier fetch REST (le socket ne les porte pas).
 *
 * À appeler UNE fois dans le composant racine de la Carte Live.
 */
export function useDelivererLiveSync(): void {
  const socket = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket) return;

    const handler = (payload: IDelivererLivePosition) => {
      queryClient.setQueriesData<IDelivererLive[]>(
        { queryKey: ["deliverers", "live-locations"] },
        (old) => {
          if (!old) return old;
          let changed = false;
          const next = old.map((d) => {
            if (d.id !== payload.delivererId) return d;
            changed = true;
            return {
              ...d,
              location: { lat: payload.lat, lng: payload.lng },
              location_at: payload.ts,
              location_fresh: true,
              heading_deg: payload.heading,
              speed_kmh: payload.speedKmh,
            };
          });
          // Si le livreur n'est pas (encore) dans la liste, on ne fait rien :
          // le prochain refetch de réconciliation l'ajoutera.
          return changed ? next : old;
        },
      );
    };

    socket.on(DELIVERER_LOCATION_LIVE_EVENT, handler);
    return () => {
      socket.off(DELIVERER_LOCATION_LIVE_EVENT, handler);
    };
  }, [socket, queryClient]);
}

/**
 * Position GPS live d'UN livreur précis (détail de course, drawer commande).
 *
 * S'abonne au même canal `deliverer:location:live` mais ne retient que les pings
 * du `delivererId` ciblé. Retourne la dernière position connue (ou `null` tant
 * qu'aucun ping n'est arrivé) — le marker animé se charge ensuite du glissement.
 *
 * `delivererId === null` → pas d'abonnement (course non encore affectée).
 */
export function useDelivererLivePosition(
  delivererId: string | null | undefined,
): IDelivererLivePosition | null {
  const socket = useSocket();
  const [position, setPosition] = useState<IDelivererLivePosition | null>(null);

  // Reset si on change de livreur ciblé (navigation entre courses).
  useEffect(() => {
    setPosition(null);
  }, [delivererId]);

  useEffect(() => {
    if (!socket || !delivererId) return;

    const handler = (payload: IDelivererLivePosition) => {
      if (payload.delivererId === delivererId) setPosition(payload);
    };

    socket.on(DELIVERER_LOCATION_LIVE_EVENT, handler);
    return () => {
      socket.off(DELIVERER_LOCATION_LIVE_EVENT, handler);
    };
  }, [socket, delivererId]);

  return position;
}
