import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { useNoterIncidentMutation } from "../../queries/incident.mutation";
import type { IncidentFiche } from "../../types/incident.types";
import { NOTE_MAX, formatJourHeure } from "../../utils/incident";
import { Bloc, classeChamp } from "../Elements";

/**
 * Journal de l'incident : qui a fait quoi, quand, du signalement à la
 * clôture. Les phrases viennent du serveur. Une note peut y être ajoutée par
 * ceux qui prennent ou servent les commandes.
 */
export function JournalIncident({ incident }: { incident: IncidentFiche }) {
  const noter = useNoterIncidentMutation();
  const [note, setNote] = useState("");
  const pret = note.trim().length > 0;

  const envoyer = () => {
    if (!pret) return;
    noter.mutate({ id: incident.id, valeur: note.trim() }, { onSuccess: () => setNote("") });
  };

  return (
    <Bloc titre="Journal">
      <ol className="flex flex-col gap-3">
        {incident.suivis.map((s) => (
          <li key={s.id} className="flex gap-3 text-[13px]">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#F17922]" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-gray-900">{s.texte}</p>
              {s.note && <p className="mt-0.5 whitespace-pre-line text-gray-600">{s.note}</p>}
              <p className="mt-0.5 text-xs text-gray-400">{formatJourHeure(s.created_at)}</p>
            </div>
          </li>
        ))}
      </ol>
      {incident.droits.noter && (
        <div className="flex items-end gap-2 border-t border-gray-100 pt-3">
          <label className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="text-xs font-semibold text-gray-600">Ajouter une note</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={NOTE_MAX}
              rows={2}
              placeholder="Ce qu'un collègue doit savoir"
              className={`${classeChamp} resize-y`}
            />
          </label>
          <button
            type="button"
            onClick={envoyer}
            disabled={!pret || noter.isPending}
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {noter.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Ajouter
          </button>
        </div>
      )}
    </Bloc>
  );
}
