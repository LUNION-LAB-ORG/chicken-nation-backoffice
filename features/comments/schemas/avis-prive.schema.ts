import { z } from "zod";
import type { AvisSolution, AvisStatut, JournalAvisDTO, StatutAvisDTO } from "../types/avis-prive.types";
import { solutionPossible } from "../utils/avis-prive";

/**
 * Formulaires de la fiche d'un avis (Journal de suivi, Clôture). Mêmes règles
 * et mêmes messages que le serveur (`verifierEntreeJournal`,
 * `changementStatut`) : l'agent lit l'erreur avant l'envoi, le serveur reste
 * juge. Messages au personnel : vouvoiement, comme le reste du back-office.
 */

export const NOTE_MAX = 2000;

export const MESSAGE_RESULTAT = "Choisissez le résultat.";
export const MESSAGE_RESULTAT_WHATSAPP = "Un message WhatsApp est Joint ou Injoignable.";
export const MESSAGE_NOTE = "Écrivez la note.";
export const MESSAGE_NOTE_LONGUE = "La note ne doit pas dépasser 2 000 caractères.";
export const MESSAGE_STATUT = "Choisissez le statut.";
export const MESSAGE_SOLUTION = "La solution est obligatoire pour Résolu.";
export const MESSAGE_INCIDENT_MANUEL = "Passer par Créer un incident.";
export const MESSAGE_SANS_ACCORD = "Pas d'accord de rappel : ni appel ni WhatsApp.";
export const MESSAGE_SANS_ACCORD_STATUT = "Pas d'accord de rappel : ce statut n'est pas possible.";

export const journalSchema = z
  .object({
    action: z.enum(["APPEL", "WHATSAPP", "NOTE"]),
    resultat: z.enum(["JOINT", "INJOIGNABLE", "MESSAGERIE"]).or(z.literal("")),
    note: z.string().trim().max(NOTE_MAX, MESSAGE_NOTE_LONGUE),
    accord_rappel: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (v.action === "NOTE") {
      if (!v.note) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["note"], message: MESSAGE_NOTE });
      return;
    }
    if (!v.accord_rappel) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["action"], message: MESSAGE_SANS_ACCORD });
      return;
    }
    if (!v.resultat) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["resultat"], message: MESSAGE_RESULTAT });
    } else if (v.action === "WHATSAPP" && v.resultat === "MESSAGERIE") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["resultat"], message: MESSAGE_RESULTAT_WHATSAPP });
    }
  });

export type SaisieJournal = z.input<typeof journalSchema>;

/** Saisie du journal → corps de `POST /avis-prives/:id/journal`, ou le premier message d'erreur. */
export function verifierJournal(saisie: SaisieJournal): { ok: true; dto: JournalAvisDTO } | { ok: false; message: string } {
  const r = journalSchema.safeParse(saisie);
  if (!r.success) return { ok: false, message: r.error.issues[0]?.message ?? MESSAGE_NOTE };
  const { action, resultat, note } = r.data;
  return {
    ok: true,
    dto: {
      action,
      ...(action === "NOTE" ? {} : { resultat: resultat || null }),
      note: note || null,
    },
  };
}

export const clotureSchema = z
  .object({
    statut: z.string(),
    solution: z.string(),
    accord_rappel: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (!v.statut || v.statut === "NOUVEAU") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["statut"], message: MESSAGE_STATUT });
      return;
    }
    if (v.statut === "INCIDENT_OUVERT") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["statut"], message: MESSAGE_INCIDENT_MANUEL });
      return;
    }
    if (!v.accord_rappel && (v.statut === "A_RAPPELER" || v.statut === "INJOIGNABLE")) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["statut"], message: MESSAGE_SANS_ACCORD_STATUT });
      return;
    }
    if (v.statut === "RESOLU" && !v.solution) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["solution"], message: MESSAGE_SOLUTION });
    }
  });

export type SaisieCloture = z.input<typeof clotureSchema>;

/**
 * Saisie de la clôture → corps de `PATCH /avis-prives/:id/statut`, ou le
 * message d'erreur. La solution ne part que pour Résolu et Classé.
 */
export function verifierCloture(
  saisie: SaisieCloture,
  statutLu: AvisStatut,
): { ok: true; dto: StatutAvisDTO } | { ok: false; message: string } {
  const r = clotureSchema.safeParse(saisie);
  if (!r.success) return { ok: false, message: r.error.issues[0]?.message ?? MESSAGE_STATUT };
  const statut = r.data.statut as AvisStatut;
  const solution = solutionPossible(statut) && r.data.solution ? (r.data.solution as AvisSolution) : null;
  return { ok: true, dto: { statut, solution, statut_lu: statutLu } };
}
