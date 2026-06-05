"use client";

import React, { useState } from "react";
import { BarChart3, Database, Ticket, TrendingUp, Users, UserPlus } from "lucide-react";

import DashboardPageHeader from "@/components/ui/DashboardPageHeader";
import { ProspectsList } from "../../../../features/base-donnees/components/ProspectsList";
import { CallCenterView } from "../../../../features/base-donnees/components/CallCenterView";
import { DashboardView } from "../../../../features/base-donnees/components/DashboardView";
import { CouponsView } from "../../../../features/base-donnees/components/CouponsView";
import { SalesView } from "../../../../features/base-donnees/components/SalesView";
import { ExportButton } from "../../../../features/base-donnees/components/ExportButton";
import { ProspectDetailModal } from "../../../../features/base-donnees/components/ProspectDetailModal";
import { CaptureContactModal } from "../../../../features/base-donnees/components/CaptureContactModal";
import { HasPermission } from "../../../../features/users/components/HasPermission";
import { Action, Modules } from "../../../../features/users/types/auth.type";
import { useAuthStore } from "../../../../features/users/hook/authStore";

type AdminTab = "dashboard" | "liste" | "coupons" | "ventes";

const ADMIN_TABS: { key: AdminTab; label: string; Icon: typeof Database }[] = [
  { key: "dashboard", label: "Tableau de bord", Icon: BarChart3 },
  { key: "liste", label: "Contacts", Icon: Users },
  { key: "coupons", label: "Coupons", Icon: Ticket },
  { key: "ventes", label: "Ventes", Icon: TrendingUp },
];

const EXPORT_BY_TAB: Partial<Record<AdminTab, "contacts" | "coupons" | "sales">> =
  {
    liste: "contacts",
    coupons: "coupons",
    ventes: "sales",
  };

/**
 * Module « Base de Données » — captation & conversion des clients Glovo/Yango.
 * - Call Center → file d'appels J+1 (qualification + coupon).
 * - Admin / Marketing → tableau de bord, contacts (+ fiche), coupons, ventes.
 */
export default function BaseDonnees() {
  const user = useAuthStore((s) => s.user);
  const can = useAuthStore((s) => s.can);
  const isCallCenter = String(user?.role) === "CALL_CENTER";

  const [tab, setTab] = useState<AdminTab>("dashboard");
  const [captureOpen, setCaptureOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const exportType = !isCallCenter ? EXPORT_BY_TAB[tab] : undefined;

  return (
    <div className="flex-1 px-4 pt-4 pb-10">
      <DashboardPageHeader
        mode="list"
        title={isCallCenter ? "Vérification — Call Center" : "Acquisition Glovo/Yango"}
        subtitle={
          isCallCenter
            ? "File d'appels J+1 · conversion en client direct"
            : "Captation & conversion des clients Glovo / Yango"
        }
        actions={[
          ...(exportType && can(Modules.BASE_DONNEES, Action.EXPORT)
            ? [
                {
                  label: "Exporter",
                  onClick: () => {},
                  customComponent: <ExportButton type={exportType} />,
                },
              ]
            : []),
          ...(can(Modules.BASE_DONNEES, Action.CREATE)
            ? [
                {
                  label: "Capturer un client",
                  onClick: () => setCaptureOpen(true),
                  variant: "primary" as const,
                  icon: UserPlus,
                },
              ]
            : []),
        ]}
      />

      {isCallCenter ? (
        <div className="mt-4">
          <CallCenterView />
        </div>
      ) : (
        <HasPermission
          module={Modules.BASE_DONNEES}
          action={Action.READ}
          fallback={
            <div className="text-sm text-gray-500 bg-white border border-gray-200 rounded-xl p-6 mt-4">
              Vous n&apos;avez pas accès à ce module.
            </div>
          }
        >
          {/* Onglets admin */}
          <div className="flex items-center gap-1 bg-[#f4f4f5] rounded-xl p-1 w-fit my-4">
            {ADMIN_TABS.map((t) => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={`inline-flex items-center gap-1.5 text-[13px] font-semibold px-4 py-1.5 rounded-lg transition-colors ${
                    active
                      ? "bg-[#F17922] text-white"
                      : "text-[#71717A] hover:text-gray-700"
                  }`}
                >
                  <t.Icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>

          {tab === "dashboard" && <DashboardView />}
          {tab === "liste" && <ProspectsList onRowClick={setDetailId} />}
          {tab === "coupons" && <CouponsView />}
          {tab === "ventes" && <SalesView />}
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
