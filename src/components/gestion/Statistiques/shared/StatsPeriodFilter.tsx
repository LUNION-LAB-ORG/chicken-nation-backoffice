"use client";

import React, { useState } from "react";
import { CalendarRange } from "lucide-react";
import { StatsFilters, PERIOD_OPTIONS, StatsPeriod } from "../../../../../features/statistics/filters/statistics.filters";
import DateRangePicker from "@/components/ui/DateRangePicker";

interface StatsPeriodFilterProps {
  filters: StatsFilters;
  onChange: (filters: StatsFilters) => void;
}

export default function StatsPeriodFilter({ filters, onChange }: StatsPeriodFilterProps) {
  const [showCalendar, setShowCalendar] = useState(false);
  const isCustomActive = !filters.period && (filters.startDate || filters.endDate);

  const handlePeriodChange = (period: StatsPeriod) => {
    setShowCalendar(false);
    onChange({ ...filters, period, startDate: undefined, endDate: undefined });
  };

  const handleCalendarToggle = () => {
    setShowCalendar(!showCalendar);
  };

  const handleDateRangeSelect = (range: { start: Date | null; end: Date | null } | null) => {
    if (range && range.start && range.end) {
      const formatDate = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
      };
      onChange({
        ...filters,
        period: undefined,
        startDate: formatDate(range.start),
        endDate: formatDate(range.end),
      });
    } else {
      onChange({ ...filters, period: "month", startDate: undefined, endDate: undefined });
    }
    setShowCalendar(false);
  };

  // Formater les dates pour l'affichage
  const formatDisplayDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
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
        <div className="relative">
          <button
            onClick={handleCalendarToggle}
            className={`px-2 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 ${
              isCustomActive
                ? "bg-white shadow-sm text-[#F17922] font-semibold"
                : "text-gray-500 hover:text-gray-700"
            }`}
            title="Période personnalisée"
          >
            <CalendarRange className="w-3.5 h-3.5" />
          </button>
          {showCalendar && (
            <DateRangePicker onRangeSelect={handleDateRangeSelect} />
          )}
        </div>
      </div>

      {isCustomActive && filters.startDate && filters.endDate && (
        <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
          {formatDisplayDate(filters.startDate)} - {formatDisplayDate(filters.endDate)}
        </span>
      )}
    </div>
  );
}
