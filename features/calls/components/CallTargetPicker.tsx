"use client";

import { Phone } from "lucide-react";
import { UserType } from "../../users/types/user.types";
import { useIsAdmin } from "../../users/hook/useIsAdmin";
import { useOutgoingCall } from "../hooks/useOutgoingCall";
import { useCallStore } from "../stores/callStore";
import type { CallInvoker } from "../types/call.type";
import RestaurantCallList from "./RestaurantCallList";
import UserCallList from "./UserCallList";

function CallCenterCard({ call, disabled }: { call: CallInvoker; disabled: boolean }) {
  return (
    <section className="bg-white border border-slate-100 rounded-2xl p-6">
      <h3 className="font-semibold text-slate-800 mb-1">Appeler le call center</h3>
      <p className="text-sm text-slate-500 mb-4">Sonne chez les agents du call center.</p>
      <button
        type="button"
        onClick={() => call({ targetKind: "CALL_CENTER", targetLabel: "Call Center" })}
        disabled={disabled}
        className="w-full h-12 rounded-xl bg-[#F17922] hover:bg-[#e06a15] text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <Phone className="h-5 w-5" /> Appeler le call center
      </button>
    </section>
  );
}

export default function CallTargetPicker({ userType }: { userType?: UserType }) {
  const { call, starting } = useOutgoingCall();
  const active = useCallStore((s) => s.active);
  const isAdmin = useIsAdmin();
  const disabled = starting || !!active;

  // Admin : appelle tout le monde — restaurants + call center + individuel (P2P).
  if (isAdmin) {
    return (
      <div className="space-y-6">
        <RestaurantCallList call={call} disabled={disabled} />
        <CallCenterCard call={call} disabled={disabled} />
        <UserCallList call={call} disabled={disabled} />
      </div>
    );
  }

  // Utilisateur RESTAURANT → appelle le call center.
  if (userType === UserType.RESTAURANT) {
    return <CallCenterCard call={call} disabled={disabled} />;
  }

  // Utilisateur BACKOFFICE (non-admin) → choisit un restaurant.
  return <RestaurantCallList call={call} disabled={disabled} />;
}
