import React, { useState } from "react";
import { ChevronDown, LucideIcon } from "lucide-react";
import { IContactLigne } from "../../types/contact.type";
import { CarteFile } from "./CarteFile";

export function SectionFile({
  titre,
  aide,
  Icone,
  lignes,
  onOuvrir,
  replieeParDefaut = false,
  commune = false,
  total,
  aDesSuivants = false,
  onSuivants,
  chargement = false,
  erreur = false,
}: {
  titre: string;
  aide: string;
  Icone: LucideIcon;
  lignes: IContactLigne[];
  onOuvrir: (id: string) => void;
  replieeParDefaut?: boolean;
  /** File commune Glovo/Yango : appeler prend d'abord le client. */
  commune?: boolean;
  /** Vrai nombre de la rubrique, venu du serveur ; absent : les lignes reçues. */
  total?: number;
  /** Il reste des lignes au-delà de celles affichées. */
  aDesSuivants?: boolean;
  onSuivants?: () => void;
  chargement?: boolean;
  /** Les suivants n'ont pas pu être chargés : « Voir les suivants » réessaie. */
  erreur?: boolean;
}) {
  const [repliee, setRepliee] = useState(replieeParDefaut);
  const nombre = total ?? lignes.length;
  if (lignes.length === 0 && nombre === 0) return null;

  return (
    <section>
      <button
        type="button"
        onClick={() => setRepliee((r) => !r)}
        className="w-full flex items-center gap-3 text-left mb-2"
      >
        <span className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
          <Icone className="w-4 h-4 text-[#F17922]" />
        </span>
        <span className="flex-1">
          <span className="text-sm font-semibold text-gray-900">
            {titre} <span className="text-gray-400">({nombre})</span>
          </span>
          <span className="block text-xs text-gray-500">{aide}</span>
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${repliee ? "-rotate-90" : ""}`} />
      </button>
      {!repliee && (
        <div className="space-y-2">
          {lignes.map((p) => (
            <CarteFile key={p.id} p={p} onOuvrir={() => onOuvrir(p.id)} commune={commune} />
          ))}
          {lignes.length === 0 && chargement && <p className="text-xs text-gray-400 px-1">Chargement…</p>}
          {erreur && <p className="text-xs text-rose-600 px-1">Les suivants n&apos;ont pas pu être chargés : réessayez.</p>}
          {aDesSuivants && onSuivants && lignes.length > 0 && (
            <button
              type="button"
              onClick={onSuivants}
              disabled={chargement}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              {chargement ? "Chargement…" : "Voir les suivants"}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
