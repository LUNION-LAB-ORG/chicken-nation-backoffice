"use client";

import React, { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { FicheContact } from "../../../crm/components/fiche/FicheContact";
import { useDroitsAvis } from "../../hooks/useDroitsAvis";
import { useAgentAvisMutation, useSupprimerAvisMutation } from "../../queries/avis-prive.mutation";
import { useAgentsAvisQuery, useFicheAvisQuery } from "../../queries/avis-prive.query";
import type { AvisFiche } from "../../types/avis-prive.types";
import {
  formatRecu,
  JE_NE_SAIS_PAS,
  LIBELLE_CANAL,
  libelleSource,
  messageErreurAvis,
  NON_ASSIGNE,
  texteRetardFiche,
} from "../../utils/avis-prive";
import { BlocClient } from "./BlocClient";
import { ClotureAvis } from "./ClotureAvis";
import { DernieresCommandes } from "./DernieresCommandes";
import { Carte, ChampListe, PastilleRessenti, PastilleStatut } from "./Elements";
import { JournalSuivi } from "./JournalSuivi";

const LienRetour = ({ onRetour }: { onRetour: () => void }) => (
  <button type="button" onClick={onRetour} className="self-start text-[13px] font-semibold text-[#F17922] hover:underline">
    ← Tous les avis
  </button>
);

/** Agent de l'avis : liste pour qui traite, sinon le nom. */
function ChoixAgent({ avis, peutTraiter }: { avis: AvisFiche; peutTraiter: boolean }) {
  const { data: agents } = useAgentsAvisQuery(peutTraiter);
  const mutation = useAgentAvisMutation();
  if (!peutTraiter) {
    return (
      <span className="text-sm text-gray-600">
        Agent : <span className="font-semibold text-gray-900">{avis.agent?.fullname ?? NON_ASSIGNE}</span>
      </span>
    );
  }
  // L'agent actuel reste visible même s'il ne traite plus les avis.
  const options = [...(agents ?? [])];
  if (avis.agent && !options.some((a) => a.id === avis.agent!.id)) options.push(avis.agent);
  return (
    <ChampListe
      label="Agent"
      valeur={avis.agent?.id ?? ""}
      onChange={(v) => mutation.mutate({ id: avis.id, valeur: v || null })}
      vide={NON_ASSIGNE}
      options={options.map((a) => ({ valeur: a.id, libelle: a.fullname }))}
      desactive={mutation.isPending}
      className="min-w-[200px]"
    />
  );
}

/**
 * Fiche d'un retour privé (maquette BO-Fiche) : commentaire, journal,
 * clôture à gauche ; client et dernières commandes à droite, comme les
 * autres fiches du back-office.
 */
export function FicheRetour({ id, onRetour }: { id: string; onRetour: () => void }) {
  const droits = useDroitsAvis();
  const { data: avis, isLoading, isError, error } = useFicheAvisQuery(id);
  const [crmOuvert, setCrmOuvert] = useState(false);
  const [suppression, setSuppression] = useState(false);
  const supprimer = useSupprimerAvisMutation();

  if (isLoading) {
    return (
      <div className="flex justify-center rounded-xl bg-white py-16">
        <Loader2 className="h-6 w-6 animate-spin text-[#F17922]" />
      </div>
    );
  }

  if (isError || !avis) {
    const introuvable = (error as { status?: number } | null)?.status === 404;
    return (
      <div className="flex flex-col gap-4 rounded-xl bg-white p-6">
        <LienRetour onRetour={onRetour} />
        <p className="text-sm text-gray-600">{introuvable ? "Cet avis n'existe plus." : messageErreurAvis(error)}</p>
      </div>
    );
  }

  const retard = texteRetardFiche(avis.echeance_at, avis.en_retard);

  return (
    <div className="flex flex-col gap-4">
      <LienRetour onRetour={onRetour} />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-bold text-gray-900">Avis du {formatRecu(avis.created_at)}</h2>
          <PastilleRessenti ressenti={avis.ressenti} />
          <PastilleStatut statut={avis.statut} />
          {retard && <span className="text-[13px] font-bold text-[#9A3412]">{retard}</span>}
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <ChoixAgent avis={avis} peutTraiter={droits.peutTraiter} />
          {droits.peutSupprimer && (
            <button
              type="button"
              onClick={() => setSuppression(true)}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-red-200 bg-white px-4 text-sm font-semibold text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              Supprimer
            </button>
          )}
        </div>
      </div>

      <div className="rounded-xl bg-white">
        <div className="flex flex-col gap-4 md:flex-row md:gap-6">
          <div className="flex flex-col gap-4 p-4 sm:p-6 md:w-3/5">
            <Carte titre="Commentaire du client">
              <p className="whitespace-pre-line rounded-lg bg-[#FBF8F5] px-4 py-3 text-[15px] leading-relaxed text-gray-900">
                {avis.commentaire}
              </p>
              <dl className="grid grid-cols-2 gap-3 text-[13px] sm:grid-cols-4">
                <div>
                  <dt className="text-gray-500">Canal</dt>
                  <dd className="font-semibold text-gray-900">{LIBELLE_CANAL[avis.canal]}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Store</dt>
                  <dd className="font-semibold text-gray-900">{avis.restaurant?.name ?? JE_NE_SAIS_PAS}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Accord de rappel</dt>
                  <dd className="font-semibold text-gray-900">{avis.accord_rappel ? "Oui" : "Non"}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Source</dt>
                  <dd className="font-semibold text-gray-900">{libelleSource(avis.source)}</dd>
                </div>
              </dl>
            </Carte>

            <JournalSuivi avis={avis} peutTraiter={droits.peutTraiter} />

            {droits.peutTraiter && <ClotureAvis key={`${avis.statut}-${avis.solution ?? ""}`} avis={avis} />}
          </div>

          <div className="flex flex-col gap-4 rounded-b-xl bg-[#FBFBFB] p-4 sm:p-6 md:w-2/5 md:rounded-r-xl md:rounded-bl-none">
            <BlocClient
              avis={avis}
              peutTraiter={droits.peutTraiter}
              peutVoirCrm={droits.peutVoirCrm}
              peutVoirTickets={droits.peutVoirTickets}
              onOuvrirCrm={() => setCrmOuvert(true)}
            />
            <DernieresCommandes avis={avis} peutTraiter={droits.peutTraiter} peutVoirCommandes={droits.peutVoirCommandes} />
          </div>
        </div>
      </div>

      {droits.peutVoirCrm && avis.client.crm_contact_id && (
        <FicheContact
          id={crmOuvert ? avis.client.crm_contact_id : null}
          onFermer={() => setCrmOuvert(false)}
          estGestionnaire={droits.peutGererCrm}
        />
      )}

      <ConfirmDialog
        isOpen={suppression}
        onClose={() => setSuppression(false)}
        onConfirm={() =>
          supprimer.mutate(avis.id, {
            onSuccess: () => {
              setSuppression(false);
              onRetour();
            },
          })
        }
        title="Supprimer cet avis ?"
        description="Le commentaire, le numéro et le prénom sont effacés. Cette action est définitive."
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="danger"
        isLoading={supprimer.isPending}
      />
    </div>
  );
}
