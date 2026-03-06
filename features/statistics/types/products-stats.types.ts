// =========================================
// TYPES - Statistiques Produits & Catégories
// Alignés sur les réponses du backend
// =========================================

export interface ProductsStatsQueryParams {
  restaurantId?: string;
  startDate?: string;
  endDate?: string;
  period?: 'today' | 'week' | 'month' | 'lastMonth' | 'year';
  categoryId?: string;
  limit?: number;
}

export interface ProductsComparisonQueryParams {
  restaurantId?: string;
  period1Start: string;
  period1End: string;
  period2Start: string;
  period2End: string;
  limit?: number;
}

// ----- Top Produits -----
export interface TopProductItem {
  id: string;
  name: string;
  image: string;
  categoryName: string;
  totalSold: number;
  revenue: number;
  percentage: number;
  previousPeriodSold?: number;
  evolution?: string;
}

export interface TopProductsResponse {
  items: TopProductItem[];
  totalSold: number;
  uniqueDishesCount: number;
}

// ----- Top Catégories -----
export interface TopCategoryItem {
  id: string;
  name: string;
  image: string;
  totalSold: number;
  revenue: number;
  percentage: number;
  dishCount: number;
}

export interface TopCategoriesResponse {
  items: TopCategoryItem[];
  totalSold: number;
}

// ----- Comparaison Produits -----
export interface ProductComparisonItem {
  id: string;
  name: string;
  image: string;
  categoryName: string;
  period1Sold: number;
  period2Sold: number;
  evolution: string;
  evolutionValue: number;
}

export interface ProductComparisonResponse {
  items: ProductComparisonItem[];
  period1Label: string;
  period2Label: string;
}

// ----- Par Restaurant -----
export interface ProductByRestaurantItem {
  restaurantId: string;
  restaurantName: string;
  totalSold: number;
  revenue: number;
  percentage: number;
}

export interface ProductsByRestaurantResponse {
  dishId: string;
  dishName: string;
  byRestaurant: ProductByRestaurantItem[];
}

// ----- Par Zone -----
export interface ProductByZoneItem {
  zone: string;
  orderCount: number;
  percentage: number;
}

export interface TopProductByZoneItem {
  dishId: string;
  dishName: string;
  image: string;
  totalSold: number;
  zones: ProductByZoneItem[];
}

export interface ProductsByZoneResponse {
  items: TopProductByZoneItem[];
}
