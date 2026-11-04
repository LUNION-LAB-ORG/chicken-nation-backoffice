/** Formatage FCFA (séparateur de milliers fr-FR). */
export const fcfa = (n: number | null | undefined): string =>
  `${Math.round(Number(n ?? 0)).toLocaleString("fr-FR")} FCFA`;

/** Date courte lisible. */
export const shortDate = (iso: string | null | undefined): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

/** Nombre avec séparateur de milliers. */
export const nombre = (n: number | null | undefined): string =>
  Math.round(Number(n ?? 0)).toLocaleString("fr-FR");

/** « 1 parrain », « 3 parrains ». */
export const pluriel = (n: number, mot: string): string =>
  `${nombre(n)} ${mot}${n > 1 ? "s" : ""}`;

/** Évolution par rapport à la période précédente, `null` si rien à comparer. */
export const tendance = (actuel: number, avant: number | undefined): string | null => {
  if (!avant) return null;
  const pct = Math.round(((actuel - avant) / avant) * 100);
  return `${pct > 0 ? "+" : ""}${pct} %`;
};
