"use client";

import React, { useEffect, useState } from "react";
import { AlertCircle, Plus } from "lucide-react";

import { useDroitsLivraison } from "../../livreurs/hook/use-droits-livraison";
import { peutAgirSurRestaurant } from "../../livreurs/utils/droits-livraison";
import { useAuthStore } from "../../users/hook/authStore";
import { useSchedulePlansQuery } from "../queries/schedule.query";
import type { ISchedulePlan, SchedulePlanStatus } from "../types/schedule.types";
import { cleAujourdhui, couvre, periode, planningParDefaut } from "../utils/periode-planning";

import { GeneratePlanModal } from "./GeneratePlanModal";
import { PastillePlanning } from "./PastillePlanning";
import { SchedulePlanDetail } from "./SchedulePlanDetail";

type Filtre = SchedulePlanStatus | "ALL";

const FILTRES: { key: Filtre; label: string; vide: string }[] = [
  { key: "ALL", label: "Tous", vide: "Aucun plan." },
  { key: "DRAFT", label: "Brouillons", vide: "Aucun plan brouillon." },
  { key: "SENT", label: "Envoyés", vide: "Aucun plan envoyé." },
  { key: "CONFIRMED", label: "Confirmés", vide: "Aucun plan confirmé." },
  { key: "ARCHIVED", label: "Archivés", vide: "Aucun plan archivé." },
];

interface Props {
  restaurantId: string;
  /** Faux pour un compte de restaurant : « Générer » est pour le sien. */
  choixRestaurant: boolean;
}

/**
 * Plannings d'un restaurant (conception du 24/10, 10.3) : la liste à
 * gauche, le détail à droite.
 *
 * Les boutons ont quitté les cartes : on agit à un seul endroit, l'en-tête du
 * détail. À l'arrivée, le planning qui couvre aujourd'hui est choisi
 * d'office (envoyé ou confirmé d'abord), sinon le plus récent.
 */
export function SchedulePlanningView({ restaurantId, choixRestaurant }: Props) {
  const [filtre, setFiltre] = useState<Filtre>("ALL");
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  const droits = useDroitsLivraison();
  const membre = useAuthStore((s) => s.user);
  const peutCreer = droits.creerPlanning && peutAgirSurRestaurant(membre, restaurantId);

  const { data: plans, isLoading, isError, isFetching, refetch } = useSchedulePlansQuery({
    restaurantId,
    status: filtre === "ALL" ? undefined : filtre,
  });

  // Choix d'office, et nouveau choix quand le planning affiché quitte la
  // liste (supprimé, filtre). Pas pendant une relecture : un planning tout
  // juste créé ou refait n'y est pas encore.
  useEffect(() => {
    if (!plans || isFetching) return;
    if (selectedPlanId && plans.some((p) => p.id === selectedPlanId)) return;
    setSelectedPlanId(planningParDefaut(plans, cleAujourdhui())?.id ?? null);
  }, [plans, isFetching, selectedPlanId]);

  const aujourdhui = cleAujourdhui();
  const vide = FILTRES.find((f) => f.key === filtre)?.vide ?? FILTRES[0].vide;
  const choisir = (planId: string) => {
    setFiltre("ALL");
    setSelectedPlanId(planId);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Liste */}
      <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-200 p-4 self-start">
        <div className="flex items-center justify-between gap-2 mb-4">
          <h3 className="text-base font-bold text-gray-900">Plans de planning</h3>
          {peutCreer && (
            <button
              type="button"
              onClick={() => setShowGenerateModal(true)}
              className="inline-flex items-center gap-1 bg-[#F17922] text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-[#D8631F] whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              Générer
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1">
          {FILTRES.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFiltre(f.key)}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                filtre === f.key ? "bg-[#F17922] text-white" : "bg-gray-100 text-gray-600"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {isError && plans && (
          <p className="mt-3 text-[11px] text-red-600 bg-red-50 rounded px-2 py-1">
            Connexion perdue, nouvel essai en cours
          </p>
        )}

        {isLoading ? (
          <ul className="mt-3 space-y-2">
            {[0, 1, 2].map((i) => (
              <li key={i} className="h-[58px] rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </ul>
        ) : isError && !plans ? (
          <div className="mt-3 flex items-center gap-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Impossible de lire les plannings.</span>
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="ml-auto shrink-0 text-[#F17922] underline disabled:opacity-50"
            >
              Réessayer
            </button>
          </div>
        ) : plans && plans.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {plans.map((p) => (
              <CartePlanning
                key={p.id}
                plan={p}
                enCours={couvre(p, aujourdhui)}
                selected={selectedPlanId === p.id}
                onSelect={() => setSelectedPlanId(p.id)}
              />
            ))}
          </ul>
        ) : (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">{vide}</p>
            {filtre === "ALL" && peutCreer && (
              <button
                type="button"
                onClick={() => setShowGenerateModal(true)}
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#F17922] hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                Générer
              </button>
            )}
          </div>
        )}
      </div>

      {/* Détail */}
      <div className="lg:col-span-2 min-w-0">
        {selectedPlanId ? (
          <SchedulePlanDetail
            key={selectedPlanId}
            planId={selectedPlanId}
            onPlanRefait={choisir}
            onPlanSupprime={() => setSelectedPlanId(null)}
          />
        ) : plans && plans.length > 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
            <p className="text-sm text-gray-500">Sélectionne un plan dans la liste pour voir le détail.</p>
          </div>
        ) : null}
      </div>

      <GeneratePlanModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        defaultRestaurantId={restaurantId}
        choixRestaurant={choixRestaurant}
        onGenerated={(planId) => {
          choisir(planId);
          setShowGenerateModal(false);
        }}
      />
    </div>
  );
}

const CartePlanning: React.FC<{
  plan: ISchedulePlan;
  enCours: boolean;
  selected: boolean;
  onSelect: () => void;
}> = ({ plan, enCours, selected, onSelect }) => (
  <li>
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left rounded-xl border px-3 py-2.5 transition ${
        selected ? "border-[#F17922] bg-orange-50" : "border-gray-200 hover:border-gray-300 bg-white"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-gray-800 truncate">
          {periode(plan.period_start, plan.period_end)}
        </span>
        <PastillePlanning statut={plan.status} />
      </div>
      <p className="mt-0.5 h-4 text-[11px] font-semibold text-[#F17922]">{enCours ? "En cours" : ""}</p>
    </button>
  </li>
);
