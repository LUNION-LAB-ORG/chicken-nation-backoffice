/**
 * Fabriques d'icônes Google Maps de marque (backoffice).
 *
 * Alignées sur l'identité visuelle des apps mobiles :
 *  - Restaurant  → pastille orange « R »
 *  - Client      → MAISON (le client est une maison, comme sur l'app livreur)
 *  - Livreur     → badge orange directionnel (flèche orientée selon le cap),
 *                  style « unité en mouvement » à la Uber / Yango.
 *
 * ⚠ À n'appeler qu'après chargement du script Google (`isScriptLoaded`), car ces
 * fonctions référencent `google.maps.Size` / `google.maps.Point`.
 */

const ORANGE = "#F17922";
const WHITE = "#FFFFFF";

function svgIcon(svg: string, size: number, anchor?: { x: number; y: number }): google.maps.Icon {
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(size, size),
    anchor: new google.maps.Point(anchor?.x ?? size / 2, anchor?.y ?? size / 2),
  };
}

/** Pastille orange « R » — origine du trajet (restaurant / point de retrait). */
export function restaurantMarkerIcon(selected = false): google.maps.Icon {
  const size = selected ? 44 : 38;
  const r = selected ? 15 : 13;
  const cx = size / 2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${cx}" cy="${cx}" r="${r}" fill="${ORANGE}" stroke="${WHITE}" stroke-width="3"/>
    <text x="${cx}" y="${cx + 5}" text-anchor="middle" fill="${WHITE}" font-family="Arial,Helvetica,sans-serif" font-size="${selected ? 16 : 14}" font-weight="700">R</text>
  </svg>`;
  return svgIcon(svg, size);
}

/**
 * Maison blanche liserée orange — destination client. Cohérent avec l'app
 * livreur (le client est une maison). `index` optionnel → pastille numérotée
 * en haut-droite pour les courses multi-arrêts (ordre de livraison).
 */
export function clientHouseMarkerIcon(
  opts: { index?: number; selected?: boolean } = {},
): google.maps.Icon {
  const { index, selected = false } = opts;
  const size = selected ? 44 : 38;
  const cx = size / 2;
  const r = selected ? 15 : 13;
  // Maison centrée autour de (cx, cx), échelle douce.
  const s = selected ? 1.15 : 1;
  const house = `
    <g transform="translate(${cx} ${cx}) scale(${s})">
      <path d="M0 -7 L8 0.5 L5.5 0.5 L5.5 8 L1.5 8 L1.5 3 L-1.5 3 L-1.5 8 L-5.5 8 L-5.5 0.5 L-8 0.5 Z"
            fill="${ORANGE}"/>
    </g>`;
  // Pastille numérotée (multi-stops) : petit disque orange en haut-droite.
  const badge =
    typeof index === "number"
      ? `<g>
           <circle cx="${size - 9}" cy="9" r="8" fill="${ORANGE}" stroke="${WHITE}" stroke-width="1.5"/>
           <text x="${size - 9}" y="12" text-anchor="middle" fill="${WHITE}" font-family="Arial,Helvetica,sans-serif" font-size="10" font-weight="700">${index}</text>
         </g>`
      : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${cx}" cy="${cx}" r="${r}" fill="${WHITE}" stroke="${ORANGE}" stroke-width="2.5"/>
    ${house}
    ${badge}
  </svg>`;
  return svgIcon(svg, size);
}

/**
 * Badge livreur live (détail de course). Flèche blanche orientée selon le `cap`
 * GPS (0° = nord) sur pastille orange, ceinte d'un halo « live ». Donne le sens
 * de déplacement, comme les apps de course.
 */
export function delivererCourseMarkerIcon(heading: number | null = null): google.maps.Icon {
  const size = 48;
  const cx = size / 2;
  const rot = typeof heading === "number" && Number.isFinite(heading) ? heading : 0;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${cx}" cy="${cx}" r="21" fill="${ORANGE}" fill-opacity="0.16"/>
    <circle cx="${cx}" cy="${cx}" r="14" fill="${ORANGE}" stroke="${WHITE}" stroke-width="3"/>
    <g transform="rotate(${rot} ${cx} ${cx})">
      <path d="M${cx} ${cx - 9} L${cx + 6} ${cx + 7} L${cx} ${cx + 3} L${cx - 6} ${cx + 7} Z" fill="${WHITE}"/>
    </g>
  </svg>`;
  return svgIcon(svg, size);
}
