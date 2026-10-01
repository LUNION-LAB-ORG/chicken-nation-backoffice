import { Public } from "./contact.type";

/**
 * Réponses de l'analytique du CRM (lot 3). Unités : pourcentages en % à une
 * décimale, délais en jours (`_j`) ou en heures (`_h`), montants en francs
 * CFA entiers. `null` sur un nombre : non disponible, ou sans objet pour ce
 * public (champ Glovo/Yango sur une ligne d'inscrits).
 */

export interface IPeriode {
  from?: string;
  to?: string;
  campaign_id?: string;
  /** Un seul public (ancien paramètre, gardé). */
  segment?: Public;
  /** Plusieurs publics : vide ou absent = tous. Envoyé « segments=A,B ». */
  segments?: Public[];
}

/** Clé d'une ligne de tableau : un public, Glovo + Yango réunis, ou le total. */
export type CleLigne = Public | "CAPTES" | "TOTAL";

// ---------------------------------------------------------------------------
// Vue comparée des publics (GET /crm/analytics/publics)
// ---------------------------------------------------------------------------

/** Passages entrés sur la période, et ce qui leur est arrivé depuis. */
export interface IDevenir {
  entrees: number;
  contactes: number;
  joints: number;
  interesses: number;
  coupons: number;
  commandes: number;
  ventes: number;
  hors_entonnoir: number;
  sans_contact: number;
  repris: number;
  ca: number;
  taux_contact: number;
  taux_joint: number;
  base_taux: number;
  taux_conversion: number;
  mesurables_30j: number;
  ventes_30j: number;
  taux_30j: number;
  delai_median_j: number | null;
  delai_moyen_j: number | null;
  premier_appel_median_h: number | null;
  mesurables_j1: number;
  traites_j1: number;
  part_j1: number;
  mesurables_j2: number;
  traites_j2: number;
  part_j2: number;
  captes: number | null;
  deja_clients: number | null;
  ventes_deja_clients: number | null;
  deja_inscrits_a_la_capture: number | null;
  inscrits_apres_capture: number | null;
  sans_compte: number | null;
}

/** Événements datés dans la période, rangés sous le public du passage. */
export interface IActivite {
  appels: number;
  appels_joints: number;
  contacts_appeles: number;
  coupons_envoyes: number;
  coupons_utilises: number;
  ca_coupons: number;
  remises_coupons: number;
  ventes_crm: number;
  ca_crm: number;
  panier_moyen: number;
  ventes_historiques: number;
  ca_historique: number;
}

/** Stocks d'aujourd'hui, sans période. */
export interface IAujourdhui {
  ouverts: number;
  jamais_appeles: number;
  a_rappeler: number;
  file_commune: number | null;
  sans_agent_hors_file: number;
  en_campagne: number;
}

export interface ISecondeCommande {
  fenetre_jours: number;
  ventes: number;
  non_mesurables: number;
  en_attente: number;
  mesurables: number;
  recommande_30j: number;
  taux_30j: number;
  delai_median_j: number | null;
}

export interface ILignePublic {
  cle: CleLigne;
  segment: Public | null;
  libelle: string;
  devenir: IDevenir;
  activite: IActivite;
  aujourdhui: IAujourdhui;
  seconde_commande: ISecondeCommande;
}

export interface IComparatifPublics {
  periode: { from: string | null; to: string | null };
  campaign_id: string | null;
  publics: Public[];
  fenetre_jours: number;
  lignes: ILignePublic[];
  /** Non nulle seulement si Glovo ET Yango sont couverts. */
  glovo_yango: ILignePublic | null;
  total: ILignePublic;
}

// ---------------------------------------------------------------------------
// Vue d'ensemble (GET /crm/analytics/overview)
// ---------------------------------------------------------------------------

export type CleEtape = "entrees" | "contactes" | "joints" | "interesses" | "coupons" | "commandes";

export interface IEtapeEntonnoir {
  cle: CleEtape;
  libelle: string;
  nombre: number;
  part_entree: number;
  /** Ancien nom de `part_entree`, gardé une version. */
  part_inscrits?: number;
  part_etape_precedente: number;
}

export interface IEntonnoirPublic {
  segment: Public;
  libelle: string;
  etapes: IEtapeEntonnoir[];
  ventes: number;
  hors_entonnoir: number;
  sans_contact: number;
  repris: number;
  taux_conversion: number;
}

export interface IPassageAppli {
  publics: Public[];
  captes: number;
  sans_compte: number;
  deja_inscrits_a_la_capture: number;
  inscrits_apres_capture: number;
  deja_clients: number;
  ventes_deja_clients: number;
  commandes_directes: number;
  taux_passage_direct: number;
}

export interface IVueEnsemble {
  population: {
    actifs: number;
    ouverts: number;
    jamais_appeles: number;
    /** Ouverts sans agent, hors file commune. */
    non_assignes: number;
    /** File commune Glovo/Yango du jour (0 sans public capté). */
    file_commune: number;
    a_rappeler: number;
    interesses: number;
    coupons: number;
    non_interesses: number;
    injoignables: number;
    abandons: number;
  };
  entonnoir: IEtapeEntonnoir[];
  hors_entonnoir: { commandes: number; sans_contact: number; repris: number };
  entonnoirs: IEntonnoirPublic[];
  passage_appli: IPassageAppli | null;
  conversion: {
    taux: number;
    base_taux: number;
    ventes_entres: number;
    taux_30j: number;
    mesurables_30j: number;
    ventes_30j: number;
    fenetre_jours: number;
    delai_median_j: number | null;
    delai_moyen_j: number | null;
    conversions_periode: number;
    ca_periode: number;
    panier_moyen: number;
    historique: { ventes: number; ca: number };
  };
}

// ---------------------------------------------------------------------------
// Cohortes (GET /crm/analytics/cohorts)
// ---------------------------------------------------------------------------

export interface ICohortesFiltres {
  segment?: Public;
  from?: string;
  to?: string;
}

export interface ICohortesInscrits {
  type: "INSCRITS";
  segment: "JAMAIS_COMMANDE" | null;
  /**
   * Compte de point de vente : un inscrit qui n'a jamais commandé n'est
   * rattaché à aucun restaurant, le serveur ne rend alors aucune ligne.
   */
  hors_restaurant?: boolean;
  lignes: {
    mois: string;
    inscrits: number;
    convertis: number;
    sous_7_jours: number;
    taux: number;
    taux_7_jours: number;
    delai_moyen: number;
    delai_median: number;
  }[];
}

export interface ICohortesInactifs {
  type: "INACTIFS";
  segment: "INACTIF";
  lignes: {
    mois: string;
    entres: number;
    reconquis: number;
    reconquis_30j: number;
    reconquis_60j: number;
    reconquis_90j: number;
    complet_30j: boolean;
    complet_60j: boolean;
    complet_90j: boolean;
    taux: number;
    delai_median_j: number | null;
    encore_ouverts: number;
    deja_reconquis_avant: number;
  }[];
}

export interface ICohortesCaptes {
  type: "CAPTES";
  segment: "GLOVO" | "YANGO";
  lignes: {
    mois: string;
    captes: number;
    deja_clients: number;
    sans_compte: number;
    deja_inscrits_a_la_capture: number;
    inscrits_apres_capture: number;
    commandes_directes: number;
    commandes_directes_30j: number;
    commandes_directes_60j: number;
    commandes_directes_90j: number;
    complet_30j: boolean;
    complet_60j: boolean;
    complet_90j: boolean;
    commandes_deja_clients: number;
    /** Convertis par l'ancienne acquisition : hors taux, comme les déjà clients. */
    historiques: number;
    taux: number;
    delai_median_inscription_j: number | null;
    delai_median_commande_j: number | null;
  }[];
}

export type ICohortePublic = ICohortesInscrits | ICohortesInactifs | ICohortesCaptes;

// ---------------------------------------------------------------------------
// Raisons, qualité, agents, tendance
// ---------------------------------------------------------------------------

export interface IPareto {
  total: number;
  raisons: {
    /** null : « Raison non renseignée » (refus repris sans raison). */
    id: string | null;
    raison: string;
    nombre: number;
    part: number;
    cumul: number;
    principale: boolean;
  }[];
  par_public: { id: string | null; raison: string; segment: Public; nombre: number }[];
}

export interface IQualite {
  resolution_premier_appel: { traites: number; resolus: number; taux: number };
  traitement: {
    qualifies: number;
    tentatives_moyennes: number;
    heures_moyennes: number;
    heures_medianes: number | null;
    appels_par_contact: number;
  };
  premier_appel: {
    entrees: number;
    premier_appel_median_h: number | null;
    mesurables_j1: number;
    traites_j1: number;
    part_j1: number;
    mesurables_j2: number;
    traites_j2: number;
    part_j2: number;
  };
  seconde_commande: ISecondeCommande;
}

export interface IAgentPerf {
  id: string;
  fullname: string;
  appels: number;
  traites: number;
  joints: number;
  coupons: number;
  ventes: number;
  ventes_travaillees: number;
  ventes_spontanees: number;
  ca: number;
  ca_travaille: number;
  portefeuille: number;
  taux_contact: number;
  /** Ventes travaillées sur contacts traités. */
  taux_conversion: number;
  par_public: Partial<Record<Public, number>>;
  spontanees_par_public: Partial<Record<Public, number>>;
}

export interface ITendanceJour {
  jour: string;
  entrees: number;
  captures: number;
  appels: number;
  joints: number;
  coupons: number;
  conversions: number;
  entrees_par_public: Partial<Record<Public, number>>;
  ventes_par_public: Partial<Record<Public, number>>;
}

export interface ITendance {
  debut: string;
  fin: string;
  /** Vrai sans date de début : la série part du premier passage, un an au plus. */
  depuis_ouverture: boolean;
  serie: ITendanceJour[];
}

// ---------------------------------------------------------------------------
// Coupons
// ---------------------------------------------------------------------------

export interface IResumeCoupons {
  envoyes: number;
  utilises: number;
  sur_commande_annulee: number;
  actifs: number;
  expires: number;
  taux_utilisation: number;
  ca: number;
  panier_moyen: number;
  remises: number;
}

export interface ICouponsStats extends IResumeCoupons {
  delai_moyen_jours: number;
  delai_median_jours: number | null;
  par_offre: { offre: string; envoyes: number; utilises: number; ca: number; taux: number }[];
  par_canal: { canal: "WHATSAPP" | "SMS" | "AUCUN" | "INCONNU"; envoyes: number }[];
  par_public: (IResumeCoupons & { segment: Public; libelle: string })[];
}

// ---------------------------------------------------------------------------
// Verbatims
// ---------------------------------------------------------------------------

export interface IVerbatimsFiltres extends IPeriode {
  search?: string;
  loss_reason_id?: string;
  agent_id?: string;
  page?: number;
  limit?: number;
}

export interface IVerbatim {
  id: string;
  created_at: string;
  comment: string;
  status_label: string;
  outcome: "NON_JOINT" | "A_RAPPELER" | "INTERESSE" | "NON_INTERESSE" | "NUMERO_INVALIDE";
  segment: Public;
  raison: string | null;
  agent: string | null;
  contact: string;
  contact_id: string;
}

export interface IVerbatims {
  data: IVerbatim[];
  meta: { total: number; page: number; limit: number; totalPages: number };
  mots: { mot: string; nombre: number }[];
}

// ---------------------------------------------------------------------------
// Ventes
// ---------------------------------------------------------------------------

export interface IVentesFiltres extends IPeriode {
  restaurant_id?: string;
}

export interface IVente {
  id: string;
  converted_at: string;
  segment: Public;
  amount: number;
  /** CRM, ou ACQUISITION_HISTORIQUE pour une vente d'avant la bascule. */
  source: "CRM" | "ACQUISITION_HISTORIQUE";
  reference: string | null;
  restaurant: string | null;
  contact_id: string;
  nom: string;
}

/**
 * Ventes du CRM : une par personne et par passage, une commande ne comptant
 * qu'une fois. `ventes` et `ca` ne comptent que le CRM ; l'ancienne
 * acquisition Glovo/Yango est dans `historique` et `ca_historique`.
 */
export interface IVentes {
  /** Jour où le CRM a pris le relais de l'ancienne acquisition Glovo/Yango. */
  bascule: string | null;
  total: { ventes: number; ca: number; panier_moyen: number; historique: number; ca_historique: number };
  par_public: { segment: Public; ventes: number; ca: number; historique: number; ca_historique: number }[];
  par_mois: { mois: string; segment: Public; ventes: number; ca: number; historique: number; ca_historique: number }[];
  /** Vide quand aucun public capté n'est couvert. */
  captures_par_restaurant: { restaurant_id: string | null; restaurant: string; captures: number; personnes: number; ventes: number }[];
  /** Total sans double compte : une personne relevée dans deux restaurants compte une fois. */
  captures_total: { captures: number; personnes: number; ventes: number };
  dernieres: IVente[];
}

// ---------------------------------------------------------------------------
// Rapport « Où en sommes-nous » (GET /crm/analytics/rapport, /rapport/pdf)
// ---------------------------------------------------------------------------

/**
 * Un chiffre de la période et ce qu'il valait sur la période précédente de
 * même durée. `variation` en % à une décimale ; `comparable` à faux (et
 * `variation` à null) quand la base est trop petite pour qu'un pourcentage
 * veuille dire quelque chose : décompte précédent sous 10, précédent à zéro,
 * ou variation au-delà de 1 000 %. `monnaie` : un montant en francs.
 */
export interface Compare {
  valeur: number;
  precedent: number;
  ecart: number;
  variation: number | null;
  comparable: boolean;
  monnaie?: boolean;
}

/** Un taux en % à une décimale, et son écart en points avec la période précédente. */
export interface Taux {
  valeur: number;
  precedent: number;
  ecart_points: number;
}

/**
 * Un levier de croissance lu comme un entonnoir : entrés (captés pour
 * Glovo/Yango, entrés en inactivité pour les inactifs), appelés, joints,
 * coupons envoyés, ventes. `taux_conversion` = ventes sur entrés.
 */
export interface Levier {
  entres: Compare;
  appeles: Compare;
  joints: Compare;
  coupons: Compare;
  ventes: Compare;
  ca: Compare;
  taux_contact: Taux;
  taux_conversion: Taux;
}

export interface IRapportAgent {
  id: string;
  nom: string;
  appels: number;
  joints: number;
  coupons: number;
  ventes: number;
  ca: number;
}

export interface IRapport {
  periode: { debut: string; fin: string; jours: number };
  precedente: { debut: string; fin: string };
  edite_le: string;
  filtres: {
    publics: string[];
    campagne: { id: string; nom: string } | null;
    restaurant: { id: string; nom: string } | null;
  };
  /** Deux à quatre phrases calculées par le serveur. */
  a_retenir: string[];
  inscriptions: {
    /**
     * Section exclue par le filtre (public « inscrits » non choisi, ou une
     * campagne filtrée) : le serveur rend des zéros, l'écran la grise.
     */
    hors_filtre: boolean;
    /** Compte de point de vente : les inscrits sont ceux de tout le réseau. */
    hors_restaurant: boolean;
    inscrits: Compare;
    ont_commande: Compare;
    sous_7_jours: Compare;
    taux_commande: Taux;
    delai_median_j: number | null;
    ca: Compare;
    sans_commande: number;
    /** Par jour jusqu'à 45 jours, par semaine au-delà. */
    pas: "jour" | "semaine";
    serie: { date: string; inscrits: number; premieres_commandes: number }[];
  };
  captes: {
    /** Ni Glovo ni Yango dans le filtre. */
    hors_filtre: boolean;
    total: Levier;
    /** `libelle` est celui du serveur : « Clients Glovo », « Clients Yango ». */
    par_public: ({ segment: "GLOVO" | "YANGO"; libelle: string; hors_filtre: boolean } & Levier)[];
  };
  inactifs: Levier & { hors_filtre: boolean; delai_median_j: number | null };
  equipe: {
    appels: Compare;
    joints: Compare;
    coupons: Compare;
    taux_contact: Taux;
    agents: IRapportAgent[];
  };
  resultat: {
    ventes: Compare;
    ca: Compare;
    panier_moyen: Compare;
    par_public: { segment: string; libelle: string; ventes: number; ca: number }[];
  };
  raisons: { raison: string; nombre: number; part: number }[];
}
