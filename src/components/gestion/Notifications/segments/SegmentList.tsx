"use client";

import React, { useState } from "react";
import {
  useSegmentsQuery,
  useDeleteSegmentMutation,
} from "@/hooks/usePushCampaignQuery";
import type { PushSegment } from "@/types/push-campaign";
import {
  Users,
  Loader2,
  Trash2,
  Pencil,
  Lock,
  Sparkles,
} from "lucide-react";
import CreateSegmentModal from "./CreateSegmentModal";

interface Props {
  searchQuery: string;
  onCreate?: () => void;
}

export default function SegmentList({ searchQuery, onCreate }: Props) {
  const { data: segments, isLoading, error } = useSegmentsQuery();
  const deleteMutation = useDeleteSegmentMutation();
  const [editSegment, setEditSegment] = useState<PushSegment | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="animate-spin text-[#F17922]" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-500 text-sm">Erreur : {error.message}</p>
      </div>
    );
  }

  const allSegments = segments ?? [];
  const systemSegments = allSegments.filter((s) => s.is_system);
  const customSegments = allSegments.filter((s) => !s.is_system);

  const filterFn = (s: PushSegment) =>
    !searchQuery || s.label.toLowerCase().includes(searchQuery.toLowerCase());

  const filteredSystem = systemSegments.filter(filterFn);
  const filteredCustom = customSegments.filter(filterFn);

  const handleDelete = (segment: PushSegment) => {
    if (!segment.id) return;
    if (!confirm(`Supprimer le segment "${segment.label}" ?`)) return;
    deleteMutation.mutate(segment.id);
  };

  if (filteredSystem.length === 0 && filteredCustom.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users size={28} className="text-gray-400" />
        </div>
        <p className="text-gray-500 text-sm">Aucun segment trouvé</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Custom segments */}
      {filteredCustom.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={16} className="text-[#F17922]" />
            <h3 className="text-sm font-semibold text-gray-900">
              Segments personnalisés
            </h3>
            <span className="text-xs text-gray-400">
              ({filteredCustom.length})
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredCustom.map((segment) => (
              <div
                key={segment.key}
                className="border border-gray-100 rounded-xl p-4 hover:border-[#F17922]/30 transition-all group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-[#F17922]" />
                    <span className="font-medium text-gray-900 text-sm">
                      {segment.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditSegment(segment)}
                      className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(segment)}
                      disabled={deleteMutation.isPending}
                      className="p-1 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  {segment.description}
                </p>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FFF3E8] text-[#F17922]">
                  {segment.count.toLocaleString("fr-FR")} abonnés
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System segments — compact chips */}
      {filteredSystem.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Lock size={14} className="text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900">
              Segments système
            </h3>
            <span className="text-xs text-gray-400">
              (calculés automatiquement)
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {filteredSystem.map((segment) => (
              <div
                key={segment.key}
                className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl"
                title={segment.description}
              >
                <Users size={14} className="text-gray-400 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-700">
                  {segment.label}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-200 text-gray-600">
                  {segment.count.toLocaleString("fr-FR")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit modal */}
      <CreateSegmentModal
        isOpen={showCreate || !!editSegment}
        onClose={() => {
          setShowCreate(false);
          setEditSegment(null);
        }}
        editSegment={editSegment}
      />
    </div>
  );
}
