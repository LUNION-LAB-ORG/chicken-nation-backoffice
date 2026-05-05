"use client";

import React from "react";
import type { LucideIcon } from "lucide-react";

interface Props {
  badgeText: string;
  badgeColor: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  /** Progression 0-100 affichée en mini-circle à droite (optionnel) */
  progress?: number;
  progressLabel?: string;
  onClick?: () => void;
}

/**
 * Card KPI pour la page Courses. Inspirée de GenericStatCard (Dashboard)
 * mais sans dépendance, pour découpler le module.
 */
export function CoursesStatCard({
  badgeText,
  badgeColor,
  value,
  unit,
  subtitle,
  icon: Icon,
  iconColor,
  progress,
  progressLabel,
  onClick,
}: Props) {
  const clickable = !!onClick;
  return (
    <div
      onClick={onClick}
      className={`relative bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden ${
        clickable ? "cursor-pointer hover:shadow-lg transition-shadow" : ""
      }`}
    >
      <div
        className="absolute top-0 left-4 py-[3px] px-4 text-white text-sm font-medium rounded-b-xl"
        style={{ backgroundColor: badgeColor }}
      >
        {badgeText}
      </div>

      <div className="pt-10 pb-3 px-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-gray-900 truncate">
              {value}
              {unit ? <span className="text-base font-medium text-gray-500 ml-1">{unit}</span> : null}
            </h2>
            {subtitle ? <p className="text-xs text-gray-500 mt-1">{subtitle}</p> : null}
          </div>

          {Icon && (
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${iconColor ?? badgeColor}15` }}
            >
              <Icon className="w-5 h-5" style={{ color: iconColor ?? badgeColor }} />
            </div>
          )}
        </div>
      </div>

      {progress !== undefined && (
        <div className="bg-[#FFF8EE] px-4 py-2 flex items-center justify-between">
          <span className="text-xs text-gray-700">{progressLabel ?? "Taux"}</span>
          <MiniCircle percentage={Math.max(0, Math.min(100, progress))} color={badgeColor} />
        </div>
      )}
    </div>
  );
}

function MiniCircle({ percentage, color }: { percentage: number; color: string }) {
  const size = 40;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (percentage / 100) * circ;

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#F5F5F5"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="absolute text-[11px] font-semibold" style={{ color }}>
        {percentage}%
      </span>
    </div>
  );
}
