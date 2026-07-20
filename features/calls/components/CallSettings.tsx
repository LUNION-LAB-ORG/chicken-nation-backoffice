"use client";

import { useEffect, useState } from "react";
import { UserType } from "../../users/types/user.types";
import {
  useCallsConfigQuery,
  useUpdateCallsConfigMutation,
} from "../queries/calls-config.query";
import type { ICallsConfig } from "../types/call.type";
import CallerConfigCard from "./CallerConfigCard";

/** Onglet Paramètres → Appels (admin uniquement). */
export default function CallSettings() {
  const { data, isLoading } = useCallsConfigQuery();
  const update = useUpdateCallsConfigMutation();
  const [config, setConfig] = useState<ICallsConfig | null>(null);

  useEffect(() => {
    if (data) setConfig(data);
  }, [data]);

  if (isLoading || !config) {
    return <p className="text-sm text-slate-400 py-6">Chargement…</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Configurez qui reçoit les appels selon le type de l&apos;appelant. Réservé aux
        administrateurs.
      </p>

      <CallerConfigCard
        callerType={UserType.BACKOFFICE}
        config={config[UserType.BACKOFFICE]}
        onChange={(next) => setConfig({ ...config, [UserType.BACKOFFICE]: next })}
      />
      <CallerConfigCard
        callerType={UserType.RESTAURANT}
        config={config[UserType.RESTAURANT]}
        onChange={(next) => setConfig({ ...config, [UserType.RESTAURANT]: next })}
      />

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => update.mutate(config)}
          disabled={update.isPending}
          className="h-11 px-6 rounded-xl bg-[#F17922] hover:bg-[#e06a15] text-white font-medium disabled:opacity-50"
        >
          {update.isPending ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </div>
  );
}
