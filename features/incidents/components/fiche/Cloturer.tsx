import React, { useState } from "react";
import { Loader2, RotateCcw } from "lucide-react";
import { useCloturerIncidentMutation, useRouvrirIncidentMutation } from "../../queries/incident.mutation";
import type { IncidentFiche, IncidentRecontact } from "../../types/incident.types";
import { LIBELLE_RECONTACT, MOTIF_MAX, RECONTACTS, TEXTE_MAX, TEXTE_MIN, formatMontant, manqueALaCloture } from "../../utils/incident";
import { Bloc, Choix, Zone, classeChamp } from "../Elements";

/**
 * « Clôturer » : le client est rappelé pour lui dire ce qui a été fait (et
 * lui annoncer son bon), sa réaction est notée. Injoignable ou sans
 * recontact (constat interne) : la réaction est facultative.
 */
export function Cloturer({ incident }: { incident: IncidentFiche }) {
  const cloturer = useCloturerIncidentMutation();
  const [recontact, setRecontact] = useState<IncidentRecontact | "">("");
  const [reaction, setReaction] = useState("");
  const manque = manqueALaCloture({ recontact, reaction });

  const envoyer = () => {
    if (manque || !recontact) return;
    cloturer.mutate({
      id: incident.id,
      valeur: { statut_lu: incident.statut, recontact, ...(reaction.trim() && { reaction: reaction.trim() }) },
    });
  };

  return (
    <Bloc titre="Informer le client et clôturer">
      {incident.bon && (
        <p className="rounded-lg bg-[#FBF8F5] px-3 py-2 text-[13px] text-gray-700">
          À dire au client : un bon de <strong>{formatMontant(incident.bon.montant)}</strong> l&apos;attend, code{" "}
          <strong className="tracking-wide">{incident.bon.code}</strong>.
        </p>
      )}
      <Choix<IncidentRecontact>
        label="Le client a-t-il été informé ?"
        valeur={recontact}
        onChange={setRecontact}
        options={RECONTACTS.map((r) => ({ valeur: r, libelle: LIBELLE_RECONTACT[r] }))}
      />
      <Zone
        label={recontact === "INFORME" || recontact === "" ? "Réaction du client" : "Remarque (facultatif)"}
        valeur={reaction}
        onChange={setReaction}
        max={TEXTE_MAX}
        lignes={2}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-gray-500">{manque ?? ""}</span>
        <button
          type="button"
          onClick={envoyer}
          disabled={!!manque || cloturer.isPending}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#166534] px-4 text-sm font-semibold text-white hover:bg-[#14532d] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {cloturer.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Clôturer l&apos;incident
        </button>
      </div>
    </Bloc>
  );
}

/** « Rouvrir » (siège) : le client n'est pas satisfait, ou le problème revient. Un motif, et l'incident repart En cours. */
export function Rouvrir({ incident }: { incident: IncidentFiche }) {
  const rouvrir = useRouvrirIncidentMutation();
  const [ouvert, setOuvert] = useState(false);
  const [motif, setMotif] = useState("");
  const pret = motif.trim().length >= TEXTE_MIN;

  if (!ouvert) {
    return (
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className="inline-flex items-center gap-1.5 self-start text-[13px] font-semibold text-gray-600 hover:text-[#F17922]"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Rouvrir l&apos;incident
      </button>
    );
  }
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-gray-200 p-3">
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-gray-600">Pourquoi rouvrir ?</span>
        <input
          autoFocus
          value={motif}
          onChange={(e) => setMotif(e.target.value)}
          maxLength={MOTIF_MAX}
          placeholder="Le client a rappelé, le problème revient…"
          className={classeChamp}
        />
      </label>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setOuvert(false)}
          className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-[13px] font-semibold text-gray-700 hover:bg-gray-50"
        >
          Annuler
        </button>
        <button
          type="button"
          disabled={!pret || rouvrir.isPending}
          onClick={() =>
            rouvrir.mutate(
              { id: incident.id, valeur: { statut_lu: incident.statut, motif: motif.trim() } },
              { onSuccess: () => setOuvert(false) },
            )
          }
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#18181B] px-3 text-[13px] font-semibold text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          {rouvrir.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Rouvrir
        </button>
      </div>
    </div>
  );
}
