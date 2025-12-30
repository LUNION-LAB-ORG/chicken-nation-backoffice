import { OrderStatus } from "../types/order.types";

export const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.ACCEPTED,
  OrderStatus.IN_PROGRESS,
  OrderStatus.READY,
  OrderStatus.PICKED_UP, // LIVRAISON
  OrderStatus.COLLECTED, // CLIENT A RECUPERE
];
