"use client";

import React, { useState } from "react";
import { CalendarRange } from "lucide-react";
import { StatsFilters, PERIOD_OPTIONS, StatsPeriod } from "../../../../../features/statistics/filters/statistics.filters";

interface StatsPeriodFilterProps {
  filters: StatsFilters;
  onChange: (filters: StatsFilters) => void;
}

export default function StatsPeriodFilter({ filters, onChange }: StatsPeriodFilterProps) {
  const [showCustom, setShowCustom] = useState(false);
  const isCustomActive = !filters.period && (filters.startDate || filters.endDate);

  const handlePeriodChange = (period: StatsPeriod) => {
    setShowCustom(false);
    onChange({ ...filters, period, startDate: undefined, endDate: undefined });
  };

  const handleCustomToggle = () => {
    setShowCustom(!showCustom);
  };

  const handleDateChange = (field: "startDate" | "endDate", value: string) => {
    onChange({ ...filters, period: undefined, [field]: value });
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
        {PERIOD_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handlePeriodChange(opt.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 ${
              filters.period === opt.value
                ? "bg-white shadow-sm text-[#F17922] font-semibold"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {opt.shortLabel}
          </button>
        ))}
        <button
          onClick={handleCustomToggle}
          className={`px-2 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 ${
            isCustomActive
              ? "bg-white shadow-sm text-[#F17922] font-semibold"
              : "text-gray-500 hover:text-gray-700"
          }`}
          title="Période personnalisée"
        >
          <CalendarRange className="w-3.5 h-3.5" />
        </button>
      </div>

      {(showCustom || isCustomActive) && (
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={filters.startDate ?? ""}
            onChange={(e) => handleDateChange("startDate", e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 focus:border-[#F17922] focus:outline-none"
          />
          <span className="text-xs text-gray-400">-</span>
          <input
            type="date"
            value={filters.endDate ?? ""}
            onChange={(e) => handleDateChange("endDate", e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 focus:border-[#F17922] focus:outline-none"
          />
        </div>
      )}
    </div>
  );
}
