import { Supplement } from "./supplement.types";

/**
 * MENUS COMPOSABLES.
 *
 * Un plat composable pose des questions au client avant d'entrer au panier :
 * « quelle sauce ? », « quel format ? ». Chaque question est un GROUPE, chaque
 * réponse possible un CHOIX qui porte SON prix pour CE plat.
 *
 * Le prix vit sur le choix et non sur le catalogue de suppléments, parce qu'un
 * même ajout ne vaut pas la même chose selon le plat : le format « Menu » ne se
 * facture pas pareil sur un burger et sur un poulet pané.
 */

export interface DishOptionItem {
  id: string;
  group_id: string;
  label: string;
  /** Supplément facturé pour ce plat. 0 signifie choix inclus. */
  price_delta: number;
  /** Rattachement facultatif au catalogue, pour la cuisine et les tickets. */
  supplement_id: string | null;
  supplement?: Pick<Supplement, "id" | "name" | "price"> | null;
  is_default: boolean;
  available: boolean;
  position: number;
}

export interface DishOptionGroup {
  id: string;
  dish_id: string;
  name: string;
  description: string | null;
  /** Le client doit répondre pour pouvoir commander. */
  required: boolean;
  min_select: number;
  max_select: number;
  position: number;
  items: DishOptionItem[];
}

export interface DishOptionConfiguration {
  dish_id: string;
  /** Vrai dès qu'au moins un groupe existe. Posé par le serveur. */
  composable: boolean;
  groups: DishOptionGroup[];
}

/**
 * Forme envoyée au serveur. Les identifiants déjà connus sont transmis pour
 * être conservés : sans eux, chaque enregistrement recréerait des lignes
 * neuves et briserait plus tard la trace de ce qui a été vendu.
 */
export interface DishOptionItemPayload {
  id?: string;
  label: string;
  price_delta?: number;
  supplement_id?: string | null;
  is_default?: boolean;
  available?: boolean;
}

export interface DishOptionGroupPayload {
  id?: string;
  name: string;
  description?: string | null;
  required?: boolean;
  min_select?: number;
  max_select?: number;
  items: DishOptionItemPayload[];
}
