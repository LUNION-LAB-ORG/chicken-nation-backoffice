"use client";

import React, { useState } from "react";
import { CalendarDays, CheckCircle2, Loader2, Ticket, X } from "lucide-react";

import { GenericStatCard } from "@/components/gestion/Dashboard/GenericStatCard";

import { useCallQueueQuery } from "../queries/prospect-call-queue.query";
import {
  useMarkCallMutation,
  useSendCouponMutation,
} from "../queries/prospect-actions.mutation";
import { CallQueueItem, CallResult } from "../types/prospect.types";
import { PLATFORM_META } from "../utils/prospect-ui";

function buildScript(name: string, platform: string) {
  const plat = platform === "GLOVO" ? "Glovo" : "Yango";
  return `« Bonjour ${name}, je suis du service client de Chicken Nation. Vous avez récemment commandé via ${plat}, merci ! Désormais, commandez directement sur notre application : même bon Chicken Nation, livré à moindre coût. Je vous envoie le lien de l'app + un code promo valable 1 semaine. »`;
}

const RESULT_CLASS: Record<CallResult, string> = {
  JOINT: "text-green-600",
  NON_JOIGNABLE: "text-orange-600",
  REFUS: "text-red-600",
};
const RESULT_LABEL: Record<CallResult, string> = {
  JOINT: "Joint",
  NON_JOIGNABLE: "Non joignable",
  REFUS: "Refus",
};

function CallCard({
  c,
  markCall,
  sendCoupon,
}: {
  c: CallQueueItem;
  markCall: ReturnType<typeof useMarkCallMutation>;
  sendCoupon: ReturnType<typeof useSendCouponMutation>;
}) {
  const meta = PLATFORM_META[c.platform];
  const isJoint = c.status === "JOINT";
  const markPending = markCall.isPending && markCall.variables?.id === c.id;
  const couponPending = sendCoupon.isPending && sendCoupon.variables === c.id;
  const initials = c.name
    .split(" ")
    .map((x) => x[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-orange-50 text-[#F17922] grid place-items-center font-bold flex-none">
          {initials}
        </div>
        <div className="min-w-0">
          <div className="font-bold text-gray-800 truncate">{c.name}</div>
          <div className="text-xs text-gray-500 flex flex-wrap items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] font-bold ${meta.className}`}
            >
              {meta.emoji} {meta.label}
            </span>
            · {c.restaurant?.name ?? "—"} ·{" "}
            <span className="tabular-nums">{c.phone}</span>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border-l-[3px] border-amber-400 rounded-lg px-3 py-2 text-xs text-gray-700 leading-relaxed">
        <span className="block text-[10px] font-bold text-amber-700 uppercase mb-1">
          Script — appel
        </span>
        {buildScript(c.name, c.platform)}
      </div>

      {isJoint ? (
        <div className="rounded-lg bg-green-50 text-green-700 text-sm font-semibold py-2 text-center flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> Client joint
        </div>
      ) : (
        <div>
          <div className="text-xs font-semibold text-gray-500 mb-1.5">
            1 · Marquer l&apos;appel
          </div>
          <div className="flex gap-2">
            {(["JOINT", "NON_JOIGNABLE", "REFUS"] as CallResult[]).map((r) => (
              <button
                key={r}
                type="button"
                disabled={markPending}
                onClick={() => markCall.mutate({ id: c.id, result: r })}
                className={`flex-1 border border-gray-200 rounded-lg py-2 text-xs font-semibold bg-white hover:border-current disabled:opacity-50 ${RESULT_CLASS[r]}`}
              >
                {markPending ? "…" : RESULT_LABEL[r]}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        disabled={!isJoint || couponPending}
        onClick={() => sendCoupon.mutate(c.id)}
        className="mt-auto inline-flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold disabled:cursor-not-allowed"
        style={{
          backgroundColor: isJoint ? "#F5A623" : "#e5e7eb",
          color: isJoint ? "#3a2700" : "#9ca3af",
        }}
      >
        {couponPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Ticket className="w-4 h-4" />
        )}
        2 · Envoyer le coupon
      </button>
    </div>
  );
}

export function CallCenterView({ restaurantId }: { restaurantId?: string } = {}) {
  // Filtre de rattrapage : par défaut la file = backlog J+1 (tout jusqu'à hier).
  // En choisissant une plage de dates, l'agent peut cibler un jour raté antérieur.
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const hasDateFilter = !!(startDate || endDate);

  const { data, isLoading } = useCallQueueQuery(
    restaurantId,
    startDate || undefined,
    endDate || undefined,
  );
  const markCall = useMarkCallMutation();
  const sendCoupon = useSendCouponMutation();

  const queue = data?.queue ?? [];
  const ind = data?.indicators;

  const inputCls =
    "border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm bg-white text-gray-700 outline-none focus:ring-2 focus:ring-[#F17922] focus:border-transparent";

  return (
    <div>
      {/* Filtre de date — rattrapage des contacts ratés (J-2, J-3…) */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <CalendarDays className="w-4 h-4 text-gray-400 shrink-0" />
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-gray-500">Du</label>
            <input
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(e) => setStartDate(e.target.value)}
              className={inputCls}
            />
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-gray-500">au</label>
            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => setEndDate(e.target.value)}
              className={inputCls}
            />
          </div>
          {hasDateFilter && (
            <button
              type="button"
              onClick={() => {
                setStartDate("");
                setEndDate("");
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Réinitialiser
            </button>
          )}
        </div>
        <p className="text-xs text-gray-400 sm:ml-auto">
          {hasDateFilter
            ? "Rattrapage : contacts de la période sélectionnée"
            : "Par défaut : tout le backlog jusqu'à hier (J+1)"}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <GenericStatCard
          badgeText={hasDateFilter ? "À appeler (période)" : "À appeler (file J+1)"}
          badgeColor="#4285F4"
          value={ind?.toCall ?? 0}
        />
        <GenericStatCard badgeText="Joints aujourd'hui" badgeColor="#7C3AED" value={ind?.joinedToday ?? 0} />
        <GenericStatCard badgeText="Coupons envoyés" badgeColor="#F17922" value={ind?.couponsToday ?? 0} />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-56">
          <Loader2 className="w-6 h-6 animate-spin text-[#F17922]" />
        </div>
      ) : queue.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400">
          {hasDateFilter
            ? "Aucun contact à appeler sur cette période."
            : "🎉 File vide — tous les contacts du jour ont été traités."}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {queue.map((c) => (
            <CallCard
              key={c.id}
              c={c}
              markCall={markCall}
              sendCoupon={sendCoupon}
            />
          ))}
        </div>
      )}
    </div>
  );
}
