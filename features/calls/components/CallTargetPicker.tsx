"use client";

import { Phone } from "lucide-react";
import { UserType } from "../../users/types/user.types";
import { useOutgoingCall } from "../hooks/useOutgoingCall";
import { useCallStore } from "../stores/callStore";
import RestaurantCallList from "./RestaurantCallList";

export default function CallTargetPicker({ userType }: { userType?: UserType }) {
  const { call, starting } = useOutgoingCall();
  const active = useCallStore((s) => s.active);
  const disabled = starting || !!active;

  // Utilisateur RESTAURANT → appelle le call center.
  if (userType === UserType.RESTAURANT) {
    return (
      <section className="bg-white border border-slate-100 rounded-2xl p-6">
        <h3 className="font-semibold text-slate-800 mb-1">Appeler le call center</h3>
        <p className="text-sm text-slate-500 mb-4">
          Vos appels sonnent chez les agents du call center.
        </p>
        <button
          type="button"
          onClick={() => call({ targetLabel: "Call Center" })}
          disabled={disabled}
          className="w-full h-12 rounded-xl bg-[#F17922] hover:bg-[#e06a15] text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Phone className="h-5 w-5" /> Appeler le call center
        </button>
      </section>
    );
  }

  // Utilisateur BACKOFFICE → choisit un restaurant.
  return <RestaurantCallList call={call} disabled={disabled} />;
}
