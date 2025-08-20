export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  totalValue: number;
  description?: string;
  available?: boolean;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  productCount: number;
}

export type InventoryView = 'list' | 'create' | 'edit' | 'category';
