"use client";

import React, { useState } from "react";
import DashboardPageHeader from "@/components/ui/DashboardPageHeader";
import {
  useNewsListQuery,
  useNewsStatsQuery,
  useToggleNewsMutation,
  useDeleteNewsMutation,
} from "../../../../features/news/queries/news.query";
import type { News } from "../../../../features/news/types/news.types";
import { formatImageUrl } from "@/utils/imageHelpers";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
  Image as ImageIcon,
  Newspaper,
} from "lucide-react";
import NewsFormModal from "./NewsFormModal";

export default function Nouveautes() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<News | null>(null);

  const { data, isLoading } = useNewsListQuery({ page, limit: 10, search });
  const { data: stats } = useNewsStatsQuery();
  const toggleMutation = useToggleNewsMutation();
  const deleteMutation = useDeleteNewsMutation();

  const items = data?.data ?? [];
  const meta = data?.meta;

  const handleDelete = (item: News) => {
    if (confirm(`Supprimer "${item.title}" ?`)) {
      deleteMutation.mutate(item.id);
    }
  };

  return (
    <div className="flex-1 overflow-auto p-4">
      <DashboardPageHeader
        mode="list"
        title="Nouveautés"
        subtitle="Gérez les bannières et actualités affichées dans l'application"
        searchConfig={{
          placeholder: "Rechercher une nouveauté...",
          buttonText: "Chercher",
          onSearch: setSearch,
          realTimeSearch: true,
        }}
        actions={[
          {
            label: "Nouvelle nouveauté",
            onClick: () => {
              setEditItem(null);
              setShowForm(true);
            },
            variant: "primary" as const,
          },
        ]}
      />

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4 mt-4">
          <StatCard label="Total" value={stats.total} color="bg-gray-50 text-gray-700" />
          <StatCard label="Actives" value={stats.active} color="bg-green-50 text-green-700" />
          <StatCard label="Inactives" value={stats.inactive} color="bg-red-50 text-red-600" />
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-[20px] p-4 mt-4 shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-[#F17922]" size={32} />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <Newspaper size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-sm">Aucune nouveauté</p>
          </div>
        ) : (
          <>
            <div className="grid gap-4">
              {items.map((item) => (
                <NewsCard
                  key={item.id}
                  item={item}
                  onEdit={() => {
                    setEditItem(item);
                    setShowForm(true);
                  }}
                  onToggle={() => toggleMutation.mutate(item.id)}
                  onDelete={() => handleDelete(item)}
                  isToggling={toggleMutation.isPending}
                />
              ))}
            </div>

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Page {meta.page} sur {meta.totalPages} ({meta.total} résultat{meta.total > 1 ? "s" : ""})
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-50 cursor-pointer hover:bg-gray-50"
                  >
                    Précédent
                  </button>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= meta.totalPages}
                    className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-50 cursor-pointer hover:bg-gray-50"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Form Modal */}
      <NewsFormModal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditItem(null);
        }}
        editItem={editItem}
      />
    </div>
  );
}

// ── Stat Card ──
function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`rounded-xl p-4 ${color}`}>
      <p className="text-xs font-medium opacity-70">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

// ── News Card ──
function NewsCard({
  item,
  onEdit,
  onToggle,
  onDelete,
  isToggling,
}: {
  item: News;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  isToggling: boolean;
}) {
  const imageUrl = item.imageUrl ? formatImageUrl(item.imageUrl) : null;

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 transition-all">
      {/* Image banner with 2.5:1 aspect ratio */}
      <div className="relative" style={{ aspectRatio: "2.5 / 1" }}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={item.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <ImageIcon size={32} className="text-gray-300" />
          </div>
        )}
        {/* Status badge */}
        <div className="absolute top-3 left-3">
          <span
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
              item.isActive
                ? "bg-green-500/90 text-white"
                : "bg-gray-500/90 text-white"
            }`}
          >
            {item.isActive ? "Active" : "Inactive"}
          </span>
        </div>
        {/* Actions */}
        <div className="absolute top-3 right-3 flex gap-1.5">
          <button
            onClick={onToggle}
            disabled={isToggling}
            className="w-8 h-8 rounded-lg bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-all cursor-pointer shadow-sm"
            title={item.isActive ? "Désactiver" : "Activer"}
          >
            {item.isActive ? (
              <EyeOff size={14} className="text-gray-600" />
            ) : (
              <Eye size={14} className="text-green-600" />
            )}
          </button>
          <button
            onClick={onEdit}
            className="w-8 h-8 rounded-lg bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-all cursor-pointer shadow-sm"
            title="Modifier"
          >
            <Pencil size={14} className="text-blue-600" />
          </button>
          <button
            onClick={onDelete}
            className="w-8 h-8 rounded-lg bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-all cursor-pointer shadow-sm"
            title="Supprimer"
          >
            <Trash2 size={14} className="text-red-500" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-sm">{item.title}</h3>
        {item.content && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.content}</p>
        )}
        <div className="flex items-center justify-between mt-3">
          <span className="text-[11px] text-gray-400">
            {new Intl.DateTimeFormat("fr-FR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }).format(new Date(item.createdAt))}
          </span>
          {item.link && (
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] text-blue-500 hover:underline"
            >
              <ExternalLink size={11} />
              Lien
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
