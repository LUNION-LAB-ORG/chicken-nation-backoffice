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

/** Un inactif qui recommande est « reconquis » ; un client Glovo/Yango « a commandé en direct » ; un inscrit, « converti ». */
export function libelleStatut(statut: ContactStatut, segment?: Public): string {
  if (statut !== "CONVERTI") return STATUT_META[statut].label;
  if (segment === "INACTIF") return "Reconquis";
  if (segment === "GLOVO" || segment === "YANGO") return "A commandé en direct";
  return STATUT_META[statut].label;
}

/**
 * Vocabulaire de chaque public : le même chiffre ne se nomme pas pareil pour
 * un inscrit (première commande), un inactif (reconquête) ou un client
 * Glovo/Yango (commande en direct).
 */
export interface PublicMeta extends Meta {
  court: string;
  aide: string;
  /** Première étape d'un entonnoir, ou colonne « entrées ». */
  entree: string;
  /** Ce qu'on appelle une vente pour ce public. */
  conversion: string;
  taux: string;
  /** Libellé de la période de ciblage d'une campagne. */
  periodeCampagne: string;
  /** Ce qui regroupe les cohortes. */
  cohorte: string;
}

export const PUBLIC_META: Record<Public, PublicMeta> = {
  JAMAIS_COMMANDE: {
    label: "Inscrits sans commande",
    court: "Inscrit",
    className: "bg-sky-50 text-sky-700",
    aide: "Inscrits sur l'application, jamais passés à la commande",
    entree: "Inscrits",
    conversion: "Première commande",
    taux: "Taux de conversion",
    periodeCampagne: "Inscrits du",
    cohorte: "par mois d'inscription",
  },
  INACTIF: {
    label: "Clients inactifs",
    court: "Inactif",
    className: "bg-violet-50 text-violet-700",
    aide: "Ont déjà commandé, plus rien depuis le délai réglé",
    entree: "Devenus inactifs",
    conversion: "Reconquis",
    taux: "Taux de reconquête",
    periodeCampagne: "Devenus inactifs du",
    cohorte: "par mois de décrochage",
  },
  GLOVO: {
    label: "Clients Glovo",
    court: "Glovo",
    className: "bg-emerald-50 text-emerald-700",
    aide: "Relevés en caisse sur une commande Glovo : à faire commander en direct",
    entree: "Captés sur Glovo",
    conversion: "Commande directe",
    taux: "Taux de passage en direct",
    periodeCampagne: "Captés du",
    cohorte: "par mois de capture",
  },
  YANGO: {
    label: "Clients Yango",
    court: "Yango",
    className: "bg-yellow-50 text-yellow-800",
    aide: "Relevés en caisse sur une commande Yango : à faire commander en direct",
    entree: "Captés sur Yango",
    conversion: "Commande directe",
    taux: "Taux de passage en direct",
    periodeCampagne: "Captés du",
    cohorte: "par mois de capture",
  },
};

/** Libellés quand plusieurs publics sont mêlés. */
export const TOUS_META = { entree: "Entrés dans le CRM", conversion: "Conversions", taux: "Taux de conversion" };

/** Vocabulaire d'une sélection de publics : celui du public s'il est seul (ou Glovo + Yango), sinon le vocabulaire commun. */
export function vocabulaire(publics?: Public[]): { entree: string; conversion: string; taux: string } {
  if (!publics || publics.length === 0) return TOUS_META;
  if (publics.length === 1) return PUBLIC_META[publics[0]];
  if (publics.every((p) => p === "GLOVO" || p === "YANGO")) return { ...PUBLIC_META.GLOVO, entree: "Captés sur Glovo ou Yango" };
  return TOUS_META;
}

export const PUBLICS: Public[] = ["JAMAIS_COMMANDE", "INACTIF", "GLOVO", "YANGO"];


export const estCapte = (segment: Public) => segment === "GLOVO" || segment === "YANGO";

/** Publics couverts par un filtre, dans l'ordre d'affichage : une liste vide veut dire les quatre. */
export const publicsCouverts = (publics?: Public[]): Public[] =>
  publics && publics.length > 0 ? PUBLICS.filter((p) => publics.includes(p)) : PUBLICS;

/** Le filtre couvre-t-il Glovo ou Yango (liste vide comprise) ? */
export const couvreCaptes = (publics?: Public[]) => publicsCouverts(publics).some(estCapte);

/**
 * Mode détaillé : un seul public, ou Glovo + Yango (qui partagent leur
 * vocabulaire). Sinon, les publics se comparent côte à côte, jamais mélangés.
 */
export const modeDetail = (publics?: Public[]) =>
  !!publics && publics.length > 0 && (publics.length === 1 || publics.every(estCapte));

/** Couleur d'un public dans les graphiques, accordée à sa puce. */
export const COULEUR_PUBLIC: Record<Public, string> = {
  JAMAIS_COMMANDE: "#0EA5E9",
  INACTIF: "#8B5CF6",
  GLOVO: "#10B981",
  YANGO: "#EAB308",
};

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
  INCONNU: "canal non noté",
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

/** « 1 raison », « 12 raisons » : le nombre et son nom accordé. */
export const compter = (n: number, singulier: string, pluriel?: string) => `${fmtNombre(n)} ${accord(n, singulier, pluriel)}`;

export const virgule = (n: number) => String(n).replace(".", ",");

/** Délai en jours ; vide quand il n'est pas disponible. */
export const fmtJours = (n: number | null | undefined) => (n == null ? "" : `${virgule(n)} j`);

/** Délai en heures, en jours au-delà de 48 h ; vide quand il n'est pas disponible. */
export const fmtHeures = (n: number | null | undefined) =>
  n == null ? "" : n >= 48 ? `${virgule(Math.round(n / 2.4) / 10)} j` : `${virgule(n)} h`;

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

const chiffres = (phone?: string | null) => {
  const d = (phone ?? "").replace(/\D/g, "");
  return d.startsWith("00") ? d.slice(2) : d;
};

/** Numéro ivoirien, avec ou sans indicatif : ses 10 chiffres locaux. */
const local = (d: string) => (d.length === 10 ? d : d.length === 13 && d.startsWith("225") ? d.slice(3) : null);

/** 0707070707 → « 07 07 07 07 07 », lisible au moment de composer. Un numéro étranger reste tel quel. */
export function fmtTelephone(phone?: string | null): string {
  const l = local(chiffres(phone));
  return l ? l.replace(/(\d{2})(?=\d)/g, "$1 ") : phone ?? "";
}

/** Même règle que le serveur : 10 chiffres prennent l'indicatif 225, un numéro qui a déjà le sien part tel quel. */
export function lienAppel(phone?: string | null): string {
  const d = chiffres(phone);
  return `tel:+${d.length === 10 ? `225${d}` : d}`;
}

export const aujourdhuiISO = () => new Date().toISOString().slice(0, 10);

/** D'où vient le contact, en quelques mots : « inscrit il y a 3 j », « capté sur Glovo il y a 5 j ». */
export function origine(p: {
  segment: Public;
  segment_since: string;
  registered_at: string | null;
  last_order_at: string | null;
}): string {
  if (estCapte(p.segment)) return `capté sur ${PUBLIC_META[p.segment].court} ${depuis(p.segment_since)}`;
  if (p.segment === "INACTIF" && p.last_order_at) return `dernière commande ${depuis(p.last_order_at)}`;
  return `inscrit ${depuis(p.registered_at ?? p.segment_since)}`;
}
