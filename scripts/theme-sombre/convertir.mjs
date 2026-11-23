#!/usr/bin/env node
/**
 * Convertit les couleurs écrites en dur pour le thème sombre, puis régénère
 * src/app/theme.css. Relançable sans risque : un fichier déjà converti ne
 * change plus.
 *
 *   node scripts/theme-sombre/convertir.mjs            convertit et écrit
 *   node scripts/theme-sombre/convertir.mjs --verifier liste ce qui reste à convertir
 *
 * Voir scripts/theme-sombre/regles.mjs pour les règles.
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import {
  FAMILLES_GRISES,
  GRIS_SOMBRE,
  hexVersHsl,
  PAGE,
  RE_COULEUR_THEME,
  sombrePourFond,
  sombrePourTexte,
  SURFACE,
  TEINTES,
  convertir,
} from "./regles.mjs";

const RACINE = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const DOSSIERS = ["src", "features"];
const verifier = process.argv.includes("--verifier");

const fichiers = [];
const parcourir = (dossier) => {
  for (const nom of readdirSync(dossier)) {
    const chemin = join(dossier, nom);
    // Les tests gardent leurs exemples de classes tels quels.
    if (nom === "node_modules" || nom === "__tests__" || nom.startsWith(".")) continue;
    if (statSync(chemin).isDirectory()) parcourir(chemin);
    else if (/\.(tsx?|jsx?)$/.test(nom)) fichiers.push(chemin);
  }
};
DOSSIERS.forEach((d) => parcourir(join(RACINE, d)));

const aConvertir = [];
const utilisees = new Set();
for (const chemin of fichiers) {
  const avant = readFileSync(chemin, "utf8");
  const { texte } = convertir(avant);
  if (texte !== avant) {
    aConvertir.push(relative(RACINE, chemin));
    if (!verifier) writeFileSync(chemin, texte);
  }
  for (const m of (verifier ? avant : texte).matchAll(RE_COULEUR_THEME)) utilisees.add(m[1]);
}

if (verifier) {
  if (aConvertir.length) {
    console.log(`${aConvertir.length} fichier(s) à convertir :\n` + aConvertir.join("\n"));
    process.exit(1);
  }
  console.log("Thème sombre : rien à convertir.");
  process.exit(0);
}

// ── Palette de Tailwind : valeurs d'origine des teintes ────────────────────
const themeTailwind = readFileSync(join(RACINE, "node_modules/tailwindcss/theme.css"), "utf8");
const valeur = (teinte, nuance) => {
  const m = themeTailwind.match(new RegExp(`--color-${teinte}-${nuance}:\\s*([^;]+);`));
  if (!m) throw new Error(`Couleur Tailwind absente : ${teinte}-${nuance}`);
  return m[1].trim();
};

const lignes = (paires) => paires.map(([nom, v]) => `  ${nom}: ${v};`).join("\n");

const gris = FAMILLES_GRISES.flatMap((famille) =>
  Object.entries(GRIS_SOMBRE).map(([nuance, v]) => [`--color-${famille}-${nuance}`, v]),
);

// Teintes : les nuances claires (50 à 200, fonds et bordures) deviennent des
// fonds teintés sombres ; les nuances foncées (700 à 950, textes) prennent la
// valeur d'une nuance claire. 300 à 600 (boutons pleins, pastilles) restent.
const teintes = TEINTES.flatMap((t) => {
  const pleine = valeur(t, 500);
  return [
    [`--color-${t}-50`, `color-mix(in oklab, ${pleine} 12%, ${SURFACE})`],
    [`--color-${t}-100`, `color-mix(in oklab, ${pleine} 18%, ${SURFACE})`],
    [`--color-${t}-200`, `color-mix(in oklab, ${pleine} 30%, ${SURFACE})`],
    [`--color-${t}-700`, valeur(t, 400)],
    [`--color-${t}-800`, valeur(t, 300)],
    [`--color-${t}-900`, valeur(t, 200)],
    [`--color-${t}-950`, valeur(t, 100)],
  ];
});

// Valeurs claires des mêmes variables : un bloc toujours foncé (infobulle,
// panneau d'appel) les retrouve avec la classe \`palette-claire\`.
const grisClairs = FAMILLES_GRISES.flatMap((famille) =>
  Object.keys(GRIS_SOMBRE).map((nuance) => [`--color-${famille}-${nuance}`, valeur(famille, nuance)]),
);
const teintesClaires = TEINTES.flatMap((t) =>
  [50, 100, 200, 700, 800, 900, 950].map((nuance) => [`--color-${t}-${nuance}`, valeur(t, nuance)]),
);

const couleursCode = [...utilisees].sort().map((nom) => {
  const hex = nom.slice(4);
  const sombre = hexVersHsl(hex).l < 0.5 ? sombrePourTexte(hex) : sombrePourFond(hex);
  return { nom, clair: `#${hex}`, sombre };
});

const css = `/*
 * THÈME CLAIR ET SOMBRE
 *
 * ⚠️ Fichier GÉNÉRÉ par scripts/theme-sombre/convertir.mjs : ne pas le
 * modifier à la main, relancer le script.
 *
 * Le thème sombre se lit sur la classe \`dark\` de <html> (choix « Clair »,
 * « Sombre » ou « Système » du menu de l'utilisateur, src/utils/theme.ts).
 * Aucune classe n'est doublée : les couleurs sont des variables qui prennent
 * leur valeur sombre ci-dessous. En clair, rien ne change.
 *
 *  - \`white\` est le fond des cartes : \`bg-white\` devient sombre. Un texte
 *    blanc s'écrit \`text-blanc\` (toujours blanc), un texte noir \`text-noir\`.
 *  - Les gris (gray, slate, zinc, neutral, stone) s'inversent.
 *  - Les teintes : 50 à 200 deviennent des fonds teintés sombres, 700 à 950
 *    s'éclaircissent ; 300 à 600 restent.
 *  - Un code couleur du code (\`bg-hex-f4f4f5\`, \`text-hex-595959\`) garde son
 *    code en clair et prend une valeur calculée en sombre.
 *  - Une classe \`dark:\` reste possible pour un cas particulier.
 *  - Un bloc foncé dans les deux thèmes (infobulle, panneau d'appel, barre de
 *    sélection) porte \`palette-claire\` : il garde les couleurs du thème clair,
 *    pour lesquelles il a été dessiné.
 */

@custom-variant dark (&:where(.dark, .dark *));

/* Changement de thème sans fondu (voir appliquerTheme). */
html.sans-transition,
html.sans-transition * {
  transition: none !important;
}

@theme {
  --color-blanc: #ffffff;
  --color-noir: #000000;
${lignes(couleursCode.map((c) => [`--color-${c.nom}`, c.clair]))}
}

html.dark {
  color-scheme: dark;
  --background: ${PAGE};
  --foreground: ${GRIS_SOMBRE[800]};
  --muted: ${GRIS_SOMBRE[100]};
  --muted-foreground: ${GRIS_SOMBRE[500]};
  --border: ${GRIS_SOMBRE[200]};
  --input: ${GRIS_SOMBRE[200]};

  /* Fond des cartes, et textes noirs */
  --color-white: ${SURFACE};
  --color-noir: ${GRIS_SOMBRE[900]};

  /* Gris */
${lignes(gris)}

  /* Teintes */
${lignes(teintes)}

  /* Codes couleur du code */
${lignes(couleursCode.map((c) => [`--color-${c.nom}`, c.sombre]))}
}

/* Bloc toujours foncé : la palette du thème clair. */
html.dark .palette-claire {
  --color-white: #ffffff;
  --color-noir: #000000;
${lignes(grisClairs)}
${lignes(teintesClaires)}
${lignes(couleursCode.map((c) => [`--color-${c.nom}`, c.clair]))}
}

/* Graphiques (Recharts) : infobulle par défaut et colonne de survol, écrites
   en dur par la bibliothèque. */
html.dark .recharts-default-tooltip {
  background-color: ${SURFACE} !important;
  border-color: ${GRIS_SOMBRE[200]} !important;
}
html.dark .recharts-rectangle.recharts-tooltip-cursor {
  fill: rgba(255, 255, 255, 0.06);
}
html.dark .recharts-curve.recharts-tooltip-cursor {
  stroke: ${GRIS_SOMBRE[300]};
}
`;

writeFileSync(join(RACINE, "src/app/theme.css"), css);
console.log(`${aConvertir.length} fichier(s) convertis, ${couleursCode.length} couleurs du code dans src/app/theme.css.`);
