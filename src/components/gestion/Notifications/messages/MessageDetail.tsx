"use client";

import React, { useState } from "react";
import { useMessageQuery } from "@/hooks/useOnesignalQuery";
import type { OnesignalMessage } from "@/types/onesignal";
import {
  ArrowLeft,
  Bell,
  Mail,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  MousePointerClick,
  Copy,
  ExternalLink,
  Smartphone,
  Monitor,
  Image as ImageIcon,
  Link as LinkIcon,
  Loader2,
} from "lucide-react";
import { toast } from "react-hot-toast";

interface Props {
  message: OnesignalMessage;
  onBack: () => void;
}

function formatDate(ts?: number) {
  if (!ts) return "—";
  return new Date(ts * 1000).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatNumber(n?: number) {
  if (n === undefined || n === null) return "—";
  return n.toLocaleString("fr-FR");
}

function getChannelInfo(msg: OnesignalMessage) {
  if (msg.target_channel === "email")
    return { icon: <Mail size={20} className="text-blue-500" />, label: "Email" };
  if (msg.target_channel === "sms")
    return { icon: <MessageSquare size={20} className="text-green-500" />, label: "SMS" };
  return { icon: <Bell size={20} className="text-[#F17922]" />, label: "Push" };
}

function getStatusBadge(msg: OnesignalMessage) {
  if (msg.canceled) {
    return (
      <span className="bg-red-50 text-red-600 text-xs px-3 py-1 rounded-full font-medium">
        Annulé
      </span>
    );
  }
  if (msg.completed_at) {
    return (
      <span className="bg-green-50 text-green-600 text-xs px-3 py-1 rounded-full font-medium">
        Livré
      </span>
    );
  }
  if (msg.remaining && msg.remaining > 0) {
    return (
      <span className="bg-yellow-50 text-yellow-600 text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1">
        <Clock size={12} /> En cours
      </span>
    );
  }
  return (
    <span className="bg-blue-50 text-blue-600 text-xs px-3 py-1 rounded-full font-medium">
      Envoyé
    </span>
  );
}

export default function MessageDetail({ message: initialMessage, onBack }: Props) {
  // Fetch fresh data from the API for detailed stats
  const { data: freshMessage, isLoading } = useMessageQuery(initialMessage.id);
  const message = freshMessage ?? initialMessage;

  const channel = getChannelInfo(message);

  const delivered = message.successful ?? 0;
  const clicked = message.converted ?? 0;
  const failed = message.failed ?? 0;
  const errored = message.errored ?? 0;
  const remaining = message.remaining ?? 0;
  const ctr = delivered > 0 ? ((clicked / delivered) * 100).toFixed(2) : "0.00";

  const copyMessageId = () => {
    navigator.clipboard.writeText(message.id);
    toast.success("ID copié dans le presse-papiers");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4 cursor-pointer"
        >
          <ArrowLeft size={16} />
          Retour aux messages
        </button>

        <div className="flex items-center gap-3">
          {channel.icon}
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-gray-900">
                {message.name || message.headings?.en || message.headings?.fr || "Notification"}
              </h3>
              {getStatusBadge(message)}
              {isLoading && <Loader2 size={16} className="animate-spin text-gray-400" />}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              {channel.label} &middot; Envoyé le {formatDate(message.queued_at || message.send_after)}
            </p>
          </div>
        </div>
      </div>

      {/* ── Top Stats Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 font-medium mb-1">Livrés</p>
          <p className="text-2xl font-bold text-gray-900">{formatNumber(delivered)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 font-medium mb-1">Taux de clic (CTR)</p>
          <p className="text-2xl font-bold text-gray-900">
            {ctr}%
            <span className="text-sm font-normal text-gray-400 ml-1.5">
              ({formatNumber(clicked)} clics)
            </span>
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 font-medium mb-1">Échoués</p>
          <p className="text-2xl font-bold text-gray-900">{formatNumber(failed)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 font-medium mb-1">Restants</p>
          <p className="text-2xl font-bold text-gray-900">{formatNumber(remaining)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left Column: Stats & Settings ────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Delivery Statistics */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">
              Statistiques de livraison
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-gray-400" />
                  <span className="text-sm text-gray-600">Audience</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {formatNumber(delivered + failed + errored)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-green-500" />
                  <span className="text-sm text-gray-600">Livrés</span>
                </div>
                <span className="text-sm font-medium text-green-600">
                  {formatNumber(delivered)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MousePointerClick size={14} className="text-[#F17922]" />
                  <span className="text-sm text-gray-600">Cliqués</span>
                </div>
                <span className="text-sm font-medium text-[#F17922]">
                  {formatNumber(clicked)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle size={14} className="text-red-500" />
                  <span className="text-sm text-gray-600">Échoués</span>
                </div>
                <span className="text-sm font-medium text-red-500">
                  {formatNumber(failed)}
                </span>
              </div>
              {errored > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <XCircle size={14} className="text-orange-500" />
                    <span className="text-sm text-gray-600">Erreurs</span>
                  </div>
                  <span className="text-sm font-medium text-orange-500">
                    {formatNumber(errored)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-yellow-500" />
                  <span className="text-sm text-gray-600">Restants</span>
                </div>
                <span className="text-sm font-medium text-gray-500">
                  {formatNumber(remaining)}
                </span>
              </div>

              {/* Delivery progress bar */}
              {delivered > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (delivered / (delivered + failed + remaining)) * 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1.5">
                    {((delivered / (delivered + failed + remaining || 1)) * 100).toFixed(1)}% livrés
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Platform Statistics */}
          {(message.isAndroid || message.isIos || message.isChrome || message.isSafari) && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h4 className="text-sm font-semibold text-gray-900 mb-4">
                Plateformes
              </h4>
              <div className="space-y-3">
                {message.isAndroid && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone size={14} className="text-green-600" />
                      <span className="text-sm text-gray-600">Google Android</span>
                    </div>
                    <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">
                      Activé
                    </span>
                  </div>
                )}
                {message.isIos && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone size={14} className="text-gray-600" />
                      <span className="text-sm text-gray-600">Apple iOS</span>
                    </div>
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                      Activé
                    </span>
                  </div>
                )}
                {message.isChrome && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Monitor size={14} className="text-blue-500" />
                      <span className="text-sm text-gray-600">Chrome Web</span>
                    </div>
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                      Activé
                    </span>
                  </div>
                )}
                {message.isSafari && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Monitor size={14} className="text-blue-400" />
                      <span className="text-sm text-gray-600">Safari</span>
                    </div>
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                      Activé
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Message Settings */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">
              Paramètres du message
            </h4>

            <div className="space-y-4">
              {/* Details */}
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                  Détails
                </p>
                <div className="space-y-2">
                  {message.name && (
                    <div className="flex items-start gap-3">
                      <span className="text-sm text-gray-500 min-w-[120px]">Nom</span>
                      <span className="text-sm text-gray-900 font-medium">{message.name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 min-w-[120px]">Message ID</span>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700 font-mono">
                        {message.id}
                      </code>
                      <button
                        onClick={copyMessageId}
                        className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 cursor-pointer"
                        title="Copier l'ID"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Audience */}
              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                  Audience
                </p>
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <span className="text-sm text-gray-500 min-w-[120px]">Destinataires</span>
                    <span className="text-sm text-gray-900">{formatNumber(delivered + failed + errored)}</span>
                  </div>
                  {message.included_segments && message.included_segments.length > 0 && (
                    <div className="flex items-start gap-3">
                      <span className="text-sm text-gray-500 min-w-[120px]">Segments</span>
                      <div className="flex flex-wrap gap-1.5">
                        {message.included_segments.map((seg) => (
                          <span
                            key={seg}
                            className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full"
                          >
                            {seg}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {message.excluded_segments && message.excluded_segments.length > 0 && (
                    <div className="flex items-start gap-3">
                      <span className="text-sm text-gray-500 min-w-[120px]">Exclus</span>
                      <div className="flex flex-wrap gap-1.5">
                        {message.excluded_segments.map((seg) => (
                          <span
                            key={seg}
                            className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full"
                          >
                            {seg}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Schedule */}
              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                  Planification
                </p>
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <span className="text-sm text-gray-500 min-w-[120px]">Début d&apos;envoi</span>
                    <span className="text-sm text-gray-900">
                      {formatDate(message.queued_at || message.send_after)}
                    </span>
                  </div>
                  {message.completed_at && (
                    <div className="flex items-start gap-3">
                      <span className="text-sm text-gray-500 min-w-[120px]">Terminé le</span>
                      <span className="text-sm text-gray-900">{formatDate(message.completed_at)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Message Content */}
              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                  Contenu
                </p>
                <div className="space-y-2">
                  {message.headings && (
                    <div className="flex items-start gap-3">
                      <span className="text-sm text-gray-500 min-w-[120px]">Titre</span>
                      <span className="text-sm text-gray-900">
                        {message.headings.fr || message.headings.en || "—"}
                      </span>
                    </div>
                  )}
                  {message.contents && (
                    <div className="flex items-start gap-3">
                      <span className="text-sm text-gray-500 min-w-[120px]">Message</span>
                      <span className="text-sm text-gray-900">
                        {message.contents.fr || message.contents.en || "—"}
                      </span>
                    </div>
                  )}
                  {message.url && (
                    <div className="flex items-start gap-3">
                      <span className="text-sm text-gray-500 min-w-[120px]">URL</span>
                      <a
                        href={message.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1 break-all"
                      >
                        {message.url}
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  )}
                  {message.big_picture && (
                    <div className="flex items-start gap-3">
                      <span className="text-sm text-gray-500 min-w-[120px]">Image</span>
                      <a
                        href={message.big_picture}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1 break-all"
                      >
                        <ImageIcon size={12} />
                        Voir l&apos;image
                      </a>
                    </div>
                  )}
                  {message.template_id && (
                    <div className="flex items-start gap-3">
                      <span className="text-sm text-gray-500 min-w-[120px]">Template</span>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700 font-mono">
                        {message.template_id}
                      </code>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Column: Preview ────────────────────────────────────── */}
        <div className="space-y-6">
          {/* Push notification preview */}
          {message.target_channel !== "email" && message.target_channel !== "sms" && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h4 className="text-sm font-semibold text-gray-900 mb-4">
                Aperçu
              </h4>
              {/* Phone mockup */}
              <div className="bg-gray-50 rounded-2xl p-4 flex justify-center">
                <div className="w-[260px]">
                  {/* Mini phone frame */}
                  <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
                    {/* Status bar */}
                    <div className="bg-gray-100 px-4 py-2 flex items-center justify-center">
                      <div className="w-16 h-1 bg-gray-300 rounded-full" />
                    </div>
                    {/* Notification card */}
                    <div className="p-3">
                      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3">
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 bg-[#F17922] rounded-lg flex items-center justify-center flex-shrink-0">
                            <Bell size={14} className="text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-900 truncate">
                              {message.headings?.fr || message.headings?.en || "Notification"}
                            </p>
                            <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-3">
                              {message.contents?.fr || message.contents?.en || "—"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Image preview */}
                    {message.big_picture && (
                      <div className="px-3 pb-3">
                        <img
                          src={message.big_picture}
                          alt="Notification image"
                          className="w-full rounded-xl object-cover max-h-[150px]"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">
              Actions rapides
            </h4>
            <div className="space-y-2">
              <button
                onClick={copyMessageId}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-all text-left"
              >
                <Copy size={16} className="text-gray-400" />
                Copier l&apos;ID du message
              </button>
              <a
                href={`https://dashboard.onesignal.com`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-all"
              >
                <ExternalLink size={16} className="text-gray-400" />
                Ouvrir dans OneSignal
              </a>
            </div>
          </div>

          {/* Additional Data */}
          {message.data && Object.keys(message.data).length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                Données additionnelles
              </h4>
              <div className="bg-gray-50 rounded-lg p-3">
                <pre className="text-xs text-gray-700 font-mono whitespace-pre-wrap break-all">
                  {JSON.stringify(message.data, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
