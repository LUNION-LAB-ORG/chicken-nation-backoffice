"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react"
import { dateToLocalString } from "../../../utils/date/format-date"

interface DateRangePickerProps {
  onRangeSelect: (range: { start: Date | null; end: Date | null } | null) => void
}

type DatePickerMode = "day" | "month"

const DateRangePicker: React.FC<DateRangePickerProps> = ({ onRangeSelect }) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [mode, setMode] = useState<DatePickerMode>("day")
  const [tempStartDate, setTempStartDate] = useState<Date | null>(null)
  const [tempEndDate, setTempEndDate] = useState<Date | null>(null)
  const [isSelectingEnd, setIsSelectingEnd] = useState<boolean>(false)
  const [isOpen, setIsOpen] = useState<boolean>(true)
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstDayOfMonth = new Date(year, month, 1).getDay()

    const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1

    const days = []

    const prevMonthDays = new Date(year, month, 0).getDate()
    for (let i = adjustedFirstDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        isCurrentMonth: false,
        isToday: false,
      })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i)
      date.setHours(0, 0, 0, 0)
      days.push({
        date,
        isCurrentMonth: true,
        isToday: date.getTime() === today.getTime(),
      })
    }

    const totalDaysToShow = Math.ceil((adjustedFirstDay + daysInMonth) / 7) * 7
    const nextMonthDays = totalDaysToShow - days.length

    for (let i = 1; i <= nextMonthDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
        isToday: false,
      })
    }

    return days
  }

  const goToPrevious = () => {
    if (mode === "day") {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
    } else {
      setCurrentMonth(new Date(currentMonth.getFullYear() - 1, currentMonth.getMonth(), 1))
    }
  }

  const goToNext = () => {
    if (mode === "day") {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
    } else {
      setCurrentMonth(new Date(currentMonth.getFullYear() + 1, currentMonth.getMonth(), 1))
    }
  }

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
  }

  const handleDateClick = (date: Date) => {
    if (!tempStartDate || (tempStartDate && tempEndDate)) {
      // Première sélection ou réinitialisation
      setTempStartDate(date)
      setTempEndDate(null)
      setIsSelectingEnd(true)
    } else if (isSelectingEnd) {
      // Deuxième sélection
      if (date < tempStartDate) {
        // Si la date de fin est avant la date de début, on inverse
        setTempEndDate(tempStartDate)
        setTempStartDate(date)
      } else {
        setTempEndDate(date)
      }
      setIsSelectingEnd(false)
    }
  }

  const isInRange = (date: Date) => {
    if (!tempStartDate || !tempEndDate) return false
    const time = date.getTime()
    return time > tempStartDate.getTime() && time < tempEndDate.getTime()
  }

  const isStartDate = (date: Date) => {
    if (!tempStartDate) return false
    return date.getTime() === tempStartDate.getTime()
  }

  const isEndDate = (date: Date) => {
    if (!tempEndDate) return false
    return date.getTime() === tempEndDate.getTime()
  }

  const weekdays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]
  const days = mode === "day" ? getDaysInMonth(currentMonth) : []

  if (!isOpen) return null

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
            mode === "day" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <CalendarDays size={12} />
          Jour
        </button>
      </div>

      {/* En-tête avec navigation */}
      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={goToPrevious} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
          <ChevronLeft size={16} />
        </button>
        <div className="text-sm font-medium text-gray-700">{formatMonthYear(currentMonth)}</div>
        <button type="button" onClick={goToNext} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
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
            {days.map((day, index) => {
              const isStart = isStartDate(day.date)
              const isEnd = isEndDate(day.date)
              const inRange = isInRange(day.date)

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleDateClick(day.date)}
                  className={`
                    h-8 w-8 text-xs rounded-full flex items-center justify-center cursor-pointer transition-colors
                    ${!day.isCurrentMonth ? "text-gray-300" : ""}
                    ${day.isToday && !isStart && !isEnd ? "bg-orange-100 text-orange-700" : ""}
                    ${inRange ? "bg-orange-50" : ""}
                    ${isStart || isEnd ? "bg-[#F17922] text-white font-semibold" : !inRange ? "hover:bg-gray-100" : ""}
                  `}
                >
                  {day.date.getDate()}
                </button>
              )
            })}
          </div>
        </>
      )}

      {/* Affichage de la plage sélectionnée */}
      {tempStartDate && (
        <div className="mt-3 pt-2 border-t border-gray-200 text-xs text-gray-600">
          <div className="flex justify-between items-center">
            <span>Début:</span>
            <span className="font-medium">{dateToLocalString(tempStartDate)}</span>
          </div>
          {tempEndDate && (
            <div className="flex justify-between items-center mt-1">
              <span>Fin:</span>
              <span className="font-medium">{dateToLocalString(tempEndDate)}</span>
            </div>
          )}
        </div>
      )}

      {/* Boutons d'action */}
      <div className="mt-3 pt-2 border-t border-gray-200 flex gap-2">
        <button
          type="button"
          onClick={() => {
            setTempStartDate(null)
            setTempEndDate(null)
            setIsSelectingEnd(false)
            onRangeSelect(null)
          }}
          className="flex-1 text-xs text-gray-500 hover:text-gray-700 py-1 transition-colors"
        >
          Réinitialiser
        </button>
        <button
          type="button"
          onClick={() => {
            if (tempStartDate && tempEndDate) {
              onRangeSelect({ start: tempStartDate, end: tempEndDate })
            }
            setIsOpen(false)
          }}
          className="flex-1 text-xs bg-[#F17922] text-white py-1 px-2 rounded hover:bg-[#d66a1d] transition-colors"
          disabled={!tempStartDate || !tempEndDate}
        >
          Valider
        </button>
      </div>
    </div>
  )
}

export { DateRangePicker }
export default DateRangePicker
