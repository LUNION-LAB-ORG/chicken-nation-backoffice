"use client";

import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Archive,
  Calendar,
  CheckCircle2,
  Loader2,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  Users,
} from "lucide-react";

import { useRestaurantListQuery } from "../../restaurants/queries/restaurant-list.query";
import {
  useArchivePlanMutation,
  useConfirmPlanMutation,
  useDeletePlanMutation,
  useSchedulePlansQuery,
  useSendPlanMutation,
} from "../queries/schedule.query";
import type { ISchedulePlan, SchedulePlanStatus } from "../types/schedule.types";

import RestaurantTabsControlled from "./RestaurantTabsControlled";

import { EditDatesModal } from "./EditDatesModal";
import { GeneratePlanModal } from "./GeneratePlanModal";
import { SchedulePlanDetail } from "./SchedulePlanDetail";

const STATUS_META: Record<
  SchedulePlanStatus,
  { label: string; color: string; bg: string }
> = {
  DRAFT: { label: "Brouillon", color: "#92400E", bg: "#FEF3C7" },
  SENT: { label: "Envoyé", color: "#1E40AF", bg: "#DBEAFE" },
  CONFIRMED: { label: "Confirmé", color: "#166534", bg: "#DCFCE7" },
  ARCHIVED: { label: "Archivé", color: "#52525B", bg: "#F4F4F5" },
};

/**
 * Vue principale du module Planning (P7.5).
 *
 * Layout 2 colonnes :
 *   - Gauche (1/3) : liste des plans avec filtre par statut
 *   - Droite (2/3) : détail du plan sélectionné (matrice livreur×jours)
 *
 * Actions :
 *   - "Générer un plan" → modal avec date début + restaurant
 *   - "Envoyer" sur un DRAFT → push aux livreurs
 *   - "Confirmer" sur un SENT → fige les snapshots
 *   - "Archiver" sur un CONFIRMED → ferme le plan
 */
export function SchedulePlanningView({ restaurantId: defaultRestaurantId }: { restaurantId?: string }) {
  const [statusFilter, setStatusFilter] = useState<SchedulePlanStatus | "ALL">("ALL");
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [editPlan, setEditPlan] = useState<ISchedulePlan | null>(null);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>(defaultRestaurantId ?? "");

  const { data: restaurantsResponse } = useRestaurantListQuery();
  const restaurants = restaurantsResponse?.data ?? [];

  // Auto-sélectionne le 1er restaurant à l'arrivée si rien n'est sélectionné
  useEffect(() => {
    if (!selectedRestaurantId && restaurants.length > 0) {
      setSelectedRestaurantId(restaurants[0].id);
    }
  }, [selectedRestaurantId, restaurants]);

  const { data: plans, isLoading, isFetching, refetch } = useSchedulePlansQuery({
    restaurantId: selectedRestaurantId || undefined,
    status: statusFilter === "ALL" ? undefined : statusFilter,
  });

  return (
    <div className="space-y-4">
      {/* Header : tabs restaurants + actualiser */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <RestaurantTabsControlled
              value={selectedRestaurantId}
              onChange={(id) => {
                setSelectedRestaurantId(id);
                setSelectedPlanId(null); // reset selection au changement de resto
              }}
            />
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5 flex-shrink-0 text-xs font-semibold text-[#71717A] bg-[#f4f4f5] hover:bg-gray-200 px-3 py-2 rounded-lg disabled:opacity-60"
            title="Actualiser les plans"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
            Actualiser
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Sidebar gauche */}
      <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-gray-900">Plans de planning</h3>
          <button
            type="button"
            onClick={() => setShowGenerateModal(true)}
            disabled={!selectedRestaurantId}
            className="inline-flex items-center gap-1 bg-[#F17922] text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-[#D8631F] disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            Générer
          </button>
        </div>

        <StatusFilter selected={statusFilter} onChange={setStatusFilter} />

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-[#F17922]" />
          </div>
        ) : plans && plans.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {plans.map((p) => (
              <PlanCard
                key={p.id}
                plan={p}
                selected={selectedPlanId === p.id}
                onSelect={() => setSelectedPlanId(p.id)}
                onEdit={() => setEditPlan(p)}
              />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500 italic mt-4 text-center">
            Aucun plan {statusFilter !== "ALL" ? STATUS_META[statusFilter].label.toLowerCase() : ""}.
          </p>
        )}
      </div>

      {/* Détail droite */}
      <div className="lg:col-span-2">
        {selectedPlanId ? (
          <SchedulePlanDetail planId={selectedPlanId} />
        ) : (
          <EmptyDetail />
        )}
      </div>

      <GeneratePlanModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        defaultRestaurantId={selectedRestaurantId}
        onGenerated={(planId) => {
          setSelectedPlanId(planId);
          setShowGenerateModal(false);
        }}
      />

      <EditDatesModal
        isOpen={!!editPlan}
        plan={editPlan}
        onClose={() => setEditPlan(null)}
        onRegenerated={(planId) => {
          setSelectedPlanId(planId);
          setEditPlan(null);
        }}
      />
      </div>
    </div>
  );
}

// ============================================================
// SOUS-COMPOSANTS
// ============================================================

const StatusFilter: React.FC<{
  selected: SchedulePlanStatus | "ALL";
  onChange: (s: SchedulePlanStatus | "ALL") => void;
}> = ({ selected, onChange }) => {
  const options: { key: SchedulePlanStatus | "ALL"; label: string }[] = [
    { key: "ALL", label: "Tous" },
    { key: "DRAFT", label: "Brouillons" },
    { key: "SENT", label: "Envoyés" },
    { key: "CONFIRMED", label: "Confirmés" },
    { key: "ARCHIVED", label: "Archivés" },
  ];
  return (
    <div className="flex flex-wrap gap-1">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
            selected === o.key
              ? "bg-[#F17922] text-white"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
};

const PlanCard: React.FC<{
  plan: ISchedulePlan;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
}> = ({ plan, selected, onSelect, onEdit }) => {
  const sendMut = useSendPlanMutation();
  const confirmMut = useConfirmPlanMutation();
  const archiveMut = useArchivePlanMutation();
  const deleteMut = useDeletePlanMutation();

  const meta = STATUS_META[plan.status];
  const start = format(new Date(plan.period_start), "dd MMM", { locale: fr });
  const end = format(new Date(plan.period_end), "dd MMM yyyy", { locale: fr });

  return (
    <li
      className={`rounded-xl border p-3 cursor-pointer transition ${
        selected
          ? "border-[#F17922] bg-orange-50"
          : "border-gray-200 hover:border-gray-300 bg-white"
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between mb-1.5">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Calendar className="w-3 h-3" />
          {start} → {end}
        </div>
        <span
          className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
          style={{ color: meta.color, backgroundColor: meta.bg }}
        >
          {meta.label}
        </span>
      </div>

      {plan.confirmed_count > 0 && (
        <div className="flex items-center gap-1 text-xs text-emerald-700">
          <Users className="w-3 h-3" />
          {plan.confirmed_count} livreur(s) confirmé(s)
        </div>
      )}

      <div className="mt-2 flex flex-wrap gap-1.5">
        {(plan.status === "DRAFT" || plan.status === "SENT") && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#92400E] bg-amber-100 hover:bg-amber-200 px-2 py-1 rounded-lg"
          >
            <Calendar className="w-3 h-3" />
            Dates
          </button>
        )}
        {plan.status === "DRAFT" && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                sendMut.mutate(plan.id);
              }}
              disabled={sendMut.isPending}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded-lg disabled:opacity-60"
            >
              <Send className="w-3 h-3" />
              Envoyer
            </button>
            {/* Supprimer le brouillon — libère les dates pour une re-génération */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm("Supprimer définitivement ce brouillon ? Vous pourrez en régénérer un."))
                  deleteMut.mutate(plan.id);
              }}
              disabled={deleteMut.isPending}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-100 hover:bg-red-200 px-2 py-1 rounded-lg disabled:opacity-60"
            >
              <Trash2 className="w-3 h-3" />
              Supprimer
            </button>
          </>
        )}
        {plan.status === "SENT" && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                confirmMut.mutate(plan.id);
              }}
              disabled={confirmMut.isPending}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-2 py-1 rounded-lg disabled:opacity-60"
            >
              <CheckCircle2 className="w-3 h-3" />
              Confirmer
            </button>
            {/* Supprimer un plan envoyé — les livreurs ne le verront plus */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm("Supprimer définitivement ce plan envoyé ? Les livreurs ne le verront plus."))
                  deleteMut.mutate(plan.id);
              }}
              disabled={deleteMut.isPending}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-700 bg-orange-100 hover:bg-orange-200 px-2 py-1 rounded-lg disabled:opacity-60"
            >
              <Trash2 className="w-3 h-3" />
              Supprimer
            </button>
          </>
        )}
        {plan.status === "CONFIRMED" && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              archiveMut.mutate(plan.id);
            }}
            disabled={archiveMut.isPending}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-lg disabled:opacity-60"
          >
            <Archive className="w-3 h-3" />
            Archiver
          </button>
        )}
      </div>
    </li>
  );
};

const EmptyDetail = () => (
  <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
    <p className="text-sm text-gray-500">Sélectionne un plan dans la liste pour voir le détail.</p>
  </div>
);
