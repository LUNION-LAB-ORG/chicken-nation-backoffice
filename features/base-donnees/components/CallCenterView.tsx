"use client";

import React from "react";
import { CheckCircle2, Loader2, Ticket } from "lucide-react";

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

export function CallCenterView() {
  const { data, isLoading } = useCallQueueQuery();
  const markCall = useMarkCallMutation();
  const sendCoupon = useSendCouponMutation();

  const queue = data?.queue ?? [];
  const ind = data?.indicators;

  const Indicator = ({ label, value }: { label: string; value: number }) => (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="text-xs font-semibold text-gray-500">{label}</div>
      <div className="text-2xl font-bold text-gray-900 mt-1">{value}</div>
    </div>
  );

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-5">
        <Indicator label="À appeler (file J+1)" value={ind?.toCall ?? 0} />
        <Indicator label="Joints aujourd'hui" value={ind?.joinedToday ?? 0} />
        <Indicator label="Coupons envoyés" value={ind?.couponsToday ?? 0} />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-56">
          <Loader2 className="w-6 h-6 animate-spin text-[#F17922]" />
        </div>
      ) : queue.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400">
          🎉 File vide — tous les contacts du jour ont été traités.
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
