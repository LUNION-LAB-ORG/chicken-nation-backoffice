import React, { useState } from "react";
import { MessageCircle, Phone, Ticket } from "lucide-react";
import { useDashboardStore } from "@/store/dashboardStore";
import { lienAppel } from "../../../crm/utils/crm-ui";
import type { AvisFiche } from "../../types/avis-prive.types";
import { lienWhatsApp, nomAffiche, raisonIncidentImpossible, telephoneComplet } from "../../utils/avis-prive";
import { CreerIncident } from "./CreerIncident";
import { Carte, Rapprochement } from "./Elements";

/**
 * Colonne Client de la fiche : rapprochement, nom, numéro, fiche CRM, Appeler
 * et WhatsApp (qui traite, avec accord de rappel et numéro composable), puis
 * « Créer un incident » ou le lien du ticket déjà ouvert.
 */
export function BlocClient({
  avis,
  peutTraiter,
  peutVoirCrm,
  peutVoirTickets,
  onOuvrirCrm,
}: {
  avis: AvisFiche;
  peutTraiter: boolean;
  peutVoirCrm: boolean;
  peutVoirTickets: boolean;
  onOuvrirCrm: () => void;
}) {
  const openTicket = useDashboardStore((s) => s.openTicket);
  const [incident, setIncident] = useState(false);

  const appel = peutTraiter && avis.accord_rappel ? lienAppel(avis.telephone) : undefined;
  const whatsapp = peutTraiter && avis.accord_rappel ? lienWhatsApp(avis.telephone) : undefined;
  const raison = raisonIncidentImpossible(avis);

  return (
    <Carte titre="Client" droite={<Rapprochement rapproche={avis.rapproche} />}>
      <div>
        <div className="text-base font-bold text-gray-900">{nomAffiche(avis.prenom)}</div>
        {avis.telephone && <div className="text-sm text-gray-700">{telephoneComplet(avis.telephone)}</div>}
        {avis.client.crm_contact_id && peutVoirCrm && (
          <button type="button" onClick={onOuvrirCrm} className="mt-1 text-[13px] font-semibold text-[#F17922] hover:underline">
            Ouvrir la fiche CRM
          </button>
        )}
      </div>

      {!avis.accord_rappel ? (
        <p className="text-sm text-gray-500">Pas d&apos;accord de rappel.</p>
      ) : (
        (appel || whatsapp) && (
          <div className="grid grid-cols-2 gap-2">
            {appel && (
              <a
                href={appel}
                className="flex h-11 items-center justify-center gap-2 rounded-lg bg-[#F17922] text-sm font-bold text-white hover:bg-[#e06a15]"
              >
                <Phone className="h-4 w-4" />
                Appeler
              </a>
            )}
            {whatsapp && (
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-gray-800 hover:border-[#F17922]"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
            )}
          </div>
        )
      )}

      {avis.ticket ? (
        peutVoirTickets ? (
          <button
            type="button"
            onClick={() => openTicket(avis.ticket!.id)}
            className="inline-flex items-center gap-2 self-start text-sm font-semibold text-[#F17922] hover:underline"
          >
            <Ticket className="h-4 w-4" />
            Ticket {avis.ticket.code}
          </button>
        ) : (
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Ticket className="h-4 w-4" />
            Ticket {avis.ticket.code}
          </span>
        )
      ) : (
        peutTraiter && (
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => setIncident(true)}
              disabled={!!raison}
              className="h-11 rounded-lg border-2 border-[#C2410C] bg-white text-sm font-bold text-[#9A3412] hover:bg-orange-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400 disabled:hover:bg-white"
            >
              Créer un incident
            </button>
            {raison && <p className="text-xs text-gray-500">{raison}</p>}
            {!raison && <CreerIncident avis={avis} ouvert={incident} onFermer={() => setIncident(false)} />}
          </div>
        )
      )}
    </Carte>
  );
}
