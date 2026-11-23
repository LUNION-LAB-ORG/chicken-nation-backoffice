import { SupplementItem } from "./order-form.types";
import { OrderType } from "./order.types";

/**
 * Habitudes d'un client à la prise de commande
 * (`GET /orders/habitudes/client/:customerId`).
 */

/** Plat commandé au moins deux fois, encore au menu pour ce client. */
export interface PlatHabituel {
  dish_id: string;
  nom: string;
  image: string | null;
  /** Nombre de commandes où le plat figure, sur ses 30 dernières. */
  fois: number;
  derniere_le: string;
  /** Sa dernière façon de le commander. */
  epice: boolean;
  supplements: SupplementItem[];
  option_item_ids: string[];
}

export interface LigneDerniereCommande {
  dish_id: string;
  nom: string;
  quantity: number;
  epice: boolean;
  supplements: SupplementItem[];
  option_item_ids: string[];
  /** Faux : le plat n'est plus au menu pour ce client. */
  disponible: boolean;
}

export interface DerniereCommande {
  id: string;
  reference: string;
  le: string;
  type: OrderType;
  montant: number;
  restaurant: { id: string; name: string } | null;
  lignes: LigneDerniereCommande[];
}

export interface HabitudesClient {
  commandes: number;
  plats: PlatHabituel[];
  derniere: DerniereCommande | null;
}

/** Configuration de départ d'un plat choisi dans les habitudes. */
export interface DepartPlat {
  epice: boolean;
  supplements: SupplementItem[];
  option_item_ids: string[];
}
