import { z } from "zod";
import { PUBLIC_META } from "../utils/crm-ui";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide");
const nombre = (message: string) => z.number({ invalid_type_error: message, required_error: message });

const SEGMENTS = ["JAMAIS_COMMANDE", "INACTIF", "GLOVO", "YANGO"] as const;
const capte = (s: (typeof SEGMENTS)[number]) => s === "GLOVO" || s === "YANGO";

/** Un public visé et ses critères propres, avec son offre et ses objectifs facultatifs. */
export const publicCampagneSchema = z.object({
  segment: z.enum(SEGMENTS, { errorMap: () => ({ message: "Public inconnu" }) }),
  period_from: date.nullish(),
  period_to: date.nullish(),
  restaurant_ids: z.array(z.string().uuid("Restaurant inconnu")).max(50, "Cinquante restaurants au plus").optional(),
  account: z.enum(["AVEC", "SANS"]).nullish(),
  relapsed_only: z.boolean().optional(),
  offer_id: z.string().uuid("Offre inconnue").nullish(),
  target_conversion_rate: nombre("Le taux visé doit être un nombre")
    .min(0, "Un taux ne descend pas sous 0 %")
    .max(100, "Un taux ne dépasse pas 100 %")
    .nullish(),
  target_contacts_count: nombre("Le nombre de contacts à joindre doit être un nombre")
    .int("Le nombre de contacts à joindre est un entier")
    .min(1, "Au moins un contact à joindre")
    .nullish(),
});

/**
 * Publics d'une campagne : au moins un, un seul jeu de critères par public,
 * période dans l'ordre, restaurants et compte réservés à Glovo/Yango,
 * « déjà reconquis » réservé aux inactifs. Mêmes règles que le serveur.
 */
export const publicsCampagneSchema = z
  .array(publicCampagneSchema)
  .min(1, "Choisissez au moins un public")
  .max(4, "Quatre publics au plus")
  .superRefine((publics, ctx) => {
    const vus = new Set<string>();
    publics.forEach((p, i) => {
      const nom = PUBLIC_META[p.segment].label;
      if (vus.has(p.segment)) {
        ctx.addIssue({ code: "custom", path: [i, "segment"], message: `Le public « ${nom} » est choisi deux fois` });
      }
      vus.add(p.segment);
      if (p.period_from && p.period_to && p.period_to < p.period_from) {
        ctx.addIssue({ code: "custom", path: [i, "period_to"], message: `La période du public « ${nom} » est inversée` });
      }
      if (!capte(p.segment) && ((p.restaurant_ids?.length ?? 0) > 0 || p.account)) {
        ctx.addIssue({
          code: "custom",
          path: [i, "restaurant_ids"],
          message: `Les restaurants de capture et le compte sur l'appli ne concernent que les clients Glovo et Yango (public « ${nom} »)`,
        });
      }
      if (p.relapsed_only && p.segment !== "INACTIF") {
        ctx.addIssue({
          code: "custom",
          path: [i, "relapsed_only"],
          message: `« Déjà reconquis une fois » ne concerne que les clients inactifs (public « ${nom} »)`,
        });
      }
    });
  });

/** Paramètres d'une campagne (cahier §6.1), vérifiés avant l'envoi. */
export const campagneSchema = z
  .object({
    name: z.string().trim().min(2, "Donnez un nom à la campagne").max(255, "Nom trop long"),
    description: z.string().max(4000, "Description trop longue").optional(),
    start_date: date,
    end_date: date.optional(),
    duration_days: nombre("La durée doit être un nombre de jours")
      .int("La durée est un nombre entier de jours")
      .min(1, "Au moins un jour")
      .max(365, "Un an au plus")
      .optional(),
    target_conversion_rate: nombre("Le taux visé doit être un nombre")
      .min(0, "Un taux ne descend pas sous 0 %")
      .max(100, "Un taux ne dépasse pas 100 %")
      .nullish(),
    target_contacts_count: nombre("Le nombre de contacts à joindre doit être un nombre")
      .int("Le nombre de contacts à joindre est un entier")
      .min(1, "Au moins un contact à joindre")
      .nullish(),
    lead_agent_id: z.string().uuid("Choisissez le pilote"),
    agent_ids: z.array(z.string().uuid()).min(1, "Choisissez au moins un agent").max(50, "Cinquante agents au plus"),
    offer_id: z.string().uuid("Offre inconnue").nullish(),
    distribution_mode: z.enum(["AUTOMATIQUE", "MANUEL"]),
    publics: publicsCampagneSchema,
  })
  .refine((v) => !v.end_date || v.end_date >= v.start_date, {
    message: "La fin précède le début",
    path: ["end_date"],
  });

export type CampagneForm = z.infer<typeof campagneSchema>;
export type PublicCampagneForm = z.infer<typeof publicCampagneSchema>;
