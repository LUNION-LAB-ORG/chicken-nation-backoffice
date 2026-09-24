import { IRef } from "./prospect.type";

export type CampagneStatut = "PLANIFIED" | "ACTIVE" | "SUSPENDED" | "COMPLETED";
export type ModeRepartition = "AUTOMATIQUE" | "MANUEL";

export interface ICampagne {
  id: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  status: CampagneStatut;
  target_conversion_rate: number | null;
  target_contacts_count: number | null;
  registered_from: string | null;
  registered_to: string | null;
  distribution_mode: ModeRepartition;
  started_at: string | null;
  completed_at: string | null;
  targeted_count: number;
  created_at: string;
  lead_agent: IRef;
  created_by: IRef | null;
  offer: { id: string; label: string } | null;
  assigned_agents: { agent: IRef & { role: string } }[];
  resume?: { cibles: number; traites: number; conversions: number; coupons: number };
}

export interface ICampagneDTO {
  name: string;
  description?: string;
  start_date: string;
  end_date?: string;
  duration_days?: number;
  target_conversion_rate?: number;
  target_contacts_count?: number;
  lead_agent_id: string;
  agent_ids: string[];
  offer_id?: string;
  distribution_mode?: ModeRepartition;
  registered_from?: string;
  registered_to?: string;
}

export interface IIndicateursCampagne {
  cibles: number;
  traites: number;
  restants: number;
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
  objectif_contacts: number | null;
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
}

export interface ICampagneStats {
  campagne: {
    id: string;
    name: string;
    status: CampagneStatut;
    lead_agent: IRef;
    offer: { id: string; label: string } | null;
    target_conversion_rate: number | null;
    target_contacts_count: number | null;
  };
  indicateurs: IIndicateursCampagne;
  raisons: { raison: string; nombre: number; part: number }[];
  statuts: { statut: string; nombre: number }[];
  rythme: {
    objectif_jour: number | null;
    serie: {
      jour: string;
      traites: number;
      appels: number;
      conversions: number;
      cumul: number;
      objectif_cumul: number | null;
    }[];
  };
  agents: IAgentCampagne[];
  duree: {
    planifiee_jours: number | null;
    reelle_jours: number;
    debut_prevu: string;
    fin_prevue: string | null;
    debut_reel: string | null;
    fin_reelle: string | null;
  };
}

export interface IComparatifLigne {
  id: string;
  name: string;
  status: CampagneStatut;
  started_at: string | null;
  completed_at: string | null;
  indicateurs: IIndicateursCampagne;
  duree: ICampagneStats["duree"];
}
