import { z } from "zod";
import { CODES_RAISONS, RAISON_TEXTE_MAX } from "../constantes/relance.constante";

/**
 * Fenêtre « Ignorer cette commande ? ». Mêmes règles et mêmes messages que
 * le serveur (IgnorerRelanceDto) : une raison de la liste, et pour « Autre »
 * un texte non vide de 160 caractères au plus. Le texte ne part qu'avec
 * « Autre » : un texte tapé puis abandonné pour une autre raison n'est pas
 * enregistré.
 */
export const ignorerRelanceSchema = z
  .object({
    raison_code: z.enum(CODES_RAISONS, {
      errorMap: () => ({ message: "Choisissez une raison." }),
    }),
    raison_texte: z
      .string()
      .trim()
      .max(RAISON_TEXTE_MAX, `Précisez la raison en ${RAISON_TEXTE_MAX} caractères au plus.`)
      .optional(),
  })
  .superRefine((v, ctx) => {
    if (v.raison_code === "AUTRE" && !v.raison_texte) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Précisez la raison.", path: ["raison_texte"] });
    }
  })
  .transform((v) => (v.raison_code === "AUTRE" ? v : { raison_code: v.raison_code }));

export type IgnorerRelanceForm = z.input<typeof ignorerRelanceSchema>;
