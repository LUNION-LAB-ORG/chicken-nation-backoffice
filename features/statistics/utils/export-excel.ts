/**
 * Export vers Excel/CSV pour les rapports statistiques.
 * Utilise une approche légère sans dépendance lourde (CSV natif).
 * Pour des exports Excel complets (.xlsx), intégrer la lib `xlsx` si besoin.
 */

/**
 * Convertir un tableau d'objets en CSV et déclencher le téléchargement.
 */
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  headers?: Partial<Record<keyof T, string>>,
): void {
  if (data.length === 0) return;

  const columns = Object.keys(data[0]) as (keyof T)[];

  // En-têtes
  const headerRow = columns
    .map((col) => headers?.[col] ?? String(col))
    .map((h) => `"${h}"`)
    .join(';');

  // Lignes de données
  const rows = data.map((item) =>
    columns
      .map((col) => {
        const value = item[col];
        if (value === null || value === undefined) return '';
        const str = String(value);
        // Échapper les guillemets doubles et entourer de guillemets si nécessaire
        if (str.includes(';') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      })
      .join(';'),
  );

  const csvContent = [headerRow, ...rows].join('\n');

  // BOM UTF-8 pour Excel (Windows)
  const blob = new Blob(['\uFEFF' + csvContent], {
    type: 'text/csv;charset=utf-8;',
  });

  downloadBlob(blob, `${filename}.csv`);
}

/**
 * Export des clients inactifs (churn) au format CSV.
 */
export function exportChurnToCSV(
  items: {
    phone: string;
    firstName: string;
    lastName: string;
    email: string;
    lastOrderDate: string;
    daysSinceLastOrder: number;
    totalOrders: number;
    totalSpent: number;
    preferredChannel: string;
  }[],
  inactiveDays: number,
): void {
  exportToCSV(items, `clients-inactifs-${inactiveDays}j-${formatDateForFile()}`, {
    phone: 'Téléphone',
    firstName: 'Prénom',
    lastName: 'Nom',
    email: 'Email',
    lastOrderDate: 'Dernière commande',
    daysSinceLastOrder: 'Jours inactifs',
    totalOrders: 'Nb commandes',
    totalSpent: 'CA total (XOF)',
    preferredChannel: 'Canal préféré',
  });
}

/**
 * Export du top clients au format CSV.
 */
export function exportTopClientsToCSV(
  items: {
    fullname: string;
    phone: string;
    email: string;
    totalOrders: number;
    totalSpent: number;
    averageBasket: number;
    lastOrderDate: string;
    preferredChannel: string;
    loyaltyLevel: string;
  }[],
): void {
  exportToCSV(items, `top-clients-${formatDateForFile()}`, {
    fullname: 'Nom complet',
    phone: 'Téléphone',
    email: 'Email',
    totalOrders: 'Nb commandes',
    totalSpent: 'CA total (XOF)',
    averageBasket: 'Panier moyen (XOF)',
    lastOrderDate: 'Dernière commande',
    preferredChannel: 'Canal préféré',
    loyaltyLevel: 'Niveau fidélité',
  });
}

/**
 * Export des zones de livraison au format CSV.
 */
export function exportZonesToCSV(
  items: {
    zone: string;
    orderCount: number;
    revenue: number;
    percentage: number;
    latitude?: number;
    longitude?: number;
  }[],
): void {
  exportToCSV(items, `zones-livraison-${formatDateForFile()}`, {
    zone: 'Zone / Ville',
    orderCount: 'Nb commandes',
    revenue: 'CA (XOF)',
    percentage: 'Part (%)',
    latitude: 'Latitude',
    longitude: 'Longitude',
  });
}

// ---- Helpers privés ----

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function formatDateForFile(): string {
  const now = new Date();
  return now.toISOString().split('T')[0]; // YYYY-MM-DD
}
