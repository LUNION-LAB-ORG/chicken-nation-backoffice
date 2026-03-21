"use client";

import React from "react";
import { usePushUserDetailQuery } from "@/hooks/usePushCampaignQuery";
import type { PushUser } from "@/types/push-campaign";
import {
  X,
  Loader2,
  Smartphone,
  Crown,
  ShoppingBag,
  MapPin,
  Phone,
  Mail,
  Star,
  AlertTriangle,
} from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: PushUser;
}

const LOYALTY_COLORS: Record<string, { bg: string; text: string }> = {
  GOLD: { bg: "bg-yellow-100", text: "text-yellow-700" },
  PREMIUM: { bg: "bg-purple-100", text: "text-purple-700" },
  STANDARD: { bg: "bg-gray-100", text: "text-gray-600" },
};

export default function UserDetailModal({ isOpen, onClose, user }: Props) {
  const { data: detail, isLoading, error } = usePushUserDetailQuery(user.customer_id);

  if (!isOpen) return null;

  const name = [user.customer.first_name, user.customer.last_name]
    .filter(Boolean)
    .join(" ") || "Sans nom";

  const loyalty = detail?.customer?.loyalty_level ?? user.customer.loyalty_level ?? "STANDARD";
  const colors = LOYALTY_COLORS[loyalty] ?? LOYALTY_COLORS.STANDARD;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FFF3E8] rounded-full flex items-center justify-center text-[#F17922] font-bold">
              {(user.customer.first_name?.[0] ?? "?").toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{name}</h2>
              <p className="text-xs text-gray-400">
                Inscrit le{" "}
                {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(
                  new Date(user.customer.created_at)
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Info Cards */}
        <div className="px-6 py-3 bg-gray-50 grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <Phone size={14} className="text-gray-400" />
            <span className="text-xs text-gray-600">{user.customer.phone}</span>
          </div>
          {detail?.customer?.email && (
            <div className="flex items-center gap-2">
              <Mail size={14} className="text-gray-400" />
              <span className="text-xs text-gray-600">{detail.customer.email}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Crown size={14} className="text-gray-400" />
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${colors.bg} ${colors.text}`}
            >
              {loyalty}
            </span>
          </div>
          {detail?.customer?.addresses?.[0]?.city && (
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-gray-400" />
              <span className="text-xs text-gray-600">
                {detail.customer.addresses[0].city}
              </span>
            </div>
          )}
          {detail?.customer?.total_points !== undefined && (
            <div className="flex items-center gap-2">
              <Star size={14} className="text-gray-400" />
              <span className="text-xs text-gray-600">
                {detail.customer.total_points} points
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto px-6 py-4 space-y-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-[#F17922]" size={24} />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertTriangle size={24} className="text-amber-500 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                Impossible de charger les détails
              </p>
            </div>
          ) : (
            <>
              {/* Push Token */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Token Push
                </h3>
                <div className="border border-gray-100 rounded-xl p-3 flex items-center gap-3">
                  <Smartphone size={16} className="text-gray-400" />
                  <div className="flex-1 min-w-0">
                    {detail?.expo_push_token ? (
                      <p className="text-xs font-mono text-gray-600 truncate">
                        {detail.expo_push_token}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400">Aucun token enregistré</p>
                    )}
                  </div>
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      detail?.push ? "bg-green-500" : "bg-gray-300"
                    }`}
                  />
                </div>
              </div>

              {/* Preferences */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Préférences
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Push", enabled: detail?.push },
                    { label: "Promotions", enabled: detail?.promotions },
                    { label: "Système", enabled: detail?.system },
                  ].map((pref) => (
                    <div
                      key={pref.label}
                      className="border border-gray-100 rounded-xl p-2.5 text-center"
                    >
                      <span
                        className={`inline-block w-2 h-2 rounded-full mb-1 ${
                          pref.enabled ? "bg-green-500" : "bg-gray-300"
                        }`}
                      />
                      <p className="text-[11px] text-gray-600">{pref.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Orders */}
              {detail?.customer?.orders && detail.customer.orders.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    <ShoppingBag size={12} className="inline mr-1" />
                    Dernières commandes ({detail.customer.orders.length})
                  </h3>
                  <div className="space-y-1.5">
                    {detail.customer.orders.slice(0, 5).map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between border border-gray-50 rounded-lg px-3 py-2"
                      >
                        <span className="text-xs text-gray-500">
                          {order.completed_at
                            ? new Intl.DateTimeFormat("fr-FR", {
                                dateStyle: "medium",
                              }).format(new Date(order.completed_at))
                            : "En cours"}
                        </span>
                        <span className="text-xs font-semibold text-gray-700">
                          {order.amount.toLocaleString("fr-FR")} FCFA
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-6 py-3 flex items-center justify-end bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs font-medium cursor-pointer transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
