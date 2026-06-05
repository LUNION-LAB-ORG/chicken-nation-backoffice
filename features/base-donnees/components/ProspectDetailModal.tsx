"use client";

import React from "react";
import { Loader2, Phone, Ticket, X } from "lucide-react";

import { useProspectDetailQuery } from "../queries/prospect-detail.query";
import {
  useMarkCallMutation,
  useResendCouponMutation,
  useSendCouponMutation,
} from "../queries/prospect-actions.mutation";
import { CallResult } from "../types/prospect.types";
import { PLATFORM_META, STATUS_META } from "../utils/prospect-ui";
import { HasPermission } from "../../users/components/HasPermission";
import { Action, Modules } from "../../users/types/auth.type";

const CALL_RESULT_LABEL: Record<CallResult, string> = {
  JOINT: "Joint",
  NON_JOIGNABLE: "Non joignable",
  REFUS: "Refus",
};

function fmt(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function ProspectDetailModal({
  id,
  onClose,
}: {
  id: string | null;
  onClose: () => void;
}) {
  const { data: p, isLoading } = useProspectDetailQuery(id);
  const markCall = useMarkCallMutation();
  const sendCoupon = useSendCouponMutation();
  const resend = useResendCouponMutation();

  if (!id) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[88vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h3 className="text-base font-bold text-gray-900">Fiche contact</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {isLoading || !p ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-[#F17922]" />
          </div>
        ) : (
          <div className="p-5">
            {/* Identité */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1">
                <div className="text-lg font-bold text-gray-900">{p.name}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${PLATFORM_META[p.platform].className}`}
                  >
                    {PLATFORM_META[p.platform].emoji}{" "}
                    {PLATFORM_META[p.platform].label}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_META[p.status].bg} ${STATUS_META[p.status].text}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${STATUS_META[p.status].dot}`}
                    />
                    {STATUS_META[p.status].label}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-5">
              {[
                ["Téléphone", p.phone],
                ["N° commande", p.order_number],
                ["Store", p.restaurant?.name ?? "—"],
                ["Saisi le", fmt(p.created_at)],
              ].map(([k, v]) => (
                <div key={k} className="bg-gray-50 rounded-lg px-3 py-2">
                  <div className="text-[11px] text-gray-500 font-semibold">
                    {k}
                  </div>
                  <div className="text-sm font-semibold text-gray-800 mt-0.5 break-words">
                    {v}
                  </div>
                </div>
              ))}
            </div>

            {/* Coupon */}
            {p.promo_code && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-5 text-sm">
                <Ticket className="w-4 h-4 text-amber-600 flex-none" />
                <span className="font-bold text-amber-800">
                  {p.promo_code.code}
                </span>
                <span className="text-amber-700 text-xs">
                  expire le {fmt(p.promo_code.expiration_date)}
                </span>
              </div>
            )}

            {/* Historique des appels */}
            <div className="mb-5">
              <div className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" /> Appels
              </div>
              {p.calls.length === 0 ? (
                <p className="text-sm text-gray-400">Aucun appel.</p>
              ) : (
                <ul className="space-y-1.5">
                  {p.calls.map((call) => (
                    <li
                      key={call.id}
                      className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2"
                    >
                      <span className="font-medium text-gray-700">
                        #{call.rank} · {CALL_RESULT_LABEL[call.result]}
                        {call.agent ? ` · ${call.agent.fullname}` : ""}
                      </span>
                      <span className="text-xs text-gray-400">
                        {fmt(call.created_at)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Historique des messages */}
            <div>
              <div className="text-xs font-bold text-gray-500 uppercase mb-2">
                Messages envoyés
              </div>
              {p.messages.length === 0 ? (
                <p className="text-sm text-gray-400">Aucun message.</p>
              ) : (
                <ul className="space-y-2">
                  {p.messages.map((m) => (
                    <li
                      key={m.id}
                      className="text-xs bg-gray-50 rounded-lg px-3 py-2"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-gray-600">
                          {m.kind} (rang {m.rank})
                        </span>
                        <span className="text-gray-400">
                          {fmt(m.created_at)}
                        </span>
                      </div>
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold mb-1 ${
                          m.sms_sent
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {m.sms_sent ? "SMS délivré" : "SMS non délivré"}
                      </span>
                      <p className="text-gray-600 leading-relaxed">{m.body}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Actions call center (admin / call center) */}
            <HasPermission module={Modules.BASE_DONNEES} action={Action.UPDATE}>
              <div className="mt-5 pt-4 border-t border-gray-100">
                {p.status === "COUPON_ENVOYE" ||
                p.status === "INSCRIT" ||
                p.status === "CONVERTI" ? (
                  <button
                    type="button"
                    onClick={() => resend.mutate(p.id)}
                    disabled={resend.isPending}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                  >
                    {resend.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Ticket className="w-4 h-4" />
                    )}
                    Renvoyer le SMS du coupon
                  </button>
                ) : p.status === "JOINT" ? (
                  <button
                    type="button"
                    onClick={() => sendCoupon.mutate(p.id)}
                    disabled={sendCoupon.isPending}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-[#3a2700] disabled:opacity-60"
                    style={{ backgroundColor: "#F5A623" }}
                  >
                    {sendCoupon.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Ticket className="w-4 h-4" />
                    )}
                    Envoyer le coupon
                  </button>
                ) : (
                  <>
                    <div className="text-xs font-semibold text-gray-500 mb-1.5">
                      Marquer l&apos;appel
                    </div>
                    <div className="flex gap-2">
                      {(["JOINT", "NON_JOIGNABLE", "REFUS"] as CallResult[]).map(
                        (r) => (
                          <button
                            key={r}
                            type="button"
                            disabled={markCall.isPending}
                            onClick={() => markCall.mutate({ id: p.id, result: r })}
                            className="flex-1 border border-gray-200 rounded-lg py-2 text-xs font-semibold bg-white hover:border-current disabled:opacity-50"
                          >
                            {CALL_RESULT_LABEL[r]}
                          </button>
                        ),
                      )}
                    </div>
                  </>
                )}
              </div>
            </HasPermission>
          </div>
        )}
      </div>
    </div>
  );
}
