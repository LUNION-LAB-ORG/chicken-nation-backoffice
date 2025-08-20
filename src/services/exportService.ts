export interface ExportOrder {
  id: string;
  reference: string;
  clientName: string;
  date: string;
  status: string;
  totalPrice: number;
  deliveryPrice: number;
  orderType: string;
  address: string;
  tableNumber?: string;
  restaurant?: string;
}

export interface ExportComment {
  id: string;
  clientName: string;
  rating: number;
  message: string;
  orderReference: string;
  date: string;
  restaurant?: string;
  dish?: string;
}

export type ExportFormat = 'csv';

export interface ExportConfig {
  format: ExportFormat;
  filename?: string;
  includeHeaders?: boolean;
}

const formatCsvValue = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  if (stringValue.includes('"') || stringValue.includes(',') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

const generateFilename = (format: ExportFormat, prefix: string = 'commandes'): string => {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
  return `${prefix}_${timestamp}.${format}`;
};

export const exportToCSV = (orders: ExportOrder[], config: Partial<ExportConfig> = {}): void => {
  const { filename = generateFilename('csv'), includeHeaders = true } = config;

  const headers = [
    'ID', 'Reference', 'Client', 'Date', 'Statut', 'Type de commande',
    'Prix total (FCFA)', 'Frais de livraison (FCFA)', 'Adresse', 'Numero de table', 'Restaurant'
  ];

  const csvData: string[] = [];
  if (includeHeaders) {
    csvData.push(headers.map(formatCsvValue).join(','));
  }

  orders.forEach(order => {
    const row = [
      order.id, order.reference, order.clientName, order.date, order.status,
      order.orderType, order.totalPrice, order.deliveryPrice, order.address,
      order.tableNumber || '', order.restaurant || ''
    ];
    csvData.push(row.map(formatCsvValue).join(','));
  });

  const csvContent = csvData.join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

export const exportOrders = (
  orders: ExportOrder[],
  format: ExportFormat,
  config: Partial<ExportConfig> = {}
): void => {
  if (orders.length === 0) {
    throw new Error('Aucune commande a exporter');
  }
  if (format === 'csv') {
    exportToCSV(orders, { ...config, format });
  } else {
    throw new Error(`Format d'export non supporte: ${format}`);
  }
};

export const convertOrdersForExport = (orders: unknown[]): ExportOrder[] => {
  return orders.map(order => {
    const orderData = order as Record<string, unknown>;
    return {
      id: String(orderData.id || ''),
      reference: String(orderData.reference || ''),
      clientName: String(orderData.clientName || ''),
      date: String(orderData.date || ''),
      status: String(orderData.status || ''),
      totalPrice: Number(orderData.totalPrice) || 0,
      deliveryPrice: Number(orderData.deliveryPrice) || 0,
      orderType: String(orderData.orderType || ''),
      address: String(orderData.address || ''),
      tableNumber: orderData.tableNumber ? String(orderData.tableNumber) : undefined,
      restaurant: orderData.restaurant ? String(orderData.restaurant) : undefined
    };
  });
};

// ✅ Fonctions d'export pour les commentaires
export const exportCommentsToCSV = (comments: ExportComment[], config: Partial<ExportConfig> = {}): void => {
  const { filename = generateFilename('csv', 'commentaires'), includeHeaders = true } = config;

  const headers = [
    'ID', 'Client', 'Note', 'Message', 'Commande', 'Date', 'Restaurant', 'Plat'
  ];

  const csvData: string[] = [];
  if (includeHeaders) {
    csvData.push(headers.map(formatCsvValue).join(','));
  }

  comments.forEach(comment => {
    const row = [
      comment.id,
      comment.clientName,
      comment.rating,
      comment.message,
      comment.orderReference,
      comment.date,
      comment.restaurant || '',
      comment.dish || ''
    ];
    csvData.push(row.map(formatCsvValue).join(','));
  });

  const csvContent = csvData.join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

export const exportComments = (
  comments: ExportComment[],
  format: ExportFormat,
  config: Partial<ExportConfig> = {}
): void => {
  if (comments.length === 0) {
    throw new Error('Aucun commentaire à exporter');
  }
  if (format === 'csv') {
    exportCommentsToCSV(comments, { ...config, format });
  } else {
    throw new Error(`Format d'export non supporté: ${format}`);
  }
};

export const convertCommentsForExport = (comments: unknown[]): ExportComment[] => {
  return comments.map(comment => {
    const commentData = comment as Record<string, unknown>;
    const customer = commentData.customer as Record<string, unknown> || {};
    const order = commentData.order as Record<string, unknown> || {};
    const restaurant = commentData.restaurant as Record<string, unknown> || {};
    const dish = commentData.dish as Record<string, unknown> || {};

    return {
      id: String(commentData.id || ''),
      clientName: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Client anonyme',
      rating: Number(commentData.rating) || 0,
      message: String(commentData.message || ''),
      orderReference: String(order.reference || ''),
      date: commentData.created_at ?
        new Date(String(commentData.created_at)).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }) : '',
      restaurant: String(restaurant.name || ''),
      dish: String(dish.name || '')
    };
  });
};
