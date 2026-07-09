/**
 * Métadonnées d'affichage des types de deeplink (libellé FR + couleur).
 * Partagé par la répartition, les colonnes du tableau et le filtre.
 * Les clés correspondent au champ `type` renvoyé par le backend.
 */
export interface DeeplinkTypeMeta {
  label: string;
  color: string;
}

export const DEEPLINK_TYPE_META: Record<string, DeeplinkTypeMeta> = {
  dish: { label: "Plats", color: "#F17922" },
  category: { label: "Catégories", color: "#4285F4" },
  order: { label: "Commandes", color: "#34A853" },
  voucher: { label: "Bons & Promos", color: "#A855F7" },
  loyalty: { label: "Fidélité", color: "#EAB308" },
  nation_card: { label: "Carte Nation", color: "#EF4444" },
  home: { label: "Accueil", color: "#64748B" },
  unknown: { label: "Non catégorisé", color: "#94A3B8" },
};

/** Ordre d'affichage stable pour le filtre. */
export const DEEPLINK_TYPE_ORDER = [
  "dish",
  "category",
  "nation_card",
  "order",
  "voucher",
  "loyalty",
  "home",
] as const;

export const deeplinkTypeMeta = (type?: string | null): DeeplinkTypeMeta =>
  DEEPLINK_TYPE_META[type ?? "unknown"] ?? DEEPLINK_TYPE_META.unknown;
