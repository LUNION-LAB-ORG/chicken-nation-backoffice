"use client";

import { useEffect, useReducer } from "react";
import { useQueryClient } from "@tanstack/react-query";

import type { Order } from "../../orders/types/order.types";
import { operationsKeyQuery } from "../queries/index.query";

/**
 * La commande telle que la liste des Opérations la connaît (course complète :
 * code, livreur, retenue, ajouts), relue à chaque mise à jour de la liste.
 * Le tiroir lit le détail de la commande (`GET /orders/:id`), dont la course
 * n'a ni code ni champs du planificateur : il prend ceux de la liste.
 */
export function useCommandeEnCours(orderId: string | null | undefined): Order | null {
  const queryClient = useQueryClient();
  const [, relire] = useReducer((n: number) => n + 1, 0);

  useEffect(() => queryClient.getQueryCache().subscribe(relire), [queryClient]);

  if (!orderId) return null;
  for (const [, data] of queryClient.getQueriesData<Order[]>({ queryKey: operationsKeyQuery("active") })) {
    const trouvee = Array.isArray(data) ? data.find((o) => o?.id === orderId) : undefined;
    if (trouvee) return trouvee;
  }
  return null;
}

/**
 * Commandes d'une course telles que la liste des Opérations les connaît : la
 * fenêtre de récupération ouverte depuis le tiroir s'ouvre tout de suite avec
 * ces lignes, avant de relire la course.
 */
export function useCommandesDeCourse(courseId: string | null | undefined): Order[] {
  const queryClient = useQueryClient();
  const [, relire] = useReducer((n: number) => n + 1, 0);

  useEffect(() => queryClient.getQueryCache().subscribe(relire), [queryClient]);

  if (!courseId) return [];
  for (const [, data] of queryClient.getQueriesData<Order[]>({ queryKey: operationsKeyQuery("active") })) {
    if (!Array.isArray(data)) continue;
    const trouvees = data.filter(
      (o) => (o as unknown as { delivery?: { course?: { id?: string } | null } | null })?.delivery?.course?.id === courseId,
    );
    if (trouvees.length > 0) return trouvees;
  }
  return [];
}
