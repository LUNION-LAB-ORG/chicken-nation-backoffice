"use client";

import React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Building2, Clock, Package, Truck, Wallet } from "lucide-react";

import type { CourseWithAttempts } from "../../types/course.types";
import { CourseStatutBadge } from "../CourseStatutBadge";

interface Props {
  course: CourseWithAttempts;
}

function formatPrix(n: number): string {
  return n.toLocaleString("fr-FR").replace(/\s/g, ".");
}

/** Hero card du détail course : pickup code XXL + infos clés + chips. */
export function CourseDetailHero({ course }: Props) {
  const deliveriesCount = course.deliveries.length;
  const doneCount = course.deliveries.filter((d) =>
    ["DELIVERED", "FAILED", "CANCELLED"].includes(d.statut),
  ).length;
  const durationMin =
    course.completed_at && course.assigned_at
      ? Math.round(
          (new Date(course.completed_at).getTime() - new Date(course.assigned_at).getTime()) / 60000,
        )
      : null;

  return (
    <div className="bg-gradient-to-br from-orange-50 via-white to-orange-50 rounded-3xl border border-orange-100 p-6 shadow-sm">
      <div className="flex items-start gap-6 flex-wrap">
        {/* Code retrait XXL */}
        <div className="flex items-center justify-center min-w-[140px] h-[110px] bg-white rounded-2xl border-2 border-[#F17922] shadow-sm px-6">
          <div className="text-center">
            <div className="text-[10px] uppercase font-semibold text-gray-500 tracking-wider">
              Code retrait
            </div>
            <div className="font-mono text-[52px] leading-[52px] font-bold text-[#F17922] tracking-tight mt-1">
              {course.pickup_code}
            </div>
          </div>
        </div>

        {/* Infos principales */}
        <div className="flex-1 min-w-[240px]">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900">{course.reference}</h1>
            <CourseStatutBadge statut={course.statut} />
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Créée le {format(new Date(course.created_at), "dd MMMM yyyy à HH:mm", { locale: fr })}
          </p>

          <div className="flex items-center gap-2 flex-wrap">
            <Chip icon={Building2} label={course.restaurant.name} />
            <Chip
              icon={Package}
              label={`${doneCount}/${deliveriesCount} livraison${deliveriesCount > 1 ? 's' : ''}`}
              tone={doneCount === deliveriesCount && deliveriesCount > 0 ? "green" : "default"}
            />
            <Chip
              icon={Wallet}
              label={`${formatPrix(course.total_delivery_fee)} F`}
              tone="orange"
            />
            {course.refusal_count > 0 && (
              <Chip
                icon={Truck}
                label={`${course.refusal_count} refus cumulés`}
                tone="red"
              />
            )}
            {durationMin !== null && (
              <Chip icon={Clock} label={`Durée ${durationMin} min`} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Chip({
  icon: Icon,
  label,
  tone = "default",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  tone?: "default" | "green" | "orange" | "red";
}) {
  const bg = {
    default: "bg-white border-gray-200 text-gray-700",
    green: "bg-green-50 border-green-200 text-green-700",
    orange: "bg-orange-50 border-orange-200 text-[#F17922]",
    red: "bg-red-50 border-red-200 text-red-700",
  }[tone];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${bg}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}
