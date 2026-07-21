"use client";

import { useMemo, useState } from "react";
import { History, PhoneMissed } from "lucide-react";
import { useAuthStore } from "../../users/hook/authStore";
import { useIsAdmin } from "../../users/hook/useIsAdmin";
import { UserType } from "../../users/types/user.types";
import { useCallHistoryQuery } from "../queries/calls-history.query";
import { useOutgoingCall } from "../hooks/useOutgoingCall";
import { useCallStore } from "../stores/callStore";
import { ICall } from "../types/call.type";
import CallHistoryRow, { isMissedForMe } from "./CallHistoryRow";

function SkeletonRows() {
  return (
    <div className="space-y-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex animate-pulse items-center gap-3 rounded-2xl border border-slate-100 p-3">
          <div className="h-11 w-11 rounded-full bg-slate-100" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-32 rounded bg-slate-100" />
            <div className="h-2.5 w-20 rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CallHistoryList() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = useIsAdmin();
  const { data: calls, isLoading } = useCallHistoryQuery(50);
  const { call, starting } = useOutgoingCall();
  const active = useCallStore((s) => s.active);
  const [tab, setTab] = useState<"all" | "missed">("all");

  const missed = useMemo(
    () => (calls ?? []).filter((c) => isMissedForMe(c, user?.id)),
    [calls, user?.id],
  );
  const shown = tab === "missed" ? missed : (calls ?? []);
  const disabled = starting || !!active;

  /** Peut-on rappeler cette entrée ? (miroir exact des branches de onCallBack) */
  const canCallBack = (c: ICall): boolean => {
    if (c.caller_id === user?.id) return true; // je re-cible ma propre cible
    if (isAdmin && c.caller) return true; // admin → rappel P2P de l'appelant
    if (c.caller?.restaurant) return true; // je rappelle le restaurant de l'appelant
    return user?.type === UserType.RESTAURANT; // staff resto → call center
  };

  /** Rappeler : re-cible ce que je peux légitimement appeler. */
  const onCallBack = (c: ICall) => {
    if (c.caller_id === user?.id) {
      // Je rappelle ma propre cible.
      if (c.target_kind === "USER" && c.target_user) {
        call({ targetKind: "USER", targetUserId: c.target_user.id, targetLabel: c.target_user.fullname });
      } else if (c.target_kind === "RESTAURANT" && c.target_restaurant) {
        call({ targetKind: "RESTAURANT", restaurantId: c.target_restaurant.id, targetLabel: c.target_restaurant.name });
      } else {
        call({ targetKind: "CALL_CENTER", targetLabel: "Call Center" });
      }
      return;
    }
    // Je rappelle l'appelant.
    if (isAdmin && c.caller) {
      call({ targetKind: "USER", targetUserId: c.caller.id, targetLabel: c.caller.fullname });
    } else if (c.caller?.restaurant) {
      call({ targetKind: "RESTAURANT", restaurantId: c.caller.restaurant.id, targetLabel: c.caller.restaurant.name });
    } else if (user?.type === UserType.RESTAURANT) {
      call({ targetKind: "CALL_CENTER", targetLabel: "Call Center" });
    }
  };

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-semibold text-slate-800">
          <History className="h-4 w-4 text-slate-400" /> Historique
        </h3>
        {/* Onglets Tous / Manqués */}
        <div className="flex rounded-full bg-slate-100 p-1 text-xs font-medium">
          <button
            type="button"
            onClick={() => setTab("all")}
            className={`rounded-full px-3 py-1.5 transition-colors ${tab === "all" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"}`}
          >
            Tous
          </button>
          <button
            type="button"
            onClick={() => setTab("missed")}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors ${tab === "missed" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"}`}
          >
            <PhoneMissed className="h-3 w-3" />
            Manqués
            {missed.length > 0 && (
              <span className="rounded-full bg-red-500 px-1.5 py-px text-[10px] font-semibold text-white">
                {missed.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {isLoading && <SkeletonRows />}

      <div className="max-h-[26rem] space-y-2 overflow-auto sm:max-h-[30rem]">
        {shown.map((c) => (
          <CallHistoryRow
            key={c.id}
            call={c}
            meId={user?.id}
            onCallBack={canCallBack(c) ? onCallBack : undefined}
            disabled={disabled}
          />
        ))}
        {!isLoading && shown.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <History className="h-8 w-8 text-slate-200" />
            <p className="text-sm text-slate-400">
              {tab === "missed" ? "Aucun appel manqué" : "Aucun appel récent"}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
