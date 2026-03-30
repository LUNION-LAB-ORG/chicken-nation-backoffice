import { z } from 'zod';

export const creerTicketSchema = z.object({
  title: z.string().min(1, 'Le sujet est requis'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  category: z.string().optional(),
  clientId: z.string().uuid().optional(),
  assignedToId: z.string().uuid().optional(),
  conversationId: z.string().uuid().optional(),
  description: z.string().optional(),
});

export const envoyerMessageTicketSchema = z.object({
  body: z.string().min(1, 'Le message ne peut pas être vide'),
  internal: z.boolean().default(false),
});

export const escaladerConversationSchema = z.object({
  conversationId: z.string().uuid('ID de conversation invalide'),
  title: z.string().min(1, 'Le sujet est requis'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  category: z.string().optional(),
});

export type CreerTicketFormData = z.infer<typeof creerTicketSchema>;
export type EnvoyerMessageTicketFormData = z.infer<typeof envoyerMessageTicketSchema>;
export type EscaladerConversationFormData = z.infer<typeof escaladerConversationSchema>;
