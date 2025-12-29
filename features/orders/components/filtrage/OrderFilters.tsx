import Image from "next/image";
import { useCallback, useState } from "react";
import { dateToLocalString } from "../../../../utils/date/format-date";
import { useDashboardStore } from "@/store/dashboardStore";
import { OrderStatus, OrderType } from "../../types/order.types";
import DatePicker from "./DatePicker";

export function OrderFilters() {
  const {
    orders: { filters },
    setFilter,
    setPagination,
  } = useDashboardStore();

  const [showDatePicker, setShowDatePicker] = useState(false);

  const filtrages = [
    { id: "", label: "Tous" },
    { id: OrderType.DELIVERY, label: "À livrer" },
    { id: OrderType.PICKUP, label: "À récupérer" },
    { id: OrderType.TABLE, label: "À tables" },
    { id: OrderStatus.PENDING, label: "Nouvelles commandes" },
  ];

  // Gestion des filtres
  const handleFilterChange = useCallback((filter: string) => {
    switch (filter) {
      case OrderType.DELIVERY:
        setFilter("orders", "active_filter", OrderType.DELIVERY);
        break;
      case OrderType.PICKUP:
        setFilter("orders", "active_filter", OrderType.PICKUP);
        break;
      case OrderType.TABLE:
        setFilter("orders", "active_filter", OrderType.TABLE);
        break;
      case OrderStatus.PENDING:
        setFilter("orders", "active_filter", OrderStatus.PENDING);
        break;

      default:
        setFilter("orders", "active_filter", "");
        break;
    }
    setPagination("orders", 1, 10);
  }, []);

  const handleDateChange = useCallback((date: Date | null) => {
    date = typeof date === "string" ? new Date(date) : date;
    setFilter("orders", "date", date);
    setPagination("orders", 1, 10);
  }, []);

  return (
    <div className="w-full bg-white p-2 rounded-t-xl border-b border-gray-200">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {filtrages.map((filter) => (
            <button
              key={filter.id}
              className={`px-5 py-1.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                filters?.active_filter === filter.id
                  ? "bg-[#F17922] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              onClick={() => handleFilterChange(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 relative">
          <button
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border-2 cursor-pointer border-gray-300 text-sm text-gray-700"
            onClick={() => setShowDatePicker(!showDatePicker)}
          >
            <Image
              src="/icons/calendar.png"
              alt="calendar"
              width={20}
              height={20}
              className="mr-2"
            />
            <span>{dateToLocalString(filters?.date)}</span>
            <svg
              className="ml-1 h-4 w-4"
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

          {/* Bouton pour effacer le filtre de date */}
          {filters?.date && (
            <button
              className="px-2 py-1.5 text-sm text-gray-500 hover:text-red-500 transition-colors cursor-pointer"
              onClick={() => handleDateChange(null)}
              title="Effacer le filtre de date"
            >
              ✕
            </button>
          )}

          {showDatePicker && (
            <DatePicker
              selectedDate={
                filters?.date
                  ? typeof filters?.date == "string"
                    ? new Date(filters?.date)
                    : filters?.date
                  : new Date()
              }
              onChange={(date) => {
                handleDateChange(date);
                setShowDatePicker(false);
              }}
              onClose={() => setShowDatePicker(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
