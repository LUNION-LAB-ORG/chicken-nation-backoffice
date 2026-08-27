/** Modes de ciblage exposés. Le mode « filtres libres » du push n'est pas repris. */
export type Ciblage = 'all' | 'segment' | 'ids';

export type StatutDiffusion = 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';

export interface IDiffusion {
  id: string;
  name: string;
  body: string;
  target_type: Ciblage;
  target_config: Record<string, any>;
  status: StatutDiffusion;
  image_url?: string | null;
  scheduled_at: string | null;
  started_at: string | null;
  sent_at: string | null;
  total_targeted: number;
  created_by: string;
  created_at: string;
  stats?: {
    cibles: number;
    envoyes: number;
    en_attente: number;
    echecs: number;
  };
}

export interface ICreerDiffusion {
  name: string;
  body: string;
  target_type: Ciblage;
  target_config: Record<string, any>;
  scheduled_at?: string;
  /** Image jointe, facultative. Part en multipart. */
  image?: File | null;
}

export interface IClientCible {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string;
}

/**
 * Aperçu d'audience.
 *
 * ⚠️ DEUX nombres, et c'est volontaire. Le ciblage désigne `cibles` clients,
 * mais seuls ceux qui ont ouvert l'application verront le message : la table
 * des clients contient aussi les demandes de Carte Nation faites depuis le
 * site et les comptes créés au backoffice.
 */
export interface IApercuAudience {
  total: number;
  cibles: number;
  sans_application: number;
}

export const LIBELLES_STATUT: Record<StatutDiffusion, string> = {
  draft: 'Brouillon',
  scheduled: 'Planifiée',
  sending: 'Envoi en cours',
  sent: 'Envoyée',
  failed: 'Échouée',
};

/** Segments prêts à l'emploi, alignés sur ceux du module des notifications. */
export const SEGMENTS_SYSTEME = [
  { cle: 'all', libelle: 'Tous les clients' },
  { cle: 'vip', libelle: 'Clients VIP' },
  { cle: 'vvip', libelle: 'Clients VVIP' },
  { cle: 'standard', libelle: 'Clients Standard' },
  { cle: 'recent_30d', libelle: 'Ont commandé ces 30 derniers jours' },
  { cle: 'inactive_30d', libelle: 'Sans commande depuis 30 jours' },
  { cle: 'inactive_90d', libelle: 'Sans commande depuis 90 jours' },
];
