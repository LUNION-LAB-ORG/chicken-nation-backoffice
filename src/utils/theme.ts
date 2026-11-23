/**
 * THÈME CLAIR ET SOMBRE DU BACKOFFICE (23/11).
 *
 * Le choix est propre à l'appareil (mémorisé dans le navigateur) : « Clair »
 * par défaut, l'écran que les équipes connaissent ; « Sombre » ; ou
 * « Système », qui suit le réglage de l'ordinateur ou du téléphone.
 *
 * Le thème sombre se lit sur la classe `dark` de la balise <html>. Les
 * couleurs, elles, sont des variables (src/app/theme.css) : une classe
 * comme `bg-white` ou `text-gray-500` prend sa valeur sombre d'elle-même.
 */

export type ChoixTheme = "clair" | "sombre" | "systeme";

export const CLE_THEME = "cn-theme";
export const THEME_PAR_DEFAUT: ChoixTheme = "clair";

export const CHOIX_THEME: { valeur: ChoixTheme; libelle: string }[] = [
  { valeur: "clair", libelle: "Clair" },
  { valeur: "sombre", libelle: "Sombre" },
  { valeur: "systeme", libelle: "Système" },
];

/** Valeur mémorisée, ou le thème par défaut si elle est absente ou inconnue. */
export const lireChoixTheme = (brut: string | null | undefined): ChoixTheme =>
  brut === "clair" || brut === "sombre" || brut === "systeme" ? brut : THEME_PAR_DEFAUT;

/** L'écran doit-il être sombre ? `systemeSombre` : réglage de l'appareil. */
export const estSombre = (choix: ChoixTheme, systemeSombre: boolean): boolean =>
  choix === "sombre" || (choix === "systeme" && systemeSombre);

/**
 * Posé dans <head>, exécuté AVANT l'affichage : sans lui, la page
 * s'afficherait claire puis basculerait (éclair blanc à chaque ouverture).
 * Même règle que `estSombre`, écrite à la main car elle tourne avant React.
 */
export const SCRIPT_THEME = `(function(){try{var c=localStorage.getItem("${CLE_THEME}");var s=c==="sombre"||(c==="systeme"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",s);}catch(e){}})();`;
