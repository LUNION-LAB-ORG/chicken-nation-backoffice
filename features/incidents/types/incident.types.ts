/**
 * INCIDENTS SUR COMMANDE (11/11) : formes rendues par `/incidents`.
 * Contrat : `.banc-test-crm/incidents/contrat-incidents.md`.
 */

export type IncidentStatut = "OUVERT" | "EN_COURS" | "RESOLU" | "CLOTURE";
export type IncidentGravite = "FAIBLE" | "MOYENNE" | "HAUTE";
export type IncidentOrigine =
  | "APPEL"
  | "WHATSAPP"
  | "SUR_PLACE"
  | "CONSTAT_INTERNE"
  | "TICKET"
  | "AVIS"
  | "NOTE"
  | "RAPPEL";
export type IncidentPole = "RESTAURANT" | "LIVRAISON" | "CALL_CENTER";
export type IncidentGeste = "AUCUN" | "EXCUSES" | "BON" | "REMPLACEMENT" | "REMBOURSEMENT";
export type IncidentRecontact = "INFORME" | "INJOIGNABLE" | "SANS_RECONTACT";
export type IncidentSuiviType =
  | "CREATION"
  | "ASSIGNATION"
  | "RESOLUTION"
  | "BON"
  | "MESSAGE"
  | "CLOTURE"
  | "REOUVERTURE"
  | "NOTE"
  | "RETARD";

export interface CategorieIncident {
  id: string;
  nom: string;
  pole: IncidentPole;
  delai_heures: number;
  actif: boolean;
  ordre: number;
}

export type Bareme = Record<IncidentGravite, number>;

export interface ReglagesIncident {
  categories: CategorieIncident[];
  bareme: Bareme;
  validite_jours: number;
  bon_restaurant: boolean;
}

export interface IncidentLigne {
  id: string;
  code: string;
  statut: IncidentStatut;
  gravite: IncidentGravite;
  origine: IncidentOrigine;
  pole: IncidentPole;
  categorie: { id: string; nom: string };
  extrait: string;
  commande: { id: string; reference: string };
  restaurant: { id: string; name: string };
  client: { id: string; nom: string; telephone: string | null };
  agent: { id: string; fullname: string } | null;
  geste: IncidentGeste | null;
  bon_montant: number | null;
  echeance_at: string;
  en_retard: boolean;
  created_at: string;
  resolu_at: string | null;
  cloture_at: string | null;
}

export interface ContexteCommande {
  id: string;
  reference: string;
  created_at: string;
  type: "DELIVERY" | "PICKUP" | "TABLE";
  statut: string;
  montant: number;
  restaurant: { id: string; name: string };
  client: { id: string; nom: string; telephone: string | null };
}

export interface DroitsIncident {
  /** Ce compte traite cet incident : code du bon lisible, SMS à renvoyer, bon à créer. */
  traiter: boolean;
  noter: boolean;
  prendre: boolean;
  assigner: boolean;
  resoudre: boolean;
  bon: boolean;
  cloturer: boolean;
  rouvrir: boolean;
}

export interface SuiviIncident {
  id: string;
  type: IncidentSuiviType;
  texte: string;
  note: string | null;
  auteur_nom: string | null;
  created_at: string;
}

export interface IncidentFiche extends Omit<IncidentLigne, "commande"> {
  description: string;
  cause: string | null;
  action: string | null;
  recontact: IncidentRecontact | null;
  reaction: string | null;
  signale_par: string | null;
  resolu_par: string | null;
  cloture_par: string | null;
  assigne_at: string | null;
  commande: ContexteCommande;
  bon: {
    code: string;
    montant: number;
    statut: "ACTIVE" | "REDEEMED" | "EXPIRED" | "CANCELLED";
    expire_at: string | null;
    message_at: string | null;
    message_canal: string | null;
  } | null;
  bon_a_creer: boolean;
  liens: {
    ticket: { id: string; code: string } | null;
    avis_id: string | null;
    note: { id: string; rating: number } | null;
  };
  autres: { id: string; code: string; statut: IncidentStatut; categorie: string; created_at: string }[];
  suivis: SuiviIncident[];
  droits: DroitsIncident;
  montants_bon: number[];
  bon_suggere: number;
}

export interface ColonneIncidents {
  total: number;
  incidents: IncidentLigne[];
}

export interface TableauIncidents {
  colonnes: Record<IncidentStatut, ColonneIncidents>;
}

export interface PageIncidents {
  data: IncidentLigne[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface CompteursIncidents {
  ouverts: number;
  en_cours: number;
  resolus: number;
  en_retard: number;
}

export interface IncidentsCommande {
  commande: ContexteCommande;
  incidents: IncidentLigne[];
  peut_signaler: boolean;
}

export interface IncidentOuvert {
  id: string;
  code: string;
  order_id: string;
  statut: IncidentStatut;
  gravite: IncidentGravite;
  categorie: string;
}

export interface AgentIncident {
  id: string;
  fullname: string;
  role: string;
}

export interface StatistiquesIncidents {
  du: string;
  au: string;
  total: number;
  ouverts: number;
  en_cours: number;
  resolus: number;
  clotures: number;
  en_retard: number;
  delai_moyen_heures: number | null;
  dans_les_delais_pct: number | null;
  par_categorie: { id: string; nom: string; total: number; ouverts: number }[];
  par_restaurant: { id: string; name: string; total: number; ouverts: number }[];
  par_pole: { pole: IncidentPole; total: number }[];
  par_origine: { origine: IncidentOrigine; total: number }[];
  par_gravite: { gravite: IncidentGravite; total: number }[];
  par_jour: { jour: string; total: number }[];
  gestes: { geste: IncidentGeste; total: number }[];
  bons: { nombre: number; montant: number };
  corrections: { id: string; code: string; categorie: string; restaurant: string; cause: string; action: string; resolu_at: string }[];
}

// ─── Filtres et corps ────────────────────────────────────────────────────────

export interface FiltresIncidents {
  restaurantId?: string;
  pole?: IncidentPole | "";
  categorieId?: string;
  gravite?: IncidentGravite | "";
  recherche?: string;
}

export interface FiltresHistorique extends FiltresIncidents {
  /** Incidents d'un client (fiche du CRM). */
  customerId?: string;
  statut?: IncidentStatut | "";
  origine?: IncidentOrigine | "";
  du?: string;
  au?: string;
  page?: number;
  limit?: number;
}

export interface SignalerIncidentDTO {
  order_id: string;
  categorie_id: string;
  gravite: IncidentGravite;
  origine?: IncidentOrigine;
  description: string;
  ticket_id?: string;
  avis_id?: string;
  comment_id?: string;
}

export interface AssignerIncidentDTO {
  statut_lu: IncidentStatut;
  pole?: IncidentPole;
  agent_id?: string | null;
}

export interface ResoudreIncidentDTO {
  statut_lu: IncidentStatut;
  cause: string;
  action: string;
  geste: IncidentGeste;
  bon_montant?: number;
}

export interface CloturerIncidentDTO {
  statut_lu: IncidentStatut;
  recontact: IncidentRecontact;
  reaction?: string;
}

export interface RouvrirIncidentDTO {
  statut_lu: IncidentStatut;
  motif: string;
}

/** Ce qu'un écran donne à la fenêtre « Signaler un incident ». */
export interface DemandeSignalement {
  /** Commande connue (tiroir, ticket, avis, note) ; absente : la fenêtre la fait chercher. */
  orderId?: string;
  ticketId?: string;
  avisId?: string;
  commentId?: string;
  gravite?: IncidentGravite;
  description?: string;
}
