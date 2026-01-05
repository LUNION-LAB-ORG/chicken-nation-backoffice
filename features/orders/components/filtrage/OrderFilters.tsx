"use client";
import { useCallback, useState } from "react";
import { useDashboardStore } from "@/store/dashboardStore";
import { OrderStatus, OrderType } from "../../types/order.types";
import { dateRangeToLocalString } from "../../../../utils/date/format-date";
import DateRangePicker from "@/components/ui/DateRangePicker";

export function OrderFilters() {
  const {
    orders: { filters },
    setFilter,
    setPagination,
  } = useDashboardStore();

  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showSourceDropdown, setShowSourceDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const filtragesType = [
    { id: "", label: "Tous les types", icon: "📦" },
    { id: OrderType.DELIVERY, label: "À livrer", icon: "🚚" },
    { id: OrderType.PICKUP, label: "À récupérer", icon: "🛍️" },
    { id: OrderType.TABLE, label: "À tables", icon: "🍽️" },
  ];

  const filtragesStatus = [
    { id: "", label: "Tous les statuts", icon: "📋" },
    { id: OrderStatus.PENDING, label: "Nouvelles", icon: "🔔" },
    { id: OrderStatus.IN_PROGRESS, label: "En préparation", icon: "👨‍🍳" },
    { id: OrderStatus.READY, label: "Prêtes", icon: "✅" },
    { id: OrderStatus.PICKED_UP, label: "En Livraison", icon: "🚗" },
    { id: OrderStatus.COLLECTED, label: "Collectées", icon: "📦" },
    { id: OrderStatus.COMPLETED, label: "Terminées", icon: "✔️" },
    { id: OrderStatus.CANCELLED, label: "Annulées", icon: "❌" },
  ];

  const filtragesSource = [
    { id: "", label: "Toutes les sources", icon: "🌐" },
    { id: "auto", label: "Par application", icon: "📱" },
    { id: "mannuel", label: "Par téléphone", icon: "☎️" },
  ];

  const handleFilterTypeChange = useCallback(
    (filter: string) => {
      setFilter("orders", "type", filter);
      setPagination("orders", 1, 10);
      setShowTypeDropdown(false);
    },
    [setFilter, setPagination]
  );

  const handleFilterStatusChange = useCallback(
    (filter: string) => {
      setFilter("orders", "status", filter);
      setPagination("orders", 1, 10);
      setShowStatusDropdown(false);
    },
    [setFilter, setPagination]
  );

  const handleFilterSourceChange = useCallback(
    (filter: string) => {
      setFilter("orders", "source", filter);
      setPagination("orders", 1, 10);
      setShowSourceDropdown(false);
    },
    [setFilter, setPagination]
  );

  const handleDateRangeChange = useCallback(
    (range: { start: Date | null; end: Date | null } | null) => {
      if (range) {
        setFilter("orders", "startDate", range.start);
        setFilter("orders", "endDate", range.end);
      } else {
        setFilter("orders", "startDate", null);
        setFilter("orders", "endDate", null);
      }
      setPagination("orders", 1, 10);
    },
    [setFilter, setPagination]
  );

  const getCurrentTypeLabel = () => {
    const current = filtragesType.find((f) => f.id === filters?.type);
    return current
      ? `${current.icon} ${current.label}`
      : `${filtragesType[0].icon} ${filtragesType[0].label}`;
  };

  const getCurrentStatusLabel = () => {
    const current = filtragesStatus.find((f) => f.id === filters?.status);
    return current
      ? `${current.icon} ${current.label}`
      : `${filtragesStatus[0].icon} ${filtragesStatus[0].label}`;
  };

  const getCurrentSourceLabel = () => {
    const current = filtragesSource.find((f) => f.id === filters?.source);
    return current
      ? `${current.icon} ${current.label}`
      : `${filtragesSource[0].icon} ${filtragesSource[0].label}`;
  };

  const hasActiveFilters =
    filters?.type || filters?.status || filters?.source || filters?.startDate;

  return (
    <div className="w-full bg-white p-3 rounded-lg shadow-sm border border-gray-200">
      <div className="flex flex-col gap-2">
        {/* Filter Row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Type Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowTypeDropdown(!showTypeDropdown);
                setShowStatusDropdown(false);
                setShowSourceDropdown(false);
                setShowDatePicker(false);
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                filters?.type
                  ? "bg-orange-50 text-[#F17922] border-2 border-[#F17922]"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              <span>{getCurrentTypeLabel()}</span>
              <svg
                className={`w-4 h-4 transition-transform ${
                  showTypeDropdown ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {showTypeDropdown && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                {filtragesType.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => handleFilterTypeChange(filter.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                      filters?.type === filter.id
                        ? "bg-orange-50 text-[#F17922] font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-lg">{filter.icon}</span>
                    <span>{filter.label}</span>
                    {filters?.type === filter.id && (
                      <svg
                        className="w-4 h-4 ml-auto"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Status Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowStatusDropdown(!showStatusDropdown);
                setShowTypeDropdown(false);
                setShowSourceDropdown(false);
                setShowDatePicker(false);
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                filters?.status
                  ? "bg-orange-50 text-[#F17922] border-2 border-[#F17922]"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              <span>{getCurrentStatusLabel()}</span>
              <svg
                className={`w-4 h-4 transition-transform ${
                  showStatusDropdown ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {showStatusDropdown && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden max-h-80 overflow-y-auto">
                {filtragesStatus.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => handleFilterStatusChange(filter.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                      filters?.status === filter.id
                        ? "bg-orange-50 text-[#F17922] font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-lg">{filter.icon}</span>
                    <span>{filter.label}</span>
                    {filters?.status === filter.id && (
                      <svg
                        className="w-4 h-4 ml-auto"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Source Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowSourceDropdown(!showSourceDropdown);
                setShowTypeDropdown(false);
                setShowStatusDropdown(false);
                setShowDatePicker(false);
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                filters?.source
                  ? "bg-orange-50 text-[#F17922] border-2 border-[#F17922]"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              <span>{getCurrentSourceLabel()}</span>
              <svg
                className={`w-4 h-4 transition-transform ${
                  showSourceDropdown ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {showSourceDropdown && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                {filtragesSource.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => handleFilterSourceChange(filter.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                      filters?.source === filter.id
                        ? "bg-orange-50 text-[#F17922] font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-lg">{filter.icon}</span>
                    <span>{filter.label}</span>
                    {filters?.source === filter.id && (
                      <svg
                        className="w-4 h-4 ml-auto"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date Range Picker */}
          <div className="relative ml-auto">
            <button
              onClick={() => {
                setShowDatePicker(!showDatePicker);
                setShowTypeDropdown(false);
                setShowStatusDropdown(false);
                setShowSourceDropdown(false);
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                filters?.startDate
                  ? "bg-orange-50 text-[#F17922] border-2 border-[#F17922]"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="hidden sm:inline">
                {filters?.startDate && filters?.endDate
                  ? dateRangeToLocalString(
                      typeof filters.startDate === "string"
                        ? new Date(filters.startDate)
                        : filters.startDate,
                      typeof filters.endDate === "string"
                        ? new Date(filters.endDate)
                        : filters.endDate
                    )
                  : "Période"}
              </span>
              <svg
                className={`w-4 h-4 transition-transform ${
                  showDatePicker ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {showDatePicker && (
              <DateRangePicker
                onRangeSelect={(range) => {
                  handleDateRangeChange(range);
                  setShowDatePicker(false);
                }}
              />
            )}
          </div>

          {/* Clear All Filters */}
          {hasActiveFilters && (
            <button
              onClick={() => {
                setFilter("orders", "type", "");
                setFilter("orders", "status", "");
                setFilter("orders", "source", "");
                handleDateRangeChange(null);
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-all"
              title="Effacer tous les filtres"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              <span className="hidden sm:inline">Réinitialiser</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
