"use client";

import React from "react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarDays } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { ICourseStatsDailyPoint } from "../../types/course.types";

interface Props {
  data: ICourseStatsDailyPoint[];
  isLoading: boolean;
}

/** Breakdown journalier — bars empilées : livrées / échouées / en cours (= total - completed - cancelled). */
export function CoursesDailyBarChart({ data, isLoading }: Props) {
  const formatted = data.map((d) => ({
    date: d.date,
    label: format(parseISO(d.date), "d MMM", { locale: fr }),
    Livrées: d.completed,
    Échouées: d.cancelled,
    "En cours": Math.max(0, d.total - d.completed - d.cancelled),
  }));

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-full bg-orange-50 flex items-center justify-center">
          <CalendarDays className="w-5 h-5 text-[#F17922]" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900">Courses par jour</h3>
          <p className="text-xs text-gray-500">Répartition par statut sur la période</p>
        </div>
      </div>

      {isLoading && !data.length ? (
        <div className="h-[260px] rounded-xl bg-gray-50 animate-pulse" />
      ) : (
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formatted} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  fontSize: 12,
                  boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
              <Bar dataKey="Livrées" stackId="a" fill="#4FCB71" radius={[0, 0, 0, 0]} />
              <Bar dataKey="En cours" stackId="a" fill="#F17922" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Échouées" stackId="a" fill="#EA4335" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
