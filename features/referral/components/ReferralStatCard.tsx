"use client";

import React from "react";
import type { LucideIcon } from "lucide-react";

/**
 * Carte de chiffre du parrainage, au dessin des cartes de la page Fidélité.
 * Cliquable : elle ouvre la liste qui détaille le chiffre.
 */
export default function ReferralStatCard({
  titre,
  couleur,
  valeur,
  unite,
  detail,
  evolution,
  Icone,
  onClick,
}: {
  titre: string;
  couleur: string;
  valeur: string;
  unite?: string;
  detail?: string;
  /** Par rapport à la période précédente : « +12 % », « -5 % ». */
  evolution?: string | null;
  Icone: LucideIcon;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`relative w-full text-left bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden ${
        onClick ? "cursor-pointer hover:shadow-lg transition-shadow" : "cursor-default"
      }`}
    >
      <span
        className="absolute top-0 left-4 py-[3px] px-4 text-white text-sm font-medium rounded-b-xl"
        style={{ backgroundColor: couleur }}
      >
        {titre}
      </span>
      <span className="flex items-start justify-between gap-2 pt-10 pb-3 px-4">
        <span className="flex-1 min-w-0">
          <span className="block text-2xl font-bold text-gray-900 truncate">
            {valeur}
            {unite && <span className="text-base font-medium text-gray-500 ml-1">{unite}</span>}
          </span>
          {detail && <span className="block text-xs text-gray-500 mt-1">{detail}</span>}
          {evolution && (
            <span className="block text-xs text-gray-500 mt-1">
              <span
                className={`font-semibold ${
                  evolution.startsWith("+")
                    ? "text-[#1E8E5A]"
                    : evolution.startsWith("-")
                      ? "text-red-600"
                      : ""
                }`}
              >
                {evolution}
              </span>{" "}
              par rapport à la période précédente
            </span>
          )}
        </span>
        <span
          className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${couleur}15` }}
        >
          <Icone className="w-5 h-5" style={{ color: couleur }} />
        </span>
      </span>
    </button>
  );
}
