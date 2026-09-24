import React from "react";
import { PartyPopper } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { useAuthStore } from "../../../users/hook/authStore";
import { useProspectFicheQuery } from "../../queries/prospect.query";
import { fmtDate, fmtMontant } from "../../utils/prospect-ui";
import { Chargement, Erreur } from "../commun/Etats";
import { FicheContexte } from "./FicheContexte";
import { FicheEntete } from "./FicheEntete";
import { FicheHistorique } from "./FicheHistorique";
import { PanneauAgent } from "./PanneauAgent";
import { PanneauAppel } from "./PanneauAppel";
import { PanneauCoupon } from "./PanneauCoupon";

/**
 * Fiche prospect (cahier §4.1) : à gauche ce qu'on sait du client, à droite
 * ce qu'on peut faire pour lui. Même disposition que les fiches Livreur et
 * Personnel du backoffice.
 */
export function FicheProspect({
  id,
  onFermer,
  estGestionnaire,
}: {
  id: string | null;
  onFermer: () => void;
  estGestionnaire: boolean;
}) {
  const moi = useAuthStore((s) => s.user?.id);
  const { data: p, isLoading, isError, error } = useProspectFicheQuery(id);

  const pilote = !!p?.campagnes.some((m) => !m.released_at && m.campaign.lead_agent_id === moi);
  const converti = p?.status === "CONVERTI";

  return (
    <Modal isOpen={!!id} onClose={onFermer} title="Fiche prospect" size="large">
      {isLoading ? (
        <Chargement />
      ) : isError || !p ? (
        <Erreur message={(error as Error)?.message} />
      ) : (
        <div className="space-y-5">
          <FicheEntete p={p} />
          {/* Sur téléphone, les actions passent avant l'historique : l'agent qualifie son appel sans défiler. */}
          <div className="grid gap-6 md:grid-cols-5">
            <div className="md:col-span-3 space-y-4 min-w-0 order-2 md:order-1">
              <FicheHistorique p={p} />
              <FicheContexte p={p} />
            </div>

            <div className="md:col-span-2 space-y-5 bg-[#FBFBFB] rounded-2xl p-4 h-fit order-1 md:order-2">
              {converti ? (
                <div className="text-center py-6">
                  <PartyPopper className="w-8 h-8 text-emerald-600 mx-auto" />
                  <p className="font-semibold text-gray-900 mt-2">Client converti</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Première commande le {fmtDate(p.converted_at)}
                    {p.first_order_amount != null && `, ${fmtMontant(p.first_order_amount)}`}.
                  </p>
                  <p className="text-xs text-gray-400 mt-2">Il est sorti de la liste : plus aucun appel n&apos;est nécessaire.</p>
                </div>
              ) : (
                <>
                  <PanneauAppel prospectId={p.id} />
                  <div className="border-t border-gray-200" />
                  <PanneauCoupon p={p} />
                  {(estGestionnaire || pilote) && (
                    <>
                      <div className="border-t border-gray-200" />
                      <PanneauAgent key={p.assigned_to_id ?? "aucun"} p={p} />
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
