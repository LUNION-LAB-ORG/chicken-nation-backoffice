
// Exporter tous les services
export * from './api';
export * from './authService';
export * from './categoryService';
export * from './dashboardService';
export * from './dishRestaurantService';
export * from './dishService';
export * from './dishSupplementService';
export * from './menuService';
export * from './productService';
export * from './restaurantService';
export * from './supplementService';
export * from './userService';
// Export spécifique pour éviter les conflits de PaginatedResponse
export {
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  getCustomerReviews,
  getCustomerOrders,
  type Customer
} from './customerService';

// Re-export des interfaces pour faciliter l'importation
export type { Category, CreateCategoryDto, UpdateCategoryDto } from './categoryService';
export type { Product, CreateProductDto, UpdateProductDto } from './productService';
export type { AuthResponse, RefreshTokenResponse } from './authService';
export type { User, CreateUserDto, UpdateUserDto } from './userService';
