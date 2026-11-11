/**
 * RETOURS PRIVÉS « TON AVIS COMPTE » : mots, couleurs, dates et droits.
 *
 * Jumeau de `backend/src/modules/customer/avis-prives/avis-prive.rules.ts`
 * (contrat .banc-test-crm/avis/contrat-avis.md, 3.1 et 6) : une ligne changée
 * au serveur se change ici, le test bun compare les deux listes.
 *
 * Au back-office, une commande prise par téléphone s'appelle « Manuel »
 * (règle du client) ; le formulaire du site, lui, dit « Téléphone ».
 *
 * Fichier pur (aucun React), testé par `bun test`.
 */

import type {
  ActionJournal,
  AgentAvisDTO,
  AvisCanal,
  AvisFiche,
  AvisResultat,
  AvisRessenti,
  AvisSolution,
  AvisStatut,
  CommandeAvisDTO,
  FiltresAvis,
  PeriodeAvis,
  RequeteAvis,
} from "../types/avis-prive.types";

// ─── Mots (contrat 3.1) ─────────────────────────────────────────────────────

export const LIBELLE_RESSENTI: Record<AvisRessenti, string> = {
  PAS_CONTENT: "Pas content",
  PEUT_MIEUX_FAIRE: "Peut mieux faire",
  AU_TOP: "Au top",
};

/** À l'écran : « Téléphone » du formulaire devient « Manuel ». */
export const LIBELLE_CANAL: Record<AvisCanal, string> = {
  APPLI: "Appli",
  SITE_WEB: "Site web",
  TELEPHONE: "Manuel",
  WHATSAPP: "WhatsApp",
  SUR_PLACE: "Sur place",
  AUTRE_PLATEFORME: "Autre plateforme",
};

export const LIBELLE_STATUT: Record<AvisStatut, string> = {
  NOUVEAU: "Nouveau",
  A_RAPPELER: "À rappeler",
  EN_COURS: "En cours",
  INJOIGNABLE: "Injoignable",
  INCIDENT_OUVERT: "Incident ouvert",
  RESOLU: "Résolu",
  CLASSE: "Classé",
};

export const LIBELLE_SOLUTION: Record<AvisSolution, string> = {
  EXCUSES: "Excuses",
  GESTE_COMMERCIAL: "Geste commercial",
  REMPLACEMENT: "Remplacement",
  REMBOURSEMENT: "Remboursement",
  AUCUNE: "Aucune",
};

export const LIBELLE_RESULTAT: Record<AvisResultat, string> = {
  JOINT: "Joint",
  INJOIGNABLE: "Injoignable",
  MESSAGERIE: "Messagerie",
};

export const LIBELLE_ACTION: Record<ActionJournal, string> = {
  APPEL: "Appel",
  WHATSAPP: "Message WhatsApp",
  NOTE: "Note interne",
};

/**
 * Sources de la liste blanche (QR codes imprimés), jumelles du serveur.
 * Un code inconnu se lit « Site web », comme le serveur l'enregistre.
 */
export const SOURCES: Record<string, string> = {
  "marque-page": "QR code marque-page",
  ticket: "QR code ticket de caisse",
  sac: "QR code sac",
  site: "Site web",
};

export function libelleSource(code: string | null | undefined): string {
  return (code && SOURCES[code]) || SOURCES.site;
}

export const RESSENTIS: AvisRessenti[] = ["PAS_CONTENT", "PEUT_MIEUX_FAIRE", "AU_TOP"];

export const STATUTS: AvisStatut[] = [
  "NOUVEAU",
  "A_RAPPELER",
  "EN_COURS",
  "INJOIGNABLE",
  "INCIDENT_OUVERT",
  "RESOLU",
  "CLASSE",
];

export const SOLUTIONS: AvisSolution[] = ["EXCUSES", "GESTE_COMMERCIAL", "REMPLACEMENT", "REMBOURSEMENT", "AUCUNE"];

export const PERIODES: { valeur: PeriodeAvis; libelle: string }[] = [
  { valeur: "7j", libelle: "7 derniers jours" },
  { valeur: "aujourdhui", libelle: "Aujourd'hui" },
  { valeur: "30j", libelle: "30 derniers jours" },
  { valeur: "tout", libelle: "Tout" },
];

export const SANS_PRENOM = "Sans prénom";
export const JE_NE_SAIS_PAS = "Je ne sais pas";
export const NON_ASSIGNE = "Non assigné";

/** Prénom saisi (ou du compte), sinon « Sans prénom ». */
export const nomAffiche = (prenom: string | null | undefined) => prenom?.trim() || SANS_PRENOM;

// ─── Couleurs des pastilles (maquette) ──────────────────────────────────────

export interface Couleur {
  fond: string;
  texte: string;
}

export const COULEUR_RESSENTI: Record<AvisRessenti, Couleur> = {
  PAS_CONTENT: { fond: "#FDE2D3", texte: "#8A2C00" },
  PEUT_MIEUX_FAIRE: { fond: "#FEF0C7", texte: "#7A4B00" },
  AU_TOP: { fond: "#DCF2E3", texte: "#1C5E34" },
};

export const COULEUR_STATUT: Record<AvisStatut, Couleur> = {
  NOUVEAU: { fond: "#E5EEFB", texte: "#1E4D8F" },
  A_RAPPELER: { fond: "#FFF1E8", texte: "#8A3500" },
  EN_COURS: { fond: "#EFE7F8", texte: "#5B2E91" },
  INJOIGNABLE: { fond: "#E2E8F0", texte: "#334155" },
  INCIDENT_OUVERT: { fond: "#FDE2D3", texte: "#8A2C00" },
  RESOLU: { fond: "#DCF2E3", texte: "#1C5E34" },
  CLASSE: { fond: "#EEEAE6", texte: "#4A3B30" },
};

// ─── Droits (contrat 4.3) ───────────────────────────────────────────────────

/**
 * Miroir de `ROLES_TRAITEMENT_AVIS` du serveur
 * (`src/modules/auth/constantes/roles-avis-prives.ts`) : journal, statut,
 * commande cochée, agent et ticket. Le droit COMMENTAIRES UPDATE n'y est pour
 * rien (il donne la curation des témoignages du site).
 */
export const ROLES_TRAITEMENT_AVIS = ["ADMIN", "CALL_CENTER"] as const;

export function peutTraiterAvis(user: { role?: string | null } | null | undefined): boolean {
  return !!user?.role && (ROLES_TRAITEMENT_AVIS as readonly string[]).includes(user.role);
}

/** Gestes du journal possibles : sans accord de rappel, seule la note interne. */
export function actionsPossibles(accordRappel: boolean): ActionJournal[] {
  return accordRappel ? ["APPEL", "WHATSAPP", "NOTE"] : ["NOTE"];
}

/** Résultats d'un geste : un message WhatsApp n'a pas de messagerie. */
export function resultatsPossibles(action: ActionJournal): AvisResultat[] {
  if (action === "APPEL") return ["JOINT", "INJOIGNABLE", "MESSAGERIE"];
  if (action === "WHATSAPP") return ["JOINT", "INJOIGNABLE"];
  return [];
}

/** Statuts de la section Clôture, grisés quand le serveur les refuserait. */
export const STATUTS_CLOTURE: AvisStatut[] = ["A_RAPPELER", "EN_COURS", "INJOIGNABLE", "INCIDENT_OUVERT", "RESOLU", "CLASSE"];

export function optionsCloture(accordRappel: boolean): { valeur: AvisStatut; libelle: string; desactive: boolean }[] {
  return STATUTS_CLOTURE.map((s) => ({
    valeur: s,
    libelle: LIBELLE_STATUT[s],
    desactive: s === "INCIDENT_OUVERT" || (!accordRappel && (s === "A_RAPPELER" || s === "INJOIGNABLE")),
  }));
}

/** La solution ne compte que pour Résolu (obligatoire) et Classé (facultative). */
export const solutionPossible = (statut: AvisStatut | "") => statut === "RESOLU" || statut === "CLASSE";

/**
 * Clé de montage du formulaire Clôture : l'avis, son statut et sa solution.
 * Un autre avis (cloche, liste) ou une fiche relue repart de ses valeurs à
 * lui, jamais du choix laissé en plan sur l'avis d'avant.
 */
export const cleCloture = (avis: Pick<AvisFiche, "id" | "statut" | "solution">) =>
  `${avis.id}-${avis.statut}-${avis.solution ?? ""}`;

// ─── Corps des gestes : la valeur LUE part avec (claim du serveur) ─────────

/** Cocher ou décocher : la commande cochée vue à l'écran part avec. */
export const corpsCommande = (avis: Pick<AvisFiche, "order_id">, orderId: string | null): CommandeAvisDTO => ({
  order_id: orderId,
  order_id_lu: avis.order_id ?? null,
});

/** Changer d'agent : l'agent vu à l'écran part avec. */
export const corpsAgent = (avis: Pick<AvisFiche, "agent">, agentId: string | null): AgentAvisDTO => ({
  agent_id: agentId,
  agent_lu: avis.agent?.id ?? null,
});

/** Pourquoi « Créer un incident » est grisé, ou `null` s'il est possible. */
export function raisonIncidentImpossible(avis: Pick<AvisFiche, "rapproche" | "order_id">): string | null {
  if (!avis.rapproche) return "Client non rapproché.";
  if (!avis.order_id) return "Cocher d'abord la commande concernée.";
  return null;
}

// ─── Dates (heure locale du poste) ──────────────────────────────────────────

const deux = (n: number) => String(n).padStart(2, "0");

/** `02/11` */
export const formatJour = (d: Date) => `${deux(d.getDate())}/${deux(d.getMonth() + 1)}`;

/** `08:42` */
export const formatHeure = (d: Date) => `${deux(d.getHours())}:${deux(d.getMinutes())}`;

/** `02/11 · 08:42` : colonne « Reçu le », titre de la fiche, lignes du journal. */
export function formatRecu(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${formatJour(d)} · ${formatHeure(d)}`;
}

/** `35 min`, `2 h`, `3 j` */
export function duree(ms: number): string {
  const minutes = Math.max(1, Math.floor(ms / 60_000));
  if (minutes < 60) return `${minutes} min`;
  const heures = Math.floor(minutes / 60);
  if (heures < 24) return `${heures} h`;
  return `${Math.floor(heures / 24)} j`;
}

const memeJour = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/**
 * Colonne « Échéance » : « Aujourd'hui 10:15 », « Demain 21:03 », ou
 * « Dépassée de 2 h » (rouge). Vide quand l'échéance est sans objet.
 */
export function formatEcheance(
  iso: string | null | undefined,
  enRetard: boolean,
  maintenant: Date = new Date(),
): { texte: string; depassee: boolean } {
  if (!iso) return { texte: "", depassee: false };
  const e = new Date(iso);
  const ecart = maintenant.getTime() - e.getTime();
  if (enRetard || ecart > 0) return { texte: `Dépassée de ${duree(ecart)}`, depassee: true };
  const demain = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate() + 1);
  if (memeJour(e, maintenant)) return { texte: `Aujourd'hui ${formatHeure(e)}`, depassee: false };
  if (memeJour(e, demain)) return { texte: `Demain ${formatHeure(e)}`, depassee: false };
  return { texte: `${formatJour(e)} · ${formatHeure(e)}`, depassee: false };
}

/** En-tête de la fiche : « Échéance dépassée de 2 h », ou `null`. */
export function texteRetardFiche(
  iso: string | null | undefined,
  enRetard: boolean,
  maintenant: Date = new Date(),
): string | null {
  const e = formatEcheance(iso, enRetard, maintenant);
  return e.depassee ? `Échéance ${e.texte.charAt(0).toLowerCase()}${e.texte.slice(1)}` : null;
}

// ─── Téléphone ──────────────────────────────────────────────────────────────

const chiffres = (tel?: string | null) => (tel ?? "").replace(/\D/g, "");

/** Les 10 chiffres d'un mobile ivoirien, avec ou sans indicatif, sinon `null`. */
function local(tel?: string | null): string | null {
  if (!tel || tel.includes("•")) return null;
  const d = chiffres(tel);
  if (d.length === 10) return d;
  if (d.length === 13 && d.startsWith("225")) return d.slice(3);
  return null;
}

const espacer = (d: string) => d.replace(/(\d{2})(?=\d)/g, "$1 ");

/** `01 23 45 67 89` ; un numéro masqué ou étranger reste tel quel. */
export function telephoneLocal(tel?: string | null): string {
  const l = local(tel);
  return l ? espacer(l) : tel ?? "";
}

/** `+225 01 23 45 67 89` (fiche) ; un numéro masqué ou étranger reste tel quel. */
export function telephoneComplet(tel?: string | null): string {
  const l = local(tel);
  return l ? `+225 ${espacer(l)}` : tel ?? "";
}

/**
 * Lien WhatsApp, ou RIEN quand le numéro n'est pas composable : même garde
 * que `lienAppel` du CRM. Un numéro masqué (« +225••••••••01 ») donnerait
 * sinon un lien d'apparence normale vers un faux numéro.
 */
export function lienWhatsApp(tel?: string | null): string | undefined {
  if (!tel || tel.includes("•")) return undefined;
  const d = chiffres(tel);
  if (d.length < 8) return undefined;
  return `https://wa.me/${d.length === 10 ? `225${d}` : d}`;
}

// ─── Filtres de la liste ────────────────────────────────────────────────────

export const FILTRES_DEFAUT: FiltresAvis = {
  recherche: "",
  ressenti: "",
  statut: "",
  en_retard: false,
  resolus_7j: false,
  store: "",
  periode: "7j",
  page: 1,
};

export const TAILLE_PAGE = 20;

/** Filtres gardés dans le store, complétés : un ancien état n'a pas toutes les clés. */
export function lireFiltres(brut: unknown): FiltresAvis {
  const f = (brut && typeof brut === "object" ? brut : {}) as Partial<FiltresAvis>;
  return {
    recherche: typeof f.recherche === "string" ? f.recherche : "",
    ressenti: RESSENTIS.includes(f.ressenti as AvisRessenti) ? (f.ressenti as AvisRessenti) : "",
    statut: STATUTS.includes(f.statut as AvisStatut) ? (f.statut as AvisStatut) : "",
    en_retard: f.en_retard === true,
    resolus_7j: f.resolus_7j === true,
    store: typeof f.store === "string" ? f.store : "",
    periode: PERIODES.some((p) => p.valeur === f.periode) ? (f.periode as PeriodeAvis) : "7j",
    page: typeof f.page === "number" && f.page >= 1 ? f.page : 1,
  };
}

/**
 * Paramètres du serveur. Une recherche de moins de 2 caractères ne part pas ;
 * un compte de point de vente n'envoie pas de store (le serveur impose le sien).
 */
export function requeteDepuisFiltres(f: FiltresAvis, pointDeVente = false): RequeteAvis {
  const recherche = f.recherche.trim();
  return {
    page: f.page,
    limit: TAILLE_PAGE,
    ...(recherche.length >= 2 ? { recherche } : {}),
    ...(f.ressenti ? { ressenti: f.ressenti } : {}),
    ...(f.statut ? { statut: f.statut } : {}),
    ...(f.en_retard ? { en_retard: "true" as const } : {}),
    ...(f.resolus_7j ? { resolus_7j: "true" as const } : {}),
    ...(!pointDeVente && f.store ? { restaurantId: f.store } : {}),
    periode: f.periode,
  };
}

export type CleCompteur = "nouveaux" | "a_rappeler" | "echeance_depassee" | "resolus_7j";

export const COMPTEURS: { cle: CleCompteur; libelle: string }[] = [
  { cle: "nouveaux", libelle: "Nouveaux" },
  { cle: "a_rappeler", libelle: "À rappeler" },
  { cle: "echeance_depassee", libelle: "Échéance dépassée" },
  { cle: "resolus_7j", libelle: "Résolus sur 7 jours" },
];

/**
 * Filtres posés par un clic sur un compteur. Les compteurs ne suivent que le
 * store : ressenti et recherche sont donc retirés, pour que la liste montre
 * ce que le chiffre compte. « Résolus sur 7 jours » compte sur la date de
 * RÉSOLUTION : son filtre est celui du serveur (`resolus_7j`), période Tout,
 * et non la période « 7 derniers jours » qui porte sur la date de réception.
 */
export function filtresDuCompteur(cle: CleCompteur, f: FiltresAvis): FiltresAvis {
  const base: FiltresAvis = { ...f, recherche: "", ressenti: "", page: 1, en_retard: false, resolus_7j: false };
  switch (cle) {
    case "nouveaux":
      return { ...base, statut: "NOUVEAU", periode: "tout" };
    case "a_rappeler":
      return { ...base, statut: "A_RAPPELER", periode: "tout" };
    case "echeance_depassee":
      return { ...base, statut: "", en_retard: true, periode: "tout" };
    case "resolus_7j":
      return { ...base, statut: "", resolus_7j: true, periode: "tout" };
  }
}

/** Pastille de l'onglet « Retours privés » : masquée à 0. */
export function pastilleOnglet(aTraiter: number | null | undefined): string | null {
  if (!aTraiter || aTraiter < 1) return null;
  return aTraiter > 99 ? "99+" : String(aTraiter);
}

// ─── Cloche ─────────────────────────────────────────────────────────────────

/**
 * Avis à ouvrir depuis une notification de la cloche (`{ kind: 'avis',
 * avis_id }`), ou `null` si la notification n'en est pas une.
 */
export function cibleNotificationAvis(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const d = data as { kind?: unknown; avis_id?: unknown };
  return d.kind === "avis" && typeof d.avis_id === "string" && d.avis_id ? d.avis_id : null;
}

// ─── Erreurs ────────────────────────────────────────────────────────────────

export const MESSAGE_CONFLIT = "L'avis a changé entre-temps. Rechargez la fiche.";

// ─── Affichage pendant un rafraîchissement raté ─────────────────────────────

export const AVERTISSEMENT_FICHE = "Mise à jour impossible pour le moment : la fiche n'est peut-être plus à jour.";
export const AVERTISSEMENT_LISTE = "Mise à jour impossible pour le moment : la liste n'est peut-être plus à jour.";

const estIntrouvable = (e: unknown) => (e as { status?: unknown } | null)?.status === 404;

/**
 * Ce que montre la fiche. Un rafraîchissement raté (serveur redémarré,
 * réseau coupé) garde la fiche déjà chargée, avec un avertissement : sinon
 * le journal et la clôture seraient démontés et la note en cours perdue.
 * L'écran d'erreur seulement sans fiche ; « introuvable » dès un 404 (avis
 * supprimé entre-temps), même s'il en reste une copie.
 */
export function etatFiche(q: {
  avis: AvisFiche | undefined;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
}): { etat: "chargement" | "introuvable" | "erreur" | "fiche"; avertissement: boolean } {
  if (q.isError && estIntrouvable(q.error)) return { etat: "introuvable", avertissement: false };
  if (q.avis) return { etat: "fiche", avertissement: q.isError };
  if (q.isLoading) return { etat: "chargement", avertissement: false };
  return { etat: "erreur", avertissement: false };
}

/** Ce que montre la liste : même règle, le tableau déjà chargé reste. */
export function etatListe(q: {
  lignes: unknown[] | undefined;
  isLoading: boolean;
  isError: boolean;
}): { etat: "chargement" | "erreur" | "vide" | "table"; avertissement: boolean } {
  if (q.lignes) return { etat: q.lignes.length ? "table" : "vide", avertissement: q.isError };
  if (q.isLoading) return { etat: "chargement", avertissement: false };
  return { etat: q.isError ? "erreur" : "vide", avertissement: false };
}

/** Textes par défaut du cadriciel du serveur, en anglais : jamais montrés. */
const TEXTES_PAR_DEFAUT_SERVEUR = new Set(["Internal server error", "Not Found", "Forbidden resource", "Too Many Requests"]);

/**
 * Message à montrer pour une erreur du serveur. Le client HTTP garde le texte
 * du serveur à part (`messageServeur`) pour un 404 ou un 500 (« Catégorie de
 * ticket introuvable. », « Le ticket n'a pas pu être créé. ») ; un 400 de
 * validation arrive en tableau.
 */
export function messageErreurAvis(e: unknown, parDefaut = "Une erreur est survenue. Veuillez réessayer."): string {
  const err = (e ?? {}) as { message?: unknown; messageServeur?: unknown; status?: unknown };
  if (err.status === 409) return MESSAGE_CONFLIT;
  if (
    typeof err.messageServeur === "string" &&
    err.messageServeur.trim() &&
    !TEXTES_PAR_DEFAUT_SERVEUR.has(err.messageServeur.trim())
  ) {
    return err.messageServeur;
  }
  if (Array.isArray(err.message)) return err.message.join(" ");
  if (typeof err.message === "string" && err.message.trim()) return err.message;
  return parDefaut;
}

// ─── Tri (jumeau du serveur, 3.9) ──────────────────────────────────────────

const NON_TRAITES: AvisStatut[] = ["NOUVEAU", "A_RAPPELER", "EN_COURS", "INJOIGNABLE"];

/** « Pas content » encore à traiter : en tête de liste. */
export const prioritaire = (a: { ressenti: AvisRessenti; statut: AvisStatut }) =>
  a.ressenti === "PAS_CONTENT" && NON_TRAITES.includes(a.statut);

/**
 * Jumeau de `SQL_TRI` du serveur (l'écran garde l'ordre du serveur ; ce
 * jumeau prouve la règle sur l'exemple de la maquette) : les « Pas content »
 * non traités d'abord, du plus ancien au plus récent, puis tout le reste, du
 * plus récent au plus ancien.
 */
export function comparerAvis(
  a: { id: string; ressenti: AvisRessenti; statut: AvisStatut; created_at: string },
  b: { id: string; ressenti: AvisRessenti; statut: AvisStatut; created_at: string },
): number {
  const pa = prioritaire(a);
  const pb = prioritaire(b);
  if (pa !== pb) return pa ? -1 : 1;
  const ecart = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  if (ecart !== 0) return pa ? ecart : -ecart;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}
