"use client";

import React from "react";
import { formatDistanceToNow, formatDistanceToNowStrict } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Activity,
  AlertTriangle,
  Award,
  Clock,
  Pause,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";

import { useDelivererScoringInfoQuery } from "../../queries/deliverer-scoring.query";
import type { IDelivererScoringInfo } from "../../types/deliverer-scoring.type";

interface ScoringQueueSectionProps {
  livreurId: string;
}

/**
 * Section "Scoring & File d'attente" du drawer livreur.
 *
 * Affiche en temps réel (polling 15 s) :
 *   - Position dans la file FIFO + total candidats
 *   - Score composite + breakdown des composantes
 *   - Refus récents avec barre de progression vers seuil auto-pause
 *   - Auto-pause / Pénalité queue actives (countdown)
 *   - Liste lisible des raisons (pas opérationnel, course active, etc.)
 *
 * Source : `GET /deliverers/:id/scoring-info` (admin only).
 */
const ScoringQueueSection: React.FC<ScoringQueueSectionProps> = ({ livreurId }) => {
  const { data, isLoading, isFetching, error } = useDelivererScoringInfoQuery(livreurId);

  if (isLoading) {
    return (
      <div className="mb-6">
        <p className="text-[18px] font-medium text-[#F17922] mb-3">Scoring & File d&apos;attente</p>
        <div className="rounded-xl border border-[#E4E4E7] bg-white p-6 text-center">
          <p className="text-sm text-[#71717A]">Chargement…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mb-6">
        <p className="text-[18px] font-medium text-[#F17922] mb-3">Scoring & File d&apos;attente</p>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">
            Impossible de charger les infos scoring : {(error as Error)?.message ?? "erreur inconnue"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[18px] font-medium text-[#F17922]">Scoring & File d&apos;attente</p>
        {isFetching && (
          <span className="text-[10px] text-[#A1A1AA] uppercase tracking-wider">
            actualisation…
          </span>
        )}
      </div>

      <RankingCard data={data} />
      <ScoringCard data={data} />
      <RefusalsCard data={data} />
      <PauseCard data={data} />
      <ReasonsCard data={data} />
    </div>
  );
};

export default ScoringQueueSection;

// ============================================================
// CARDS
// ============================================================

const RankingCard: React.FC<{ data: IDelivererScoringInfo }> = ({ data }) => {
  const ranking = data.ranking;
  const lastSeen = data.lastAvailableAt
    ? formatDistanceToNow(new Date(data.lastAvailableAt), { addSuffix: true, locale: fr })
    : null;

  return (
    <div className="rounded-xl border border-[#E4E4E7] bg-white p-4 mb-3">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-lg bg-[#F17922]/10 flex items-center justify-center flex-shrink-0">
          <Users className="w-5 h-5 text-[#F17922]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-[#71717A]">Position dans la file</p>
          {ranking && ranking.position !== null ? (
            <>
              <p className="text-2xl font-bold text-[#18181B] mt-1">
                #{ranking.position}{" "}
                <span className="text-sm font-normal text-[#71717A]">
                  / {ranking.totalCandidates} candidat{ranking.totalCandidates > 1 ? "s" : ""}
                </span>
              </p>
              {ranking.rankInQueue !== null && ranking.rankInQueue !== ranking.position && (
                <p className="text-xs text-[#71717A] mt-1">
                  Rang FIFO pur : #{ranking.rankInQueue}{" "}
                  <span className="text-[#A1A1AA]">
                    (le score composite a modifié l&apos;ordre)
                  </span>
                </p>
              )}
              {lastSeen && (
                <p className="text-xs text-[#71717A] mt-1">Dispo depuis {lastSeen}</p>
              )}
            </>
          ) : (
            <p className="text-sm text-[#A1A1AA] italic mt-1">
              Pas dans le ranking actuel
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const ScoringCard: React.FC<{ data: IDelivererScoringInfo }> = ({ data }) => {
  if (!data.scoring) {
    return (
      <div className="rounded-xl border border-[#E4E4E7] bg-white p-4 mb-3">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
            <Award className="w-5 h-5 text-gray-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-[#71717A]">Score composite</p>
            <p className="text-sm text-[#A1A1AA] italic mt-1">Non calculable</p>
          </div>
        </div>
      </div>
    );
  }

  const { currentScore, distanceMeters, components, weights } = data.scoring;
  const weighted = {
    queue: components.queue * weights.queue,
    distance: components.distance * weights.distance,
    chain: components.chain * weights.chain,
    vehicle: components.vehicle * weights.vehicle,
  };
  const positiveTotal =
    weighted.queue + weighted.distance + weighted.chain + weighted.vehicle;
  const max = Math.max(positiveTotal, 0.01);

  return (
    <div className="rounded-xl border border-[#E4E4E7] bg-white p-4 mb-3">
      <div className="flex items-start gap-3 mb-3">
        <div className="h-10 w-10 rounded-lg bg-[#F17922]/10 flex items-center justify-center flex-shrink-0">
          <Award className="w-5 h-5 text-[#F17922]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-[#71717A]">Score composite</p>
          <p className="text-2xl font-bold text-[#18181B] mt-1">
            {currentScore.toFixed(3)}
          </p>
          {distanceMeters !== null && (
            <p className="text-xs text-[#71717A] mt-1">
              Distance restaurant :{" "}
              <span className="font-medium text-[#18181B]">
                {(distanceMeters / 1000).toFixed(2)} km
              </span>
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <ScoreBar
          label="File FIFO"
          rawValue={components.queue}
          weightedValue={weighted.queue}
          weight={weights.queue}
          max={max}
          color="bg-blue-500"
        />
        <ScoreBar
          label="Distance"
          rawValue={components.distance}
          weightedValue={weighted.distance}
          weight={weights.distance}
          max={max}
          color="bg-green-500"
        />
        <ScoreBar
          label="Chaînage"
          rawValue={components.chain}
          weightedValue={weighted.chain}
          weight={weights.chain}
          max={max}
          color="bg-purple-500"
        />
        <ScoreBar
          label="Véhicule"
          rawValue={components.vehicle}
          weightedValue={weighted.vehicle}
          weight={weights.vehicle}
          max={max}
          color="bg-orange-500"
        />
        {components.penalty > 0 && (
          <div className="pt-2 border-t border-[#F4F4F5] mt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-red-600">
                <TrendingDown className="w-3.5 h-3.5" />
                Pénalité refus
              </span>
              <span className="font-semibold text-red-600">
                −{components.penalty.toFixed(3)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ScoreBar: React.FC<{
  label: string;
  rawValue: number;
  weightedValue: number;
  weight: number;
  max: number;
  color: string;
}> = ({ label, rawValue, weightedValue, weight, max, color }) => {
  const pct = Math.max(0, Math.min(100, (weightedValue / max) * 100));
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-[#71717A]">
          {label}{" "}
          <span className="text-[#A1A1AA]">
            (poids {(weight * 100).toFixed(0)}%)
          </span>
        </span>
        <span className="font-medium text-[#18181B]">
          {rawValue.toFixed(2)} → {weightedValue.toFixed(3)}
        </span>
      </div>
      <div className="h-1.5 bg-[#F4F4F5] rounded-full overflow-hidden">
        <div className={`${color} h-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

const RefusalsCard: React.FC<{ data: IDelivererScoringInfo }> = ({ data }) => {
  const { refusals } = data;
  const pct = Math.min(100, (refusals.countInWindow / refusals.threshold) * 100);
  const color = pct >= 100 ? "bg-red-500" : pct >= 66 ? "bg-orange-500" : "bg-yellow-500";

  return (
    <div className="rounded-xl border border-[#E4E4E7] bg-white p-4 mb-3">
      <div className="flex items-start gap-3 mb-2">
        <div className="h-10 w-10 rounded-lg bg-[#F17922]/10 flex items-center justify-center flex-shrink-0">
          <TrendingDown className="w-5 h-5 text-[#F17922]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-[#71717A]">Refus récents</p>
          <p className="text-lg font-bold text-[#18181B] mt-0.5">
            {refusals.countInWindow}{" "}
            <span className="text-sm font-normal text-[#71717A]">
              / {refusals.threshold} avant auto-pause
            </span>
          </p>
          <p className="text-xs text-[#A1A1AA] mt-0.5">
            Fenêtre glissante de {refusals.windowMinutes} min
          </p>
        </div>
      </div>

      <div className="h-2 bg-[#F4F4F5] rounded-full overflow-hidden mb-2">
        <div className={`${color} h-full transition-all`} style={{ width: `${pct}%` }} />
      </div>

      {refusals.timestamps.length > 0 && (
        <div className="mt-2 pt-2 border-t border-[#F4F4F5]">
          <p className="text-[10px] uppercase tracking-wider text-[#A1A1AA] mb-1">
            Derniers refus
          </p>
          <div className="space-y-0.5 max-h-24 overflow-y-auto">
            {refusals.timestamps.slice(0, 5).map((ts) => (
              <p key={ts} className="text-xs text-[#71717A]">
                •{" "}
                {formatDistanceToNow(new Date(ts), {
                  addSuffix: true,
                  locale: fr,
                })}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const PauseCard: React.FC<{ data: IDelivererScoringInfo }> = ({ data }) => {
  const { pauses, queuePenalty } = data;
  const hasAnyPause =
    pauses.isPaused || pauses.isAutoPaused || queuePenalty.active;

  if (!hasAnyPause) return null;

  return (
    <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 mb-3">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
          <Pause className="w-5 h-5 text-orange-600" />
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          {pauses.isAutoPaused && pauses.autoPauseUntil && (
            <PauseLine
              icon={<AlertTriangle className="w-3.5 h-3.5" />}
              label="Auto-pause active"
              detail={`Termine ${formatDistanceToNowStrict(new Date(pauses.autoPauseUntil), { addSuffix: true, locale: fr })}`}
              tone="auto"
            />
          )}
          {pauses.isPaused && pauses.pauseUntil && (
            <PauseLine
              icon={<Pause className="w-3.5 h-3.5" />}
              label="Pause manuelle"
              detail={`Termine ${formatDistanceToNowStrict(new Date(pauses.pauseUntil), { addSuffix: true, locale: fr })}`}
              tone="manual"
            />
          )}
          {queuePenalty.active && queuePenalty.until && (
            <PauseLine
              icon={<TrendingDown className="w-3.5 h-3.5" />}
              label={`Pénalité +${queuePenalty.positions} positions`}
              detail={`Reset ${formatDistanceToNowStrict(new Date(queuePenalty.until), { addSuffix: true, locale: fr })}`}
              tone="penalty"
            />
          )}
        </div>
      </div>
    </div>
  );
};

const PauseLine: React.FC<{
  icon: React.ReactNode;
  label: string;
  detail: string;
  tone: "auto" | "manual" | "penalty";
}> = ({ icon, label, detail, tone }) => {
  const colorMap = {
    auto: "text-red-700",
    manual: "text-orange-700",
    penalty: "text-yellow-800",
  };
  return (
    <div className="flex items-center justify-between text-xs">
      <span className={`flex items-center gap-1.5 font-medium ${colorMap[tone]}`}>
        {icon}
        {label}
      </span>
      <span className="text-[#71717A]">{detail}</span>
    </div>
  );
};

const ReasonsCard: React.FC<{ data: IDelivererScoringInfo }> = ({ data }) => {
  if (data.reasons.length === 0) return null;

  return (
    <div className="rounded-xl border border-[#E4E4E7] bg-[#FAFAFA] p-4">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
          <Activity className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-[#71717A] mb-2">Raisons / contexte</p>
          <ul className="space-y-1">
            {data.reasons.map((reason) => (
              <li
                key={reason}
                className="text-xs text-[#52525B] flex items-start gap-1.5"
              >
                <Clock className="w-3 h-3 mt-0.5 text-[#A1A1AA] flex-shrink-0" />
                <span>{reason}</span>
              </li>
            ))}
            {data.isInActiveCourse && data.activeCourse && (
              <li className="text-xs text-[#52525B] flex items-start gap-1.5">
                <TrendingUp className="w-3 h-3 mt-0.5 text-emerald-600 flex-shrink-0" />
                <span>
                  Course active :{" "}
                  <span className="font-mono text-[#18181B]">
                    {data.activeCourse.reference}
                  </span>{" "}
                  (statut {data.activeCourse.statut})
                </span>
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};
