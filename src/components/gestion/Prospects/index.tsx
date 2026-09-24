"use client";

import React, { useMemo, useState } from "react";
import { BarChart3, Headset, Megaphone, Settings, Ticket, Users } from "lucide-react";

import DashboardPageHeader from "@/components/ui/DashboardPageHeader";
import { HasPermission } from "../../../../features/users/components/HasPermission";
import { Action, Modules } from "../../../../features/users/types/auth.type";
import { useAuthStore } from "../../../../features/users/hook/authStore";
import { useConversionSocketSync } from "../../../../features/prospects/hooks/useConversionSocketSync";
import { useCampagnesQuery } from "../../../../features/prospects/queries/campagne.query";
import { useMaFileQuery } from "../../../../features/prospects/queries/prospect.query";
import { IProspectFiltres } from "../../../../features/prospects/types/prospect.type";
import { Onglet, Onglets } from "../../../../features/prospects/components/commun/Onglets";
import { TableauDeBord } from "../../../../features/prospects/components/analyse/TableauDeBord";
import { CouponsVue } from "../../../../features/prospects/components/analyse/CouponsVue";
import { FILTRES_DEFAUT, ListeProspects } from "../../../../features/prospects/components/liste/ListeProspects";
import { MaFile } from "../../../../features/prospects/components/file/MaFile";
import { Campagnes } from "../../../../features/prospects/components/campagnes/Campagnes";
import { Reglages } from "../../../../features/prospects/components/reglages/Reglages";
import { FicheProspect } from "../../../../features/prospects/components/fiche/FicheProspect";

type Cle = "tableau" | "file" | "prospects" | "campagnes" | "coupons" | "reglages";

/**
 * Module Prospects : conversion des inscrits qui n'ont jamais commandé.
 *
 * Les onglets suivent le rôle (cahier §9) : la direction pilote (tableau de
 * bord, campagnes, réglages), l'agent traite sa file, la lecture seule ne
 * voit que les tableaux de bord. Le serveur applique les mêmes règles.
 */
export default function Prospects() {
  const can = useAuthStore((s) => s.can);
  const moi = useAuthStore((s) => s.user?.id);
  const estGestionnaire = can(Modules.PROSPECTS, Action.CREATE);
  const peutTraiter = can(Modules.PROSPECTS, Action.UPDATE);
  const peutAnalyser = can(Modules.PROSPECTS, Action.REPORT);
  const peutExporter = can(Modules.PROSPECTS, Action.EXPORT);

  useConversionSocketSync();
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
      { cle: "prospects", label: "Prospects", Icone: Users, visible: peutTraiter },
      { cle: "campagnes", label: "Campagnes", Icone: Megaphone, visible: true },
      { cle: "coupons", label: "Coupons", Icone: Ticket, visible: peutAnalyser },
      { cle: "reglages", label: "Réglages", Icone: Settings, visible: estGestionnaire },
    ];
    return liste.filter((o) => o.visible);
  }, [peutAnalyser, peutTraiter, estGestionnaire, file]);

  const [cle, setCle] = useState<Cle>(estGestionnaire || !peutTraiter ? onglets[0]?.cle ?? "campagnes" : "file");
  const [filtresListe, setFiltresListe] = useState<IProspectFiltres>(FILTRES_DEFAUT);
  const [ficheId, setFicheId] = useState<string | null>(null);
  const actif: Cle = onglets.some((o) => o.cle === cle) ? cle : (onglets[0]?.cle ?? "campagnes");

  return (
    <div className="flex-1 px-4 pt-4 pb-10">
      <DashboardPageHeader mode="list" title="Prospects" subtitle="Inscrits qui n'ont jamais commandé : relance, coupons et campagnes" />

      <HasPermission
        module={Modules.PROSPECTS}
        action={Action.READ}
        fallback={<div className="text-sm text-gray-500 bg-white border border-gray-200 rounded-xl p-6 mt-4">Vous n&apos;avez pas accès à ce module.</div>}
      >
        <div className="my-4">
          <Onglets<Cle> onglets={onglets} actif={actif} onChange={(k) => setCle(k)} />
        </div>

        {actif === "tableau" && <TableauDeBord onOuvrir={setFicheId} />}
        {actif === "file" && <MaFile onOuvrir={setFicheId} />}
        {actif === "prospects" && (
          <ListeProspects
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
              setCle("prospects");
            }}
          />
        )}
        {actif === "reglages" && <Reglages />}
      </HasPermission>

      <FicheProspect id={ficheId} onFermer={() => setFicheId(null)} estGestionnaire={estGestionnaire} />
    </div>
  );
}
