"use client";

import { useState } from "react";
import { Headphones, Phone, Store, Users } from "lucide-react";
import { UserType } from "../../users/types/user.types";
import { useIsAdmin } from "../../users/hook/useIsAdmin";
import { useOutgoingCall } from "../hooks/useOutgoingCall";
import { useCallStore } from "../stores/callStore";
import type { CallInvoker } from "../types/call.type";
import RestaurantCallList from "./RestaurantCallList";
import UserCallList from "./UserCallList";

function CallCenterCard({ call, disabled }: { call: CallInvoker; disabled: boolean }) {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F17922]/10">
          <Headphones className="h-8 w-8 text-[#F17922]" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-800">Call center</h3>
          <p className="mt-1 text-sm text-slate-500">Sonne chez tous les agents disponibles.</p>
        </div>
        <button
          type="button"
          onClick={() => call({ targetKind: "CALL_CENTER", targetLabel: "Call Center" })}
          disabled={disabled}
          className="flex h-12 w-full max-w-xs items-center justify-center gap-2 rounded-xl bg-[#F17922] font-medium text-white transition-colors hover:bg-[#e06a15] disabled:opacity-50 active:scale-[.98]"
        >
          <Phone className="h-5 w-5" /> Appeler le call center
        </button>
      </div>
    </section>
  );
}

const ADMIN_TABS = [
  { key: "restaurants" as const, label: "Restaurants", icon: Store },
  { key: "callcenter" as const, label: "Call center", icon: Headphones },
  { key: "people" as const, label: "Personnes", icon: Users },
];

export default function CallTargetPicker({ userType }: { userType?: UserType }) {
  const { call, starting } = useOutgoingCall();
  const active = useCallStore((s) => s.active);
  const isAdmin = useIsAdmin();
  const disabled = starting || !!active;
  const [adminTab, setAdminTab] = useState<(typeof ADMIN_TABS)[number]["key"]>("restaurants");

  // Admin : appelle tout le monde — restaurants + call center + individuel (P2P).
  if (isAdmin) {
    return (
      <div className="space-y-4">
        <div className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-100 bg-white p-1.5 shadow-sm">
          {ADMIN_TABS.map(({ key, label, icon: TabIcon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setAdminTab(key)}
              className={`flex flex-1 min-w-fit items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                adminTab === key
                  ? "bg-[#F17922] text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <TabIcon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>
        {adminTab === "restaurants" && <RestaurantCallList call={call} disabled={disabled} />}
        {adminTab === "callcenter" && <CallCenterCard call={call} disabled={disabled} />}
        {adminTab === "people" && <UserCallList call={call} disabled={disabled} />}
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
