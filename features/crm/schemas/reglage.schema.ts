import { z } from "zod";

export const offreSchema = z
  .object({
    label: z.string().trim().min(2, "Donnez un libellé à l'offre").max(120),
    discount_type: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
    discount_value: z.number({ required_error: "Indiquez la remise" }).positive("La remise doit être positive"),
    max_discount_amount: z.number().min(0).optional(),
    min_order_amount: z.number().min(0).optional(),
    validity_days: z.number({ required_error: "Indiquez la validité" }).int().min(1).max(90, "90 jours au plus"),
  })
  .refine((o) => o.discount_type !== "PERCENTAGE" || o.discount_value <= 100, {
    message: "Un pourcentage ne dépasse pas 100 %",
    path: ["discount_value"],
  });

export const reglagesSchema = z.object({
  max_attempts: z.number().int().min(1).max(20, "20 tentatives au plus"),
  alert_delay_hours: z.number().int().min(1).max(720),
  inactive_days: z.number().int().min(7, "7 jours au moins").max(365, "365 jours au plus"),
  whatsapp_template_sid: z
    .string()
    .trim()
    .regex(/^(HX[0-9a-fA-F]{32})?$/, "L'identifiant Twilio commence par HX, suivi de 32 caractères"),
  message_template: z.string().trim().min(20, "Le message est trop court").max(700, "700 caractères au plus"),
  app_link: z.string().trim().url("Lien invalide"),
  default_offer_id: z.string(),
});
