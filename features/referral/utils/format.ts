/** Formatage FCFA (séparateur de milliers fr-FR). */
export const fcfa = (n: number | null | undefined): string =>
  `${Math.round(Number(n ?? 0)).toLocaleString("fr-FR")} FCFA`;

/** Date courte lisible. */
export const shortDate = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};
