export interface IAppClick {
  id: number;
  platform: string | null;
  userAgent: string | null;
  ip: string | null;
  referer: string | null;
  /** Type de deeplink cliqué : home | dish | category | order | voucher | loyalty | nation_card */
  type: string | null;
  /** Id/slug/référence de la cible (plat, catégorie, commande…) */
  targetId: string | null;
  /** Libellé lisible de la cible (nom du plat/catégorie, "Carte de la Nation"…) */
  targetLabel: string | null;
  createdAt: Date;
}

export interface IAppClickSearchParams {
  /** Numéro de page (par défaut: 1) */
  page?: number;
  /** Nombre d'éléments par page (par défaut: 25) */
  limit?: number;
  /** Termes de recherche (recherche sur platform, userAgent, ip, targetLabel) */
  search?: string;
  /** Filtre exact ou partiel sur la plateforme (ex: "mobile", "web") */
  platform?: string;
  /** Filtre sur le type de deeplink (dish, category, order…) */
  type?: string;
  /** Filtre exact ou partiel sur l'adresse IP du client */
  ip?: string;
  /** Date de début de la plage (format ISO 8601) */
  dateFrom?: string;
  /** Date de fin de la plage (format ISO 8601) */
  dateTo?: string;
}

export interface IPaginatedResponse<T> {
  data: T[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ITypeClicksStat {
  type: string;
  count: number;
}

export interface IStatsResponse {
  total: {
    allTime: number,
    currentMonth: number,
    last24Hours: number,
  },
  android: {
    allTime: number,
    currentMonth: number,
  },
  ios: {
    allTime: number,
    currentMonth: number,
  },
  /** Répartition des clics par type de deeplink (info de décision) */
  byType: ITypeClicksStat[],
}
