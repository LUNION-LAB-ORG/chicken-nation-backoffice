import { SupplementItem } from "../types/order-form.types";

/**
 * Panneau du panier de la prise de commande : trajet de livraison et
 * suppléments d'une ligne. Tout est pur : aucun état, aucun appel réseau.
 */

/** Trajet du restaurant à l'adresse, remonté par la section Livraison. */
export interface TrajetLivraison {
  /** Distance par la route (Google), en mètres. */
  distanceMetres?: number;
  /** Durée du trajet, trafic compris, en secondes. */
  dureeSecondes?: number;
  /** Distance retenue pour les frais, en kilomètres : repli quand l'itinéraire manque. */
  distanceFraisKm?: number;
}

const kilometres = (km: number): string => `${km.toFixed(1).replace(".", ",")} km`;

/** « 850 m », « 12,4 km » : même écriture que les pastilles de la section Livraison. */
export const texteDistance = (metres: number): string =>
  metres >= 1000 ? kilometres(metres / 1000) : `${Math.round(metres)} m`;

/** « 25 min » : même écriture que les pastilles de la section Livraison. */
export const texteDuree = (secondes: number): string => `${Math.max(1, Math.round(secondes / 60))} min`;

const nombre = (n?: number): n is number => typeof n === "number" && Number.isFinite(n) && n > 0;

/**
 * « 12,4 km · 25 min de trajet ». Sans itinéraire, la distance des frais
 * seule ; rien du tout si aucune n'est connue.
 */
export const texteTrajet = (trajet?: TrajetLivraison | null): string | null => {
  if (!trajet) return null;
  if (nombre(trajet.distanceMetres)) {
    const distance = texteDistance(trajet.distanceMetres);
    return nombre(trajet.dureeSecondes) ? `${distance} · ${texteDuree(trajet.dureeSecondes)} de trajet` : distance;
  }
  return nombre(trajet.distanceFraisKm) ? kilometres(trajet.distanceFraisKm) : null;
};

/**
 * Suppléments d'une ligne, nommés : « Coca », « Sauce piment x2 ». Un
 * supplément inconnu du catalogue de l'écran garde un nom générique plutôt
 * que de disparaître de la ligne.
 */
export const supplementsNommes = (
  supplements: SupplementItem[],
  nomDe: (id: string) => string | undefined,
): string[] =>
  supplements
    .filter((s) => s.quantity > 0)
    .map((s) => {
      const nom = nomDe(s.id)?.trim() || "Supplément";
      return s.quantity > 1 ? `${nom} x${s.quantity}` : nom;
    });
