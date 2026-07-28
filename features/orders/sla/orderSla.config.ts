import { OrderTable, OrderTableStatus } from "../types/ordersTable.types";

export interface OrderTimer {
  orderId: string;
  status: OrderTableStatus;
  elapsedSeconds: number;
  allowedSeconds: number;
  isOverdue: boolean;
}

const DEFAULT_PREPARATION_TIME = 20; // minutes

/**
 * Temps de préparation alloué à une commande, en minutes.
 *
 * Règle : on prend le plat le PLUS LONG de la commande, pas la somme — une
 * cuisine prépare les plats en parallèle, une commande de 3 plats de 10 min
 * n'immobilise pas 30 minutes.
 *
 * Sources, par ordre de priorité :
 *   1. le temps paramétré sur les plats de la commande (fiche menu) ;
 *   2. `estimated_preparation_time` saisi manuellement sur la commande ;
 *   3. la valeur par défaut (20 min).
 */
export const resolvePreparationMinutes = (order: OrderTable): number => {
  const parPlat = (order.items ?? [])
    .map((i) => Number(i.cookingTime))
    .filter((n) => Number.isFinite(n) && n > 0);

  if (parPlat.length > 0) return Math.max(...parPlat);

  const saisi = Number(order.estimatedPreparationTime);
  if (Number.isFinite(saisi) && saisi > 0) return saisi;

  return DEFAULT_PREPARATION_TIME;
};

export type SlaRule = {
  next: OrderTableStatus;
  delayMinutes: number | ((order: OrderTable) => number);
  reason?: string;
  lateReason?: string;
};

export const ORDER_SLA: Partial<Record<OrderTableStatus, SlaRule>> = {
  "NOUVELLE": {
    next: "EN PRÉPARATION",
    delayMinutes: 10,
    reason: "En attente de prise en charge par le restaurant",
    lateReason: "Le restaurant n'a pas pris en charge la commande à temps",
  },

  "EN PRÉPARATION": {
    next: "PRÊT",
    delayMinutes: (order) => resolvePreparationMinutes(order),
    reason: "Commande en cours de préparation",
    lateReason: "La préparation de la commande a pris trop de temps",
  },

  "PRÊT": {
    // À livrer  → étape suivante = EN LIVRAISON (livreur a pris)
    // À récupérer/À table → étape suivante = RÉCUPÉRÉE (client a récupéré)
    next: "EN LIVRAISON",
    delayMinutes: (order) =>
      order.orderType === "À livrer" ? 15 : 60,
    reason: "Commande prête, en attente de livraison ou de retrait",
    lateReason: "La commande est prête mais n'a pas été récupérée à temps",
  },

  "EN LIVRAISON": {
    next: "RÉCUPÉRÉE",
    delayMinutes: 45,
    reason: "Commande en cours de livraison",
    lateReason: "La livraison de la commande prend trop de temps",
  },

  "RÉCUPÉRÉE": {
    next: "TERMINÉE",
    delayMinutes: 60,
    reason: "Commande récupérée par le client, en attente de clôture (paiement)",
    lateReason: "La commande récupérée n'a pas été clôturée à temps",
  },
};
