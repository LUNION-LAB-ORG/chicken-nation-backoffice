import { CardLevel } from "../types/carte-nation.types";

/**
 * Palette de la Carte de la Nation — cahier des charges §4.5.
 *
 * DEUX AXES INDÉPENDANTS :
 *  - le NIVEAU donne la dominante couleur de la carte (ci-dessous) ;
 *  - le STATUT ÉTUDIANT est un MARQUEUR jaune posé PAR-DESSUS (case à cocher,
 *    indépendante du niveau → « Étudiant + VIP » est possible).
 *
 * ⚠️ Miroir du `LEVEL_THEME` / `STUDENT_COLOR` du générateur backend
 * (card-generation.service.ts) — garder les deux alignés.
 */
export const LEVEL_OPTIONS: {
  value: CardLevel;
  label: string;
  hint: string;
  dot: string;
}[] = [
  { value: "STANDARD", label: "Standard", hint: "Orange — niveau de base", dot: "#F17922" },
  { value: "VIP", label: "VIP", hint: "Or — sur éligibilité", dot: "#D4AF37" },
  { value: "VVIP", label: "VVIP", hint: "Rouge — le sommet", dot: "#C0392B" },
];

/** Couleur du marqueur étudiant (badge + liseré). */
export const STUDENT_MARKER_DOT = "#FFD24C";
