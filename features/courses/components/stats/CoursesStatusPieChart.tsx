"use client";

import React from "react";
import { PieChart as PieChartIcon } from "lucide-react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import type { ICourseStatsDistribution } from "../../types/course.types";

interface Props {
  distribution: ICourseStatsDistribution[];
  isLoading: boolean;
}

const COLORS: Record<ICourseStatsDistribution["statut"], string> = {
  COMPLETED: "#4FCB71",
  CANCELLED: "#EA4335",
  EXPIRED: "#6B7280",
};

const LABELS: Record<ICourseStatsDistribution["statut"], string> = {
  COMPLETED: "Livrées",
  CANCELLED: "Annulées",
  EXPIRED: "Expirées",
};

/** Distribution des statuts finaux (pie donut). */
export function CoursesStatusPieChart({ distribution, isLoading }: Props) {
  const total = distribution.reduce((s, d) => s + d.count, 0);
  const data = distribution.map((d) => ({
    name: LABELS[d.statut],
    value: d.count,
    color: COLORS[d.statut],
  }));

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center">
          <PieChartIcon className="w-5 h-5 text-[#007AFF]" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900">Répartition finale</h3>
          <p className="text-xs text-gray-500">Toutes les courses terminales</p>
        </div>
      </div>

      {isLoading && total === 0 ? (
        <div className="h-[260px] rounded-xl bg-gray-50 animate-pulse" />
      ) : total === 0 ? (
        <div className="h-[260px] flex items-center justify-center">
          <p className="text-sm text-gray-400">Aucune course terminée sur la période</p>
        </div>
      ) : (
        <div className="h-[260px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={2}
                dataKey="value"
                stroke="white"
                strokeWidth={3}
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  fontSize: 12,
                }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} verticalAlign="bottom" />
            </PieChart>
          </ResponsiveContainer>
          {/* Total au centre */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none top-[-30px]">
            <span className="text-2xl font-bold text-gray-900">{total}</span>
            <span className="text-xs text-gray-500">courses</span>
          </div>
        </div>
      )}
    </div>
  );
}
