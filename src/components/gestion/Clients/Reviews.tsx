"use client";

import DashboardPageHeader from "@/components/ui/DashboardPageHeader";
import { useDashboardStore } from "@/store/dashboardStore";
import { GlobalReviews } from "../../../../features/customer/components/GlobalReviews";
import { FicheRetour } from "../../../../features/comments/components/retours/FicheRetour";
import { RetoursPrives } from "../../../../features/comments/components/retours/RetoursPrives";
import { useAvisSocketSync } from "../../../../features/comments/hooks/useAvisSocketSync";
import { useCompteursAvisQuery } from "../../../../features/comments/queries/avis-prive.query";
import { pastilleOnglet } from "../../../../features/comments/utils/avis-prive";
import { useAuthStore } from "../../../../features/users/hook/authStore";
import { Action, Modules } from "../../../../features/users/types/auth.type";

/**
 * Module « Notes et avis ». Deux onglets sous l'en-tête (02/11) :
 *  - « Notes après commande » : l'écran d'origine, inchangé ;
 *  - « Retours privés » : les avis de la page « Ton avis compte » du site
 *    (liste, puis fiche quand `reviews.view === 'view'`), avec la pastille
 *    des avis à traiter.
 * La cloche ouvre une fiche par `openAvis` du tableau de bord.
 */

type Vue = "notes" | "retours";

const VUES: { cle: Vue; libelle: string }[] = [
  { cle: "notes", libelle: "Notes après commande" },
  { cle: "retours", libelle: "Retours privés" },
];

export default function Reviews() {
  const vue: Vue = useDashboardStore((s) => (s.reviews.filters?.vue === "retours" ? "retours" : "notes"));
  const view = useDashboardStore((s) => s.reviews.view);
  const selectedItem = useDashboardStore((s) => s.reviews.selectedItem);
  const setFilter = useDashboardStore((s) => s.setFilter);
  const setSectionView = useDashboardStore((s) => s.setSectionView);
  const setSelectedItem = useDashboardStore((s) => s.setSelectedItem);
  const peutLireRetours = useAuthStore((s) => s.can(Modules.COMMENTAIRES, Action.READ));

  const { data: compteurs } = useCompteursAvisQuery(undefined, peutLireRetours);
  useAvisSocketSync();
  const pastille = pastilleOnglet(compteurs?.a_traiter);

  const vueActive: Vue = peutLireRetours ? vue : "notes";
  const avisId = vueActive === "retours" && view === "view" && typeof selectedItem === "string" ? selectedItem : null;

  const choisirVue = (v: Vue) => {
    setFilter("reviews", "vue", v);
    setSectionView("reviews", "list");
  };
  const ouvrirAvis = (id: string) => {
    setSelectedItem("reviews", id);
    setSectionView("reviews", "view");
  };
  const retourListe = () => setSectionView("reviews", "list");

  return (
    <div className="flex-1 overflow-auto p-4 space-y-6">
      <div className="-mt-10">
        <DashboardPageHeader
          mode="list"
          title="Notes et Avis"
          subtitle="Avis et commentaires des clients"
        />
      </div>
      {peutLireRetours && (
        <div
          role="tablist"
          className="flex w-fit items-center rounded-[12px] bg-[#f4f4f5] px-2"
          style={{ minHeight: 40 }}
        >
          {VUES.map((v, idx) => {
            const actif = vueActive === v.cle;
            return (
              <button
                key={v.cle}
                type="button"
                role="tab"
                aria-selected={actif}
                onClick={() => choisirVue(v.cle)}
                className={`inline-flex items-center gap-2 whitespace-nowrap rounded-[12px] px-5 py-1 text-[11px] font-bold transition-colors focus:outline-none lg:text-[14px] ${
                  actif ? "bg-[#F17922] text-white" : "bg-transparent font-normal text-[#71717A]"
                } ${idx === 0 ? "" : "ml-1"}`}
                style={{ minWidth: 75, height: 30 }}
              >
                {v.libelle}
                {v.cle === "retours" && pastille && (
                  <span
                    className={`rounded-full px-1.5 text-[11px] font-bold leading-[18px] ${
                      actif ? "bg-white text-[#F17922]" : "bg-[#F17922] text-white"
                    }`}
                  >
                    {pastille}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
      {vueActive === "notes" ? (
        <div className="bg-white border border-slate-100 rounded-xl sm:rounded-2xl overflow-hidden p-4">
          <GlobalReviews />
        </div>
      ) : avisId ? (
        <FicheRetour id={avisId} onRetour={retourListe} />
      ) : (
        <RetoursPrives onOuvrir={ouvrirAvis} />
      )}
    </div>
  );
}
