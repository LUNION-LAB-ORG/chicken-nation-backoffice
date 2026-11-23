/**
 * THÈME SOMBRE : règles partagées par le script de conversion
 * (scripts/theme-sombre/convertir.mjs) et par le test qui garde le thème
 * complet (src/utils/__tests__/theme-couleurs.test.ts).
 *
 * Principe : le thème sombre ne touche à AUCUNE classe à la main. Les
 * couleurs claires sont des variables qui prennent une valeur sombre sous
 * `html.dark` (src/app/theme.css). Ce qui ne passe pas par une variable de
 * Tailwind est converti une fois pour toutes :
 *  - un code couleur clair en fond, bordure ou dégradé (`bg-[#F4F4F5]`), et
 *    un code couleur foncé en texte (`text-[#595959]`), deviennent une
 *    couleur du thème au même code (`bg-hex-f4f4f5`, `text-hex-595959`) :
 *    identique en clair, adaptée en sombre ;
 *  - `text-white` devient `text-blanc` (toujours blanc), car en sombre
 *    `white` désigne le fond des cartes ; `text-black` devient `text-noir` ;
 *  - un fond gris foncé (`bg-gray-900`, infobulles, badges) reçoit sa valeur
 *    sombre fixe (`dark:bg-[#0e1014]`), sinon il deviendrait clair ;
 *  - le survol d'un bouton plein (`hover:bg-red-700`) reçoit
 *    `dark:hover:bg-red-500`, le 700 devenant clair en sombre.
 */

/** Fond des cartes (`bg-white`) et de la page en thème sombre. */
export const SURFACE = "#1b1e25";
export const PAGE = "#13151a";

/** Échelle grise sombre : reprise par gray, slate, zinc, neutral et stone. */
export const GRIS_SOMBRE = {
  50: PAGE,
  100: "#23272f",
  200: "#2d323c",
  300: "#3b414d",
  400: "#6c7381",
  500: "#949bab",
  600: "#b0b6c3",
  700: "#c8cdd7",
  800: "#dde1e8",
  900: "#eef0f4",
  950: "#f7f8fa",
};
export const FAMILLES_GRISES = ["gray", "slate", "zinc", "neutral", "stone"];
export const TEINTES = [
  "red", "orange", "amber", "yellow", "lime", "green", "emerald", "teal", "cyan",
  "sky", "blue", "indigo", "violet", "purple", "fuchsia", "pink", "rose",
];

/** Fonds gris foncés : valeur fixe en sombre (ils restent foncés). */
export const GRIS_FONCES_FIXES = {
  600: "#4b5260",
  700: "#3a404c",
  800: "#2a2f38",
  900: "#0e1014",
  950: "#0a0b0e",
};

const PROPS_TEXTE = new Set(["text", "fill", "stroke", "placeholder", "caret", "decoration"]);
/** Propriétés de fond et de trait converties. Barres de défilement, accent et ombres gardent leur code. */
const PROPS_FOND = new Set([
  "bg", "border", "border-t", "border-b", "border-l", "border-r", "border-x", "border-y", "border-s", "border-e",
  "divide", "ring", "ring-offset", "outline", "from", "via", "to",
]);

export const versHex6 = (hex) => {
  const h = hex.replace("#", "").toLowerCase();
  return h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
};

export const hexVersHsl = (hex) => {
  const h = versHex6(hex);
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let teinte;
  if (max === r) teinte = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) teinte = (b - r) / d + 2;
  else teinte = (r - g) / d + 4;
  return { h: teinte * 60, s, l };
};

export const hslVersHex = ({ h, s, l }) => {
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return "#" + [f(0), f(8), f(4)].map((x) => Math.round(x * 255).toString(16).padStart(2, "0")).join("");
};

const borne = (x, min, max) => Math.min(max, Math.max(min, x));

/** Code couleur à convertir pour cette propriété, ou rien. */
export const aConvertir = (prop, hex) => {
  const { l } = hexVersHsl(hex);
  if (PROPS_TEXTE.has(prop)) return l < 0.5;
  if (PROPS_FOND.has(prop)) return l > 0.78;
  return false;
};

/** Valeur sombre d'une couleur claire de fond ou de trait. */
export const sombrePourFond = (hex) => {
  const { h, s, l } = hexVersHsl(hex);
  if (s < 0.15) {
    if (l >= 0.995) return SURFACE;
    if (l >= 0.97) return "#191c22";
    if (l >= 0.94) return GRIS_SOMBRE[100];
    if (l >= 0.9) return GRIS_SOMBRE[200];
    if (l >= 0.84) return GRIS_SOMBRE[300];
    return "#4a5160";
  }
  const lum = l >= 0.97 ? 0.13 : l >= 0.94 ? 0.155 : l >= 0.9 ? 0.19 : l >= 0.84 ? 0.25 : 0.3;
  return hslVersHex({ h, s: Math.min(s, 0.7) * 0.55, l: lum });
};

/** Valeur sombre d'une couleur foncée de texte : éclaircie, même teinte. */
export const sombrePourTexte = (hex) => {
  const { h, s, l } = hexVersHsl(hex);
  if (s < 0.15) return hslVersHex({ h, s: Math.min(s, 0.08), l: borne(1 - l * 0.78, 0.6, 0.93) });
  return hslVersHex({ h, s: Math.min(s, 0.85), l: borne(1 - l * 0.6, 0.66, 0.82) });
};

const RE_HEX = /(?<![\w-])((?:[a-z0-9-]+:)*)([a-z]+(?:-[a-z]+)?)-\[#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\]/g;
const RE_BLANC_NOIR = /(?<![\w-])((?:[a-z0-9-]+:)*)(text|fill|stroke|placeholder|caret|decoration)-(white|black)(?![\w-])/g;
const RE_SURVOL_700 = new RegExp(
  `(?<![\\w:-])hover:bg-(${TEINTES.join("|")})-700(?![\\w-])(?! dark:hover:bg-)`,
  "g",
);
const RE_GRIS_FONCE = new RegExp(
  `(?<![\\w-])((?:[a-z0-9-]+:)*)(bg|from|via|to|border|ring|divide)-(${FAMILLES_GRISES.join("|")})-(600|700|800|900|950)(\\/\\d+)?(?![\\w-])`,
  "g",
);

/**
 * Convertit le texte d'un fichier. Renvoie le texte converti et les couleurs
 * du thème qu'il utilise (`{ nom, clair, sombre }`).
 */
export function convertir(texte) {
  const couleurs = new Map();

  let sortie = texte.replace(RE_HEX, (tout, variantes, prop, hex) => {
    if (variantes.includes("dark:") || !aConvertir(prop, hex)) return tout;
    const h6 = versHex6(hex);
    const nom = `hex-${h6}`;
    const texteFonce = PROPS_TEXTE.has(prop);
    couleurs.set(nom, { nom, clair: `#${h6}`, sombre: texteFonce ? sombrePourTexte(h6) : sombrePourFond(h6) });
    return `${variantes}${prop}-${nom}`;
  });

  sortie = sortie.replace(RE_BLANC_NOIR, (tout, variantes, prop, couleur) => {
    if (variantes.includes("dark:")) return tout;
    return `${variantes}${prop}-${couleur === "white" ? "blanc" : "noir"}`;
  });

  sortie = sortie.replace(RE_SURVOL_700, (tout, teinte) => `${tout} dark:hover:bg-${teinte}-500`);

  sortie = sortie.replace(RE_GRIS_FONCE, (tout, variantes, prop, _famille, nuance, opacite = "", decalage, chaine) => {
    if (variantes.includes("dark:")) return tout;
    const ajout = ` dark:${variantes}${prop}-[${GRIS_FONCES_FIXES[nuance]}]${opacite}`;
    // Déjà converti : la valeur sombre suit.
    if (chaine.startsWith(ajout, decalage + tout.length)) return tout;
    return tout + ajout;
  });

  return { texte: sortie, couleurs: [...couleurs.values()] };
}

/** Une couleur de la forme `hex-xxxxxx` utilisée dans un texte. */
export const RE_COULEUR_THEME = /(?<![\w-])(?:[a-z0-9-]+:)*[a-z]+(?:-[a-z]+)?-(hex-[0-9a-f]{6})(?![\w-])/g;
