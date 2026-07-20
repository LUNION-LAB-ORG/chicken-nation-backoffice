"use client";

import { UserRole, UserType } from "../../users/types/user.types";
import type { ICallerRoleConfig } from "../types/call.type";

const ROLE_LABELS: Record<string, string> = {
  MANAGER: "Manager",
  ASSISTANT_MANAGER: "Assistant manager",
  CAISSIER: "Caissier",
  CUISINE: "Cuisine",
  CALL_CENTER: "Call center",
  MARKETING: "Marketing",
  COMPTABLE: "Comptable",
};

// Rôles proposés comme receveurs selon le type ciblé.
const CANDIDATES: Record<UserType, UserRole[]> = {
  [UserType.RESTAURANT]: [
    UserRole.MANAGER,
    UserRole.ASSISTANT_MANAGER,
    UserRole.CAISSIER,
    UserRole.CUISINE,
  ],
  [UserType.BACKOFFICE]: [UserRole.CALL_CENTER, UserRole.MARKETING, UserRole.COMPTABLE],
};

const CALLER_LABEL: Record<UserType, string> = {
  [UserType.BACKOFFICE]: "un utilisateur BACKOFFICE",
  [UserType.RESTAURANT]: "un utilisateur RESTAURANT",
};

export default function CallerConfigCard({
  callerType,
  config,
  onChange,
}: {
  callerType: UserType;
  config: ICallerRoleConfig;
  onChange: (next: ICallerRoleConfig) => void;
}) {
  const candidates = CANDIDATES[config.receiverType] ?? [];

  const toggleRole = (role: UserRole) => {
    const has = config.receiverRoles.includes(role);
    onChange({
      ...config,
      receiverRoles: has
        ? config.receiverRoles.filter((r) => r !== role)
        : [...config.receiverRoles, role],
    });
  };

  return (
    <div className="rounded-2xl border border-slate-100 p-5">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-slate-800">
          Quand {CALLER_LABEL[callerType]} appelle
        </h4>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={config.canCall}
            onChange={(e) => onChange({ ...config, canCall: e.target.checked })}
          />
          Autoriser
        </label>
      </div>
      <p className="text-sm text-slate-500 mt-1 mb-3">
        Cible : {config.targetKind === "CALL_CENTER" ? "le call center" : "un restaurant"}. Font
        sonner :
      </p>
      <div className="grid grid-cols-2 gap-2">
        {candidates.map((role) => (
          <label
            key={role}
            className="flex items-center gap-2 text-sm text-slate-700 p-2 rounded-lg border border-slate-100 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={config.receiverRoles.includes(role)}
              onChange={() => toggleRole(role)}
            />
            {ROLE_LABELS[role] ?? role}
          </label>
        ))}
      </div>
    </div>
  );
}
