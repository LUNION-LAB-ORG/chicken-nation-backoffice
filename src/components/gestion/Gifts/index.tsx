"use client";

import React from "react";
import DashboardPageHeader from "@/components/ui/DashboardPageHeader";
import SendGiftManager from "../../../../features/reward_campaign/components/SendGiftManager";

/**
 * Module « Cadeaux » (menu Fidélisation) : campagnes « Envoyer un cadeau »
 * (bons, plats, suppléments, codes promo à gratter) + suivi de leur impact.
 */
export default function GiftsModule() {
  return (
    <div className="flex-1 overflow-auto p-4 space-y-4">
      <div className="-mt-10">
        <DashboardPageHeader mode="list" title="Cadeaux" />
      </div>
      <SendGiftManager />
    </div>
  );
}
