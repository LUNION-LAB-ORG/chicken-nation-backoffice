import type { ISuiviCampagne } from "../types/contact.type";
import { accord, compter, fmtNombre } from "./crm-ui";
import { type Dossier, resumeDossiers } from "./dossiers-file";

/**
 * Phrases de « Ma file ». À part de `dossiers-file.ts`, qui ne dépend que des
 * types : les tests de reproduction du serveur l'importent tel quel.
 */

/** Sous-titre de « Mes dossiers » : son propre travail, puis la file commune à part. */
export function phraseDossiers(dossiers: Dossier[]): string {
  const { aAppeler, commune } = resumeDossiers(dossiers);
  return commune != null
    ? `${fmtNombre(aAppeler)} contacts à appeler en tout, plus ${fmtNombre(commune)} dans la file commune. Ouvrez un dossier pour le traiter.`
    : `${fmtNombre(aAppeler)} contacts à appeler en tout. Ouvrez un dossier pour le traiter.`;
}

/** Ligne d'une campagne en pause : « 12 contacts en attente de la reprise ». */
export const lignePause = (total: number) => `${compter(total, "contact")} en attente de la reprise`;

/** Petite ligne d'un dossier de suivi. */
export function ligneSuivi(s: ISuiviCampagne): string {
  const morceaux = [compter(s.jamais_appeles, "jamais appelé", "jamais appelés"), `${fmtNombre(s.sans_agent)} sans agent`];
  if (s.statut === "SUSPENDED") morceaux.push("en pause");
  return morceaux.join(" · ");
}

/** « restant » ou « restants » après le grand nombre d'un dossier de suivi. */
export const motRestants = (n: number) => accord(n, "restant");
