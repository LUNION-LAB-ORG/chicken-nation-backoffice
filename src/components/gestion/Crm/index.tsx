"use client";

import React, { useEffect, useMemo, useState } from "react";
import { BarChart3, Headset, Megaphone, Receipt, Settings, Store, Ticket, Users } from "lucide-react";

import DashboardPageHeader from "@/components/ui/DashboardPageHeader";
import { useDashboardStore } from "@/store/dashboardStore";
import { HasPermission } from "../../../../features/users/components/HasPermission";
import { Action, Modules } from "../../../../features/users/types/auth.type";
import { useAuthStore } from "../../../../features/users/hook/authStore";
import { useCrmSocketSync } from "../../../../features/crm/hooks/useCrmSocketSync";
import { useDroitsCrm } from "../../../../features/crm/hooks/useDroitsCrm";
import { useCampagnesQuery } from "../../../../features/crm/queries/campagne.query";
import { useMaFileQuery } from "../../../../features/crm/queries/contact.query";
import { IContactFiltres, Public } from "../../../../features/crm/types/contact.type";
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
 * Les onglets suivent le rôle (cahier §9, revu le 25/09) : la direction
 * pilote (tableau de bord, campagnes, réglages), l'agent traite sa file et
 * consulte les tableaux de bord, le lecteur (marketing, manager) voit tout,
 * téléphones compris, sans aucun geste ni export. Un compte de point de
 * vente ne voit que les clients de son restaurant et jamais les campagnes.
 * Le serveur applique les mêmes règles.
 */
export default function Crm() {
  const moi = useAuthStore((s) => s.user?.id);
  const { estGestionnaire, peutTraiter, peutAnalyser, peutExporter, lecteur, pointDeVente } = useDroitsCrm();
  const voitContacts = peutTraiter || lecteur;

  useCrmSocketSync();
  const { data: file } = useMaFileQuery(peutTraiter && !estGestionnaire);
  // Les campagnes se consultent au siège : un point de vente n'en demande aucune.
  const { data: campagnes = [] } = useCampagnesQuery({}, !pointDeVente);
  const pilote = peutTraiter && campagnes.some((c) => c.lead_agent.id === moi && c.status !== "COMPLETED");

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
      { cle: "contacts", label: "Contacts", Icone: Users, visible: voitContacts },
      { cle: "campagnes", label: "Campagnes", Icone: Megaphone, visible: !pointDeVente },
      { cle: "coupons", label: "Coupons", Icone: Ticket, visible: peutAnalyser },
      { cle: "ventes", label: "Ventes", Icone: Receipt, visible: peutAnalyser },
      // Réglages du réseau (messages, offres, statuts) : pas pour un point de vente.
      { cle: "reglages", label: "Réglages", Icone: Settings, visible: estGestionnaire || (lecteur && !pointDeVente) },
    ];
    return liste.filter((o) => o.visible);
  }, [peutAnalyser, peutTraiter, voitContacts, pointDeVente, estGestionnaire, lecteur, file]);

  const [cle, setCle] = useState<Cle>(estGestionnaire || !peutTraiter ? onglets[0]?.cle ?? "contacts" : "file");
  const [filtresListe, setFiltresListe] = useState<IContactFiltres>(FILTRES_DEFAUT);
  // Le numéro tapé dans « Un client appelle ? » accompagne la fiche : lui seul
  // ouvre en lecture la fiche d'un client suivi par un collègue.
  const [fiche, setFiche] = useState<{ id: string; telephone?: string } | null>(null);
  const setFicheId = (id: string | null) => setFiche(id ? { id } : null);
  const ouvrirParNumero = (id: string, telephone?: string) => setFiche({ id, telephone });
  const actif: Cle | undefined = onglets.some((o) => o.cle === cle) ? cle : onglets[0]?.cle;

  // Ouverture demandée depuis un autre écran (ex. « Rappeler » dans les statistiques clients).
  // Qui voit les contacts arrive sur la liste filtrée ; les autres, sur le tableau de
  // bord filtré sur ce public (remonté par `demande` pour repartir de ce filtre).
  const publicDemande = useDashboardStore((s) => s.pendingCrmSegment);
  const oublierPublicDemande = useDashboardStore((s) => s.clearPendingCrm);
  const [publicsTableau, setPublicsTableau] = useState<Public[] | undefined>();
  const [demande, setDemande] = useState(0);
  useEffect(() => {
    if (!publicDemande) return;
    if (voitContacts) {
      setFiltresListe({ ...FILTRES_DEFAUT, segment: publicDemande });
      setCle("contacts");
    } else {
      setPublicsTableau([publicDemande]);
      setDemande((n) => n + 1);
      setCle("tableau");
    }
    oublierPublicDemande();
  }, [publicDemande, oublierPublicDemande, voitContacts]);

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
          <Onglets<Cle> onglets={onglets} actif={actif ?? "contacts"} onChange={(k) => setCle(k)} />
        </div>

        {pointDeVente && actif !== "reglages" && (
          <div className="flex items-start gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 mb-4 text-sm text-gray-600">
            <Store className="w-4 h-4 mt-0.5 shrink-0 text-gray-400" />
            <p>
              Clients de votre restaurant : ceux qui y ont commandé ou y ont été relevés sur Glovo/Yango. Les inscrits qui
              n&apos;ont jamais commandé ne sont rattachés à aucun restaurant.
            </p>
          </div>
        )}

        {actif === "tableau" && (
          <TableauDeBord key={demande} publicsInitiaux={publicsTableau} peutExporter={peutExporter} onOuvrir={setFicheId} />
        )}
        {actif === "file" && <MaFile onOuvrir={ouvrirParNumero} />}
        {actif === "contacts" && (
          <ListeContacts
            key={JSON.stringify(filtresListe)}
            filtresInitiaux={filtresListe}
            peutAssigner={estGestionnaire || pilote}
            peutExporter={peutExporter}
            voitTousLesAgents={estGestionnaire || pilote || lecteur}
            onOuvrir={setFicheId}
          />
        )}
        {actif === "campagnes" && !pointDeVente && (
          <Campagnes estGestionnaire={estGestionnaire} peutTraiter={peutTraiter} peutExporter={peutExporter} peutAnalyser={peutAnalyser} />
        )}
        {actif === "coupons" && (
          <CouponsVue
            onVoir={
              voitContacts
                ? (etat) => {
                    setFiltresListe({ ...FILTRES_DEFAUT, coupon: etat, status: etat === "UTILISE" ? "CONVERTI" : undefined });
                    setCle("contacts");
                  }
                : undefined
            }
          />
        )}
        {actif === "ventes" && <Ventes onOuvrir={setFicheId} />}
        {actif === "reglages" && <Reglages lectureSeule={!estGestionnaire} />}
      </HasPermission>

      <FicheContact id={fiche?.id ?? null} telephone={fiche?.telephone} onFermer={() => setFiche(null)} estGestionnaire={estGestionnaire} />
    </div>
  );
}
