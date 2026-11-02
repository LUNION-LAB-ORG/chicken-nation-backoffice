import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { useJournalAvisMutation } from "../../queries/avis-prive.mutation";
import { NOTE_MAX, verifierJournal } from "../../schemas/avis-prive.schema";
import type { ActionJournal, AvisFiche, AvisResultat } from "../../types/avis-prive.types";
import {
  actionsPossibles,
  formatRecu,
  LIBELLE_ACTION,
  LIBELLE_RESULTAT,
  resultatsPossibles,
} from "../../utils/avis-prive";
import { Carte, ChampListe, classeChamp } from "./Elements";

/**
 * Journal de suivi : lignes du système et des agents, de la plus ancienne à
 * la plus récente, puis (pour qui traite) le formulaire Appel, Message
 * WhatsApp ou Note interne. Sans accord de rappel, seule la note interne.
 */
export function JournalSuivi({ avis, peutTraiter }: { avis: AvisFiche; peutTraiter: boolean }) {
  return (
    <Carte titre="Journal de suivi">
      {avis.journal.length > 0 && (
        <ol className="flex flex-col gap-3 border-l-2 border-slate-100 pl-4">
          {avis.journal.map((l) => (
            <li key={l.id}>
              <div className="text-xs text-gray-500">
                {formatRecu(l.created_at)} · {l.auteur}
              </div>
              <div className="whitespace-pre-line text-sm text-gray-800">{l.texte}</div>
            </li>
          ))}
        </ol>
      )}
      {peutTraiter && <AjoutJournal avis={avis} />}
    </Carte>
  );
}

function AjoutJournal({ avis }: { avis: AvisFiche }) {
  const actions = actionsPossibles(avis.accord_rappel);
  const [action, setAction] = useState<ActionJournal>(actions[0]);
  const [resultat, setResultat] = useState<AvisResultat | "">("");
  const [note, setNote] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const mutation = useJournalAvisMutation();

  // L'accord ne change pas, mais une fiche relue garde un geste valable.
  const actionValide = actions.includes(action) ? action : actions[0];
  const resultats = resultatsPossibles(actionValide);

  const choisirAction = (v: string) => {
    const a = v as ActionJournal;
    setAction(a);
    if (!resultatsPossibles(a).includes(resultat as AvisResultat)) setResultat("");
    setErreur(null);
  };

  const ajouter = () => {
    const r = verifierJournal({ action: actionValide, resultat, note, accord_rappel: avis.accord_rappel });
    if (r.ok === false) {
      setErreur(r.message);
      return;
    }
    setErreur(null);
    mutation.mutate(
      { id: avis.id, valeur: r.dto },
      {
        onSuccess: () => {
          setNote("");
          setResultat("");
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 pt-3">
      <div className="flex flex-wrap gap-3">
        <ChampListe
          label="Action"
          valeur={actionValide}
          onChange={choisirAction}
          options={actions.map((a) => ({ valeur: a, libelle: LIBELLE_ACTION[a] }))}
          className="min-w-[180px]"
        />
        {resultats.length > 0 && (
          <ChampListe
            label="Résultat"
            valeur={resultat}
            onChange={(v) => {
              setResultat(v as AvisResultat | "");
              setErreur(null);
            }}
            vide="Choisir"
            options={resultats.map((r) => ({ valeur: r, libelle: LIBELLE_RESULTAT[r] }))}
            className="min-w-[160px]"
          />
        )}
      </div>
      <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
        Note
        <textarea
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            setErreur(null);
          }}
          maxLength={NOTE_MAX}
          rows={3}
          placeholder="Ce que le client a dit, ce qui a été proposé…"
          className={`${classeChamp} h-auto min-h-[72px] resize-y py-2`}
        />
      </label>
      {erreur && <p className="text-xs font-medium text-red-600">{erreur}</p>}
      <button
        type="button"
        onClick={ajouter}
        disabled={mutation.isPending}
        className="inline-flex h-10 items-center gap-2 self-start rounded-lg bg-gray-900 px-4 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
      >
        {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Ajouter au journal
      </button>
    </div>
  );
}
