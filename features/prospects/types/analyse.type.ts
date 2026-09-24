export interface IPeriode {
  from?: string;
  to?: string;
  campaign_id?: string;
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
  traitement: { qualifies: number; tentatives_moyennes: number; heures_moyennes: number; appels_par_prospect: number };
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
  prospect: string;
  prospect_id: string;
}

export interface IVerbatims {
  data: IVerbatim[];
  meta: { total: number; page: number; limit: number; totalPages: number };
  mots: { mot: string; nombre: number }[];
}
