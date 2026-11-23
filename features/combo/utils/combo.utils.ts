import {
  ComboGame,
  ComboItemType,
  ComboSolutionItem,
  ComboStatus,
} from "../types/combo.types";

export const money = (n: number) =>
  `${Math.round(n || 0).toLocaleString("fr-FR")} FCFA`;

/** Formate une date ISO en date+heure lisible (fr). */
export const dateTimeFmt = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Convertit une date ISO en valeur pour un <input type="datetime-local">
 * (format "YYYY-MM-DDTHH:mm", en heure locale).
 */
export const toLocalInput = (iso: string | null | undefined): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};

/** Convertit une valeur d'input datetime-local en ISO (UTC). */
export const fromLocalInput = (value: string): string => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString();
};

export const ITEM_TYPE_LABEL: Record<ComboItemType, string> = {
  DISH: "Plat",
  SUPPLEMENT: "Supplément",
};

export const ITEM_TYPE_BADGE: Record<ComboItemType, string> = {
  DISH: "bg-hex-fff6e9 text-hex-b25a00",
  SUPPLEMENT: "bg-hex-e7f0fb text-hex-2b6cb0",
};

/**
 * Statut effectif d'un jeu : privilégie le statut serveur, sinon dérive de la
 * fenêtre temporelle et de l'état du tirage.
 */
export const resolveStatus = (game: ComboGame): ComboStatus => {
  if (game.status) return game.status;
  if (game.winners_drawn) return "DRAWN";
  const now = Date.now();
  const start = new Date(game.starts_at).getTime();
  const end = new Date(game.ends_at).getTime();
  if (Number.isFinite(start) && now < start) return "SCHEDULED";
  if (Number.isFinite(end) && now > end) return "ENDED";
  return "ACTIVE";
};

export const STATUS_LABEL: Record<ComboStatus, string> = {
  SCHEDULED: "Planifié",
  ACTIVE: "En cours",
  ENDED: "Terminé",
  DRAWN: "Tirage effectué",
};

export const STATUS_BADGE: Record<ComboStatus, string> = {
  SCHEDULED: "bg-hex-e7f0fb text-hex-2b6cb0",
  ACTIVE: "bg-hex-e6f4ec text-hex-1e8e5a",
  ENDED: "bg-hex-eef1f4 text-hex-6c757d",
  DRAWN: "bg-hex-f3e8ff text-[#7C3AED]",
};

/** Résumé lisible de la combinaison-solution. */
export const describeSolution = (
  items: ComboSolutionItem[] | undefined | null
): string => {
  if (!items || items.length === 0) return "—";
  return items
    .map((it) => {
      const name = it.name || `${ITEM_TYPE_LABEL[it.item_type]}`;
      return it.quantity && it.quantity > 1 ? `${name} ×${it.quantity}` : name;
    })
    .join(" + ");
};
