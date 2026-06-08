import { z } from 'zod';

// Validation des suppléments
export const SupplementItemSchema = z.object({
  id: z.string().min(1, 'ID du supplément requis'),
  name: z.string().min(1, 'Nom du supplément requis').max(100, 'Nom trop long'),
  price: z.string().min(1, 'Prix requis'), // Changé en string pour la cohérence
  image: z.string().optional(),
  quantity: z.number().min(0).optional(),
  category: z.enum(['ACCESSORY', 'FOOD', 'DRINK'], {
    errorMap: () => ({ message: 'Catégorie invalide' })
  }),
  isSelected: z.boolean().optional(),
  isAvailable: z.boolean().default(true)
});

export const SupplementTypeSchema = z.object({
  type: z.enum(['ACCESSORY', 'FOOD', 'DRINK']),
  items: z.array(SupplementItemSchema),
  isIncluded: z.boolean().optional(),
  required: z.boolean().optional()
});

// Validation des catégories
export const MenuCategorySchema = z.object({
  id: z.string().min(1, 'ID de catégorie requis'),
  name: z.string().min(1, 'Nom de catégorie requis').max(50, 'Nom trop long'),
  description: z.string().max(200, 'Description trop longue').optional(),
  image: z.string().optional()
});

// Validation des menus
export const MenuItemSchema = z.object({
  id: z.string().min(1, 'ID du menu requis'),
  name: z.string()
    .min(1, 'Nom du menu requis')
    .max(100, 'Nom trop long'),
  description: z.string()
    .max(200, 'Description trop longue'),
  restaurant: z.string(),
  restaurantId: z.string(),
  price: z.string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Format de prix invalide')
    .refine(val => parseFloat(val) > 0, 'Prix doit être positif'),
  categoryId: z.string(),
  category_id: z.string().optional(),
  category: z.union([MenuCategorySchema, z.string()]).optional(),
  isAvailable: z.boolean(),
  isNew: z.boolean().optional(),
  ingredients: z.array(z.string().max(50, 'Nom d\'ingrédient trop long')).optional(),
  image: z.string().min(1, 'Image requise'),
  imageUrl: z.string().optional(),
  rating: z.number().min(0).max(5).optional(),
  supplements: z.object({
    boissons: SupplementTypeSchema.optional(),
    sauces: SupplementTypeSchema.optional(),
    portions: SupplementTypeSchema.optional(),
    ACCESSORY: z.array(SupplementItemSchema).optional(),
    FOOD: z.array(SupplementItemSchema).optional(),
    DRINK: z.array(SupplementItemSchema).optional()
  }),
  reviews: z.array(z.string()),
  totalReviews: z.number().min(0),
  is_promotion: z.boolean(),
  promotion_price: z.union([z.number(), z.string()]).optional(),
  dish_supplements: z.array(z.any()).optional(),
  dish_restaurants: z.array(z.any()).optional(),
  // Modèle "tout par défaut − exclusions" : IDs explicitement retirés du plat.
  excluded_supplement_ids: z.array(z.string()).optional(),
  excluded_restaurant_ids: z.array(z.string()).optional(),
  is_alway_epice: z.boolean().default(false), // ✅ Nom corrigé sans "s"
  // Épicé à 3 états (remplace progressivement is_alway_epice).
  spice_level: z.enum(['ALWAYS', 'OPTIONAL', 'NEVER']).optional(),
  // Modes de commande disponibles (vide/absent = tous).
  available_order_types: z.array(z.enum(['DELIVERY', 'PICKUP', 'TABLE'])).optional(),
  // Créneau horaire « HH:mm » (null/absent = toujours dispo).
  available_from: z.string().nullable().optional(),
  available_until: z.string().nullable().optional(),
  private: z.boolean().default(false), // ✅ Nom corrigé sans "s"
  hubrise_sku: z.string().nullable().optional()
});

// Schémas pour les données API
export const ApiMenuDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  restaurant: z.string().optional(),
  restaurant_id: z.string().optional(),
  price: z.number().optional(),
  category_id: z.string().optional(),
  available: z.boolean().optional(),
  is_new: z.boolean().optional(),
  ingredients: z.array(z.string()).optional(),
  image: z.string().optional(),
  supplements: z.unknown().optional(),
  reviews: z.array(z.string()).optional(),
  total_reviews: z.number().optional(),
  promotion_price: z.number().optional(),
  is_promotion: z.boolean().optional(),
  dish_supplements: z.array(z.any()).optional(),
  dish_restaurants: z.array(z.any()).optional(),
  // Exclusions renvoyées par l'API (effectif = tout − exclusions).
  excluded_supplement_ids: z.array(z.string()).optional(),
  excluded_restaurant_ids: z.array(z.string()).optional(),
  // ✅ Champ pour les restaurants multiples
  selectedRestaurants: z.array(z.string()).optional(),
  is_alway_epice: z.boolean().optional(), // ✅ Nom corrigé sans "s"
  spice_level: z.enum(['ALWAYS', 'OPTIONAL', 'NEVER']).optional(),
  available_order_types: z.array(z.enum(['DELIVERY', 'PICKUP', 'TABLE'])).optional(),
  available_from: z.string().nullable().optional(),
  available_until: z.string().nullable().optional(),
  private: z.boolean().optional(), // ✅ Nom corrigé sans "s"
  hubrise_sku: z.string().nullable().optional()
});

// Schéma pour la création de menu
export const CreateMenuSchema = MenuItemSchema.omit({
  id: true,
  reviews: true,
  totalReviews: true
}).extend({
  reviews: z.array(z.string()).default([]),
  totalReviews: z.number().default(0),
  // ✅ Ajouter selectedRestaurants pour la création
  selectedRestaurants: z.array(z.string()).optional()
});

// Schéma pour la mise à jour de menu
export const UpdateMenuSchema = MenuItemSchema.partial().extend({
  id: z.string().min(1, 'ID requis pour la mise à jour'),
  // Restaurants exclus (sinon Zod le supprimerait : absent de MenuItemSchema).
  selectedRestaurants: z.array(z.string()).optional()
});

// Types TypeScript dérivés des schémas
export type ValidatedMenuItem = z.infer<typeof MenuItemSchema>;
export type ValidatedSupplementItem = z.infer<typeof SupplementItemSchema>;
export type ValidatedMenuCategory = z.infer<typeof MenuCategorySchema>;
export type CreateMenuData = z.infer<typeof CreateMenuSchema>;
export type UpdateMenuData = z.infer<typeof UpdateMenuSchema>;
export type ApiMenuData = z.infer<typeof ApiMenuDataSchema>;

// Fonctions utilitaires de validation
export const validateMenuItem = (data: unknown): ValidatedMenuItem => {
  return MenuItemSchema.parse(data);
};

export const validateCreateMenu = (data: unknown): CreateMenuData => {
  return CreateMenuSchema.parse(data);
};

export const validateUpdateMenu = (data: unknown): UpdateMenuData => {
  return UpdateMenuSchema.parse(data);
};

export const validateApiMenuData = (data: unknown): ApiMenuData => {
  return ApiMenuDataSchema.parse(data);
};

// Fonction de sanitisation
export const sanitizeMenuInput = (input: string): string => {
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')  // Supprimer les scripts
    .replace(/[<>]/g, '') // Supprimer < et >
    .substring(0, 1000); // Limiter la longueur
};
