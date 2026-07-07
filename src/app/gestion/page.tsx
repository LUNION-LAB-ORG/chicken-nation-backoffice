"use client";

import { useEffect } from "react";
import DynamicModuleLoader from "@/components/gestion/DynamicModuleLoader";
import { useDashboardStore } from "@/store/dashboardStore";

export default function GestionPage() {
  const openInboxConversation = useDashboardStore((s) => s.openInboxConversation);

  // Deep-link : un lien d'email (ou de push) du type
  // /gestion?module=inbox&conversation=<id> ouvre directement la conversation.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const conversation = params.get("conversation");
    if (conversation) {
      openInboxConversation(conversation);
      // Nettoie l'URL pour ne pas rouvrir la conversation au prochain rendu.
      const url = new URL(window.location.href);
      url.searchParams.delete("conversation");
      url.searchParams.delete("module");
      window.history.replaceState({}, "", url.toString());
    }
  }, [openInboxConversation]);

  return (
    <main
      className={
        // Largeur quasi pleine (plafond 1800px sur très grands écrans) au lieu du
        // `container` Tailwind qui laissait beaucoup de vide de part et d'autre.
        "flex-1 overflow-y-auto w-full max-w-[1800px] mx-auto " +
        // Décale sous l'app-bar (mobile, + safe-area) ou le header fixe (desktop)
        "pt-[calc(3.5rem+env(safe-area-inset-top))] md:pt-14 " +
        // Dégage la barre d'onglets mobile (+ safe-area) ; aucun padding sur desktop
        "pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0"
      }
    >
      <DynamicModuleLoader />
    </main>
  );
}
