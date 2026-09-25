import React, { useMemo, useState } from "react";
import { PhoneCall } from "lucide-react";
import { useAppelMutation } from "../../queries/contact.mutation";
import { useRaisonsQuery, useStatutsAppelQuery } from "../../queries/reglage.query";
import { AppelEffet } from "../../types/contact.type";
import { EFFET_META } from "../../utils/crm-ui";
import { Bouton, ChampSelect, ChampTexte, Libelle, classeChamp } from "../commun/Champs";
import { EtatRequete } from "../commun/Etats";

const ORDRE_EFFETS: AppelEffet[] = ["NON_JOINT", "A_RAPPELER", "INTERESSE", "NON_INTERESSE", "NUMERO_INVALIDE"];

/**
 * Saisie d'un appel (cahier §4.3) : statut, raison, commentaire, rappel.
 * Les statuts sont groupés par effet, pour qu'un agent voie ce que son choix
 * va produire avant de valider.
 */
export function PanneauAppel({ contactId, onEnregistre }: { contactId: string; onEnregistre?: () => void }) {
  const requeteStatuts = useStatutsAppelQuery();
  const statuts = useMemo(() => requeteStatuts.data ?? [], [requeteStatuts.data]);
  const { data: raisons = [] } = useRaisonsQuery();
  const appel = useAppelMutation();
  const [statutId, setStatutId] = useState("");
  const [raisonId, setRaisonId] = useState("");
  const [commentaire, setCommentaire] = useState("");
  const [rappel, setRappel] = useState("");

  const actifs = useMemo(() => statuts.filter((s) => s.is_active), [statuts]);
  const raisonsActives = raisons.filter((r) => r.is_active);
  const effet = actifs.find((s) => s.id === statutId)?.outcome;
  const raisonRequise = effet === "NON_INTERESSE";
  // La raison se voit dès l'ouverture, à côté du commentaire. Elle n'a pas de
  // sens quand le client n'a pas été joint (pas de réponse, numéro invalide).
  const clientJoint = effet !== "NON_JOINT" && effet !== "NUMERO_INVALIDE";

  const enregistrer = () =>
    appel.mutate(
      {
        id: contactId,
        dto: {
          call_status_id: statutId,
          loss_reason_id: clientJoint ? raisonId || undefined : undefined,
          comment: commentaire.trim() || undefined,
          callback_at: effet === "A_RAPPELER" && rappel ? new Date(rappel).toISOString() : undefined,
        },
      },
      {
        onSuccess: () => {
          setStatutId("");
          setRaisonId("");
          setCommentaire("");
          setRappel("");
          onEnregistre?.();
        },
      },
    );

  return (
    <div className="space-y-3">
      <p className="flex items-center gap-2 text-sm font-semibold text-gray-800">
        <PhoneCall className="w-4 h-4 text-[#F17922]" /> Qualifier l&apos;appel
      </p>
      <EtatRequete requete={requeteStatuts}>
        <label className="block">
          <Libelle requis>Statut de l&apos;appel</Libelle>
          <select value={statutId} onChange={(e) => setStatutId(e.target.value)} className={`${classeChamp} cursor-pointer`}>
            <option value="">Choisir…</option>
            {ORDRE_EFFETS.map((e) => {
              const groupe = actifs.filter((s) => s.outcome === e);
              if (groupe.length === 0) return null;
              return (
                <optgroup key={e} label={EFFET_META[e].label}>
                  {groupe.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </optgroup>
              );
            })}
          </select>
        </label>
        {effet && <p className="text-xs text-gray-500 -mt-1">{EFFET_META[effet].aide}</p>}

        {clientJoint && (
          <div>
            <ChampSelect
              label="Raison de non-commande"
              requis={raisonRequise}
              valeur={raisonId}
              onChange={setRaisonId}
              vide={raisonRequise ? "Choisir…" : "Aucune"}
              options={raisonsActives.map((r) => ({ value: r.id, label: r.name }))}
            />
            <p className="text-xs text-gray-500 mt-1">
              {raisonsActives.length === 0
                ? "Aucune raison n'est configurée : la direction peut en ajouter dans Réglages."
                : raisonRequise
                  ? "Pourquoi le client ne commande pas : elle alimente le tableau des raisons."
                  : "Obligatoire si le client n'est pas intéressé, facultative sinon."}
            </p>
          </div>
        )}
        {effet === "A_RAPPELER" && (
          <ChampTexte label="Rappeler le" type="datetime-local" valeur={rappel} onChange={setRappel} min={new Date().toISOString().slice(0, 16)} />
        )}
        <label className="block">
          <Libelle>Commentaire</Libelle>
          <textarea
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="Ce que le client a dit, dans ses mots"
            className={`${classeChamp} resize-none`}
          />
        </label>
        <Bouton
          variante="primaire"
          className="w-full"
          desactive={!statutId || (raisonRequise && !raisonId) || appel.isPending}
          onClick={enregistrer}
        >
          Enregistrer l&apos;appel
        </Bouton>
      </EtatRequete>
    </div>
  );
}
