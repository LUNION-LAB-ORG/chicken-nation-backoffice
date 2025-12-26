"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  CalendarDays,
} from "lucide-react";

interface DatePickerProps {
  selectedDate: Date;
  onChange: (date: Date) => void;
  onClose: () => void;
}

type DatePickerMode = "day" | "month";

const DatePicker: React.FC<DatePickerProps> = ({
  selectedDate = new Date(),
  onChange,
  onClose,
}) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(
    new Date(selectedDate)
  );
  const [mode, setMode] = useState<DatePickerMode>("day");
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    // Ajuster pour commencer la semaine par lundi (0 = lundi, 6 = dimanche)
    const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    const days = [];

    // Ajouter les jours du mois précédent pour remplir la première ligne
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = adjustedFirstDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        isCurrentMonth: false,
        isToday: false,
      });
    }

    // Ajouter les jours du mois actuel
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      date.setHours(0, 0, 0, 0);
      days.push({
        date,
        isCurrentMonth: true,
        isToday: date.getTime() === today.getTime(),
      });
    }

    // Ajouter les jours du mois suivant pour compléter la dernière ligne
    const totalDaysToShow = Math.ceil((adjustedFirstDay + daysInMonth) / 7) * 7;
    const nextMonthDays = totalDaysToShow - days.length;

    for (let i = 1; i <= nextMonthDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
        isToday: false,
      });
    }

    return days;
  };

  // Obtenir les mois de l'année
  const getMonthsInYear = (year: number) => {
    const months = [];
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    for (let month = 0; month < 12; month++) {
      const date = new Date(year, month, 1);
      months.push({
        date,
        isCurrentMonth: year === currentYear && month === currentMonth,
        isSelected:
          year === selectedDate.getFullYear() &&
          month === selectedDate.getMonth(),
      });
    }

    return months;
  };

  // Navigation
  const goToPrevious = () => {
    if (mode === "day") {
      setCurrentMonth(
        new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
      );
    } else {
      setCurrentMonth(
        new Date(currentMonth.getFullYear() - 1, currentMonth.getMonth(), 1)
      );
    }
  };

  const goToNext = () => {
    if (mode === "day") {
      setCurrentMonth(
        new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
      );
    } else {
      setCurrentMonth(
        new Date(currentMonth.getFullYear() + 1, currentMonth.getMonth(), 1)
      );
    }
  };

  // Formatters
  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  };

  const formatYear = (date: Date) => {
    return date.getFullYear().toString();
  };

  const formatMonthName = (date: Date) => {
    return date.toLocaleDateString("fr-FR", { month: "long" });
  };

  // Vérifications
  const isSelectedDate = (date: Date) => {
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  // Sélection de mois entier
  const selectMonth = (monthDate: Date) => {
    // Sélectionner le premier jour du mois
    const firstDayOfMonth = new Date(
      monthDate.getFullYear(),
      monthDate.getMonth(),
      1
    );
    onChange(firstDayOfMonth);
    onClose();
  };

  // Jours de la semaine (commençant par lundi)
  const weekdays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  // Obtenir les données à afficher selon le mode
  const days = mode === "day" ? getDaysInMonth(currentMonth) : [];
  const months =
    mode === "month" ? getMonthsInYear(currentMonth.getFullYear()) : [];

  return (
    <div
      ref={pickerRef}
      className="absolute z-50 top-full mt-1 right-0 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-3"
      style={{ maxHeight: "400px", overflowY: "auto" }}
    >
      {/* Toggle entre jour et mois */}
      <div className="flex items-center justify-center mb-3 bg-gray-100 rounded-lg p-1">
        <button
          type="button"
          onClick={() => setMode("day")}
          className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
            mode === "day"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <CalendarDays size={12} />
          Jour
        </button>
        <button
          type="button"
          onClick={() => setMode("month")}
          className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
            mode === "month"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Calendar size={12} />
          Mois
        </button>
      </div>

      {/* En-tête avec navigation */}
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={goToPrevious}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="text-sm font-medium text-gray-700">
          {mode === "day"
            ? formatMonthYear(currentMonth)
            : formatYear(currentMonth)}
        </div>
        <button
          type="button"
          onClick={goToNext}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Mode jour */}
      {mode === "day" && (
        <>
          {/* Jours de la semaine */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {weekdays.map((day) => (
              <div key={day} className="text-center text-xs text-gray-500 py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Jours du mois */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => (
              <button
                key={index}
                type="button"
                onClick={() => {
                  onChange(day.date);
                  onClose();
                }}
                className={`
                  h-8 w-8 text-xs rounded-full flex items-center justify-center cursor-pointer transition-colors
                  ${!day.isCurrentMonth ? "text-gray-300" : ""}
                  ${day.isToday ? "bg-orange-100 text-orange-700" : ""}
                  ${
                    isSelectedDate(day.date)
                      ? "bg-[#F17922] text-white"
                      : "hover:bg-gray-100"
                  }
                `}
              >
                {day.date.getDate()}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Mode mois */}
      {mode === "month" && (
        <div className="grid grid-cols-3 gap-2">
          {months.map((month, index) => (
            <button
              key={index}
              type="button"
              onClick={() => selectMonth(month.date)}
              className={`
                px-2 py-2 text-xs rounded-lg flex items-center justify-center cursor-pointer transition-colors font-medium
                ${month.isCurrentMonth ? "bg-orange-100 text-orange-700" : ""}
                ${
                  month.isSelected
                    ? "bg-[#F17922] text-white"
                    : "hover:bg-gray-100 text-gray-700"
                }
              `}
            >
              {formatMonthName(month.date)}
            </button>
          ))}
        </div>
      )}

      {/* Bouton pour effacer la sélection */}
      <div className="mt-3 pt-2 border-t border-gray-200">
        <button
          type="button"
          onClick={() => {
            onChange(new Date()); // Reset à aujourd'hui
            onClose();
          }}
          className="w-full text-xs text-gray-500 hover:text-gray-700 py-1 transition-colors"
        >
          Aujourd&apos;hui
        </button>
      </div>
    </div>
  );
};

export default DatePicker;
