"use client";

import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Ban, ChevronRight, Gift, Plus, Tag, Ticket } from "lucide-react";
import {
  listRewardCampaigns,
  cancelRewardCampaign,
} from "../services/reward-campaign.service";
import type { RewardCampaign, RewardCampaignType } from "../types/reward-campaign.types";

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  scheduled: { label: "Programmée", cls: "bg-[#E7F0FB] text-[#2B6CB0]" },
  sending: { label: "Envoi…", cls: "bg-[#FEF3C7] text-[#92400E]" },
  sent: { label: "Envoyée", cls: "bg-[#E6F4EC] text-[#1E8E5A]" },
  cancelled: { label: "Annulée", cls: "bg-[#EEF1F4] text-[#6C757D]" },
  failed: { label: "Échec", cls: "bg-[#FDECEA] text-[#C0392B]" },
};

const TYPE_META: Record<RewardCampaignType, { label: string; icon: React.ElementType }> = {
  GIFT: { label: "Cadeau", icon: Gift },
  VOUCHER: { label: "Bon d'achat", icon: Ticket },
  PROMO_CODE: { label: "Code promo", icon: Tag },
};

const money = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} FCFA`;
const pct = (part: number, whole: number) =>
  whole > 0 ? `${Math.round((part / whole) * 100)}%` : null;

const Stat = ({
  label,
  value,
  sub,
  color = "#18181B",
}: {
  label: string;
  value: React.ReactNode;
  sub?: string | null;
  color?: string;
}) => (
  <div className="rounded-lg bg-[#FAFAFA] py-2 px-2 text-center">
    <div className="text-[10px] uppercase tracking-wide text-[#9796A1]">{label}</div>
    <div className="text-base font-bold" style={{ color }}>
      {value}
    </div>
    <div className="text-[9px] text-[#9796A1] leading-none mt-0.5 min-h-[10px]">{sub ?? ""}</div>
  </div>
);

/**
 * Vue par DÉFAUT du module Cadeaux : la liste des campagnes envoyées, avec leur
 * suivi. L'envoi d'un nouveau cadeau se fait via le bouton (formulaire dédié),
 * et chaque campagne s'ouvre sur son détail — qui a reçu quoi, et où ils en sont.
 */
export default function GiftCampaignList({
  onCreate,
  onOpen,
}: {
  onCreate: () => void;
  onOpen: (campaign: RewardCampaign) => void;
}) {
  const qc = useQueryClient();
  const campaignsQuery = useQuery({
    queryKey: ["reward-campaigns"],
    queryFn: listRewardCampaigns,
  });

  const cancelMut = useMutation({
    mutationFn: cancelRewardCampaign,
    onSuccess: () => {
      toast.success("Campagne annulée");
      qc.invalidateQueries({ queryKey: ["reward-campaigns"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const campaigns = campaignsQuery.data ?? [];

  return (
    <div className="bg-white border border-[#E4E4E7] rounded-xl p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-[18px] font-semibold text-[#F17922]">Campagnes de cadeaux</h2>
          <p className="text-sm text-[#9796A1] mt-0.5">
            Qui a été ciblé, qui a gratté, qui a utilisé son cadeau.
          </p>
        </div>
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-[#F17922] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#d96a1c] cursor-pointer shrink-0"
        >
          <Plus size={16} /> Envoyer un cadeau
        </button>
      </div>

      {campaignsQuery.isLoading ? (
        <div className="text-sm text-[#9796A1] py-8 text-center">Chargement…</div>
      ) : campaigns.length === 0 ? (
        <div className="py-12 text-center">
          <Gift size={36} className="mx-auto text-[#D9D9D9]" />
          <p className="text-sm text-[#9796A1] mt-3">Aucune campagne pour le moment.</p>
          <button
            type="button"
            onClick={onCreate}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#F17922] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#d96a1c] cursor-pointer"
          >
            <Plus size={16} /> Envoyer un premier cadeau
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {campaigns.map((c) => {
            const badge = STATUS_BADGE[c.status] ?? STATUS_BADGE.sent;
            const meta = TYPE_META[c.type] ?? TYPE_META.GIFT;
            const Icon = meta.icon;
            const itemName = (c.payload as { name?: string; label?: string } | null)?.label
              ?? (c.payload as { name?: string } | null)?.name;

            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onOpen(c)}
                className="text-left border border-[#F1F3F5] rounded-xl p-4 hover:border-[#F17922]/40 hover:shadow-sm transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-[#FFF6E9] flex items-center justify-center shrink-0">
                      <Icon size={18} className="text-[#F17922]" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[#18181B] truncate">{c.name}</div>
                      <div className="text-[11px] text-[#9796A1] truncate">
                        {meta.label}
                        {itemName ? ` · ${itemName}` : ""}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.cls}`}>
                      {badge.label}
                    </span>
                    <ChevronRight size={16} className="text-[#C9CBCF]" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3">
                  <Stat label="Ciblés" value={c.total_targeted} />
                  <Stat
                    label="Grattés"
                    value={c.scratched_count}
                    sub={pct(c.scratched_count, c.total_targeted)}
                    color="#F17922"
                  />
                  <Stat
                    label="Utilisés"
                    value={c.redeemed_count == null ? "—" : c.redeemed_count}
                    sub={
                      c.redeemed_count == null ? "non suivi" : pct(c.redeemed_count, c.scratched_count)
                    }
                    color="#1E8E5A"
                  />
                </div>

                {c.revenue != null && (
                  <div className="flex items-center justify-between rounded-lg bg-[#F4FAF6] px-2.5 py-1.5 mt-2 text-[11px]">
                    <span className="text-[#71717A]">
                      CA généré : <strong className="text-[#1E8E5A]">{money(c.revenue)}</strong>
                    </span>
                    <span className="text-[#71717A]">
                      Coût :{" "}
                      <strong className="text-[#C0392B]">{money(c.discount_cost ?? 0)}</strong>
                    </span>
                  </div>
                )}

                {/* Capping : l'explication la plus fréquente d'un « rien reçu ». */}
                {c.target_config?.skipped_capping ? (
                  <div className="mt-2 rounded-lg bg-[#FFF7ED] px-2.5 py-1.5 text-[10px] text-[#9A5B12]">
                    {c.target_config.skipped_capping} client(s) écarté(s) — capping anti-fatigue
                    (déjà gâtés récemment)
                  </div>
                ) : null}

                {c.status === "scheduled" && c.scheduled_at && (
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[11px] text-[#2B6CB0]">
                      Prévu le {new Date(c.scheduled_at).toLocaleString("fr-FR")}
                    </span>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        cancelMut.mutate(c.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.stopPropagation();
                          cancelMut.mutate(c.id);
                        }
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-[#C0392B] hover:underline cursor-pointer"
                    >
                      <Ban size={12} /> Annuler
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
