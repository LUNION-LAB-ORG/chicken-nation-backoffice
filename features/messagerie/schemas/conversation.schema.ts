import { z } from 'zod';

export const creerConversationSchema = z.object({
  receiver_user_id: z.string().uuid().optional(),
  seed_message: z.string().min(1, 'Le message initial est requis'),
  restaurant_id: z.string().uuid().optional(),
  subject: z.string().optional(),
  customer_to_contact_id: z.string().uuid().optional(),
});

export const envoyerMessageSchema = z.object({
  body: z.string().min(1, 'Le message ne peut pas être vide'),
  messageType: z.enum(['TEXT', 'IMAGE', 'FILE']).default('TEXT'),
});

export type CreerConversationFormData = z.infer<typeof creerConversationSchema>;
export type EnvoyerMessageFormData = z.infer<typeof envoyerMessageSchema>;
