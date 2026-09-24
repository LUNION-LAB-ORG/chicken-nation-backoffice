import React, { useState } from "react";
import { Pencil, Plus, Ticket, Trash2 } from "lucide-react";
import StatsChartCard from "@/components/gestion/Statistiques/shared/StatsChartCard";
import Toggle from "@/components/ui/Toggle";
import { useListeMutation, useOffresQuery } from "../../queries/reglage.query";
import { IOffre } from "../../types/reglage.type";
import { fmtMontant } from "../../utils/prospect-ui";
import { Bouton } from "../commun/Champs";
import { FormOffre } from "./FormOffre";

const remise = (o: IOffre) => (o.discount_type === "PERCENTAGE" ? `${o.discount_value} %` : fmtMontant(o.discount_value));

/** Offres proposables en coupon (cahier §4.1 : « Offre associée »). */
export function EditeurOffres() {
  const { data: offres = [] } = useOffresQuery();
  const liste = useListeMutation("offres");
  const [edition, setEdition] = useState<IOffre | "nouvelle" | null>(null);

  return (
    <StatsChartCard
      title="Offres des coupons"
      subtitle="La remise créée pour chaque coupon"
      icon={Ticket}
      rightContent={
        <Bouton variante="primaire" onClick={() => setEdition("nouvelle")}>
          <Plus className="w-4 h-4" /> Offre
        </Bouton>
      }
    >
      <ul className="space-y-2">
        {offres.map((o) => (
          <li key={o.id} className={`flex items-center gap-3 border border-gray-100 rounded-xl px-3 py-2 ${o.is_active ? "" : "bg-gray-50 opacity-70"}`}>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{o.label}</p>
              <p className="text-xs text-gray-500">
                Remise {remise(o)} · valable {o.validity_days} j
                {o.min_order_amount > 0 && ` · dès ${fmtMontant(o.min_order_amount)}`}
                {o.max_discount_amount ? ` · plafond ${fmtMontant(o.max_discount_amount)}` : ""}
              </p>
            </div>
            <Toggle checked={o.is_active} onChange={(v) => liste.mutate({ type: "modifier", id: o.id, dto: { is_active: v } })} />
            <button type="button" onClick={() => setEdition(o)} className="p-1.5 rounded hover:bg-gray-100" aria-label="Modifier">
              <Pencil className="w-4 h-4 text-gray-500" />
            </button>
            <button type="button" onClick={() => liste.mutate({ type: "supprimer", id: o.id })} className="p-1.5 rounded hover:bg-rose-50" aria-label="Retirer">
              <Trash2 className="w-4 h-4 text-rose-500" />
            </button>
          </li>
        ))}
      </ul>
      {edition && (
        <FormOffre key={edition === "nouvelle" ? "nouvelle" : edition.id} offre={edition === "nouvelle" ? null : edition} onFermer={() => setEdition(null)} />
      )}
    </StatsChartCard>
  );
}
