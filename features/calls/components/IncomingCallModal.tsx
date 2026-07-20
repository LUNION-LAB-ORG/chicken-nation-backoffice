"use client";

import { Phone, PhoneOff } from "lucide-react";
import { useCallActions } from "../hooks/useCallActions";
import type { IIncomingCallEvent } from "../types/call.type";

export default function IncomingCallModal({ incoming }: { incoming: IIncomingCallEvent }) {
  const { accept, reject } = useCallActions();

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-80 rounded-3xl bg-white shadow-2xl p-8 text-center">
        <div className="mx-auto h-20 w-20 rounded-full bg-[#F17922]/10 flex items-center justify-center animate-pulse">
          <Phone className="h-9 w-9 text-[#F17922]" />
        </div>
        <div className="mt-4 text-lg font-semibold text-slate-800">{incoming.callerName}</div>
        <div className="text-sm text-slate-500">Appel entrant · {incoming.targetLabel}</div>

        <div className="mt-8 flex items-center justify-center gap-10">
          <button type="button" onClick={reject} className="flex flex-col items-center gap-2">
            <span className="h-14 w-14 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center">
              <PhoneOff className="h-6 w-6" />
            </span>
            <span className="text-xs text-slate-500">Refuser</span>
          </button>
          <button type="button" onClick={accept} className="flex flex-col items-center gap-2">
            <span className="h-14 w-14 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center animate-bounce">
              <Phone className="h-6 w-6" />
            </span>
            <span className="text-xs text-slate-500">Répondre</span>
          </button>
        </div>
      </div>
    </div>
  );
}
