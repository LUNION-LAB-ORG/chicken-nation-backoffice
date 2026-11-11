/**
 * INCIDENTS SUR COMMANDE (11/11) : mots, couleurs et petites règles d'écran,
 * testés par `bun test`. Les droits sur un incident viennent du serveur
 * (`droits` de la fiche) ; ici, seulement ce que le menu doit savoir avant
 * toute lecture (mêmes listes de rôles que `roles-incidents.ts` du serveur :
 * les deux bougent ensemble).
 */
import type {
  DemandeSignalement,
  FiltresHistorique,
  FiltresIncidents,
  IncidentGeste,
  IncidentGravite,
  IncidentLigne,
  IncidentOrigine,
  IncidentPole,
  IncidentRecontact,
  IncidentStatut,
} from "../types/incident.types";

// ─── Mots ────────────────────────────────────────────────────────────────────

export const STATUTS: IncidentStatut[] = ["OUVERT", "EN_COURS", "RESOLU", "CLOTURE"];

export const LIBELLE_STATUT: Record<IncidentStatut, string> = {
  OUVERT: "Ouvert",
  EN_COURS: "En cours",
  RESOLU: "Résolu",
  CLOTURE: "Clôturé",
};

export const GRAVITES: IncidentGravite[] = ["FAIBLE", "MOYENNE", "HAUTE"];

export const LIBELLE_GRAVITE: Record<IncidentGravite, string> = {
  FAIBLE: "Faible",
  MOYENNE: "Moyenne",
  HAUTE: "Haute",
};

export const LIBELLE_ORIGINE: Record<IncidentOrigine, string> = {
  APPEL: "Appel",
  WHATSAPP: "WhatsApp",
  SUR_PLACE: "Sur place",
  CONSTAT_INTERNE: "Constat interne",
  TICKET: "Ticket",
  AVIS: "Avis du site",
  NOTE: "Note après commande",
  RAPPEL: "Rappel du lendemain",
};

/** Origines qu'un agent choisit ; les autres viennent du ticket, de l'avis ou de la note. */
export const ORIGINES_SAISIES: IncidentOrigine[] = ["APPEL", "WHATSAPP", "SUR_PLACE", "CONSTAT_INTERNE"];

export const ORIGINES: IncidentOrigine[] = [...ORIGINES_SAISIES, "TICKET", "AVIS", "NOTE"];

export const POLES: IncidentPole[] = ["RESTAURANT", "LIVRAISON", "CALL_CENTER"];

export const LIBELLE_POLE: Record<IncidentPole, string> = {
  RESTAURANT: "Restaurant",
  LIVRAISON: "Livraison",
  CALL_CENTER: "Call center",
};

export const GESTES: IncidentGeste[] = ["AUCUN", "EXCUSES", "BON", "REMPLACEMENT", "REMBOURSEMENT"];

export const LIBELLE_GESTE: Record<IncidentGeste, string> = {
  AUCUN: "Aucun geste",
  EXCUSES: "Excuses",
  BON: "Bon de réduction",
  REMPLACEMENT: "Remplacement",
  REMBOURSEMENT: "Remboursement",
};

export const RECONTACTS: IncidentRecontact[] = ["INFORME", "INJOIGNABLE", "SANS_RECONTACT"];

export const LIBELLE_RECONTACT: Record<IncidentRecontact, string> = {
  INFORME: "Client informé",
  INJOIGNABLE: "Client injoignable",
  SANS_RECONTACT: "Sans recontact",
};

export const LIBELLE_TYPE_COMMANDE: Record<string, string> = {
  DELIVERY: "À livrer",
  PICKUP: "À récupérer",
  TABLE: "À table",
};

// ─── Couleurs ────────────────────────────────────────────────────────────────

export interface Couleur {
  fond: string;
  texte: string;
}

export const COULEUR_STATUT: Record<IncidentStatut, Couleur> = {
  OUVERT: { fond: "#FDE8DC", texte: "#9A3412" },
  EN_COURS: { fond: "#FEF3C7", texte: "#92400E" },
  RESOLU: { fond: "#DBEAFE", texte: "#1E40AF" },
  CLOTURE: { fond: "#DCFCE7", texte: "#166534" },
};

export const COULEUR_GRAVITE: Record<IncidentGravite, Couleur> = {
  FAIBLE: { fond: "#F4F4F5", texte: "#52525B" },
  MOYENNE: { fond: "#FEF3C7", texte: "#92400E" },
  HAUTE: { fond: "#FEE2E2", texte: "#B91C1C" },
};

// ─── Rôles (menu, boutons d'entrée) ──────────────────────────────────────────

const ROLES_LECTURE = ["ADMIN", "CALL_CENTER", "MARKETING", "LIVRAISON_OPS", "MANAGER", "ASSISTANT_MANAGER", "CAISSIER"];
const ROLES_SIGNALEMENT = ["ADMIN", "CALL_CENTER", "MANAGER", "ASSISTANT_MANAGER", "CAISSIER"];
const ROLES_SIEGE = ["ADMIN", "CALL_CENTER"];

type Compte = { role?: string | null; type?: string | null } | null | undefined;

export const peutVoirIncidents = (u: Compte) => !!u?.role && ROLES_LECTURE.includes(u.role);
export const peutSignalerIncident = (u: Compte) => !!u?.role && ROLES_SIGNALEMENT.includes(u.role);
/** Administrateur ou call center : tout le réseau, responsable, réouverture, export. */
export const estSiegeIncidents = (u: Compte) => !!u?.role && ROLES_SIEGE.includes(u.role) && u.type !== "RESTAURANT";
export const peutReglerIncidents = (u: Compte) => u?.role === "ADMIN";

// ─── Nombres, dates, durées ──────────────────────────────────────────────────

/** « 2.000 F », comme les autres écrans du back-office. */
export function formatMontant(n: number | null | undefined): string {
  const montant = typeof n === "number" && Number.isFinite(n) ? Math.round(n) : 0;
  return `${String(montant).replace(/\B(?=(\d{3})+(?!\d))/g, ".")} F`;
}

const deux = (n: number) => String(n).padStart(2, "0");

/** « 11/11 à 18 h 30 » ; vide sans date lisible. */
export function formatJourHeure(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${deux(d.getDate())}/${deux(d.getMonth() + 1)} à ${d.getHours()} h ${deux(d.getMinutes())}`;
}

/** « 11/11/2026 » */
export function formatJour(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${deux(d.getDate())}/${deux(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** « 45 min », « 3 h », « 2 j » : l'ordre de grandeur suffit. */
export function dureeEnMots(ms: number): string {
  const minutes = Math.max(0, Math.round(ms / 60_000));
  if (minutes < 1) return "moins d'une minute";
  if (minutes < 60) return `${minutes} min`;
  const heures = Math.round(minutes / 60);
  if (heures < 48) return `${heures} h`;
  return `${Math.round(heures / 24)} j`;
}

/**
 * Le délai d'un incident, en toutes lettres : « en retard de 3 h », sinon
 * « à résoudre avant le 12/11 à 10 h 00 ». Rien une fois résolu.
 */
export function texteDelai(
  i: Pick<IncidentLigne, "statut" | "echeance_at">,
  maintenant: Date,
): { texte: string; retard: boolean } | null {
  if (i.statut !== "OUVERT" && i.statut !== "EN_COURS") return null;
  const echeance = new Date(i.echeance_at).getTime();
  if (Number.isNaN(echeance)) return null;
  const ecart = echeance - maintenant.getTime();
  if (ecart < 0) return { texte: `en retard de ${dureeEnMots(-ecart)}`, retard: true };
  return { texte: `à résoudre avant le ${formatJourHeure(i.echeance_at)}`, retard: false };
}

/** Ce que la carte dit du temps, selon la colonne. */
export function texteTempsCarte(
  i: Pick<IncidentLigne, "statut" | "echeance_at" | "created_at" | "resolu_at" | "cloture_at">,
  maintenant: Date,
): { texte: string; retard: boolean } {
  const delai = texteDelai(i, maintenant);
  if (delai) return delai;
  if (i.statut === "RESOLU" && i.resolu_at) {
    return { texte: `résolu depuis ${dureeEnMots(maintenant.getTime() - new Date(i.resolu_at).getTime())}`, retard: false };
  }
  if (i.statut === "CLOTURE" && i.cloture_at) return { texte: `clôturé le ${formatJourHeure(i.cloture_at)}`, retard: false };
  return { texte: `signalé le ${formatJourHeure(i.created_at)}`, retard: false };
}

/** Fin d'une référence de commande : « ORD-261110-50950 » → « …50950 ». */
export function finDeReference(reference: string): string {
  const fin = reference.split("-").pop()?.trim();
  return fin && fin !== reference ? `…${fin}` : reference;
}

/** « 07 07 00 00 01 » pour un numéro ivoirien ; tel quel sinon (numéro masqué compris). */
export function telephoneLisible(telephone: string | null | undefined): string {
  if (!telephone) return "";
  const local = telephone.replace(/^\+225/, "");
  if (!/^\d{10}$/.test(local)) return telephone;
  return local.replace(/(\d{2})(?=\d)/g, "$1 ");
}

/** Lien `tel:` ; null pour un numéro masqué ou absent. */
export function lienTelephone(telephone: string | null | undefined): string | null {
  if (!telephone || /[^\d+\s]/.test(telephone)) return null;
  return `tel:${telephone.replace(/\s/g, "")}`;
}

/** Lien WhatsApp ; null pour un numéro masqué ou absent. */
export function lienWhatsApp(telephone: string | null | undefined): string | null {
  if (!lienTelephone(telephone)) return null;
  const chiffres = (telephone as string).replace(/\D/g, "");
  return chiffres.length >= 8 ? `https://wa.me/${chiffres}` : null;
}

// ─── Signalement ─────────────────────────────────────────────────────────────

export const DESCRIPTION_MIN = 5;
export const DESCRIPTION_MAX = 2000;
export const TEXTE_MIN = 3;
export const TEXTE_MAX = 1000;
export const MOTIF_MAX = 500;
export const NOTE_MAX = 2000;

/** Gravité proposée pour une note après commande : une étoile, c'est grave. */
export function graviteDepuisNote(note: number): IncidentGravite {
  if (note <= 1) return "HAUTE";
  if (note <= 2) return "MOYENNE";
  return "FAIBLE";
}

/** Gravité proposée pour un retour privé du site. */
export function graviteDepuisRessenti(ressenti: string): IncidentGravite {
  return ressenti === "PAS_CONTENT" ? "HAUTE" : "MOYENNE";
}

/** L'origine est imposée par le lien : la fenêtre ne la demande pas. */
export function origineImposee(d: DemandeSignalement | null | undefined): IncidentOrigine | null {
  if (d?.ticketId) return "TICKET";
  if (d?.avisId) return "AVIS";
  if (d?.commentId) return "NOTE";
  return null;
}

/** Incident non clôturé de la même catégorie sur cette commande : on l'ouvre au lieu d'en créer un second. */
export function doublonOuvert(incidents: readonly IncidentLigne[] | undefined, categorieId: string): IncidentLigne | null {
  if (!categorieId) return null;
  return incidents?.find((i) => i.categorie.id === categorieId && i.statut !== "CLOTURE") ?? null;
}

export interface SaisieSignalement {
  orderId: string;
  categorieId: string;
  gravite: IncidentGravite | "";
  origine: IncidentOrigine | "";
  description: string;
}

/** Ce qui manque avant d'envoyer, en une phrase ; null quand tout y est. */
export function manqueAuSignalement(s: SaisieSignalement, origine: IncidentOrigine | null): string | null {
  if (!s.orderId) return "Choisissez la commande.";
  if (!s.categorieId) return "Choisissez la catégorie.";
  if (!s.gravite) return "Choisissez la gravité.";
  if (!origine && !s.origine) return "Indiquez l'origine du signalement.";
  if (s.description.trim().length < DESCRIPTION_MIN) return "Décrivez le problème.";
  return null;
}

// ─── Résolution et clôture ───────────────────────────────────────────────────

export function manqueALaResolution(s: {
  cause: string;
  action: string;
  geste: IncidentGeste | "";
  bonMontant: number | null;
  bonExistant: boolean;
}): string | null {
  if (s.cause.trim().length < TEXTE_MIN) return "Indiquez la cause.";
  if (s.action.trim().length < TEXTE_MIN) return "Indiquez l'action corrective.";
  if (!s.geste) return "Choisissez le geste pour le client.";
  if (s.geste === "BON" && !s.bonExistant && !s.bonMontant) return "Choisissez le montant du bon.";
  return null;
}

export function manqueALaCloture(s: { recontact: IncidentRecontact | ""; reaction: string }): string | null {
  if (!s.recontact) return "Indiquez si le client a été informé.";
  if (s.recontact === "INFORME" && s.reaction.trim().length < TEXTE_MIN) return "Notez la réaction du client.";
  return null;
}

// ─── Filtres ─────────────────────────────────────────────────────────────────

/** Filtres sans valeur vide : la clé des requêtes ne change pas pour un filtre effacé. */
export function filtresNets<T extends FiltresIncidents | FiltresHistorique>(f: T): T {
  const net: Record<string, unknown> = {};
  for (const [cle, valeur] of Object.entries(f)) {
    const v = typeof valeur === "string" ? valeur.trim() : valeur;
    if (v !== undefined && v !== null && v !== "") net[cle] = v;
  }
  return net as T;
}

const ilYa = (jours: number) => new Date(Date.now() - jours * 86_400_000).toISOString().slice(0, 10);

/** Tableau de bord : 30 derniers jours. */
export const periodeParDefaut = () => ({ from: ilYa(29), to: ilYa(0) });

// ─── Cloche, pastille ────────────────────────────────────────────────────────

/** Incident visé par une notification de la cloche (`{ kind: 'incident', incident_id }`). */
export function cibleNotificationIncident(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const d = data as { kind?: unknown; incident_id?: unknown };
  return d.kind === "incident" && typeof d.incident_id === "string" && d.incident_id ? d.incident_id : null;
}

/** Pastille de l'onglet « Incidents » : ceux que personne n'a pris ; masquée à 0. */
export function pastilleIncidents(compteurs: { ouverts: number } | undefined): number | undefined {
  return compteurs && compteurs.ouverts > 0 ? compteurs.ouverts : undefined;
}

// ─── Erreurs ─────────────────────────────────────────────────────────────────

export const CODE_DOUBLON = "INCIDENT_DOUBLON";

const TEXTES_PAR_DEFAUT = new Set(["Internal server error", "Forbidden resource", "Bad Request", "Not Found"]);

/** Message du serveur quand il est écrit pour l'utilisateur, sinon une phrase simple. */
export function messageErreurIncident(e: unknown, parDefaut = "Une erreur est survenue. Réessayez."): string {
  const err = (e ?? {}) as { message?: unknown; messageServeur?: unknown };
  if (typeof err.messageServeur === "string" && err.messageServeur.trim() && !TEXTES_PAR_DEFAUT.has(err.messageServeur.trim())) {
    return err.messageServeur;
  }
  if (Array.isArray(err.message)) return err.message.join(" ");
  if (typeof err.message === "string" && err.message.trim() && !TEXTES_PAR_DEFAUT.has(err.message.trim())) return err.message;
  return parDefaut;
}

export const estDoublon = (e: unknown) => (e as { code?: unknown } | null)?.code === CODE_DOUBLON;
