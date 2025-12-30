import { OrderTable, OrderTableStatus } from "../types/ordersTable.types";

export interface OrderTimer {
  orderId: string;
  status: OrderTableStatus;
  elapsedSeconds: number;
  allowedSeconds: number;
  isOverdue: boolean;
}

const DEFAULT_PREPARATION_TIME = 20; // minutes

export type SlaRule = {
  next: OrderTableStatus;
  delayMinutes: number | ((order: OrderTable) => number);
  reason?: string;
  lateReason?: string;
};

export const ORDER_SLA: Partial<Record<OrderTableStatus, SlaRule>> = {
  "NOUVELLE": {
    next: "EN COURS",
    delayMinutes: 10,
    reason: "En attente de prise en charge par le restaurant",
    lateReason: "Le restaurant n'a pas pris en charge la commande à temps",
  },

  "EN COURS": {
    next: "EN PRÉPARATION",
    delayMinutes: 15,
    reason: "Commande en cours de validation par le restaurant",
    lateReason: "La validation de la commande a pris trop de temps",
  },

  "EN PRÉPARATION": {
    next: "PRÊT",
    delayMinutes: (order) =>
      Number(order.estimatedPreparationTime) || DEFAULT_PREPARATION_TIME,
    reason: "Commande en cours de préparation",
    lateReason: "La préparation de la commande a pris trop de temps",
  },

  "PRÊT": {
    next: "LIVRAISON",
    delayMinutes: (order) =>
      order.orderType === "À livrer" ? 5 : 60,
    reason: "Commande prête, en attente de livraison ou de retrait",
    lateReason: "La commande est prête mais n'a pas été récupérée à temps",
  },

  "LIVRAISON": {
    next: "COLLECTÉ",
    delayMinutes: 30,
    reason: "Commande en cours de livraison",
    lateReason: "La livraison de la commande prend trop de temps",
  },

  "COLLECTÉ": {
    next: "TERMINÉ",
    delayMinutes: 10,
    reason: "Commande collectée, en attente de clôture",
    lateReason: "La commande collectée n’a pas été clôturée à temps",
  },
};

