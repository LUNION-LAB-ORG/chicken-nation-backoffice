import { Public } from "./contact.type";

export interface IPeriode {
  from?: string;
  to?: string;
  campaign_id?: string;
  segment?: Public;
}

export interface IVueEnsemble {
  population: {
    actifs: number;
    jamais_appeles: number;
    non_assignes: number;
    a_rappeler: number;
    interesses: number;
    coupons: number;
    non_interesses: number;
    injoignables: number;
    abandons: number;
  };
  entonnoir: { cle: string; libelle: string; nombre: number; part_inscrits: number; part_etape_precedente: number }[];
  conversion: {
    taux: number;
    delai_moyen_jours: number;
    conversions_periode: number;
    ca_periode: number;
    panier_moyen: number;
  };
}

export interface IPareto {
  total: number;
  raisons: { id: string; raison: string; nombre: number; part: number; cumul: number; principale: boolean }[];
}

export interface ICohorte {
  mois: string;
  inscrits: number;
  convertis: number;
  sous_7_jours: number;
  taux: number;
  taux_7_jours: number;
  delai_moyen: number;
  delai_median: number;
}

export interface ICouponsStats {
  envoyes: number;
  utilises: number;
  actifs: number;
  expires: number;
  taux_utilisation: number;
  ca: number;
  panier_moyen: number;
  delai_moyen_jours: number;
  par_offre: { offre: string; envoyes: number; utilises: number; ca: number; taux: number }[];
  par_canal: { canal: string; envoyes: number }[];
}

export interface IQualite {
  resolution_premier_appel: { traites: number; resolus: number; taux: number };
  traitement: { qualifies: number; tentatives_moyennes: number; heures_moyennes: number; appels_par_contact: number };
  retention: { convertis: number; deuxieme_commande: number; taux: number; delai_moyen_jours: number };
}

export interface IAgentPerf {
  id: string;
  fullname: string;
  appels: number;
  traites: number;
  joints: number;
  coupons: number;
  conversions: number;
  ca: number;
  portefeuille: number;
  taux_contact: number;
  taux_conversion: number;
}

export interface ITendanceJour {
  jour: string;
  appels: number;
  joints: number;
  coupons: number;
  conversions: number;
  inscriptions: number;
}

export interface IVerbatim {
  id: string;
  created_at: string;
  comment: string;
  status_label: string;
  outcome: string;
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

/** Ventes du CRM : une par personne et par cycle, une commande ne comptant qu'une fois. */
export interface IVentes {
  /** Jour où le CRM a pris le relais de l'ancienne acquisition Glovo/Yango. */
  bascule: string | null;
  total: { ventes: number; ca: number; panier_moyen: number; historique: number };
  par_public: { segment: Public; ventes: number; ca: number }[];
  par_mois: { mois: string; segment: Public; ventes: number; ca: number; historique: number }[];
  captures_par_restaurant: { restaurant_id: string | null; restaurant: string; captures: number; personnes: number; ventes: number }[];
  dernieres: IVente[];
}
