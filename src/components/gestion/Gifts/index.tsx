"use client";

import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";
import DashboardPageHeader from "@/components/ui/DashboardPageHeader";
import SendGiftManager from "../../../../features/reward_campaign/components/SendGiftManager";
import GiftCampaignList from "../../../../features/reward_campaign/components/GiftCampaignList";
import GiftCampaignDetail from "../../../../features/reward_campaign/components/GiftCampaignDetail";
import type { RewardCampaign } from "../../../../features/reward_campaign/types/reward-campaign.types";

type View = { mode: "list" } | { mode: "create" } | { mode: "detail"; campaign: RewardCampaign };

/**
 * Module « Cadeaux » (menu Fidélisation). Trois vues :
 *  - la LISTE des campagnes (par défaut) avec leur suivi ;
 *  - le FORMULAIRE d'envoi, ouvert par le bouton « Envoyer un cadeau » ;
 *  - le DÉTAIL d'une campagne : le cadeau + qui l'a reçu et où chacun en est.
 */
export default function GiftsModule() {
  const [view, setView] = useState<View>({ mode: "list" });

  return (
    <div className="flex-1 overflow-auto p-4 space-y-4">
      <div className="-mt-10">
        <DashboardPageHeader mode="list" title="Cadeaux" />
      </div>

      {view.mode === "list" && (
        <GiftCampaignList
          onCreate={() => setView({ mode: "create" })}
          onOpen={(campaign) => setView({ mode: "detail", campaign })}
        />
      )}

      {view.mode === "create" && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setView({ mode: "list" })}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#71717A] hover:text-[#18181B] cursor-pointer"
          >
            <ArrowLeft size={16} /> Retour aux campagnes
          </button>
          <div className="bg-white border border-[#E4E4E7] rounded-xl p-5 sm:p-6">
            <h2 className="text-[18px] font-semibold text-[#F17922] mb-5">Envoyer un cadeau</h2>
            {/* Retour automatique à la liste une fois la campagne partie. */}
            <SendGiftManager onSent={() => setView({ mode: "list" })} />
          </div>
        </div>
      )}

      {view.mode === "detail" && (
        <GiftCampaignDetail
          campaign={view.campaign}
          onBack={() => setView({ mode: "list" })}
        />
      )}
    </div>
  );
}
