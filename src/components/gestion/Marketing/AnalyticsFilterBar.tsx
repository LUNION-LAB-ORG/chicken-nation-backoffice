"use client";

import React, { useState } from "react";
import { CalendarDays, Check, ChevronDown, Search, X } from "lucide-react";
import DateRangePicker from "@/components/ui/DateRangePicker";
import {
  DEEPLINK_TYPE_ORDER,
  deeplinkTypeMeta,
} from "@/components/gestion/Marketing/deeplink-types";
import { IAppClickSearchParams } from "../../../../features/analytics/types/analytics.type";

interface Props {
  filters: {
    search: string;
    type: string;
    dateFrom: Date | null;
    dateTo: Date | null;
  };
  changeFilters: (f: Partial<IAppClickSearchParams>) => void;
}

/**
 * Barre de filtres de la page « Clics & Deeplinks » — même langage visuel que la
 * page Commandes (pilules, actif orange, bouton Réinitialiser). Pilote à la fois
 * les KPIs et la liste.
 */
export function AnalyticsFilterBar({ filters, changeFilters }: Props) {
  const [showType, setShowType] = useState(false);
  const [showDate, setShowDate] = useState(false);

  const hasActive = !!(filters.type || filters.search || filters.dateFrom);
  const currentTypeLabel = filters.type
    ? deeplinkTypeMeta(filters.type).label
    : "Tous les types";

  return (
    <div className="w-full bg-white p-3 rounded-xl shadow-sm border border-gray-200">
      <div className="flex flex-wrap items-center gap-2">
        {/* Recherche */}
        <div className="relative flex-1 min-w-[14rem]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            className="w-full text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none py-2 pl-9 pr-3"
            placeholder="Rechercher (cible, plateforme, IP…)"
            value={filters.search}
            onChange={(e) => changeFilters({ search: e.target.value })}
          />
        </div>

        {/* Type de deeplink */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowType((s) => !s);
              setShowDate(false);
            }}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              filters.type
                ? "bg-orange-50 text-[#F17922] border-2 border-[#F17922]"
                : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            <span>{currentTypeLabel}</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${showType ? "rotate-180" : ""}`}
            />
          </button>

          {showType && (
            <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
              <button
                type="button"
                onClick={() => {
                  changeFilters({ type: "" });
                  setShowType(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm ${
                  !filters.type
                    ? "bg-orange-50 text-[#F17922] font-medium"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                <span>Tous les types</span>
                {!filters.type && <Check className="w-4 h-4 ml-auto" />}
              </button>
              {DEEPLINK_TYPE_ORDER.map((t) => {
                const meta = deeplinkTypeMeta(t);
                return (
                  <button
                    type="button"
                    key={t}
                    onClick={() => {
                      changeFilters({ type: t });
                      setShowType(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm ${
                      filters.type === t
                        ? "bg-orange-50 text-[#F17922] font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: meta.color }}
                    />
                    <span>{meta.label}</span>
                    {filters.type === t && <Check className="w-4 h-4 ml-auto" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Période — DateRangePicker (comme Commandes) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowDate((s) => !s);
              setShowType(false);
            }}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              filters.dateFrom
                ? "bg-orange-50 text-[#F17922] border-2 border-[#F17922]"
                : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>
              {filters.dateFrom && filters.dateTo
                ? `${new Date(filters.dateFrom).toLocaleDateString()} – ${new Date(
                    filters.dateTo,
                  ).toLocaleDateString()}`
                : "Période"}
            </span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${showDate ? "rotate-180" : ""}`}
            />
          </button>

          {showDate && (
            <DateRangePicker
              onRangeSelect={(range) => {
                changeFilters({
                  dateFrom: (range?.start ?? null) as unknown as string,
                  dateTo: (range?.end ?? null) as unknown as string,
                });
                setShowDate(false);
              }}
            />
          )}
        </div>

        {/* Réinitialiser (comme Commandes) */}
        {hasActive && (
          <button
            type="button"
            onClick={() =>
              changeFilters({
                search: "",
                type: "",
                dateFrom: null as unknown as string,
                dateTo: null as unknown as string,
              })
            }
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-all"
            title="Effacer tous les filtres"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Réinitialiser</span>
          </button>
        )}
      </div>
    </div>
  );
}
