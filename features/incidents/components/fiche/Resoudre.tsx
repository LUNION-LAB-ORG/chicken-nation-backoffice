import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { useResoudreIncidentMutation } from "../../queries/incident.mutation";
import { useReglagesIncidentsQuery } from "../../queries/incident.query";
import type { IncidentFiche, IncidentGeste } from "../../types/incident.types";
import { GESTES, LIBELLE_GESTE, TEXTE_MAX, formatMontant, manqueALaResolution } from "../../utils/incident";
import { Bloc, Choix, Zone } from "../Elements";

/**
 * « Résoudre » : la cause, l'action corrective (ce que le restaurant, la
 * livraison ou le call center change pour que cela ne se reproduise pas) et
 * le geste pour le client. Un bon de réduction est créé à la résolution et
 * son code part par SMS.
 *
 * N'existe que tant que l'incident est à résoudre : après une réouverture,
 * le formulaire repart de la cause et de l'action déjà saisies. Prendre
 * l'incident en charge ou ajouter une note ne vide pas ce qui est tapé.
 */
export function Resoudre({ incident }: { incident: IncidentFiche }) {
  const { data: reglages } = useReglagesIncidentsQuery();
  const resoudre = useResoudreIncidentMutation();
  const [cause, setCause] = useState(incident.cause ?? "");
  const [action, setAction] = useState(incident.action ?? "");
  const [geste, setGeste] = useState<IncidentGeste | "">(incident.geste ?? "");
  const [bonMontant, setBonMontant] = useState<number | null>(incident.bon_suggere);

  const bonExistant = !!incident.bon;
  // Le bon de réduction n'est proposé qu'à qui peut en offrir ; un bon déjà créé reste affiché.
  const gestes = GESTES.filter((g) => g !== "BON" || incident.droits.bon || bonExistant);
  const manque = manqueALaResolution({ cause, action, geste, bonMontant, bonExistant });

  const envoyer = () => {
    if (manque || !geste) return;
    resoudre.mutate({
      id: incident.id,
      valeur: {
        statut_lu: incident.statut,
        cause: cause.trim(),
        action: action.trim(),
        geste,
        ...(geste === "BON" && !bonExistant && bonMontant ? { bon_montant: bonMontant } : {}),
      },
    });
  };

  return (
    <Bloc titre="Résoudre l'incident">
      <Zone label="Cause" valeur={cause} onChange={setCause} placeholder="Ce qui s'est passé" max={TEXTE_MAX} lignes={2} />
      <Zone
        label="Action corrective"
        valeur={action}
        onChange={setAction}
        placeholder="Ce qui change pour que cela ne se reproduise pas"
        max={TEXTE_MAX}
        lignes={2}
      />
      <Choix<IncidentGeste>
        label="Geste pour le client"
        valeur={geste}
        onChange={setGeste}
        options={gestes.map((g) => ({ valeur: g, libelle: LIBELLE_GESTE[g] }))}
      />
      {bonExistant ? (
        <p className="text-[13px] text-gray-600">
          Le bon de {formatMontant(incident.bon!.montant)} déjà créé reste acquis au client.
        </p>
      ) : (
        geste === "BON" && (
          <>
            <Choix<number>
              label="Montant du bon"
              valeur={bonMontant}
              onChange={setBonMontant}
              options={incident.montants_bon.map((m) => ({ valeur: m, libelle: formatMontant(m) }))}
            />
            <p className="text-xs text-gray-500">
              Le bon est créé pour ce client{reglages ? `, valable ${reglages.validite_jours} jours` : ""}. Son code lui part
              par SMS dès la résolution.
            </p>
          </>
        )
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-gray-500">{manque ?? ""}</span>
        <button
          type="button"
          onClick={envoyer}
          disabled={!!manque || resoudre.isPending}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#F17922] px-4 text-sm font-semibold text-white hover:bg-[#e06a15] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {resoudre.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Marquer résolu
        </button>
      </div>
    </Bloc>
  );
}
