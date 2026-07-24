"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Gift, Tag, Ticket, Users } from "lucide-react";
import { getCampaignRecipients } from "../services/reward-campaign.service";
import { formatImageUrl } from "@/utils/imageHelpers";
import type {
  RecipientStatus,
  RewardCampaign,
  RewardCampaignType,
} from "../types/reward-campaign.types";

const TYPE_META: Record<RewardCampaignType, { label: string; icon: React.ElementType }> = {
  GIFT: { label: "Cadeau", icon: Gift },
  VOUCHER: { label: "Bon d'achat", icon: Ticket },
  PROMO_CODE: { label: "Code promo", icon: Tag },
};

/** Le statut d'un destinataire raconte OÙ il en est, pas juste son état brut. */
const RECIPIENT_STATUS: Record<RecipientStatus, { label: string; cls: string }> = {
  PENDING: { label: "Pas encore gratté", cls: "bg-[#FEF3C7] text-[#92400E]" },
  SCRATCHED: { label: "Gratté — à utiliser", cls: "bg-[#E7F0FB] text-[#2B6CB0]" },
  CONSUMED: { label: "Utilisé", cls: "bg-[#E6F4EC] text-[#1E8E5A]" },
  REVOKED: { label: "Annulé", cls: "bg-[#EEF1F4] text-[#6C757D]" },
};

const fmt = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "—";

/**
 * Détail d'une campagne : le cadeau envoyé, et la liste NOMINATIVE des
 * destinataires avec l'avancement de chacun (gratté ? utilisé ?).
 */
export default function GiftCampaignDetail({
  campaign,
  onBack,
}: {
  campaign: RewardCampaign;
  onBack: () => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["reward-campaign-recipients", campaign.id],
    queryFn: () => getCampaignRecipients(campaign.id),
  });

  const meta = TYPE_META[campaign.type] ?? TYPE_META.GIFT;
  const Icon = meta.icon;
  const payload = (campaign.payload ?? {}) as {
    name?: string;
    label?: string;
    price?: number;
    amount?: number;
    code?: string;
    image?: string;
    item_type?: string;
  };
  const itemName = payload.label ?? payload.name ?? payload.code;
  const recipients = data?.recipients ?? [];

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-medium text-[#71717A] hover:text-[#18181B] cursor-pointer"
      >
        <ArrowLeft size={16} /> Retour aux campagnes
      </button>

      {/* Le cadeau envoyé */}
      <div className="bg-white border border-[#E4E4E7] rounded-xl p-5 sm:p-6">
        <div className="flex items-start gap-4">
          {payload.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={formatImageUrl(payload.image)} alt="" className="h-16 w-16 rounded-xl object-cover" />
          ) : (
            <div className="h-16 w-16 rounded-xl bg-[#FFF6E9] flex items-center justify-center shrink-0">
              <Icon size={26} className="text-[#F17922]" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-[#18181B]">{campaign.name}</h2>
            <p className="text-sm text-[#71717A] mt-0.5">
              {meta.label}
              {itemName ? ` · ${itemName}` : ""}
              {payload.item_type === "SUPPLEMENT" ? " (supplément)" : ""}
              {payload.amount ? ` · ${payload.amount.toLocaleString("fr-FR")} FCFA` : ""}
            </p>
            <p className="text-xs text-[#9796A1] mt-1">
              Envoyée le {fmt(campaign.sent_at ?? campaign.created_at)}
              {campaign.expires_at ? ` · expire le ${fmt(campaign.expires_at)}` : ""}
            </p>
          </div>
        </div>

        {/* Capping : la raison n°1 d'un « je n'ai rien reçu ». */}
        {data && data.skipped_capping > 0 && (
          <div className="mt-4 rounded-lg bg-[#FFF7ED] border border-[#FCD9A8] px-3.5 py-2.5 text-[13px] text-[#9A5B12]">
            <strong>{data.skipped_capping} client(s) n&apos;ont RIEN reçu</strong> : ils avaient déjà
            reçu un cadeau de campagne récemment (capping anti-fatigue). Pour passer outre, cochez
            « Ignorer le capping anti-fatigue » à l&apos;envoi.
          </div>
        )}
      </div>

      {/* Destinataires */}
      <div className="bg-white border border-[#E4E4E7] rounded-xl p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users size={18} className="text-[#F17922]" />
          <h3 className="text-[16px] font-semibold text-[#18181B]">
            Destinataires {data ? `(${data.total})` : ""}
          </h3>
        </div>

        {isLoading ? (
          <div className="text-sm text-[#9796A1] py-6 text-center">Chargement…</div>
        ) : recipients.length === 0 ? (
          <div className="text-sm text-[#9796A1] py-8 text-center">
            Aucun cadeau distribué pour cette campagne.
            {data && data.skipped_capping > 0
              ? " Tous les clients ciblés ont été écartés par le capping."
              : ""}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-[#9796A1] border-b border-[#F1F3F5]">
                  <th className="py-2 pr-3 font-medium">Client</th>
                  <th className="py-2 px-3 font-medium">Statut</th>
                  <th className="py-2 px-3 font-medium">Gratté le</th>
                  <th className="py-2 pl-3 font-medium">Utilisé le</th>
                </tr>
              </thead>
              <tbody>
                {recipients.map((r) => {
                  const badge = RECIPIENT_STATUS[r.status] ?? RECIPIENT_STATUS.PENDING;
                  return (
                    <tr key={r.reward_id} className="border-b border-[#F7F7F8] last:border-0">
                      <td className="py-3 pr-3">
                        <div className="font-medium text-[#18181B]">{r.fullname ?? "—"}</div>
                        <div className="text-xs text-[#9796A1]">{r.phone ?? "—"}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.cls}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#71717A]">{fmt(r.scratched_at)}</td>
                      <td className="py-3 pl-3 text-[#71717A]">{fmt(r.consumed_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
