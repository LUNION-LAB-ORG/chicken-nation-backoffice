"use client";

import { CardLevel } from "../types/carte-nation.types";
import { LEVEL_OPTIONS, STUDENT_MARKER_DOT } from "../utils/cardVisualOptions";

interface CardVisualPickerProps {
  level: CardLevel;
  isStudent: boolean;
  onLevelChange: (level: CardLevel) => void;
  onStudentChange: (isStudent: boolean) => void;
  disabled?: boolean;
  /** Couleur d'accent de la sélection selon le contexte (approbation vs régénération). */
  accent?: "emerald" | "orange";
}

/**
 * Sélecteur du visuel de carte — DEUX AXES INDÉPENDANTS (cahier §4.5) :
 *  - le NIVEAU donne la dominante couleur (Orange / Or / Rouge) ;
 *  - le MARQUEUR étudiant (jaune) se pose PAR-DESSUS, sans toucher au niveau
 *    → « Étudiant + VIP » est exprimable, ce qu'un choix unique parmi 4 interdisait.
 */
export function CardVisualPicker({
  level,
  isStudent,
  onLevelChange,
  onStudentChange,
  disabled,
  accent = "emerald",
}: CardVisualPickerProps) {
  const activeRing =
    accent === "emerald"
      ? "border-emerald-500 ring-2 ring-emerald-200"
      : "border-[#F17922] ring-2 ring-[#F17922]/20";

  return (
    <div className="space-y-3">
      <div>
        <p className="mb-2 text-sm font-semibold text-gray-900">
          Niveau{" "}
          <span className="font-normal text-gray-500">
            (dominante couleur de la carte)
          </span>
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {LEVEL_OPTIONS.map((opt) => {
            const active = level === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onLevelChange(opt.value)}
                disabled={disabled}
                className={`flex items-center gap-2 rounded-xl border-2 bg-white px-3 py-2.5 text-left transition-colors disabled:opacity-50 ${
                  active ? activeRing : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <span
                  className="h-3 w-3 shrink-0 rounded-full ring-2 ring-white"
                  style={{ backgroundColor: opt.dot }}
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-gray-900">
                    {opt.label}
                  </span>
                  <span className="block truncate text-[11px] text-gray-500">
                    {opt.hint}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Axe 2 : marqueur étudiant, indépendant du niveau */}
      <label
        className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 bg-white px-3 py-2.5 transition-colors ${
          isStudent
            ? "border-[#FFD24C] ring-2 ring-[#FFD24C]/40"
            : "border-gray-200 hover:border-gray-300"
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
          className="h-3 w-3 shrink-0 rounded-full ring-2 ring-white"
          style={{ backgroundColor: STUDENT_MARKER_DOT }}
        />
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-gray-900">
            Marqueur étudiant
          </span>
          <span className="block text-[11px] text-gray-500">
            Badge jaune posé par-dessus le niveau — indépendant (ex. Étudiant + VIP)
          </span>
        </span>
      </label>
    </div>
  );
}
