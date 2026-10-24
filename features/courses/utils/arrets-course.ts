import { objetAdresse } from "../../orders/utils/adresse-commande";

/** Coordonnées validées : nombres finis dans les bornes de Google Maps. */
export type LatLng = { lat: number; lng: number };

/**
 * Garde stricte : Google Maps exige des nombres FINIS (pas `null`,
 * `undefined`, `NaN`, `Infinity`). Un texte numérique est accepté.
 */
export function toLatLng(lat: unknown, lng: unknown): LatLng | null {
  const n1 = typeof lat === "string" ? Number(lat) : lat;
  const n2 = typeof lng === "string" ? Number(lng) : lng;
  if (typeof n1 !== "number" || !Number.isFinite(n1)) return null;
  if (typeof n2 !== "number" || !Number.isFinite(n2)) return null;
  if (n1 < -90 || n1 > 90) return null;
  if (n2 < -180 || n2 > 180) return null;
  return { lat: n1, lng: n2 };
}

export interface ArretCourse extends LatLng {
  id: string;
  index: number;
  label: string;
}

interface LivraisonLue {
  id: string;
  sequence_order: number;
  order: { reference: string; address?: unknown };
}

/**
 * Arrêts de la carte d'une course, dans l'ordre de la tournée, et nombre de
 * livraisons sans coordonnées.
 *
 * `Order.address` arrive le plus souvent en TEXTE JSON
 * (« {"title":"Maison","latitude":5.36,...} ») : lu tel quel, il n'avait ni
 * latitude ni longitude, la carte disait « 0 arrêt » et « coordonnées
 * manquantes » pour des commandes bien placées (vérification à l'écran du
 * 24/10). L'adresse passe donc par `objetAdresse`.
 */
export function arretsDeLaCourse(livraisons: readonly LivraisonLue[]): { stops: ArretCourse[]; invalidCount: number } {
  let invalidCount = 0;
  const stops: ArretCourse[] = [];
  for (const d of [...livraisons].sort((a, b) => a.sequence_order - b.sequence_order)) {
    const adresse = objetAdresse(d.order.address);
    const coords = toLatLng(adresse?.latitude, adresse?.longitude);
    if (!coords) {
      invalidCount += 1;
      continue;
    }
    stops.push({ id: d.id, index: d.sequence_order, lat: coords.lat, lng: coords.lng, label: d.order.reference });
  }
  return { stops, invalidCount };
}
