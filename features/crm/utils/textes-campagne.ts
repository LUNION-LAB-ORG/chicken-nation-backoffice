import { ICampagne, ILancement, ModeRepartition } from "../types/campagne.type";
import { accord, compter } from "./crm-ui";

/**
 * Phrases des écrans de campagne qui dépendent de son état ou de son mode de
 * répartition. Les champs lus ici sont venus avec le serveur du 02/11 : absents,
 * aucune phrase nouvelle ne s'affiche.
 */

const minuscule = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);

/**
 * Campagne planifiée dont la date de début est passée : elle se lance seule
 * dans l'heure, ou elle dit pourquoi elle ne le peut pas. null : rien à dire.
 */
export function ligneDateDebut(c: Pick<ICampagne, "status" | "date_debut_passee" | "launch_error">): string | null {
  if (c.status !== "PLANIFIED" || !c.date_debut_passee) return null;
  return c.launch_error
    ? `Date de début passée. Lancement impossible : ${minuscule(c.launch_error)}`
    : "Date de début passée : lancement automatique dans l'heure.";
}

/** Close à sa date de fin sans avoir jamais été lancée. */
export const closeSansLancement = (c: Pick<ICampagne, "status" | "started_at">) =>
  c.status === "COMPLETED" && !c.started_at;

/** Rapport Excel et PDF : seulement pour une campagne qui a tourné. */
export const rapportDisponible = (c: Pick<ICampagne, "status" | "started_at">) =>
  c.status !== "PLANIFIED" && !!c.started_at;

/** Confirmation du bouton « Lancer », selon le mode de répartition. */
export function texteLancer(mode: ModeRepartition): string {
  return mode === "MANUEL"
    ? "Elle prend les contacts disponibles de chaque public, selon ses critères, et les confie au pilote, qui les répartit dans l'équipe. La population ne pourra plus changer. Estimez-la d'abord si besoin."
    : "Elle prend les contacts disponibles de chaque public, selon ses critères, et les répartit dans l'équipe. Ses critères ne pourront plus changer ; chaque jour, les inscrits et les inactifs à reprendre qui y répondent la rejoignent. Estimez-la d'abord si besoin.";
}

/** Ligne du compte rendu du lancement : contacts confiés au pilote (mode manuel). */
export function ligneAuPilote(l: Pick<ILancement, "au_pilote">): string | null {
  const n = l.au_pilote ?? 0;
  return n > 0 ? `${compter(n, "confié", "confiés")} au pilote, à répartir dans l'équipe.` : null;
}

/** Campagne en cours dont des contacts n'ont pas d'agent : personne ne les appelle. */
export function ligneSansAgent(c: Pick<ICampagne, "status" | "resume">): string | null {
  const n = c.resume?.sans_agent ?? 0;
  if ((c.status !== "ACTIVE" && c.status !== "SUSPENDED") || n <= 0) return null;
  return `${compter(n, "contact")} sans agent : ${accord(n, "répartissez-le", "répartissez-les")} avec le bouton « Équipe ».`;
}

/** Mode de répartition, en fin de ligne d'en-tête. */
export const ligneMode = (mode: ModeRepartition) =>
  mode === "MANUEL" ? "répartition manuelle" : "répartition automatique";

/** Ce que fait un changement d'équipe, selon le mode. */
export function texteEquipe(mode: ModeRepartition): string {
  return mode === "MANUEL"
    ? "Un agent retiré rend ses contacts au pilote. Un agent ajouté ne reçoit rien tout seul : répartissez ci-dessous."
    : "Un agent retiré rend ses contacts, aussitôt confiés aux autres agents. Un agent ajouté reçoit sa part des contacts jamais appelés.";
}

/** Phrase ajoutée à la confirmation de « Terminer ». */
export const TERMINER_A_REPRENDRE =
  "Les inscrits et inactifs libérés passent « à reprendre » : chaque jour, une campagne en cours de leur public, en répartition automatique, les reprend.";

/** Première phrase de la confirmation de « Suspendre ». */
export const SUSPENDRE_EN_PAUSE = "Ses contacts restent dans les files des agents, en pause, jusqu'à la reprise.";
