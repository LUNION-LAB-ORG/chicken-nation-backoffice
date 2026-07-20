"use client";

import { PhoneIncoming, PhoneMissed, PhoneOutgoing } from "lucide-react";
import { useAuthStore } from "../../users/hook/authStore";
import { useCallHistoryQuery } from "../queries/calls-history.query";
import { CallStatus, ICall } from "../types/call.type";

function peerLabel(call: ICall, meId?: string): string {
  if (call.caller_id === meId) {
    return call.target_kind === "CALL_CENTER"
      ? "Call Center"
      : call.target_restaurant?.name ?? "Restaurant";
  }
  return call.caller?.fullname ?? "Appelant";
}

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function CallRow({ call, meId }: { call: ICall; meId?: string }) {
  const iAmCaller = call.caller_id === meId;
  const missed = call.status === CallStatus.MISSED || call.status === CallStatus.CANCELLED;
  const Icon = missed ? PhoneMissed : iAmCaller ? PhoneOutgoing : PhoneIncoming;
  const color = missed ? "text-red-500" : iAmCaller ? "text-[#F17922]" : "text-green-600";

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-100">
      <Icon className={`h-5 w-5 shrink-0 ${color}`} />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-slate-700 truncate">{peerLabel(call, meId)}</div>
        <div className="text-xs text-slate-400">{timeLabel(call.started_at)}</div>
      </div>
      {missed && <span className="text-xs text-red-500">Manqué</span>}
    </div>
  );
}

export default function CallHistoryList() {
  const user = useAuthStore((s) => s.user);
  const { data: calls, isLoading } = useCallHistoryQuery();

  return (
    <section className="bg-white border border-slate-100 rounded-2xl p-6">
      <h3 className="font-semibold text-slate-800 mb-4">Historique des appels</h3>
      {isLoading && <p className="text-sm text-slate-400">Chargement…</p>}
      <div className="space-y-2 max-h-[28rem] overflow-auto">
        {(calls ?? []).map((c) => (
          <CallRow key={c.id} call={c} meId={user?.id} />
        ))}
        {!isLoading && (calls ?? []).length === 0 && (
          <p className="text-sm text-slate-400 text-center py-6">Aucun appel récent</p>
        )}
      </div>
    </section>
  );
}
