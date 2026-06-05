"use client";

import React, { useState } from "react";
import { Database, Phone, UserPlus } from "lucide-react";

import { ProspectsList } from "../../../../features/base-donnees/components/ProspectsList";
import { CallCenterView } from "../../../../features/base-donnees/components/CallCenterView";
import { ProspectDetailModal } from "../../../../features/base-donnees/components/ProspectDetailModal";
import { CaptureContactModal } from "../../../../features/base-donnees/components/CaptureContactModal";
import { HasPermission } from "../../../../features/users/components/HasPermission";
import { Action, Modules } from "../../../../features/users/types/auth.type";
import { useAuthStore } from "../../../../features/users/hook/authStore";

/**
 * Module « Base de Données » — captation & conversion des clients Glovo/Yango.
 * - Call Center → file d'appels J+1 (qualification + coupon).
 * - Admin / Marketing → liste des contacts + fiche détail + capture rapide.
 */
export default function BaseDonnees() {
  const user = useAuthStore((s) => s.user);
  const isCallCenter = String(user?.role) === "CALL_CENTER";

  const [captureOpen, setCaptureOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-orange-50 grid place-items-center text-[#F17922]">
            {isCallCenter ? (
              <Phone className="w-6 h-6" />
            ) : (
              <Database className="w-6 h-6" />
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {isCallCenter ? "Vérification — Call Center" : "Base de Données"}
            </h1>
            <p className="text-sm text-gray-500">
              {isCallCenter
                ? "File d'appels J+1 · conversion en client direct"
                : "Contacts captés Glovo / Yango — du plus ancien au plus récent"}
            </p>
          </div>
        </div>

        <HasPermission module={Modules.BASE_DONNEES} action={Action.CREATE}>
          <button
            type="button"
            onClick={() => setCaptureOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#F17922] text-white text-sm font-semibold hover:opacity-90"
          >
            <UserPlus className="w-4 h-4" />
            Capturer un client
          </button>
        </HasPermission>
      </div>

      {isCallCenter ? (
        <CallCenterView />
      ) : (
        <HasPermission
          module={Modules.BASE_DONNEES}
          action={Action.READ}
          fallback={
            <div className="text-sm text-gray-500 bg-white border border-gray-200 rounded-xl p-6">
              Vous n&apos;avez pas accès à la liste des contacts.
            </div>
          }
        >
          <ProspectsList onRowClick={setDetailId} />
        </HasPermission>
      )}

      <CaptureContactModal
        isOpen={captureOpen}
        onClose={() => setCaptureOpen(false)}
      />
      <ProspectDetailModal id={detailId} onClose={() => setDetailId(null)} />
    </div>
  );
}
