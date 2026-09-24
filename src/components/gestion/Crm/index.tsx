"use client";

import React, { useEffect, useMemo, useState } from "react";
import { BarChart3, Headset, Megaphone, Receipt, Settings, Ticket, Users } from "lucide-react";

import DashboardPageHeader from "@/components/ui/DashboardPageHeader";
import { useDashboardStore } from "@/store/dashboardStore";
import { HasPermission } from "../../../../features/users/components/HasPermission";
import { Action, Modules } from "../../../../features/users/types/auth.type";
import { useAuthStore } from "../../../../features/users/hook/authStore";
import { useCrmSocketSync } from "../../../../features/crm/hooks/useCrmSocketSync";
import { useCampagnesQuery } from "../../../../features/crm/queries/campagne.query";
import { useMaFileQuery } from "../../../../features/crm/queries/contact.query";
import { IContactFiltres } from "../../../../features/crm/types/contact.type";
import { Onglet, Onglets } from "../../../../features/crm/components/commun/Onglets";
import { TableauDeBord } from "../../../../features/crm/components/analyse/TableauDeBord";
import { CouponsVue } from "../../../../features/crm/components/analyse/CouponsVue";
import { Ventes } from "../../../../features/crm/components/analyse/Ventes";
import { FILTRES_DEFAUT, ListeContacts } from "../../../../features/crm/components/liste/ListeContacts";
import { MaFile } from "../../../../features/crm/components/file/MaFile";
import { Campagnes } from "../../../../features/crm/components/campagnes/Campagnes";
import { Reglages } from "../../../../features/crm/components/reglages/Reglages";
import { FicheContact } from "../../../../features/crm/components/fiche/FicheContact";

type Cle = "tableau" | "file" | "contacts" | "campagnes" | "coupons" | "ventes" | "reglages";

/**
 * CRM : relance des inscrits qui n'ont jamais commandé, des anciens clients
 * devenus inactifs (l'ancienne « Rétention clients ») et des clients
 * Glovo/Yango relevés en caisse (l'ancienne « Acquisition Glovo/Yango »).
 *
 * Les onglets suivent le rôle (cahier §9) : la direction pilote (tableau de
 * bord, campagnes, réglages), l'agent traite sa file et consulte les
 * tableaux de bord, la lecture seule ne voit que ceux-ci. Le serveur
 * applique les mêmes règles.
 */
export default function Crm() {
  const can = useAuthStore((s) => s.can);
  const moi = useAuthStore((s) => s.user?.id);
  const estGestionnaire = can(Modules.CRM, Action.CREATE);
  const peutTraiter = can(Modules.CRM, Action.UPDATE);
  const peutAnalyser = can(Modules.CRM, Action.REPORT);
  const peutExporter = can(Modules.CRM, Action.EXPORT);

  useCrmSocketSync();
  const { data: file } = useMaFileQuery(peutTraiter && !estGestionnaire);
  const { data: campagnes = [] } = useCampagnesQuery();
  const pilote = campagnes.some((c) => c.lead_agent.id === moi && c.status !== "COMPLETED");

  const onglets = useMemo(() => {
    const liste: (Onglet<Cle> & { visible: boolean })[] = [
      { cle: "tableau", label: "Tableau de bord", Icone: BarChart3, visible: peutAnalyser },
      {
        cle: "file",
        label: "Ma file",
        Icone: Headset,
        visible: peutTraiter,
        badge: file ? file.rappels.length + file.interesses.length : undefined,
      },
      { cle: "contacts", label: "Contacts", Icone: Users, visible: peutTraiter },
      { cle: "campagnes", label: "Campagnes", Icone: Megaphone, visible: true },
      { cle: "coupons", label: "Coupons", Icone: Ticket, visible: peutAnalyser },
      { cle: "ventes", label: "Ventes", Icone: Receipt, visible: peutAnalyser },
      { cle: "reglages", label: "Réglages", Icone: Settings, visible: estGestionnaire },
    ];
    return liste.filter((o) => o.visible);
  }, [peutAnalyser, peutTraiter, estGestionnaire, file]);

  const [cle, setCle] = useState<Cle>(estGestionnaire || !peutTraiter ? onglets[0]?.cle ?? "campagnes" : "file");
  const [filtresListe, setFiltresListe] = useState<IContactFiltres>(FILTRES_DEFAUT);
  // Le numéro tapé dans « Un client appelle ? » accompagne la fiche : lui seul
  // ouvre en lecture la fiche d'un client suivi par un collègue.
  const [fiche, setFiche] = useState<{ id: string; telephone?: string } | null>(null);
  const setFicheId = (id: string | null) => setFiche(id ? { id } : null);
  const ouvrirParNumero = (id: string, telephone?: string) => setFiche({ id, telephone });
  const actif: Cle = onglets.some((o) => o.cle === cle) ? cle : (onglets[0]?.cle ?? "campagnes");

  // Ouverture demandée depuis un autre écran (ex. « Rappeler » dans les statistiques clients).
  const publicDemande = useDashboardStore((s) => s.pendingCrmSegment);
  const oublierPublicDemande = useDashboardStore((s) => s.clearPendingCrm);
  useEffect(() => {
    if (!publicDemande) return;
    setFiltresListe({ ...FILTRES_DEFAUT, segment: publicDemande });
    setCle(peutTraiter ? "contacts" : "tableau");
    oublierPublicDemande();
  }, [publicDemande, oublierPublicDemande, peutTraiter]);

  return (
    <div className="flex-1 px-4 pt-4 pb-10">
      <DashboardPageHeader
        mode="list"
        title="CRM"
        subtitle="Inscrits sans commande, clients inactifs et clients Glovo/Yango : relance, coupons et campagnes"
      />

      <HasPermission
        module={Modules.CRM}
        action={Action.READ}
        fallback={<div className="text-sm text-gray-500 bg-white border border-gray-200 rounded-xl p-6 mt-4">Vous n&apos;avez pas accès à ce module.</div>}
      >
        <div className="my-4">
          <Onglets<Cle> onglets={onglets} actif={actif} onChange={(k) => setCle(k)} />
        </div>

        {actif === "tableau" && <TableauDeBord onOuvrir={setFicheId} />}
        {actif === "file" && <MaFile onOuvrir={ouvrirParNumero} />}
        {actif === "contacts" && (
          <ListeContacts
            key={JSON.stringify(filtresListe)}
            filtresInitiaux={filtresListe}
            peutAssigner={estGestionnaire || pilote}
            peutExporter={peutExporter}
            voitTousLesAgents={estGestionnaire || pilote}
            onOuvrir={setFicheId}
          />
        )}
        {actif === "campagnes" && <Campagnes estGestionnaire={estGestionnaire} peutExporter={peutExporter} peutAnalyser={peutAnalyser} />}
        {actif === "coupons" && (
          <CouponsVue
            onVoir={(etat) => {
              setFiltresListe({ ...FILTRES_DEFAUT, coupon: etat, status: etat === "UTILISE" ? "CONVERTI" : undefined });
              setCle("contacts");
            }}
          />
        )}
        {actif === "ventes" && <Ventes onOuvrir={setFicheId} />}
        {actif === "reglages" && <Reglages />}
      </HasPermission>

      <FicheContact id={fiche?.id ?? null} telephone={fiche?.telephone} onFermer={() => setFiche(null)} estGestionnaire={estGestionnaire} />
    </div>
  );
}
