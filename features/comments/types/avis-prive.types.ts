/**
 * Retours PRIVÉS « Ton avis compte » (page /fr/avis du site, 02/11).
 *
 * Formes rendues par le serveur (`/api/v1/avis-prives`, contrat
 * .banc-test-crm/avis/contrat-avis.md, 4.2). À ne pas confondre avec
 * `Comment` (note après commande, témoignages du site).
 *
 * Les numéros arrivent sous la clé `telephone` : l'intercepteur global du
 * serveur les masque pour le marketing (« +225••••••••01 »).
 */

export type AvisRessenti = "PAS_CONTENT" | "PEUT_MIEUX_FAIRE" | "AU_TOP";

export type AvisCanal = "APPLI" | "SITE_WEB" | "TELEPHONE" | "WHATSAPP" | "SUR_PLACE" | "AUTRE_PLATEFORME";

export type AvisStatut =
  | "NOUVEAU"
  | "A_RAPPELER"
  | "EN_COURS"
  | "INJOIGNABLE"
  | "INCIDENT_OUVERT"
  | "RESOLU"
  | "CLASSE";

export type AvisSolution = "EXCUSES" | "GESTE_COMMERCIAL" | "REMPLACEMENT" | "REMBOURSEMENT" | "AUCUNE";

export type AvisResultat = "JOINT" | "INJOIGNABLE" | "MESSAGERIE";

export type AvisSuiviType =
  | "SYSTEME"
  | "APPEL"
  | "WHATSAPP"
  | "NOTE"
  | "STATUT"
  | "COMMANDE"
  | "AGENT"
  | "INCIDENT"
  | "SUPPRESSION";

/** Ce qu'un agent ajoute au journal. */
export type ActionJournal = "APPEL" | "WHATSAPP" | "NOTE";

/** Période de la liste ; « Tout » mène aux avis plus anciens que 30 jours. */
export type PeriodeAvis = "aujourdhui" | "7j" | "30j" | "tout";

/** Filtre Store : un restaurant, `aucun` (« Je ne sais pas ») ou rien (tous). */
export const STORE_INCONNU = "aucun";

export interface AvisLigne {
  id: string;
  created_at: string;
  ressenti: AvisRessenti;
  canal: AvisCanal;
  restaurant: { id: string; name: string } | null;
  commentaire_extrait: string;
  /** Prénom saisi, sinon prénom du compte rapproché. */
  prenom: string | null;
  /** `+225…`, masqué pour le marketing. */
  telephone: string | null;
  rapproche: boolean;
  statut: AvisStatut;
  /** `null` quand l'échéance est sans objet (tenue, close, pas d'accord). */
  echeance_at: string | null;
  en_retard: boolean;
  agent: { id: string; fullname: string } | null;
}

export interface CommandeRecente {
  id: string;
  reference: string;
  created_at: string;
  restaurant: { id: string; name: string };
  channel: "APP" | "WEB" | "CALL_CENTER" | "RESTAURANT" | null;
  auto: boolean;
  status: string;
  type: string;
  amount: number;
  /** Deux premiers noms de plats. */
  plats: string[];
}

export interface LigneJournal {
  id: string;
  created_at: string;
  type: AvisSuiviType;
  resultat: AvisResultat | null;
  /** « Système » ou le nom recopié de l'agent. */
  auteur: string;
  /** Phrase complète composée par le serveur. */
  texte: string;
}

export interface AvisFiche extends AvisLigne {
  commentaire: string;
  accord_rappel: boolean;
  /** Code de la source (`marque-page`, `ticket`, `sac`, `site`). */
  source: string;
  solution: AvisSolution | null;
  premier_contact_at: string | null;
  tentatives_appel: number;
  client: {
    customer_id: string | null;
    first_name: string | null;
    last_name: string | null;
    telephone: string | null;
    crm_contact_id: string | null;
  };
  /** Commande cochée. */
  order_id: string | null;
  ticket: { id: string; code: string; status: string } | null;
  /** `null` pour le marketing ; `[]` quand l'avis n'est pas rapproché. */
  dernieres_commandes: CommandeRecente[] | null;
  journal: LigneJournal[];
}

export interface CompteursAvis {
  nouveaux: number;
  a_rappeler: number;
  echeance_depassee: number;
  resolus_7j: number;
  /** Tout sauf Résolu et Classé : pastille de l'onglet. */
  a_traiter: number;
}

export interface PageAvis {
  data: AvisLigne[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

/** Filtres de la liste, gardés dans le store du tableau de bord (retour depuis une fiche). */
export interface FiltresAvis {
  recherche: string;
  ressenti: AvisRessenti | "";
  statut: AvisStatut | "";
  en_retard: boolean;
  /** Restaurant, `aucun` ou "" (tous). */
  store: string;
  periode: PeriodeAvis;
  page: number;
}

/** Paramètres envoyés au serveur (liste et export). */
export interface RequeteAvis {
  page?: number;
  limit?: number;
  recherche?: string;
  ressenti?: AvisRessenti;
  statut?: AvisStatut;
  en_retard?: "true";
  restaurantId?: string;
  periode?: PeriodeAvis;
}

export interface AgentAvis {
  id: string;
  fullname: string;
}

export interface JournalAvisDTO {
  action: ActionJournal;
  resultat?: AvisResultat | null;
  note?: string | null;
}

export interface StatutAvisDTO {
  statut: AvisStatut;
  solution?: AvisSolution | null;
  /** Statut lu à l'écran : 409 s'il a changé entre-temps. */
  statut_lu: AvisStatut;
}
