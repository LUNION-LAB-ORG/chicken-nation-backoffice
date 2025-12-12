import { DishSupplement } from "./dish.types";

export type SupplementCategory = 'FOOD' | 'DRINK' | 'ACCESSORY';

export interface Supplement {
  id: string;
  name: string;
  price: number;
  image: string | null;
  available: boolean;
  category: SupplementCategory;
  // Relations
  dish_supplements?: DishSupplement[];
}