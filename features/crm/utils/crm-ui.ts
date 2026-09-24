import { AppelEffet, CanalCoupon, EtatCoupon, ContactStatut, Public } from "../types/contact.type";
import { CampagneStatut } from "../types/campagne.type";

interface Meta {
  label: string;
  className: string;
}

export const STATUT_META: Record<ContactStatut, Meta> = {
  A_APPELER: { label: "À appeler", className: "bg-slate-100 text-slate-700" },
  A_RAPPELER: { label: "À rappeler", className: "bg-amber-100 text-amber-800" },
  INTERESSE: { label: "Intéressé", className: "bg-blue-100 text-blue-700" },
  COUPON_ENVOYE: { label: "Coupon envoyé", className: "bg-orange-100 text-[#C2410C]" },
  NON_INTERESSE: { label: "Pas intéressé", className: "bg-rose-100 text-rose-700" },
  INJOIGNABLE: { label: "Injoignable", className: "bg-gray-200 text-gray-600" },
  CONVERTI: { label: "Converti", className: "bg-emerald-100 text-emerald-700" },
};

/** Un inactif qui recommande est « reconquis » ; un inscrit, « converti ». */
export function libelleStatut(statut: ContactStatut, segment?: Public): string {
  return statut === "CONVERTI" && segment === "INACTIF" ? "Reconquis" : STATUT_META[statut].label;
}

export const PUBLIC_META: Record<Public, Meta & { court: string; aide: string }> = {
  JAMAIS_COMMANDE: {
    label: "Inscrits sans commande",
    court: "Inscrit",
    className: "bg-sky-50 text-sky-700",
    aide: "Inscrits sur l'application, jamais passés à la commande",
  },
  INACTIF: {
    label: "Clients inactifs",
    court: "Inactif",
    className: "bg-violet-50 text-violet-700",
    aide: "Ont déjà commandé, plus rien depuis le délai réglé",
  },
  GLOVO: { label: "Clients Glovo", court: "Glovo", className: "bg-emerald-50 text-emerald-700", aide: "" },
  YANGO: { label: "Clients Yango", court: "Yango", className: "bg-yellow-50 text-yellow-800", aide: "" },
};

/** Publics ouverts aujourd'hui (Glovo et Yango arrivent au lot 2). */
export const PUBLICS: Public[] = ["JAMAIS_COMMANDE", "INACTIF"];

export const CANAL_ACHAT: Record<"APPLICATION" | "CENTRE_APPEL" | "MIXTE", string> = {
  APPLICATION: "surtout dans l'application",
  CENTRE_APPEL: "surtout par le centre d'appel",
  MIXTE: "application et centre d'appel",
};

export const STATUTS_ORDRE: ContactStatut[] = [
  "A_APPELER",
  "A_RAPPELER",
  "INTERESSE",
  "COUPON_ENVOYE",
  "NON_INTERESSE",
  "INJOIGNABLE",
  "CONVERTI",
];

export const EFFET_META: Record<AppelEffet, Meta & { aide: string }> = {
  NON_JOINT: { label: "Non joint", className: "bg-slate-100 text-slate-700", aide: "Pas de réponse : le contact reste à appeler" },
  A_RAPPELER: { label: "À rappeler", className: "bg-amber-100 text-amber-800", aide: "Joint, veut être rappelé : une date peut être fixée" },
  INTERESSE: { label: "Intéressé", className: "bg-blue-100 text-blue-700", aide: "Joint et intéressé : le coupon peut partir" },
  NON_INTERESSE: { label: "Pas intéressé", className: "bg-rose-100 text-rose-700", aide: "Joint, ne commandera pas : la raison est obligatoire" },
  NUMERO_INVALIDE: { label: "Numéro invalide", className: "bg-gray-200 text-gray-600", aide: "Numéro faux ou hors service : le contact sort de la file" },
};

export const ETAT_COUPON_META: Record<EtatCoupon | "AUCUN", Meta> = {
  AUCUN: { label: "Aucun", className: "bg-gray-100 text-gray-500" },
  ACTIF: { label: "Envoyé", className: "bg-orange-100 text-[#C2410C]" },
  UTILISE: { label: "Utilisé", className: "bg-emerald-100 text-emerald-700" },
  EXPIRE: { label: "Expiré", className: "bg-gray-200 text-gray-600" },
};

export const CANAL_LABEL: Record<CanalCoupon, string> = {
  WHATSAPP: "WhatsApp",
  SMS: "SMS",
  AUCUN: "non envoyé",
};

export const CAMPAGNE_META: Record<CampagneStatut, Meta> = {
  PLANIFIED: { label: "Planifiée", className: "bg-slate-100 text-slate-700" },
  ACTIVE: { label: "En cours", className: "bg-emerald-100 text-emerald-700" },
  SUSPENDED: { label: "Suspendue", className: "bg-amber-100 text-amber-800" },
  COMPLETED: { label: "Terminée", className: "bg-gray-200 text-gray-600" },
};

const nombre = new Intl.NumberFormat("fr-FR");

// Une valeur absente s'affiche vide : ni tiret ni « N/A » à l'écran.
export const fmtNombre = (n: number | null | undefined) => (n == null ? "" : nombre.format(Math.round(n)));
export const fmtMontant = (n: number | null | undefined) => (n == null ? "" : `${nombre.format(Math.round(n))} F`);
export const fmtPct = (n: number | null | undefined) => (n == null ? "" : `${String(n).replace(".", ",")} %`);

/** Accord à la française : singulier sous 2 (« 0 contact », « 1,5 tentative »). */
export const accord = (n: number, singulier: string, pluriel = `${singulier}s`) => (Math.abs(n) >= 2 ? pluriel : singulier);

export function fmtDate(valeur?: string | null): string {
  if (!valeur) return "";
  return new Date(valeur).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
}

export function fmtDateHeure(valeur?: string | null): string {
  if (!valeur) return "";
  return new Date(valeur).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

/** « il y a 3 j » : l'agent lit l'ancienneté d'un coup d'œil. */
export function depuis(valeur?: string | null): string {
  if (!valeur) return "";
  const minutes = Math.round((Date.now() - new Date(valeur).getTime()) / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const heures = Math.round(minutes / 60);
  if (heures < 24) return `il y a ${heures} h`;
  const jours = Math.round(heures / 24);
  if (jours < 31) return `il y a ${jours} j`;
  const mois = Math.round(jours / 30);
  return mois < 12 ? `il y a ${mois} mois` : `il y a ${Math.round(mois / 12)} an${mois >= 24 ? "s" : ""}`;
}

/** 0707070707 → « 07 07 07 07 07 », lisible au moment de composer. */
export function fmtTelephone(phone?: string | null): string {
  const chiffres = (phone ?? "").replace(/\D/g, "").slice(-10);
  return chiffres.length === 10 ? chiffres.replace(/(\d{2})(?=\d)/g, "$1 ") : phone ?? "";
}

export function lienAppel(phone?: string | null): string {
  const chiffres = (phone ?? "").replace(/\D/g, "").slice(-10);
  return `tel:+225${chiffres}`;
}

export const aujourdhuiISO = () => new Date().toISOString().slice(0, 10);

/** D'où vient le contact, en quelques mots : « inscrit il y a 3 j », « dernière commande il y a 2 mois ». */
export function origine(p: { segment: Public; registered_at: string; last_order_at: string | null }): string {
  return p.segment === "INACTIF" && p.last_order_at
    ? `dernière commande ${depuis(p.last_order_at)}`
    : `inscrit ${depuis(p.registered_at)}`;
}
