"use client";

import DynamicModuleLoader from "@/components/gestion/DynamicModuleLoader";

export default function GestionPage() {
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
