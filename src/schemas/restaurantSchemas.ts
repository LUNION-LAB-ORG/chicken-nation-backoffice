import { z } from 'zod';

// Schéma pour les coordonnées GPS
export const CoordinatesSchema = z.object({
  latitude: z.number()
    .min(-90, 'Latitude doit être entre -90 et 90')
    .max(90, 'Latitude doit être entre -90 et 90'),
  longitude: z.number()
    .min(-180, 'Longitude doit être entre -180 et 180')
    .max(180, 'Longitude doit être entre -180 et 180')
});

// Schéma pour les horaires
export const ScheduleSchema = z.record(z.string().regex(/^\d{2}:\d{2}-\d{2}:\d{2}$/, 'Format horaire invalide (HH:MM-HH:MM)'));

// Schéma pour les informations du gérant
export const ManagerSchema = z.object({
  managerFullname: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères')
    .regex(/^[a-zA-ZÀ-ÿ\s\-']+$/, 'Le nom contient des caractères invalides'),
  managerEmail: z.string()
    .email('Format d\'email invalide')
    .max(255, 'L\'email ne peut pas dépasser 255 caractères'),
  managerPhone: z.string()
    .regex(/^[\d\s\-\+\(\)]{8,20}$/, 'Format de téléphone invalide')
});

// Schéma principal pour les restaurants
export const RestaurantSchema = z.object({
  id: z.string().optional(),
  name: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères')
    .regex(/^[a-zA-ZÀ-ÿ0-9\s\-']+$/, 'Le nom contient des caractères invalides'),
  description: z.string()
    .max(500, 'La description ne peut pas dépasser 500 caractères')
    .optional(),
  address: z.string()
    .min(10, 'L\'adresse doit être plus détaillée (minimum 10 caractères)')
    .max(500, 'L\'adresse ne peut pas dépasser 500 caractères'),
  latitude: z.number()
    .min(-90, 'Latitude doit être entre -90 et 90')
    .max(90, 'Latitude doit être entre -90 et 90'),
  longitude: z.number()
    .min(-180, 'Longitude doit être entre -180 et 180')
    .max(180, 'Longitude doit être entre -180 et 180'),
  phone: z.string()
    .regex(/^[\d\s\-\+\(\)]{8,20}$/, 'Format de téléphone invalide'),
  email: z.string()
    .email('Format d\'email invalide')
    .max(255, 'L\'email ne peut pas dépasser 255 caractères'),
  schedule: z.array(ScheduleSchema),
  active: z.boolean().default(true),
  image: z.string().optional(),
  imageFile: z.instanceof(File).optional()
});

// Schéma pour la création de restaurant (avec gérant)
export const CreateRestaurantSchema = RestaurantSchema.merge(ManagerSchema);

// Schéma pour la mise à jour de restaurant (sans gérant)
export const UpdateRestaurantSchema = RestaurantSchema.partial().extend({
  id: z.string().min(1, 'ID requis pour la mise à jour')
});

// Types TypeScript dérivés
export type ValidatedRestaurant = z.infer<typeof RestaurantSchema>;
export type CreateRestaurantData = z.infer<typeof CreateRestaurantSchema>;
export type UpdateRestaurantData = z.infer<typeof UpdateRestaurantSchema>;
export type ValidatedCoordinates = z.infer<typeof CoordinatesSchema>;
export type ValidatedManager = z.infer<typeof ManagerSchema>;

// Fonctions utilitaires de validation
export const validateRestaurant = (data: unknown): ValidatedRestaurant => {
  return RestaurantSchema.parse(data);
};

export const validateCreateRestaurant = (data: unknown): CreateRestaurantData => {
  return CreateRestaurantSchema.parse(data);
};

export const validateUpdateRestaurant = (data: unknown): UpdateRestaurantData => {
  return UpdateRestaurantSchema.parse(data);
};

export const validateCoordinates = (data: unknown): ValidatedCoordinates => {
  return CoordinatesSchema.parse(data);
};
