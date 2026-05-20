/**
 * Cles localStorage utilisees par l'app backoffice.
 * Convention : prefix `cn_` pour le namespace, snake_case.
 *
 * Pour l'instant ce fichier ne porte que les cles d'appairage imprimante
 * thermique (cf. src/lib/escpos/usb.ts et bluetooth.ts).
 */
export const STORAGE_KEYS = {
  /** Imprimante USB appairee : `{vendorId, productId, serialNumber?}`. */
  POS_PRINTER_DEVICE: "cn_imprimante_device",
  /** Imprimante Bluetooth appairee : `{id, name}`. */
  POS_PRINTER_BT: "cn_imprimante_bt",
  /** Transport prefere : `'usb' | 'bluetooth' | 'auto'`. */
  POS_PRINTER_TRANSPORT: "cn_imprimante_transport",
} as const;
