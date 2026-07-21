"use client";

import { Phone, PhoneIncoming, PhoneMissed, PhoneOutgoing } from "lucide-react";
import { CallStatus, ICall } from "../types/call.type";
import { formatDuration, formatRelativeTime } from "../utils/call-format";
import { getInitials } from "../utils/initials";

export function peerLabel(call: ICall, meId?: string): string {
  if (call.caller_id === meId) {
    if (call.target_kind === "USER") return call.target_user?.fullname ?? "Personne";
    if (call.target_kind === "CALL_CENTER") return "Call Center";
    return call.target_restaurant?.name ?? "Restaurant";
  }
  return call.caller?.fullname ?? "Appelant";
}

/** Manqué de MON point de vue : on m'a sonné et personne n'a décroché. */
export function isMissedForMe(call: ICall, meId?: string): boolean {
  return (
    call.caller_id !== meId &&
    (call.status === CallStatus.MISSED || call.status === CallStatus.CANCELLED)
  );
}

export default function CallHistoryRow({
  call,
  meId,
  onCallBack,
  disabled,
}: {
  call: ICall;
  meId?: string;
  onCallBack?: (c: ICall) => void;
  disabled: boolean;
}) {
  const iAmCaller = call.caller_id === meId;
  const missed = call.status === CallStatus.MISSED || call.status === CallStatus.CANCELLED;
  const label = peerLabel(call, meId);
  const Icon = missed ? PhoneMissed : iAmCaller ? PhoneOutgoing : PhoneIncoming;
  const iconColor = missed ? "text-red-500" : iAmCaller ? "text-[#F17922]" : "text-emerald-600";

  const detail = missed
    ? iAmCaller
      ? "Sans réponse"
      : "Manqué"
    : call.answered_at && call.ended_at
      ? formatDuration(call.answered_at, call.ended_at)
      : call.status === CallStatus.ONGOING
        ? "En cours"
        : "";

  return (
    <div className="group flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 transition-colors hover:border-slate-200 hover:bg-slate-50">
      <div className="relative shrink-0">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
          {getInitials(label)}
        </div>
        <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm">
          <Icon className={`h-3 w-3 ${iconColor}`} />
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className={`truncate text-sm font-medium ${missed && !iAmCaller ? "text-red-600" : "text-slate-800"}`}>
          {label}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span>{formatRelativeTime(call.started_at)}</span>
          {detail && (
            <>
              <span>·</span>
              <span className={missed ? "text-red-400" : ""}>{detail}</span>
            </>
          )}
        </div>
      </div>

      {onCallBack && (
        <button
          type="button"
          onClick={() => onCallBack(call)}
          disabled={disabled}
          aria-label={`Rappeler ${label}`}
          title="Rappeler"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-[#F17922] hover:text-white disabled:opacity-40 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 sm:focus-visible:opacity-100"
        >
          <Phone className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
