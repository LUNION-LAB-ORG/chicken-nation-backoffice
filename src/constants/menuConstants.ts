 
export const MAX_SUPPLEMENTS_PER_TYPE = 3;

export enum SUPPLEMENT_TYPE {
  ACCESSORY = 'ACCESSORY', 
  FOOD = 'FOOD',           
  DRINK = 'DRINK'          
}

export const SUPPLEMENT_TYPE_LABELS = {
  [SUPPLEMENT_TYPE.ACCESSORY]: 'Ingrédients',
  [SUPPLEMENT_TYPE.FOOD]: 'Accompagnements',
  [SUPPLEMENT_TYPE.DRINK]: 'Boissons'
};

// Endpoints API
export const API_ENDPOINTS = {
  DISHES: '/api/v1/dishes',
  DISH_RESTAURANTS: '/api/v1/dish-restaurants',
  DISH_SUPPLEMENTS: '/api/v1/dish-supplements',
  MENU_CATEGORIES: '/api/v1/menu-categories'
};
