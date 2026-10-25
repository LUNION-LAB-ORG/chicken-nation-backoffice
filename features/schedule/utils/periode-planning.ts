/**
 * DATES ET TEXTES DU PLANNING (conception du 24/10, section 10.3).
 *
 * Les dates du planning arrivent en ISO à minuit UTC (« 2026-10-27T00:00:00.000Z »),
 * comme `shifts[].date` : le jour est lu dans les dix premiers caractères,
 * jamais par le fuseau du navigateur. Abidjan est à UTC.
 *
 * Fichier pur (aucun React), testé par `bun test`.
 */

import type { ISchedulePlan, IApercuPlanning, SchedulePlanStatus, WeekDay } from '../types/schedule.types';

/** « 2026-10-27 » d'une date ISO. */
export const cleJour = (iso: string): string => iso.slice(0, 10);

/** « 2026-10-27 » d'aujourd'hui, à l'heure du poste. */
export function cleAujourdhui(maintenant: Date = new Date()): string {
  const a = maintenant.getFullYear();
  const m = String(maintenant.getMonth() + 1).padStart(2, '0');
  const j = String(maintenant.getDate()).padStart(2, '0');
  return `${a}-${m}-${j}`;
}

/** « 27/10 ». */
export const dateCourte = (iso: string): string => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

/** Mois abrégés comme date-fns en français (« oct. », « nov. »), format d'avant. */
const MOIS_COURTS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

const jourEtMois = (iso: string): string => `${iso.slice(8, 10)} ${MOIS_COURTS[Number(iso.slice(5, 7)) - 1] ?? ''}`.trim();

/** « 27 oct. → 09 nov. 2026 », le format d'avant. */
export const periode = (debut: string, fin: string): string =>
  `${jourEtMois(debut)} → ${jourEtMois(fin)} ${fin.slice(0, 4)}`;

const JOURS_COURTS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
const JOURS_REGLAGE: WeekDay[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

const jourDeSemaine = (cle: string): number => new Date(`${cleJour(cle)}T00:00:00Z`).getUTCDay();

/** « lun. 27/10 » (en-tête de colonne, fenêtre d'un jour). */
export const jourCourt = (cle: string): string => `${JOURS_COURTS[jourDeSemaine(cle)]} ${dateCourte(cle)}`;

/** Le repos est-il interdit ce jour-là (réglage `no_rest_days`) ? */
export function estJourSansRepos(cle: string, joursSansRepos: readonly WeekDay[] | null | undefined): boolean {
  if (!joursSansRepos || joursSansRepos.length === 0) return false;
  return joursSansRepos.includes(JOURS_REGLAGE[jourDeSemaine(cle)]);
}

/** Tous les jours du planning, du premier au dernier (« 2026-10-27 », …). */
export function joursDuPlanning(debut: string, fin: string): string[] {
  const jours: string[] = [];
  const d = new Date(`${cleJour(debut)}T00:00:00Z`);
  const f = new Date(`${cleJour(fin)}T00:00:00Z`);
  // Garde : une période aberrante ne fige pas l'écran.
  for (let n = 0; d <= f && n < 120; n++) {
    jours.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return jours;
}

/** Nombre de jours de `de` à `a` (« 2026-10-24 » → « 2026-10-27 » : 3). */
export function joursEntre(de: string, a: string): number {
  const ms = Date.parse(`${cleJour(a)}T00:00:00Z`) - Date.parse(`${cleJour(de)}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}

/** Le planning couvre-t-il ce jour ? */
export const couvre = (
  plan: Pick<ISchedulePlan, 'period_start' | 'period_end'>,
  aujourdhui: string,
): boolean => cleJour(plan.period_start) <= aujourdhui && aujourdhui <= cleJour(plan.period_end);

const ETATS_EN_SERVICE: SchedulePlanStatus[] = ['SENT', 'CONFIRMED'];

/**
 * Planning choisi d'office à l'arrivée : celui qui couvre aujourd'hui (envoyé
 * ou confirmé d'abord), sinon le plus récent.
 */
export function planningParDefaut<T extends Pick<ISchedulePlan, 'id' | 'status' | 'period_start' | 'period_end'>>(
  plans: readonly T[] | null | undefined,
  aujourdhui: string,
): T | null {
  if (!plans || plans.length === 0) return null;
  const duJour = plans.filter((p) => couvre(p, aujourdhui));
  const enService = duJour.find((p) => ETATS_EN_SERVICE.includes(p.status));
  if (enService) return enService;
  if (duJour.length > 0) return duJour[0];
  return [...plans].sort((a, b) => b.period_start.localeCompare(a.period_start))[0];
}

const accord = (n: number, mot: string) => `${n} ${mot}${n > 1 ? 's' : ''}`;

/** « 12 confirmés · 3 en attente · 1 refusé » (zéros omis, sauf les confirmés). */
export function texteReponses(reponses: { confirmees: number; en_attente: number; refusees: number }): string {
  const morceaux = [accord(reponses.confirmees, 'confirmé')];
  if (reponses.en_attente > 0) morceaux.push(`${reponses.en_attente} en attente`);
  if (reponses.refusees > 0) morceaux.push(accord(reponses.refusees, 'refusé'));
  return morceaux.join(' · ');
}

/** « 6 prévus ». */
export const textePrevus = (n: number): string => accord(n, 'prévu');

/**
 * Aucun planning suivant alors que celui en cours finit dans 3 jours ou
 * moins : la case « Aucun » passe au rouge.
 */
export function suivantManquant(ligne: Pick<IApercuPlanning, 'en_cours' | 'suivant'>, aujourdhui: string): boolean {
  if (ligne.suivant || !ligne.en_cours) return false;
  return joursEntre(aujourdhui, ligne.en_cours.fin) <= 3;
}

/** Prénom du livreur pour les fenêtres et les messages (« Koffi »). */
export function prenomLivreur(l: { first_name?: string | null; last_name?: string | null } | null | undefined): string {
  return l?.first_name?.trim() || l?.last_name?.trim() || 'Le livreur';
}

/** « Koffi Yao ». */
export function nomLivreur(l: { first_name?: string | null; last_name?: string | null } | null | undefined): string {
  return [l?.first_name?.trim(), l?.last_name?.trim()].filter(Boolean).join(' ') || 'Livreur';
}
