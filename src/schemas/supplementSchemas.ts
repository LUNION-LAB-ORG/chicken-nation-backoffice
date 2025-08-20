import { z } from 'zod';

// Énumération des catégories de suppléments
export const SupplementCategorySchema = z.enum(['ACCESSORY', 'FOOD', 'DRINK'], {
  errorMap: () => ({ message: 'Catégorie de supplément invalide' })
});

// Schéma de base pour un supplément
export const BaseSupplementSchema = z.object({
  id: z.string().optional(),
  name: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères')
    .regex(/^[a-zA-ZÀ-ÿ0-9\s\-']+$/, 'Le nom contient des caractères invalides'),
  description: z.string()
    .max(500, 'La description ne peut pas dépasser 500 caractères')
    .optional(),
  price: z.number()
    .min(0, 'Le prix ne peut pas être négatif')
    .max(1000000, 'Le prix ne peut pas dépasser 1,000,000'),
  category: SupplementCategorySchema,
  isAvailable: z.boolean().default(true),
  image: z.string().optional(),
  imageFile: z.instanceof(File).optional(),
  quantity: z.number().min(0).optional(),
  isSelected: z.boolean().optional()
});

// Schéma pour la création de supplément
export const CreateSupplementSchema = BaseSupplementSchema.omit({ id: true });

// Schéma pour la mise à jour de supplément
export const UpdateSupplementSchema = BaseSupplementSchema.partial().extend({
  id: z.string().min(1, 'ID requis pour la mise à jour')
});

// Schéma pour les suppléments dans les menus
export const MenuSupplementSchema = z.object({
  type: SupplementCategorySchema,
  items: z.array(BaseSupplementSchema),
  isIncluded: z.boolean().optional(),
  required: z.boolean().optional()
});

// Schéma pour la validation des prix
export const PriceSchema = z.object({
  amount: z.number().min(0, 'Le montant ne peut pas être négatif'),
  currency: z.string().default('XOF'),
  formatted: z.string().optional()
});

// Types TypeScript dérivés
export type ValidatedSupplement = z.infer<typeof BaseSupplementSchema>;
export type CreateSupplementData = z.infer<typeof CreateSupplementSchema>;
export type UpdateSupplementData = z.infer<typeof UpdateSupplementSchema>;
export type SupplementCategory = z.infer<typeof SupplementCategorySchema>;
export type MenuSupplement = z.infer<typeof MenuSupplementSchema>;
export type ValidatedPrice = z.infer<typeof PriceSchema>;

// Fonctions utilitaires de validation
export const validateSupplement = (data: unknown): ValidatedSupplement => {
  return BaseSupplementSchema.parse(data);
};

export const validateCreateSupplement = (data: unknown): CreateSupplementData => {
  return CreateSupplementSchema.parse(data);
};

export const validateUpdateSupplement = (data: unknown): UpdateSupplementData => {
  return UpdateSupplementSchema.parse(data);
};

export const validateMenuSupplement = (data: unknown): MenuSupplement => {
  return MenuSupplementSchema.parse(data);
};

export const validatePrice = (data: unknown): ValidatedPrice => {
  return PriceSchema.parse(data);
};

// Utilitaires pour les catégories
export const getSupplementCategoryLabel = (category: SupplementCategory): string => {
  const labels: Record<SupplementCategory, string> = {
    ACCESSORY: 'Accessoire',
    FOOD: 'Nourriture',
    DRINK: 'Boisson'
  };
  return labels[category];
};

export const isValidSupplementCategory = (category: string): category is SupplementCategory => {
  return ['ACCESSORY', 'FOOD', 'DRINK'].includes(category);
};
