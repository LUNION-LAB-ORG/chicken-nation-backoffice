"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  useMessagesQuery,
  useCancelMessageMutation,
} from "@/hooks/useOnesignalQuery";
import type { OnesignalMessage } from "@/types/onesignal";
import {
  Bell,
  Mail,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Send,
  Eye,
  MoreVertical,
  Copy,
  XCircle,
  Trash2,
  BarChart3,
} from "lucide-react";
import { toast } from "react-hot-toast";
import MessageDetail from "./MessageDetail";

interface Props {
  searchQuery: string;
}

function getChannelIcon(msg: OnesignalMessage) {
  if (msg.target_channel === "email")
    return <Mail size={18} className="text-blue-500" />;
  if (msg.target_channel === "sms")
    return <MessageSquare size={18} className="text-green-500" />;
  return <Bell size={18} className="text-[#F17922]" />;
}

function formatDate(ts?: number) {
  if (!ts) return "—";
  return new Date(ts * 1000).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getStatusBadge(msg: OnesignalMessage) {
  if (msg.canceled) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-red-50 text-red-600 border border-red-100">
        Annulé
      </span>
    );
  }
  if (msg.completed_at) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-green-50 text-green-700 border border-green-100">
        Delivered
      </span>
    );
  }
  if (msg.remaining && msg.remaining > 0) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-100">
        En cours
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100">
      Envoyé
    </span>
  );
}

function computeCTR(msg: OnesignalMessage): string {
  const delivered = msg.successful ?? 0;
  const clicked = msg.converted ?? 0;
  if (delivered === 0) return "0.00%";
  return ((clicked / delivered) * 100).toFixed(2) + "%";
}

// ── Actions dropdown ─────────────────────────────────────────────────────────

function ActionsMenu({
  msg,
  onView,
  onCancel,
  isCancelling,
}: {
  msg: OnesignalMessage;
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
    navigator.clipboard.writeText(msg.id);
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
            Copier l&apos;ID message
          </button>
          {!msg.canceled && !msg.completed_at && (
            <>
              <div className="border-t border-gray-100 my-1" />
              <button
                onClick={() => {
                  if (confirm("Annuler cette notification ?")) {
                    onCancel();
                  }
                  setOpen(false);
                }}
                disabled={isCancelling}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer disabled:opacity-50"
              >
                <XCircle size={15} />
                Annuler l&apos;envoi
              </button>
            </>
          )}
          {msg.completed_at && (
            <>
              <div className="border-t border-gray-100 my-1" />
              <button
                onClick={() => {
                  setOpen(false);
                  toast("La suppression de messages livrés n'est pas supportée par l'API OneSignal", {
                    icon: "ℹ️",
                  });
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-400 cursor-not-allowed"
              >
                <Trash2 size={15} />
                <span>Supprimer</span>
                <span className="ml-auto text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                  N/A
                </span>
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
  const [offset, setOffset] = useState(0);
  const limit = 20;
  const [selectedMessage, setSelectedMessage] =
    useState<OnesignalMessage | null>(null);

  const { data, isLoading, error } = useMessagesQuery({ limit, offset });
  const { mutate: cancelMessage, isPending: isCancelling } =
    useCancelMessageMutation();

  const messages = data?.notifications ?? [];
  const totalCount = data?.total_count ?? 0;

  const filtered = searchQuery
    ? messages.filter(
        (m) =>
          m.contents?.en?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.contents?.fr?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.headings?.en?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.headings?.fr?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;

  if (selectedMessage) {
    return (
      <MessageDetail
        message={selectedMessage}
        onBack={() => setSelectedMessage(null)}
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
          Erreur lors du chargement des messages : {error.message}
        </p>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Send size={28} className="text-gray-400" />
        </div>
        <p className="text-gray-500 text-sm">Aucun message envoyé</p>
        <p className="text-gray-400 text-xs mt-1">
          Envoyez votre première notification
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-100">
              <th className="pb-3 font-medium pl-1">Type</th>
              <th className="pb-3 font-medium">Nom</th>
              <th className="pb-3 font-medium">Statut</th>
              <th className="pb-3 font-medium">Envoyé le</th>
              <th className="pb-3 font-medium text-right">Envoyés</th>
              <th className="pb-3 font-medium text-right">CTR</th>
              <th className="pb-3 font-medium text-right pr-1">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((msg) => (
              <tr
                key={msg.id}
                className="hover:bg-gray-50/50 group"
              >
                {/* Type icon */}
                <td className="py-3.5 pl-1">
                  <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                    {getChannelIcon(msg)}
                  </div>
                </td>

                {/* Name */}
                <td className="py-3.5">
                  <button
                    onClick={() => setSelectedMessage(msg)}
                    className="text-left cursor-pointer hover:text-[#F17922] transition-colors"
                  >
                    <p className="font-semibold text-gray-900 group-hover:text-[#F17922] transition-colors">
                      {msg.name ||
                        msg.headings?.fr ||
                        msg.headings?.en ||
                        "Sans titre"}
                    </p>
                  </button>
                </td>

                {/* Status badge */}
                <td className="py-3.5">{getStatusBadge(msg)}</td>

                {/* Sent at */}
                <td className="py-3.5 text-sm text-gray-500">
                  {formatDate(msg.queued_at || msg.send_after)}
                </td>

                {/* Sent count */}
                <td className="py-3.5 text-right">
                  <span className="font-semibold text-gray-900">
                    {msg.successful?.toLocaleString("fr-FR") ?? "—"}
                  </span>
                </td>

                {/* CTR */}
                <td className="py-3.5 text-right">
                  <span className="font-semibold text-gray-900">
                    {computeCTR(msg)}
                  </span>
                </td>

                {/* Actions menu */}
                <td className="py-3.5 pr-1">
                  <div className="flex items-center justify-end">
                    <ActionsMenu
                      msg={msg}
                      onView={() => setSelectedMessage(msg)}
                      onCancel={() => cancelMessage(msg.id)}
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
      {totalCount > limit && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            {offset + 1}–{Math.min(offset + limit, totalCount)} sur{" "}
            {totalCount}
          </p>
          <div className="flex gap-2">
            <button
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - limit))}
              className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              disabled={offset + limit >= totalCount}
              onClick={() => setOffset(offset + limit)}
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
