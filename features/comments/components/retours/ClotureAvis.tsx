import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { useStatutAvisMutation } from "../../queries/avis-prive.mutation";
import { verifierCloture } from "../../schemas/avis-prive.schema";
import type { AvisFiche } from "../../types/avis-prive.types";
import { LIBELLE_SOLUTION, optionsCloture, SOLUTIONS, solutionPossible, STATUTS_CLOTURE } from "../../utils/avis-prive";
import { Carte, ChampListe } from "./Elements";

/**
 * Clôture (qui traite) : statut et solution. Résolu exige une solution ;
 * À rappeler et Injoignable sont grisés sans accord de rappel ; Incident
 * ouvert se pose par « Créer un incident ». Le statut lu part avec la
 * demande : un collègue qui l'a changé entre-temps donne un 409.
 *
 * Le parent le monte avec une clé faite du statut et de la solution : une
 * fiche relue repart de ses valeurs.
 */
export function ClotureAvis({ avis }: { avis: AvisFiche }) {
  const [statut, setStatut] = useState<string>(STATUTS_CLOTURE.includes(avis.statut) ? avis.statut : "");
  const [solution, setSolution] = useState<string>(avis.solution ?? "");
  const [erreur, setErreur] = useState<string | null>(null);
  const mutation = useStatutAvisMutation();

  const avecSolution = solutionPossible(statut as AvisFiche["statut"]);
  const change = statut !== avis.statut || (avecSolution && (solution || null) !== avis.solution);

  const enregistrer = () => {
    const r = verifierCloture({ statut, solution, accord_rappel: avis.accord_rappel }, avis.statut);
    if (r.ok === false) {
      setErreur(r.message);
      return;
    }
    setErreur(null);
    mutation.mutate({ id: avis.id, valeur: r.dto });
  };

  return (
    <Carte titre="Clôture">
      <div className="flex flex-wrap items-end gap-3">
        <ChampListe
          label="Statut"
          valeur={statut}
          onChange={(v) => {
            setStatut(v);
            setErreur(null);
          }}
          vide={statut ? undefined : "Choisir"}
          options={optionsCloture(avis.accord_rappel)}
          className="min-w-[170px]"
        />
        <ChampListe
          label="Solution apportée (obligatoire pour Résolu)"
          valeur={avecSolution ? solution : ""}
          onChange={(v) => {
            setSolution(v);
            setErreur(null);
          }}
          vide="Choisir"
          options={SOLUTIONS.map((s) => ({ valeur: s, libelle: LIBELLE_SOLUTION[s] }))}
          desactive={!avecSolution}
          className="min-w-[240px]"
        />
        <button
          type="button"
          onClick={enregistrer}
          disabled={!change || mutation.isPending}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-800 hover:border-[#F17922] hover:text-[#F17922] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Enregistrer
        </button>
      </div>
      {erreur && <p className="text-xs font-medium text-red-600">{erreur}</p>}
    </Carte>
  );
}
