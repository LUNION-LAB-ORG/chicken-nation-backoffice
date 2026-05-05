"use client";

import React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Check,
  CheckCircle2,
  CircleDot,
  Clock,
  Flag,
  MapPin,
  MessageCircleX,
  Navigation,
  PackageCheck,
  Send,
  UserCheck,
  X,
  type LucideIcon,
} from "lucide-react";

import {
  buildCourseTimeline,
  type CourseTimelineEventKind,
} from "../../utils/build-course-timeline";
import type { CourseWithAttempts } from "../../types/course.types";

interface Props {
  course: CourseWithAttempts;
}

const ICONS: Record<CourseTimelineEventKind, LucideIcon> = {
  created: CircleDot,
  offer_sent: Send,
  offer_refused: X,
  offer_expired: Clock,
  offer_accepted: UserCheck,
  at_restaurant: MapPin,
  picked_up: PackageCheck,
  delivery_in_route: Navigation,
  delivery_arrived: Flag,
  delivery_delivered: CheckCircle2,
  delivery_failed: MessageCircleX,
  completed: Check,
  cancelled: X,
};

const COLORS: Record<CourseTimelineEventKind, { bg: string; ring: string; text: string }> = {
  created: { bg: "bg-gray-100", ring: "ring-gray-200", text: "text-gray-700" },
  offer_sent: { bg: "bg-blue-50", ring: "ring-blue-200", text: "text-blue-700" },
  offer_refused: { bg: "bg-red-50", ring: "ring-red-200", text: "text-red-700" },
  offer_expired: { bg: "bg-amber-50", ring: "ring-amber-200", text: "text-amber-700" },
  offer_accepted: { bg: "bg-green-50", ring: "ring-green-200", text: "text-green-700" },
  at_restaurant: { bg: "bg-indigo-50", ring: "ring-indigo-200", text: "text-indigo-700" },
  picked_up: { bg: "bg-purple-50", ring: "ring-purple-200", text: "text-purple-700" },
  delivery_in_route: { bg: "bg-cyan-50", ring: "ring-cyan-200", text: "text-cyan-700" },
  delivery_arrived: { bg: "bg-teal-50", ring: "ring-teal-200", text: "text-teal-700" },
  delivery_delivered: { bg: "bg-emerald-50", ring: "ring-emerald-200", text: "text-emerald-700" },
  delivery_failed: { bg: "bg-red-50", ring: "ring-red-200", text: "text-red-700" },
  completed: { bg: "bg-emerald-100", ring: "ring-emerald-300", text: "text-emerald-800" },
  cancelled: { bg: "bg-red-100", ring: "ring-red-300", text: "text-red-800" },
};

/** Timeline verticale — tous les événements de la course chronologiquement. */
export function CourseTimeline({ course }: Props) {
  const events = buildCourseTimeline(course);

  return (
    <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-5">
      <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Clock className="w-4 h-4 text-[#F17922]" />
        Chronologie de la course
      </h3>

      <div className="relative">
        {/* ligne verticale */}
        <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-gray-100" />

        <ul className="space-y-4">
          {events.map((evt, i) => {
            const Icon = ICONS[evt.kind];
            const c = COLORS[evt.kind];
            return (
              <li key={`${evt.kind}-${evt.at}-${i}`} className="relative flex gap-3 pl-0">
                <div
                  className={`relative z-10 shrink-0 w-8 h-8 rounded-full ${c.bg} ring-2 ring-white shadow-sm flex items-center justify-center`}
                >
                  <Icon className={`w-4 h-4 ${c.text}`} />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900 truncate">{evt.title}</p>
                    <span className="text-[11px] text-gray-400 whitespace-nowrap">
                      {format(new Date(evt.at), "HH:mm:ss", { locale: fr })}
                    </span>
                  </div>
                  {evt.subtitle && (
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{evt.subtitle}</p>
                  )}
                  <span className="text-[10px] text-gray-400">
                    {format(new Date(evt.at), "dd MMM yyyy", { locale: fr })}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
