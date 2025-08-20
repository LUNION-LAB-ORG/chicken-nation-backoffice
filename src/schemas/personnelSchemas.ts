import { z } from 'zod';

// Énumération des rôles
export const UserRoleSchema = z.enum([
  'ADMIN',
  'MANAGER', 
  'MARKETING',
  'COMPTABLE',
  'CAISSIER',
  'CALL_CENTER',
  'CUISINE'
], {
  errorMap: () => ({ message: 'Rôle utilisateur invalide' })
});

// Énumération des types d'utilisateur
export const UserTypeSchema = z.enum(['BACKOFFICE', 'RESTAURANT'], {
  errorMap: () => ({ message: 'Type d\'utilisateur invalide' })
});

// Schéma de base pour un utilisateur
export const BaseUserSchema = z.object({
  id: z.string().optional(),
  fullname: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères')
    .regex(/^[a-zA-ZÀ-ÿ\s\-']+$/, 'Le nom contient des caractères invalides'),
  email: z.string()
    .email('Format d\'email invalide')
    .max(255, 'L\'email ne peut pas dépasser 255 caractères'),
  phone: z.string()
    .regex(/^[\d\s\-\+\(\)]{8,20}$/, 'Format de téléphone invalide')
    .optional(),
  address: z.string()
    .max(500, 'L\'adresse ne peut pas dépasser 500 caractères')
    .optional(),
  role: UserRoleSchema,
  type: UserTypeSchema,
  restaurant_id: z.string().optional(),
  active: z.boolean().default(true),
  image: z.string().optional(),
  imageFile: z.instanceof(File).optional()
});

// Schéma pour la création d'utilisateur
export const CreateUserSchema = BaseUserSchema.omit({ id: true });

// Schéma pour la mise à jour d'utilisateur
export const UpdateUserSchema = BaseUserSchema.partial().extend({
  id: z.string().min(1, 'ID requis pour la mise à jour')
});

// Schéma pour le changement de mot de passe
export const ChangePasswordSchema = z.object({
  userId: z.string().min(1, 'ID utilisateur requis'),
  currentPassword: z.string().min(1, 'Mot de passe actuel requis'),
  newPassword: z.string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword']
});

// Schéma pour la connexion
export const LoginSchema = z.object({
  email: z.string()
    .email('Format d\'email invalide')
    .max(255, 'L\'email ne peut pas dépasser 255 caractères'),
  password: z.string()
    .min(1, 'Mot de passe requis')
});

// Types TypeScript dérivés
export type ValidatedUser = z.infer<typeof BaseUserSchema>;
export type CreateUserData = z.infer<typeof CreateUserSchema>;
export type UpdateUserData = z.infer<typeof UpdateUserSchema>;
export type ChangePasswordData = z.infer<typeof ChangePasswordSchema>;
export type LoginData = z.infer<typeof LoginSchema>;
export type UserRole = z.infer<typeof UserRoleSchema>;
export type UserType = z.infer<typeof UserTypeSchema>;

// Fonctions utilitaires de validation
export const validateUser = (data: unknown): ValidatedUser => {
  return BaseUserSchema.parse(data);
};

export const validateCreateUser = (data: unknown): CreateUserData => {
  return CreateUserSchema.parse(data);
};

export const validateUpdateUser = (data: unknown): UpdateUserData => {
  return UpdateUserSchema.parse(data);
};

export const validateChangePassword = (data: unknown): ChangePasswordData => {
  return ChangePasswordSchema.parse(data);
};

export const validateLogin = (data: unknown): LoginData => {
  return LoginSchema.parse(data);
};

// Validation des rôles et permissions
export const isBackOfficeRole = (role: UserRole): boolean => {
  return ['ADMIN', 'MANAGER', 'MARKETING', 'COMPTABLE'].includes(role);
};

export const isRestaurantRole = (role: UserRole): boolean => {
  return ['CAISSIER', 'CALL_CENTER', 'CUISINE'].includes(role);
};

export const canManageUsers = (role: UserRole): boolean => {
  return ['ADMIN', 'MANAGER'].includes(role);
};

export const canManageRestaurants = (role: UserRole): boolean => {
  return role === 'ADMIN';
};
