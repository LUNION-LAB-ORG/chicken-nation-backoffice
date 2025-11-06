export interface IAppClick {
  id: number;
  platform: string | null;
  userAgent: string | null;
  ip: string | null;
  referer: string | null;
  createdAt: Date;
}

export interface IAppClickSearchParams {
  /** Numéro de page (par défaut: 1) */
  page?: number;
  /** Nombre d'éléments par page (par défaut: 25) */
  limit?: number;
  /** Termes de recherche (recherche sur platform, userAgent, ip) */
  search?: string;
  /** Filtre exact ou partiel sur la plateforme (ex: "mobile", "web") */
  platform?: string;
  /** Filtre exact ou partiel sur l'adresse IP du client */
  ip?: string;
  /** Date de début de la plage (format ISO 8601) */
  dateFrom?: string;
  /** Date de fin de la plage (format ISO 8601) */
  dateTo?: string;
}

export interface IPaginatedResponse <T> {
  data: T[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IStatsResponse {
  totalClicks: number;
}
