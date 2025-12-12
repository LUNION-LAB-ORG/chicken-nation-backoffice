import { EntityStatus } from "../../../types";
import { Dish } from "./dish.types";

export interface Category {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  dishes?: Dish[];
  // promotion_targeted_categories?: PromotionTargetedCategory[];
  entity_status: EntityStatus;
  created_at: Date | string;
  updated_at: Date | string;
}