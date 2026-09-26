import { ContactStatut, IRef, Public } from "./contact.type";

export type CampagneStatut = "PLANIFIED" | "ACTIVE" | "SUSPENDED" | "COMPLETED";
export type ModeRepartition = "AUTOMATIQUE" | "MANUEL";
/** Compte sur l'application (Glovo/Yango) : absent ou null = tous. */
export type CompteAppli = "AVEC" | "SANS";

export interface IOffreRef {
  id: string;
  label: string;
}

/**
 * Un public visé par une campagne et ses critères propres (lot 3). La période
 * porte sur l'inscription (inscrits), l'entrée en inactivité (inactifs) ou une
 * capture (Glovo/Yango). Dates : minuit UTC du jour, en ISO.
 */
export interface ICampagnePublic {
  segment: Public;
  period_from: string | null;
  period_to: string | null;
  /** [] hors Glovo/Yango. */
  restaurant_ids: string[];
  account: CompteAppli | null;
  /** Inactifs déjà reconquis une fois ; toujours faux hors INACTIF. */
  relapsed_only: boolean;
  offer_id: string | null;
  offer: IOffreRef | null;
  /** Objectif de conversion du public, en %. */
  target_conversion_rate: number | null;
  /** Objectif du public : contacts à joindre. */
  target_contacts_count: number | null;
  /** Ciblés de ce public au lancement (0 avant). */
  targeted_count: number;
}

/** Corps d'un public, à la création, à la modification et à l'aperçu. */
export interface ICampagnePublicInput {
  segment: Public;
  period_from?: string | null;
  period_to?: string | null;
  restaurant_ids?: string[];
  account?: CompteAppli | null;
  relapsed_only?: boolean;
  offer_id?: string | null;
  target_conversion_rate?: number | null;
  target_contacts_count?: number | null;
}

export interface IResumeCampagne {
  cibles: number;
  traites: number;
  conversions: number;
  coupons: number;
  /** Publics ayant des membres. */
  par_public?: { segment: Public; cibles: number; traites: number; conversions: number }[];
}

export interface ICampagne {
  id: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  status: CampagneStatut;
  target_conversion_rate: number | null;
  /** Objectif global : contacts à joindre. */
  target_contacts_count: number | null;
  /** Recopie de la période des inscrits (compatibilité). */
  registered_from: string | null;
  registered_to: string | null;
  /** Recopie de la liste des publics (compatibilité). */
  segments: Public[];
  distribution_mode: ModeRepartition;
  started_at: string | null;
  completed_at: string | null;
  targeted_count: number;
  created_at: string;
  lead_agent: IRef;
  created_by: IRef | null;
  offer: IOffreRef | null;
  assigned_agents: { agent: IRef & { role: string } }[];
  publics: ICampagnePublic[];
  /** Absent des réponses de création, de modification, de suspension et de reprise. */
  resume?: IResumeCampagne;
}

export interface ICampagneDTO {
  name: string;
  description?: string;
  start_date: string;
  end_date?: string;
  duration_days?: number;
  /** null efface l'objectif (modification). */
  target_conversion_rate?: number | null;
  target_contacts_count?: number | null;
  lead_agent_id: string;
  agent_ids: string[];
  /** null revient à l'offre par défaut (modification). */
  offer_id?: string | null;
  distribution_mode?: ModeRepartition;
  publics?: ICampagnePublicInput[];
}

export interface ICampagnesFiltres {
  status?: CampagneStatut;
  /** Campagnes qui visent ce public. */
  segment?: Public;
}

/* ------------------------------------------------------------------ */
/* Aperçu de la population, lancement, clôture                          */
/* ------------------------------------------------------------------ */

export interface IApercuInput {
  publics: ICampagnePublicInput[];
  /** Équipe prévue : un contact suivi par l'un d'eux reste disponible. */
  agent_ids?: string[];
}

export interface IApercuPublic {
  segment: Public;
  disponibles: number;
  /** Répartition des disponibles (statuts ouverts seulement). */
  par_statut: Partial<Record<ContactStatut, number>>;
  exclus: {
    non_interesses: number;
    injoignables: number;
    autre_campagne: number;
    agent_hors_equipe: number;
    /** Glovo/Yango : captés aujourd'hui, entrent demain. Toujours 0 ailleurs. */
    captes_aujourdhui: number;
  };
  total_exclus: number;
}

export interface IApercu {
  calcule_le: string;
  disponibles: number;
  exclus: number;
  /** Dans l'ordre du corps. */
  publics: IApercuPublic[];
}

export interface ILancement {
  cibles: number;
  repartis: number;
  /** Un par public visé, 0 compris. */
  par_public: { segment: Public; cibles: number }[];
  avertissements: string[];
}

export interface ICloture {
  sortis: number;
  liberes: number;
  gardes: number;
  /** Phrase prête à afficher. */
  message: string;
}

/* ------------------------------------------------------------------ */
/* Statistiques                                                          */
/* ------------------------------------------------------------------ */

export interface IIndicateursCampagne {
  cibles: number;
  traites: number;
  /** Membres ouverts jamais appelés dans la campagne (figés à la clôture). */
  restants: number;
  /** Membres ouverts, appelés ou non (0 une fois close). */
  ouverts: number;
  joints: number;
  appels: number;
  couverture: number;
  taux_contact: number;
  coupons_envoyes: number;
  coupons_utilises: number;
  taux_utilisation: number;
  ca_coupons: number;
  conversions: number;
  taux_conversion: number;
  ca_conversions: number;
  panier_moyen: number;
  objectif_taux_conversion: number | null;
  /** Contacts à joindre. */
  objectif_contacts: number | null;
  /** % joints / objectif de contacts. */
  progression_objectif_contacts: number | null;
}

/** Indicateurs d'un public ; les objectifs sont ceux du public, jamais ceux de la campagne. */
export interface IIndicateursPublic extends IIndicateursCampagne {
  segment: Public;
  /** Glovo/Yango : ciblés inscrits sur l'appli pendant la campagne. null ailleurs. */
  inscrits_appli_pendant: number | null;
}

export interface IStatutNombre {
  statut: ContactStatut;
  nombre: number;
}

export interface IAgentCampagnePublic {
  segment: Public;
  assignes: number;
  appels: number;
  traites: number;
  joints: number;
  coupons: number;
  conversions: number;
  ca: number;
}

export interface IAgentCampagne {
  id: string;
  fullname: string;
  assignes: number;
  appels: number;
  traites: number;
  joints: number;
  coupons: number;
  conversions: number;
  ca: number;
  taux_conversion: number;
  taux_contact: number;
  par_public?: IAgentCampagnePublic[];
}

export interface IDureeCampagne {
  planifiee_jours: number | null;
  reelle_jours: number;
  debut_prevu: string;
  fin_prevue: string | null;
  debut_reel: string | null;
  fin_reelle: string | null;
}

export interface ICampagneStatsPublic extends ICampagnePublic {
  /** name null : restaurant supprimé. */
  restaurants: { id: string; name: string | null }[];
  /** Critères écrits en clair par le serveur. */
  criteres: string;
}

export interface ICampagneStats {
  campagne: {
    id: string;
    name: string;
    status: CampagneStatut;
    start_date: string;
    end_date: string | null;
    started_at: string | null;
    completed_at: string | null;
    target_conversion_rate: number | null;
    target_contacts_count: number | null;
    lead_agent: IRef;
    assigned_agents: { agent: IRef }[];
    offer: IOffreRef | null;
    publics: ICampagneStatsPublic[];
  };
  indicateurs: IIndicateursCampagne;
  par_public: (IIndicateursPublic & { statuts: IStatutNombre[] })[];
  raisons: { raison: string; nombre: number; part: number }[];
  statuts: IStatutNombre[];
  /** Campagne close (rapport version 2) : statuts et restants sont ceux de la clôture. */
  chiffres_figes: boolean;
  rythme: {
    /** Contacts à joindre par jour. */
    objectif_jour: number | null;
    serie: {
      jour: string;
      traites: number;
      joints: number;
      appels: number;
      conversions: number;
      /** Cumul des joints. */
      cumul: number;
      cumul_traites: number;
      objectif_cumul: number | null;
    }[];
  };
  agents: IAgentCampagne[];
  ventes_sans_agent: { conversions: number; ca: number };
  duree: IDureeCampagne;
  genere_le: string;
}

export interface IComparatifLigne {
  id: string;
  name: string;
  status: CampagneStatut;
  started_at: string | null;
  completed_at: string | null;
  segments: Public[];
  indicateurs: IIndicateursCampagne;
  par_public: IIndicateursPublic[];
  /** Avec un public demandé : sa ligne ; sinon null. */
  public: IIndicateursPublic | null;
  duree: IDureeCampagne;
}

/* ------------------------------------------------------------------ */
/* Ventes d'une campagne : les clients qui ont commandé                 */
/* ------------------------------------------------------------------ */

export type StatutCommande =
  | "PENDING"
  | "ACCEPTED"
  | "IN_PROGRESS"
  | "READY"
  | "PICKED_UP"
  | "COLLECTED"
  | "COMPLETED"
  | "CANCELLED";

export type TypeCommande = "DELIVERY" | "PICKUP" | "TABLE";

/** État d'une autre commande du client : seules les commandes VALIDE entrent dans les totaux. */
export type EtatCommande = "VALIDE" | "ANNULEE" | "SUPPRIMEE" | "PAIEMENT_EN_ATTENTE";

/** Autre commande passée par le client pendant la campagne (hors commande comptée). */
export interface IAutreCommande {
  id: string;
  reference: string;
  cree_le: string;
  montant: number;
  statut: StatutCommande;
  type: TypeCommande;
  restaurant: string | null;
  etat: EtatCommande;
}

/** Une vente comptée pour la campagne : une ligne du compteur « conversions ». */
export interface IVenteCampagne {
  id: string;
  vendu_le: string;
  /** Montant du registre, celui du compteur et du chiffre d'affaires. */
  montant: number;
  /** Public au ciblage. */
  segment: Public;
  contact: { id: string; nom: string; telephone: string; supprime: boolean };
  /** null : vente sans agent. */
  agent: IRef | null;
  commande: {
    id: string;
    reference: string;
    /** Montant actuel de la commande, qui peut différer de celui du registre. */
    montant: number;
    statut: StatutCommande;
    type: TypeCommande;
    restaurant: string | null;
    cree_le: string;
  } | null;
  /** Code masqué en consultation. */
  coupon: { code: string; offre: string; envoye_le: string; hors_campagne: boolean } | null;
  /** Code promo de la commande sans coupon du CRM ; masqué en consultation. */
  code_promo: string | null;
  delai_campagne_jours: number | null;
  delai_entree_jours: number | null;
  autres: {
    nombre: number;
    /** Commandes valides parmi les autres. */
    valides: number;
    /** Montant des autres commandes valides. */
    montant: number;
    /** Plus d'autres commandes que celles renvoyées. */
    tronque: boolean;
    /** Les plus récentes d'abord. */
    commandes: IAutreCommande[];
  };
}

export interface IVentesCampagne {
  /** Égal aux indicateurs de la campagne ; par_public couvre toujours tous les publics vendus. */
  resume: { ventes: number; ca: number; par_public: { segment: Public; ventes: number; ca: number }[] };
  /** Fenêtre des autres commandes ; fin null : campagne en cours. */
  fenetre: { debut: string | null; fin: string | null };
  /** Codes masqués (consultation). */
  masque: boolean;
  data: IVenteCampagne[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface IVentesCampagneFiltres {
  page?: number;
  limit?: number;
  /** Public au ciblage. */
  segment?: Public;
}
