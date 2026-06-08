"use client";

import React, { useMemo, useState } from "react";
import { Inbox, Loader2, Search } from "lucide-react";

import { useRestaurantListQuery } from "../../restaurants/queries/restaurant-list.query";
import { useProspectListQuery } from "../queries/prospect-list.query";
import {
  ProspectPlatform,
  ProspectQuery,
  ProspectStatus,
} from "../types/prospect.types";
import {
  PLATFORM_META,
  PROSPECT_STATUSES,
  STATUS_META,
} from "../utils/prospect-ui";

const PAGE_SIZE = 20;

function StatusBadge({ status }: { status: ProspectStatus }) {
  const m = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${m.bg} ${m.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

function PlatformChip({ platform }: { platform: ProspectPlatform }) {
  const m = PLATFORM_META[platform];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${m.className}`}
    >
      <span>{m.emoji}</span> {m.label}
    </span>
  );
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function ProspectsList({
  onRowClick,
  showStoreFilter = true,
}: {
  onRowClick?: (id: string) => void;
  /** Filtre « tous les stores » — masqué pour les store-roles (déjà scopés). */
  showStoreFilter?: boolean;
} = {}) {
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState<ProspectPlatform | "">("");
  const [status, setStatus] = useState<ProspectStatus | "">("");
  const [restaurantId, setRestaurantId] = useState("");
  const [page, setPage] = useState(1);

  const { data: restaurantsResp } = useRestaurantListQuery();
  const restaurants = useMemo(
    () => (restaurantsResp?.data ?? []) as { id: string; name: string }[],
    [restaurantsResp],
  );

  const query: ProspectQuery = {
    page,
    limit: PAGE_SIZE,
    ...(search.trim() ? { search: search.trim() } : {}),
    ...(platform ? { platform } : {}),
    ...(status ? { status } : {}),
    ...(showStoreFilter && restaurantId ? { restaurantId } : {}),
  };
  const { data, isLoading, isFetching } = useProspectListQuery(query);

  const rows = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div>
      {/* Filtres — empilés sur mobile, en ligne sur desktop */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 mb-4">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 w-full sm:flex-1 sm:min-w-[220px] sm:max-w-sm">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Rechercher nom, téléphone, n° commande…"
            className="flex-1 min-w-0 text-sm outline-none bg-transparent"
          />
        </div>
        <div className="flex gap-2">
          {showStoreFilter && (
            <select
              value={restaurantId}
              onChange={(e) => {
                setRestaurantId(e.target.value);
                setPage(1);
              }}
              className="flex-1 sm:flex-none border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="">Tous les stores</option>
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          )}
          <select
            value={platform}
            onChange={(e) => {
              setPlatform(e.target.value as ProspectPlatform | "");
              setPage(1);
            }}
            className="flex-1 sm:flex-none border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="">Toutes plateformes</option>
            <option value="GLOVO">Glovo</option>
            <option value="YANGO">Yango</option>
          </select>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as ProspectStatus | "");
              setPage(1);
            }}
            className="flex-1 sm:flex-none border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="">Tous statuts</option>
            {PROSPECT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_META[s].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* États vides / chargement */}
      {isLoading ? (
        <div className="flex items-center justify-center h-56 bg-white border border-gray-200 rounded-xl">
          <Loader2 className="w-6 h-6 animate-spin text-[#F17922]" />
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-56 text-gray-400 bg-white border border-gray-200 rounded-xl">
          <Inbox className="w-10 h-10 mb-2" />
          <p className="text-sm">Aucun contact pour ces filtres.</p>
        </div>
      ) : (
        <>
          {/* Mobile : cartes tap-friendly */}
          <div className="md:hidden space-y-2">
            {rows.map((p) => (
              <div
                key={p.id}
                onClick={() => onRowClick?.(p.id)}
                className={`bg-white border border-gray-200 rounded-xl p-3 ${
                  onRowClick ? "cursor-pointer active:bg-gray-50" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <PlatformChip platform={p.platform} />
                  <StatusBadge status={p.status} />
                </div>
                <p className="mt-2 font-semibold text-gray-800">{p.name}</p>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-gray-600">
                  <span className="tabular-nums">{p.phone}</span>
                  <span className="text-gray-300">·</span>
                  <span className="tabular-nums">N° {p.order_number}</span>
                </div>
                <div className="mt-1.5 flex items-center justify-between text-xs text-gray-400">
                  <span className="truncate">{p.restaurant?.name ?? "—"}</span>
                  <span className="tabular-nums shrink-0">
                    {formatDate(p.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop : tableau */}
          <div className="hidden md:block bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
                    <th className="text-left font-semibold px-4 py-3">Date</th>
                    <th className="text-left font-semibold px-4 py-3">Plateforme</th>
                    <th className="text-left font-semibold px-4 py-3">Nom / Pseudo</th>
                    <th className="text-left font-semibold px-4 py-3">N° commande</th>
                    <th className="text-left font-semibold px-4 py-3">Téléphone</th>
                    <th className="text-left font-semibold px-4 py-3">Store</th>
                    <th className="text-left font-semibold px-4 py-3">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => onRowClick?.(p.id)}
                      className={`border-t border-gray-100 hover:bg-gray-50 ${
                        onRowClick ? "cursor-pointer" : ""
                      }`}
                    >
                      <td className="px-4 py-3 text-gray-500 tabular-nums whitespace-nowrap">
                        {formatDate(p.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <PlatformChip platform={p.platform} />
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-800">
                        {p.name}
                      </td>
                      <td className="px-4 py-3 text-gray-500 tabular-nums">
                        {p.order_number}
                      </td>
                      <td className="px-4 py-3 tabular-nums">{p.phone}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {p.restaurant?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={p.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-gray-500">
            {meta.total} contact(s) · page {meta.page}/{meta.totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1 || isFetching}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-50"
            >
              Précédent
            </button>
            <button
              type="button"
              disabled={page >= meta.totalPages || isFetching}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
