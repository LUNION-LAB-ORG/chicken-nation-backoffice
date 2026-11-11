"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { useMaintenant } from "../../livreurs/hook/use-maintenant";
import { useFicheIncidentQuery } from "../queries/incident.query";
import type { IncidentFiche as Fiche } from "../types/incident.types";
import { LIBELLE_GESTE, LIBELLE_RECONTACT, formatJourHeure, messageErreurIncident, texteDelai } from "../utils/incident";
import { Bloc, PastilleGravite, PastilleStatut } from "./Elements";
import { BonIncident } from "./fiche/BonIncident";
import { Cloturer, Rouvrir } from "./fiche/Cloturer";
import { JournalIncident } from "./fiche/JournalIncident";
import { PanneauCommande } from "./fiche/PanneauCommande";
import { Resoudre } from "./fiche/Resoudre";
import { Responsable } from "./fiche/Responsable";

/** Ce qui a été décidé à la résolution, puis ce que le client en a dit. */
function Resolution({ incident }: { incident: Fiche }) {
  return (
    <Bloc titre="Résolution">
      <dl className="flex flex-col gap-3 text-[13px]">
        <div>
          <dt className="text-xs font-semibold text-gray-500">Cause</dt>
          <dd className="whitespace-pre-line text-gray-900">{incident.cause}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-gray-500">Action corrective</dt>
          <dd className="whitespace-pre-line text-gray-900">{incident.action}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-gray-500">Geste pour le client</dt>
          <dd className="font-semibold text-gray-900">{incident.geste ? LIBELLE_GESTE[incident.geste] : ""}</dd>
        </div>
      </dl>
      <BonIncident incident={incident} />
      {incident.resolu_at && (
        <p className="text-xs text-gray-400">
          Résolu le {formatJourHeure(incident.resolu_at)}
          {incident.resolu_par ? ` par ${incident.resolu_par}` : ""}
        </p>
      )}
      {incident.statut === "CLOTURE" && incident.recontact && (
        <div className="border-t border-gray-100 pt-3 text-[13px]">
          <p className="font-semibold text-gray-900">{LIBELLE_RECONTACT[incident.recontact]}</p>
          {incident.reaction && <p className="mt-0.5 whitespace-pre-line text-gray-700">{incident.reaction}</p>}
          {incident.cloture_at && (
            <p className="mt-1 text-xs text-gray-400">
              Clôturé le {formatJourHeure(incident.cloture_at)}
              {incident.cloture_par ? ` par ${incident.cloture_par}` : ""}
            </p>
          )}
        </div>
      )}
    </Bloc>
  );
}

function Contenu({ incident }: { incident: Fiche }) {
  const maintenant = useMaintenant(60_000);
  const delai = texteDelai(incident, maintenant);
  const { droits } = incident;
  const resolu = incident.statut === "RESOLU" || incident.statut === "CLOTURE";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h2 className="text-lg font-bold text-gray-900">{incident.categorie.nom}</h2>
        <PastilleStatut statut={incident.statut} />
        <PastilleGravite gravite={incident.gravite} />
        {delai && (
          <span className={`text-[13px] font-semibold ${delai.retard ? "text-[#B91C1C]" : "text-gray-500"}`}>{delai.texte}</span>
        )}
        <span className="ml-auto font-mono text-xs text-gray-400">{incident.code}</span>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="flex min-w-0 flex-col gap-4 lg:w-3/5">
          <Bloc titre="Problème signalé">
            <p className="whitespace-pre-line rounded-lg bg-[#FBF8F5] px-4 py-3 text-[15px] leading-relaxed text-gray-900">
              {incident.description}
            </p>
            {!resolu && <Responsable incident={incident} />}
          </Bloc>

          {resolu && <Resolution incident={incident} />}
          {/* Démonté tant que l'incident est résolu : après une réouverture, il reprend la cause et l'action déjà saisies. */}
          {droits.resoudre && <Resoudre key={incident.id} incident={incident} />}
          {droits.cloturer && <Cloturer key={`${incident.id}-${incident.resolu_at}`} incident={incident} />}
          {droits.rouvrir && <Rouvrir key={`${incident.id}-${incident.statut}`} incident={incident} />}

          <JournalIncident incident={incident} />
        </div>

        <div className="flex min-w-0 flex-col gap-4 lg:w-2/5">
          <PanneauCommande incident={incident} />
        </div>
      </div>
    </div>
  );
}

/**
 * FICHE D'UN INCIDENT : le problème, qui en répond, la résolution (cause,
 * action corrective, geste), le rappel du client, le journal ; à droite la
 * commande, le client et l'origine du signalement.
 *
 * S'ouvre par-dessus l'écran en cours (`useIncidentsUi`). Les boutons
 * affichés suivent `droits`, calculés par le serveur pour ce compte et cet
 * incident. Un rafraîchissement raté garde la fiche déjà lue.
 */
export function FicheIncident({ id, onFermer }: { id: string | null; onFermer: () => void }) {
  const { data: incident, isError, error } = useFicheIncidentQuery(id);
  const introuvable = isError && [403, 404].includes((error as { status?: number })?.status ?? 0);

  return (
    <Modal isOpen={!!id} onClose={onFermer} title="Incident" size="large">
      {incident && incident.id === id && !introuvable ? (
        <>
          {isError && (
            <p role="status" className="mb-3 rounded-lg bg-amber-50 px-4 py-2 text-[13px] text-amber-800">
              Mise à jour impossible pour le moment : la fiche n&apos;est peut-être plus à jour.
            </p>
          )}
          <Contenu incident={incident} />
        </>
      ) : isError ? (
        <p className="py-8 text-center text-sm text-gray-600">
          {(error as { status?: number })?.status === 404
            ? "Cet incident n'existe plus."
            : messageErreurIncident(error, "Cet incident ne peut pas être lu.")}
        </p>
      ) : (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-[#F17922]" />
        </div>
      )}
    </Modal>
  );
}
