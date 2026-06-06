"use client";

import DynamicModuleLoader from "@/components/gestion/DynamicModuleLoader";

export default function GestionPage() {
  return (
    <main
      className={
        "flex-1 overflow-y-auto container mx-auto " +
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
