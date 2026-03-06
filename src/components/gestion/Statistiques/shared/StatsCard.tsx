"use client";

import React from "react";

type CardColor = "orange" | "green" | "blue" | "purple" | "red";

const colorMap: Record<CardColor, { bg: string; text: string; border: string }> = {
  orange: { bg: "bg-orange-50", text: "text-[#F17922]", border: "border-orange-100" },
  green:  { bg: "bg-green-50",  text: "text-green-700",  border: "border-green-100" },
  blue:   { bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-100" },
  purple: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-100" },
  red:    { bg: "bg-red-50",    text: "text-red-600",    border: "border-red-100" },
};

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: { label: string; color: string; arrow: string };
  color?: CardColor;
  onClick?: () => void;
  active?: boolean;
}

export default function StatsCard({ title, value, subtitle, trend, color = "orange", onClick, active }: StatsCardProps) {
  const c = colorMap[color];

  return (
    <div
      className={`${c.bg} ${c.border} border rounded-2xl p-4 ${onClick ? "cursor-pointer transition-all hover:shadow-md" : ""} ${active ? "ring-2 ring-[#F17922] ring-offset-1 shadow-md" : ""}`}
      onClick={onClick}
    >
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
      <p className={`text-2xl font-bold ${c.text} mt-1`}>{value}</p>
      <div className="flex items-center justify-between mt-1">
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
        {trend && (
          <span className="text-xs font-medium" style={{ color: trend.color }}>
            {trend.arrow} {trend.label}
          </span>
        )}
      </div>
    </div>
  );
}
