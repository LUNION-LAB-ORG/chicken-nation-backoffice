import { z } from "zod";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide");

/** Paramètres d'une campagne (cahier §6.1), vérifiés avant l'envoi. */
export const campagneSchema = z
  .object({
    name: z.string().trim().min(2, "Donnez un nom à la campagne"),
    description: z.string().max(4000).optional(),
    start_date: date,
    end_date: date.optional(),
    duration_days: z.number().int().min(1, "Au moins un jour").max(365).optional(),
    target_conversion_rate: z.number().min(0).max(100, "Un taux ne dépasse pas 100 %").optional(),
    target_contacts_count: z.number().int().min(1).optional(),
    lead_agent_id: z.string().uuid("Choisissez le pilote"),
    agent_ids: z.array(z.string().uuid()).min(1, "Choisissez au moins un agent"),
    offer_id: z.string().uuid().optional(),
    distribution_mode: z.enum(["AUTOMATIQUE", "MANUEL"]),
    registered_from: date.optional(),
    registered_to: date.optional(),
  })
  .refine((v) => !v.end_date || v.end_date >= v.start_date, {
    message: "La fin précède le début",
    path: ["end_date"],
  })
  .refine((v) => !v.registered_from || !v.registered_to || v.registered_to >= v.registered_from, {
    message: "La période d'inscription est inversée",
    path: ["registered_to"],
  });

export type CampagneForm = z.infer<typeof campagneSchema>;
