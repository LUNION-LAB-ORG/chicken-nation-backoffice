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
}: {
  onRowClick?: (id: string) => void;
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
    ...(restaurantId ? { restaurantId } : {}),
  };
  const { data, isLoading, isFetching } = useProspectListQuery(query);

  const rows = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div>
      {/* Filtres */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 flex-1 min-w-[220px] max-w-sm">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Rechercher nom, téléphone, n° commande…"
            className="flex-1 text-sm outline-none bg-transparent"
          />
        </div>
        <select
          value={restaurantId}
          onChange={(e) => {
            setRestaurantId(e.target.value);
            setPage(1);
          }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">Tous les stores</option>
          {restaurants.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <select
          value={platform}
          onChange={(e) => {
            setPlatform(e.target.value as ProspectPlatform | "");
            setPage(1);
          }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
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
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">Tous statuts</option>
          {PROSPECT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_META[s].label}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-56">
            <Loader2 className="w-6 h-6 animate-spin text-[#F17922]" />
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-56 text-gray-400">
            <Inbox className="w-10 h-10 mb-2" />
            <p className="text-sm">Aucun contact pour ces filtres.</p>
          </div>
        ) : (
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
                    className={`border-t border-gray-100 hover:bg-gray-50 ${onRowClick ? "cursor-pointer" : ""}`}
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
        )}
      </div>

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
