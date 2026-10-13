"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { useCustomerDetailQuery } from "../../queries/customer-detail.query";
import { mapCustomerData } from "../../utils/customer-mapper";
import { ErrorState, LoadingState } from "@/components/TableStates";
import { EditCustomerModal } from "./EditCustomerModal";
import { Action, Modules } from "../../../users/types/auth.type";
import { HasPermission } from "../../../users/components/HasPermission";
import { StatsClient } from "./StatsClient";
import { OverviewTab } from "./OverviewTab";
import { OrdersTab } from "./OrdersTab";
import { FavoritesTab } from "./FavoritesTab";
import { ReviewsTab } from "./ReviewsTab";
import { AddressesTab } from "./AddressesTab";
import { CarteTab } from "./CarteTab";

export type OngletClient =
  | "overview"
  | "orders"
  | "favorites"
  | "reviews"
  | "addresses"
  | "card";

/**
 * Le DOSSIER d'un client, SANS en-tête d'identité ni barre d'onglets.
 *
 * ⚠️ C'est tout l'objet de ce composant. La fiche client complète était
 * encastrée dans la fiche contact du CRM, avec son propre en-tête : on lisait
 * le nom deux fois, le téléphone deux fois, deux boutons copier, deux dates
 * d'ancienneté qui ne disaient pas la même chose (« Inscrit le 13 oct. » et
 * « Client depuis oct. 2026 »), et deux barres d'onglets empilées.
 *
 * L'identité appartient désormais à celui qui ouvre le dossier, une seule fois,
 * et les onglets vivent dans une seule barre. Ici il ne reste que le contenu.
 *
 * Les chiffres ne s'affichent que sur la vue d'ensemble : les répéter au-dessus
 * de la liste des commandes n'apprendrait rien de plus à qui la lit.
 */
export function DossierClient({
  clientId,
  onglet,
}: {
  clientId: string;
  onglet: OngletClient;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const { data, isLoading, error } = useCustomerDetailQuery(clientId);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} title="Erreur lors du chargement du client" />;

  const customerData = mapCustomerData(data);

  return (
    <div className="space-y-4">
      <HasPermission module={Modules.CLIENTS} action={Action.UPDATE}>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:border-[#F17922]/40 hover:bg-orange-50"
          >
            <Pencil className="h-4 w-4" />
            Modifier la fiche
          </button>
        </div>
      </HasPermission>

      {onglet === "overview" && <StatsClient stats={customerData.stats} />}

      {onglet === "overview" && <OverviewTab customerData={customerData} />}
      {onglet === "orders" && <OrdersTab customerData={customerData} />}
      {onglet === "favorites" && <FavoritesTab customerData={customerData} />}
      {onglet === "reviews" && <ReviewsTab customerData={customerData} />}
      {onglet === "addresses" && <AddressesTab customerData={customerData} />}
      {onglet === "card" && <CarteTab customerData={customerData} />}

      <EditCustomerModal
        isOpen={editOpen}
        customer={data ?? null}
        onClose={() => setEditOpen(false)}
      />
    </div>
  );
}
