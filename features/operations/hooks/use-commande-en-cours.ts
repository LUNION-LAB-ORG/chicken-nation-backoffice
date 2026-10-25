"use client";

import { useEffect, useReducer } from "react";
import { useQueryClient } from "@tanstack/react-query";

import type { Order } from "../../orders/types/order.types";
import { operationsKeyQuery } from "../queries/index.query";

/** Relit le composant à chaque mise à jour du cache (liste des Opérations relue). */
function useRelectureDuCache() {
  const queryClient = useQueryClient();
  const [, relire] = useReducer((n: number) => n + 1, 0);
  useEffect(() => queryClient.getQueryCache().subscribe(relire), [queryClient]);
  return queryClient;
}

/**
 * La commande telle que la liste des Opérations la connaît (course complète :
 * code, livreur, retenue, ajouts), relue à chaque mise à jour de la liste.
 * Le tiroir lit le détail de la commande (`GET /orders/:id`), dont la course
 * n'a ni code ni champs du planificateur : il prend ceux de la liste.
 */
export function useCommandeEnCours(orderId: string | null | undefined): Order | null {
  const queryClient = useRelectureDuCache();

  if (!orderId) return null;
  for (const [, data] of queryClient.getQueriesData<Order[]>({ queryKey: operationsKeyQuery("active") })) {
    const trouvee = Array.isArray(data) ? data.find((o) => o?.id === orderId) : undefined;
    if (trouvee) return trouvee;
  }
  return null;
}

/**
 * Commandes de la liste des Opérations qui sont dans la course `courseId` :
 * lignes de la fenêtre « Récupération · code » ouverte depuis le tiroir,
 * avant la lecture de la course.
 */
export function useCommandesDeLaCourse(courseId: string | null | undefined): Order[] {
  const queryClient = useRelectureDuCache();

  if (!courseId) return [];
  const vues = new Map<string, Order>();
  for (const [, data] of queryClient.getQueriesData<Order[]>({ queryKey: operationsKeyQuery("active") })) {
    if (!Array.isArray(data)) continue;
    for (const o of data) {
      const course = (o as unknown as { delivery?: { course?: { id?: string } | null } | null })?.delivery?.course;
      if (o?.id && course?.id === courseId && !vues.has(o.id)) vues.set(o.id, o);
    }
  }
  return [...vues.values()];
}
