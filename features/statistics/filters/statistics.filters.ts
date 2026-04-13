/**
 * Filtres partagés pour tous les rapports statistiques.
 * Utilisés dans les composants de filtre (DateRangePicker, PeriodSelector, RestaurantSelector).
 */

export type StatsPeriod = 'today' | 'yesterday' | 'week' | 'lastWeek' | 'month' | 'lastMonth' | 'year';

export interface StatsFilters {
  restaurantId?: string;
  startDate?: string;   // Format: YYYY-MM-DD
  endDate?: string;     // Format: YYYY-MM-DD
  period?: StatsPeriod;
}

export interface PeriodOption {
  value: StatsPeriod;
  label: string;
  shortLabel: string;
}

export const PERIOD_OPTIONS: PeriodOption[] = [
  { value: 'today', label: "Aujourd'hui", shortLabel: 'Auj.' },
  { value: 'yesterday', label: 'Hier', shortLabel: 'Hier' },
  { value: 'week', label: 'Cette semaine', shortLabel: 'Sem.' },
  { value: 'lastWeek', label: 'Semaine dernière', shortLabel: 'S-1' },
  { value: 'month', label: 'Ce mois', shortLabel: 'Mois' },
  { value: 'lastMonth', label: 'Mois dernier', shortLabel: 'M-1' },
  { value: 'year', label: 'Cette année', shortLabel: 'Année' },
];

/**
 * Map camelCase frontend → snake_case backend pour les périodes.
 */
const PERIOD_TO_API: Record<string, string> = {
  lastWeek: 'last_week',
  lastMonth: 'last_month',
};

/**
 * Convertir les filtres UI en paramètres de requête API.
 * Si period est défini, on l'envoie tel quel (le backend le gère).
 * Si startDate/endDate sont définis, on les envoie à la place.
 */
export function filtersToQueryParams(filters: StatsFilters): Record<string, string> {
  const params: Record<string, string> = {};

  if (filters.restaurantId) params.restaurantId = filters.restaurantId;

  if (filters.period) {
    params.period = PERIOD_TO_API[filters.period] ?? filters.period;
  } else {
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
  }

  return params;
}

/**
 * Formater une plage de dates pour l'affichage.
 * Ex: "01/01/2025 - 31/01/2025"
 */
export function formatDateRangeLabel(startDate?: string, endDate?: string): string {
  if (!startDate && !endDate) return '';
  const format = (d: string) => {
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  };
  if (startDate && endDate) return `${format(startDate)} - ${format(endDate)}`;
  if (startDate) return `Depuis le ${format(startDate)}`;
  if (endDate) return `Jusqu'au ${format(endDate)}`;
  return '';
}

/**
 * Retourner le label d'une période.
 */
export function getPeriodLabel(period?: StatsPeriod): string {
  if (!period) return 'Période personnalisée';
  return PERIOD_OPTIONS.find((p) => p.value === period)?.label ?? period;
}

/**
 * Filtres par défaut.
 */
export const DEFAULT_STATS_FILTERS: StatsFilters = {
  period: 'month',
};
