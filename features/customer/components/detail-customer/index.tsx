"use client";

import { useState } from "react";
import { ClientHeader } from "./ClientHeader";
import { ClientTabs } from "./ClientTabs";
import { DossierClient, type OngletClient } from "./DossierClient";
import { StatsClient } from "./StatsClient";
import { useCustomerDetailQuery } from "../../queries/customer-detail.query";
import { mapCustomerData } from "../../utils/customer-mapper";
import { ErrorState, LoadingState } from "@/components/TableStates";

/**
 * La fiche client ENTIÈRE : identité, chiffres, onglets, dossier.
 *
 * ⚠️ À n'utiliser que SEULE, en pleine page. Dans la fiche contact du CRM,
 * c'est `DossierClient` qu'il faut monter : le CRM affiche déjà le nom, le
 * téléphone et l'ancienneté, et monter cette fiche-ci y dupliquait tout, en
 * empilant deux barres d'onglets.
 */
export function ClientDetail({ clientId }: { clientId: string }) {
  const [onglet, setOnglet] = useState<OngletClient>("overview");
  const { data, isLoading, error } = useCustomerDetailQuery(clientId);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} title="Erreur lors du chargement du client" />;

  const customerData = mapCustomerData(data);

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <ClientHeader customerData={customerData} />
      <StatsClient stats={customerData.stats} />
      <ClientTabs activeTab={onglet} onTabChange={setOnglet} />
      <DossierClient clientId={clientId} onglet={onglet} />
    </div>
  );
}
