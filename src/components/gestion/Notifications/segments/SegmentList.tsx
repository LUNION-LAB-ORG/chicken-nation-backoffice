"use client";

import React from "react";
import {
  useSegmentsQuery,
  useDeleteSegmentMutation,
} from "@/hooks/useOnesignalQuery";
import type { OnesignalSegment } from "@/types/onesignal";
import {
  Users,
  Edit2,
  Trash2,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";

interface Props {
  searchQuery: string;
  onEdit: (segment: OnesignalSegment) => void;
  onCreate: () => void;
}

// Default OneSignal segments that can't be edited/deleted
const DEFAULT_SEGMENTS = [
  "Subscribed Users",
  "Active Users",
  "Inactive Users",
  "Engaged Users",
  "Total Subscriptions",
  "Active Subscriptions",
  "Inactive Subscriptions",
  "Engaged Subscriptions",
  "All Email Subscriptions",
  "All SMS Subscriptions",
];

export default function SegmentList({ searchQuery, onEdit, onCreate }: Props) {
  const { data, isLoading, error } = useSegmentsQuery();
  const { mutate: deleteSegment, isPending: isDeleting } = useDeleteSegmentMutation();

  const segments = data?.segments ?? [];

  const filtered = searchQuery
    ? segments.filter((s) =>
        s.name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : segments;

  // Detect if segment API CRUD is blocked (we track this from mutation errors)
  // For now, we show a persistent info banner since we know free plan blocks CRUD
  const isPlanLimited = true;

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

  return (
    <div className="space-y-4">
      {/* Plan limitation banner */}
      {isPlanLimited && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <AlertTriangle size={20} className="text-amber-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-amber-800 font-semibold">
              Plan OneSignal limité
            </p>
            <p className="text-xs text-amber-700 mt-1">
              La création, modification et suppression de segments via l&apos;API nécessitent un plan OneSignal payant.
              Vous pouvez consulter les segments existants ci-dessous, mais pour les gérer, utilisez directement le{" "}
              <a
                href="https://dashboard.onesignal.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-800 underline font-medium inline-flex items-center gap-1"
              >
                tableau de bord OneSignal <ExternalLink size={12} />
              </a>
              {" "}ou passez à un plan supérieur.
            </p>
            <p className="text-xs text-amber-600 mt-2">
              <strong>Astuce :</strong> Vous pouvez cibler des utilisateurs par tags directement lors de l&apos;envoi
              d&apos;une notification (onglet Messages), sans avoir besoin de créer des segments via l&apos;API.
            </p>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users size={28} className="text-gray-400" />
          </div>
          <p className="text-gray-500 text-sm">Aucun segment trouvé</p>
          <p className="text-gray-400 text-xs mt-1">
            Les segments sont gérés depuis le tableau de bord OneSignal
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="pb-3 font-medium">Nom</th>
                <th className="pb-3 font-medium">Statut</th>
                <th className="pb-3 font-medium">Date de création</th>
                <th className="pb-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((segment) => {
                const isDefault = DEFAULT_SEGMENTS.some(
                  (d) => d.toLowerCase() === segment.name?.toLowerCase()
                );

                return (
                  <tr key={segment.id} className="hover:bg-gray-50/50">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-gray-400" />
                        <span className="font-medium text-gray-900">
                          {segment.name}
                        </span>
                        {isDefault && (
                          <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                            Défaut
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3">
                      {segment.is_active !== false ? (
                        <span className="flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle size={14} /> Actif
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <XCircle size={14} /> Inactif
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-xs text-gray-500">
                      {segment.created_at
                        ? new Date(segment.created_at).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                    <td className="py-3">
                      {!isDefault && !isPlanLimited && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onEdit(segment)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#F17922] cursor-pointer"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("Supprimer ce segment ?")) {
                                deleteSegment(segment.id);
                              }
                            }}
                            disabled={isDeleting}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 cursor-pointer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                      {!isDefault && isPlanLimited && (
                        <div className="flex items-center justify-end">
                          <span className="text-[10px] text-gray-400 italic">
                            Lecture seule
                          </span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
