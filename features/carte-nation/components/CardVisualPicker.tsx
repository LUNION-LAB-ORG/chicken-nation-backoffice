"use client";

import { CardLevel } from "../types/carte-nation.types";
import { LEVEL_OPTIONS, STUDENT_MARKER_DOT } from "../utils/cardVisualOptions";

interface CardVisualPickerProps {
  level: CardLevel;
  isStudent: boolean;
  onLevelChange: (level: CardLevel) => void;
  onStudentChange: (isStudent: boolean) => void;
  disabled?: boolean;
  /** Couleur d'accent de la sélection selon le contexte (approbation ou régénération). */
  accent?: "emerald" | "orange";
}

/**
 * Choix du visuel de carte : un niveau parmi trois, et le marqueur étudiant
 * par-dessus. Les deux axes sont indépendants, « Étudiant + VIP » est donc
 * exprimable, ce qu'un choix unique parmi quatre interdisait.
 *
 * Volontairement SANS légende sous chaque option : la pastille montre déjà la
 * couleur, et le libellé donne le niveau. Un sous-titre par bouton n'ajoutait
 * rien et alourdissait un panneau qui s'ouvre au-dessus d'une liste.
 */
export function CardVisualPicker({
  level,
  isStudent,
  onLevelChange,
  onStudentChange,
  disabled,
  accent = "emerald",
}: CardVisualPickerProps) {
  const choisi =
    accent === "emerald"
      ? "border-emerald-500 bg-emerald-50 text-emerald-900"
      : "border-[#F17922] bg-[#F17922]/10 text-[#F17922]";
  const neutre = "border-gray-200 bg-white text-gray-700 hover:border-gray-300";
  const base =
    "flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50";

  return (
    <div className="space-y-2">
      <div role="group" aria-label="Niveau de la carte" className="grid grid-cols-3 gap-2">
        {LEVEL_OPTIONS.map((opt) => {
          const actif = level === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onLevelChange(opt.value)}
              disabled={disabled}
              aria-pressed={actif}
              className={`${base} ${actif ? choisi : neutre}`}
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: opt.dot }}
              />
              {opt.label}
            </button>
          );
        })}
      </div>

      <label
        className={`${base} cursor-pointer justify-start gap-2.5 ${
          isStudent ? "border-[#E0A800] bg-[#FFD24C]/15 text-gray-900" : neutre
        } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
      >
        <input
          type="checkbox"
          checked={isStudent}
          disabled={disabled}
          onChange={(e) => onStudentChange(e.target.checked)}
          className="h-4 w-4 accent-[#F17922]"
        />
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: STUDENT_MARKER_DOT }}
        />
        Étudiant
      </label>
    </div>
  );
}
