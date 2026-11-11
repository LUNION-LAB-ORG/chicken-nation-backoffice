import React from "react";
import { Copy, MessageCircle, Phone } from "lucide-react";
import { toast } from "react-hot-toast";
import { useDashboardStore } from "@/store/dashboardStore";
import { useOuvrirCommande } from "../../../orders/hooks/useOuvrirCommande";
import { useDroitsIncidents } from "../../hooks/useDroitsIncidents";
import { useIncidentsUi } from "../../stores/incident-ui.store";
import type { IncidentFiche } from "../../types/incident.types";
import {
  LIBELLE_ORIGINE,
  LIBELLE_STATUT,
  LIBELLE_TYPE_COMMANDE,
  formatJourHeure,
  formatMontant,
  lienTelephone,
  lienWhatsApp,
  telephoneLisible,
} from "../../utils/incident";
import { Bloc, Info } from "../Elements";

const classeAction =
  "inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-semibold text-gray-700 hover:border-[#F17922]/50 hover:text-[#F17922]";

/**
 * Colonne de droite de la fiche : la commande, le client (avec de quoi
 * l'appeler tout de suite), d'où vient le signalement et les autres
 * incidents de ce client.
 */
export function PanneauCommande({ incident }: { incident: IncidentFiche }) {
  const { voirTickets, voirAvis } = useDroitsIncidents();
  const ouvrirCommande = useOuvrirCommande();
  const openTicket = useDashboardStore((s) => s.openTicket);
  const openAvis = useDashboardStore((s) => s.openAvis);
  const fermerFiche = useIncidentsUi((s) => s.fermerFiche);
  const ouvrirFiche = useIncidentsUi((s) => s.ouvrirFiche);
  const { commande, client, liens } = incident;

  const appel = lienTelephone(client.telephone);
  const whatsapp = lienWhatsApp(client.telephone);
  const quitterVers = (aller: () => void) => {
    fermerFiche();
    aller();
  };
  const copier = async () => {
    if (!client.telephone) return;
    try {
      await navigator.clipboard.writeText(client.telephone);
      toast.success("Numéro copié");
    } catch {
      toast.error("Copie impossible");
    }
  };

  return (
    <>
      <Bloc
        titre="Commande"
        droite={
          ouvrirCommande && (
            <button
              type="button"
              onClick={() => quitterVers(() => ouvrirCommande(commande.reference))}
              className="text-[13px] font-semibold text-[#F17922] hover:underline"
            >
              Voir la commande
            </button>
          )
        }
      >
        <dl className="flex flex-col gap-1.5">
          <Info libelle="Référence">{commande.reference}</Info>
          <Info libelle="Montant">{formatMontant(commande.montant)}</Info>
          <Info libelle="Passée le">{formatJourHeure(commande.created_at)}</Info>
          <Info libelle="Type">{LIBELLE_TYPE_COMMANDE[commande.type] ?? commande.type}</Info>
          <Info libelle="Restaurant">{incident.restaurant.name}</Info>
        </dl>
      </Bloc>

      <Bloc titre="Client">
        <div>
          <p className="text-sm font-bold text-gray-900">{client.nom}</p>
          {client.telephone && <p className="text-[15px] font-semibold tabular-nums text-gray-700">{telephoneLisible(client.telephone)}</p>}
        </div>
        {appel && (
          <div className="flex flex-wrap gap-2">
            <a href={appel} className={classeAction}>
              <Phone className="h-3.5 w-3.5" />
              Appeler
            </a>
            {whatsapp && (
              <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={classeAction}>
                <MessageCircle className="h-3.5 w-3.5" />
                WhatsApp
              </a>
            )}
            <button type="button" onClick={copier} className={classeAction}>
              <Copy className="h-3.5 w-3.5" />
              Copier
            </button>
          </div>
        )}
      </Bloc>

      <Bloc titre="Signalement">
        <dl className="flex flex-col gap-1.5">
          <Info libelle="Origine">{LIBELLE_ORIGINE[incident.origine]}</Info>
          <Info libelle="Signalé le">{formatJourHeure(incident.created_at)}</Info>
          {incident.signale_par && <Info libelle="Par">{incident.signale_par}</Info>}
          {liens.note && <Info libelle="Note du client">{liens.note.rating} sur 5</Info>}
        </dl>
        {(liens.ticket || liens.avis_id) && (
          <div className="flex flex-wrap gap-2">
            {liens.ticket &&
              (voirTickets ? (
                <button type="button" onClick={() => quitterVers(() => openTicket(liens.ticket!.id))} className={classeAction}>
                  Voir le ticket {liens.ticket.code}
                </button>
              ) : (
                <span className="text-[13px] text-gray-600">Ticket {liens.ticket.code}</span>
              ))}
            {liens.avis_id && voirAvis && (
              <button type="button" onClick={() => quitterVers(() => openAvis(liens.avis_id!))} className={classeAction}>
                Voir l&apos;avis du site
              </button>
            )}
          </div>
        )}
      </Bloc>

      {incident.autres.length > 0 && (
        <Bloc titre="Autres incidents de ce client">
          <ul className="flex flex-col gap-1.5">
            {incident.autres.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => ouvrirFiche(a.id)}
                  className="flex w-full items-baseline justify-between gap-3 rounded-lg px-2 py-1 text-left text-[13px] hover:bg-orange-50"
                >
                  <span className="min-w-0 truncate font-semibold text-gray-900">{a.categorie}</span>
                  <span className="shrink-0 text-xs text-gray-500">
                    {LIBELLE_STATUT[a.statut]} · {formatJourHeure(a.created_at)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Bloc>
      )}
    </>
  );
}
