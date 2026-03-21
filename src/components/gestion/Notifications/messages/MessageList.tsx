"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  useCampaignsQuery,
  useCancelCampaignMutation,
} from "@/hooks/usePushCampaignQuery";
import type { PushCampaign } from "@/types/push-campaign";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Send,
  MoreVertical,
  Copy,
  XCircle,
  BarChart3,
} from "lucide-react";
import { toast } from "react-hot-toast";
import MessageDetail from "./MessageDetail";

interface Props {
  searchQuery: string;
}

function formatDate(date?: string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusBadge(campaign: PushCampaign) {
  const styles: Record<string, string> = {
    sent: "bg-green-50 text-green-700 border-green-100",
    failed: "bg-red-50 text-red-600 border-red-100",
    scheduled: "bg-yellow-50 text-yellow-700 border-yellow-100",
    draft: "bg-blue-50 text-blue-600 border-blue-100",
  };
  const labels: Record<string, string> = {
    sent: "Envoyé",
    failed: "Échoué",
    scheduled: "Planifié",
    draft: "Brouillon",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${
        styles[campaign.status] ?? styles.draft
      }`}
    >
      {labels[campaign.status] ?? campaign.status}
    </span>
  );
}

// ── Actions dropdown ─────────────────────────────────────────────────────────

function ActionsMenu({
  campaign,
  onView,
  onCancel,
  isCancelling,
}: {
  campaign: PushCampaign;
  onView: () => void;
  onCancel: () => void;
  isCancelling: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const copyId = () => {
    navigator.clipboard.writeText(campaign.id);
    toast.success("ID copié");
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 cursor-pointer"
      >
        <MoreVertical size={18} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-lg border border-gray-200 py-1.5 z-50">
          <button
            onClick={() => {
              onView();
              setOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            <BarChart3 size={15} className="text-gray-400" />
            Voir le rapport
          </button>
          <button
            onClick={copyId}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            <Copy size={15} className="text-gray-400" />
            Copier l&apos;ID
          </button>
          {campaign.status === "scheduled" && (
            <>
              <div className="border-t border-gray-100 my-1" />
              <button
                onClick={() => {
                  if (confirm("Annuler cette campagne ?")) {
                    onCancel();
                  }
                  setOpen(false);
                }}
                disabled={isCancelling}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer disabled:opacity-50"
              >
                <XCircle size={15} />
                Annuler la campagne
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function MessageList({ searchQuery }: Props) {
  const [page, setPage] = useState(1);
  const limit = 20;
  const [selectedCampaign, setSelectedCampaign] = useState<PushCampaign | null>(null);

  const { data, isLoading, error } = useCampaignsQuery({
    page,
    limit,
    search: searchQuery || undefined,
  });
  const { mutate: cancelCampaign, isPending: isCancelling } =
    useCancelCampaignMutation();

  const campaigns = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  if (selectedCampaign) {
    return (
      <MessageDetail
        campaign={selectedCampaign}
        onBack={() => setSelectedCampaign(null)}
      />
    );
  }

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
        <p className="text-red-500 text-sm">
          Erreur lors du chargement : {error.message}
        </p>
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Send size={28} className="text-gray-400" />
        </div>
        <p className="text-gray-500 text-sm">Aucune campagne push</p>
        <p className="text-gray-400 text-xs mt-1">
          Envoyez votre première notification push
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-100">
              <th className="pb-3 font-medium pl-1">Type</th>
              <th className="pb-3 font-medium">Nom</th>
              <th className="pb-3 font-medium">Statut</th>
              <th className="pb-3 font-medium">Envoyé le</th>
              <th className="pb-3 font-medium text-right">Ciblés</th>
              <th className="pb-3 font-medium text-right">Envoyés</th>
              <th className="pb-3 font-medium text-right pr-1">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {campaigns.map((campaign) => (
              <tr key={campaign.id} className="hover:bg-gray-50/50 group">
                <td className="py-3.5 pl-1">
                  <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Bell size={18} className="text-[#F17922]" />
                  </div>
                </td>
                <td className="py-3.5">
                  <button
                    onClick={() => setSelectedCampaign(campaign)}
                    className="text-left cursor-pointer hover:text-[#F17922] transition-colors"
                  >
                    <p className="font-semibold text-gray-900 group-hover:text-[#F17922] transition-colors">
                      {campaign.name || campaign.title || "Sans titre"}
                    </p>
                    <p className="text-xs text-gray-400 truncate max-w-[200px]">
                      {campaign.body}
                    </p>
                  </button>
                </td>
                <td className="py-3.5">{getStatusBadge(campaign)}</td>
                <td className="py-3.5 text-sm text-gray-500">
                  {formatDate(campaign.sent_at ?? campaign.created_at)}
                </td>
                <td className="py-3.5 text-right">
                  <span className="font-semibold text-gray-900">
                    {campaign.total_targeted.toLocaleString("fr-FR")}
                  </span>
                </td>
                <td className="py-3.5 text-right">
                  <span className="font-semibold text-gray-900">
                    {campaign.total_sent.toLocaleString("fr-FR")}
                  </span>
                </td>
                <td className="py-3.5 pr-1">
                  <div className="flex items-center justify-end">
                    <ActionsMenu
                      campaign={campaign}
                      onView={() => setSelectedCampaign(campaign)}
                      onCancel={() => cancelCampaign(campaign.id)}
                      isCancelling={isCancelling}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Page {page} sur {totalPages} ({total} campagnes)
          </p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 cursor-pointer"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
