/**
 * Utilitaires de formatage pour les statistiques.
 * Utilisés dans les composants UI pour afficher les données de manière cohérente.
 */

/**
 * Formater un montant en FCFA avec séparateur de milliers.
 * Ex: 1500000 → "1 500 000 XOF"
 */
export function formatCurrencyXOF(amount: number): string {
  return new Intl.NumberFormat('fr-FR').format(Math.round(amount)) + ' XOF';
}

/**
 * Formater un pourcentage avec signe + si positif.
 * Ex: 15.5 → "+15,5%", -3 → "-3%"
 */
export function formatPercentage(value: number, showSign = false): string {
  const sign = showSign && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

/**
 * Formater une durée en minutes de manière lisible.
 * Ex: 90 → "1h30", 45 → "45 min"
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
}

/**
 * Formater un nombre avec séparateur de milliers.
 * Ex: 12500 → "12 500"
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('fr-FR').format(value);
}

/**
 * Obtenir la couleur CSS selon le canal préféré.
 */
export function getChannelColor(channel: 'APP' | 'CALL_CENTER' | 'MIXED'): string {
  switch (channel) {
    case 'APP':
      return '#F17922'; // Orange principal Chicken Nation
    case 'CALL_CENTER':
      return '#3B82F6'; // Bleu
    case 'MIXED':
      return '#8B5CF6'; // Violet
    default:
      return '#6B7280'; // Gris
  }
}

/**
 * Obtenir le label FR du canal.
 */
export function getChannelLabel(channel: 'APP' | 'CALL_CENTER' | 'MIXED'): string {
  switch (channel) {
    case 'APP':
      return 'App Mobile';
    case 'CALL_CENTER':
      return 'Call Center';
    case 'MIXED':
      return 'Les deux';
    default:
      return 'Inconnu';
  }
}

/**
 * Obtenir la couleur CSS selon le taux de rétention ou performance.
 */
export function getPerformanceColor(value: number, thresholds = { good: 70, ok: 40 }): string {
  if (value >= thresholds.good) return '#22C55E'; // Vert
  if (value >= thresholds.ok) return '#F59E0B';   // Orange
  return '#EF4444';                                 // Rouge
}

/**
 * Formater une tendance avec flèche et couleur.
 * Retourne un objet pour l'affichage.
 */
export function formatTrend(percentage: string | number, isPositive: boolean) {
  const value = typeof percentage === 'string' ? parseFloat(percentage) : percentage;
  return {
    label: `${isPositive ? '+' : ''}${value}%`,
    color: isPositive ? '#22C55E' : '#EF4444',
    arrow: isPositive ? '↑' : '↓',
  };
}

/**
 * Tronquer un nom long pour l'affichage dans les tableaux.
 */
export function truncateName(name: string | undefined | null, maxLength = 25): string {
  if (!name) return '';
  if (name.length <= maxLength) return name;
  return name.substring(0, maxLength - 3) + '...';
}
