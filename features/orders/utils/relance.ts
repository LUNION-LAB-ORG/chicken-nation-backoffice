import { accord, fmtMontant } from "../../crm/utils/crm-ui";
import { REGLES_PAR_DEFAUT } from "../constantes/relance.constante";
import {
  CompteursRelance,
  GroupeRelance,
  RelancesReponse,
  ReglesRelance,
} from "../types/relance.types";

const MINUTE = 60_000;

/** Un nombre lisible et positif, sinon la valeur par défaut du serveur. */
const valeur = (n: unknown, defaut: number) => (typeof n === "number" && Number.isFinite(n) && n >= 0 ? n : defaut);

/** Règles reçues, complétées par les défauts : jamais de phrase avec « undefined min ». */
export function reglesDe(data?: Pick<RelancesReponse, "regles"> | null): Required<ReglesRelance> {
  const r = data?.regles;
  return {
    delai_minutes: valeur(r?.delai_minutes, REGLES_PAR_DEFAUT.delai_minutes),
    duree_prise_minutes: valeur(r?.duree_prise_minutes, REGLES_PAR_DEFAUT.duree_prise_minutes),
    rappel_minutes: valeur(r?.rappel_minutes, REGLES_PAR_DEFAUT.rappel_minutes),
    fenetre_heures: valeur(r?.fenetre_heures, REGLES_PAR_DEFAUT.fenetre_heures),
  };
}

/** « 4 min », « 1 h », « 1 h 05 ». */
export function duree(minutes: number): string {
  const m = Math.max(0, Math.floor(minutes));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const reste = m % 60;
  return reste ? `${h} h ${String(reste).padStart(2, "0")}` : `${h} h`;
}

const minutesDepuis = (iso: string, maintenant: number) => (maintenant - Date.parse(iso)) / MINUTE;

/** « depuis 4 min », « depuis 1 h 12 » ; l'âge se lit sur la création du panier. */
export function depuis(iso: string, maintenant: number): string {
  const m = minutesDepuis(iso, maintenant);
  if (!Number.isFinite(m)) return "";
  return m < 1 ? "depuis moins d'une minute" : `depuis ${duree(m)}`;
}

/** « il y a 12 min ». */
export function ilYa(iso: string, maintenant: number): string {
  const m = minutesDepuis(iso, maintenant);
  if (!Number.isFinite(m)) return "";
  return m < 1 ? "il y a moins d'une minute" : `il y a ${duree(m)}`;
}

/** Temps restant avant une échéance, arrondi à la minute supérieure : « 8 min ». */
export function reste(iso: string, maintenant: number): string {
  const ms = Date.parse(iso) - maintenant;
  if (!Number.isFinite(ms) || ms <= 0) return "moins d'une minute";
  return duree(Math.max(1, Math.ceil(ms / MINUTE)));
}

/**
 * Clé d'une alerte d'un groupe : sa tête ET l'instant de l'alerte. Une prise
 * expirée réalerte la même tête avec un nouvel `alerte_le` : la clé change et
 * l'alerte sonne de nouveau, au lieu d'être prise pour un doublon.
 */
export const cleAlerte = (g: Pick<GroupeRelance, "tete" | "alerte_le">) => `${g.tete.id}@${g.alerte_le ?? ""}`;

/** « 1 commande à relancer : Anne Marie Aka, 5 050 F, depuis 4 min » ou le résumé de plusieurs. */
export function texteBandeau(groupes: GroupeRelance[], maintenant: number): string {
  const aRelancer = groupes.filter((g) => g.etat === "A_RELANCER");
  const n = aRelancer.length;
  if (n === 0) return "";

  const refuses = aRelancer.filter((g) => g.signaux.paiement_refuse).length;
  const suffixe = refuses
    ? `, dont ${refuses} ${accord(refuses, "paiement refusé", "paiements refusés")}`
    : "";

  if (n === 1) {
    const { tete } = aRelancer[0];
    return `1 commande à relancer : ${tete.client_nom}, ${fmtMontant(tete.amount)}, ${depuis(tete.created_at, maintenant)}${suffixe}`;
  }
  const plusAncienne = aRelancer.reduce((a, g) => (Date.parse(g.tete.created_at) < Date.parse(a) ? g.tete.created_at : a), aRelancer[0].tete.created_at);
  return `${n} commandes à relancer, la plus ancienne ${depuis(plusAncienne, maintenant)}${suffixe}`;
}

/** Infobulle du compteur : « 2 à relancer, 1 prise par l'équipe » ; les parts à zéro sont omises. */
export function texteInfobulle(c?: CompteursRelance | null): string {
  if (!c) return "À relancer";
  const pris = c.pris ?? 0;
  const parts = [
    c.a_relancer ? `${c.a_relancer} à relancer` : "",
    pris ? `${pris} ${accord(pris, "prise", "prises")} par l'équipe` : "",
    c.en_cours ? `${c.en_cours} ${accord(c.en_cours, "paiement", "paiements")} en cours` : "",
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : "Aucune commande à relancer";
}

/** Message d'un refus prêt à recevoir une suite : « Déjà prise par Koffi Yao » (sans point final). */
export const sansPointFinal = (message: string) => message.trim().replace(/[.\s]+$/, "");
