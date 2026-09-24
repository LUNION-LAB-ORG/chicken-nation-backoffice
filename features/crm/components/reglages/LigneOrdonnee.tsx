import React from "react";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import Toggle from "@/components/ui/Toggle";

/**
 * Une entrée de liste configurable : déplaçable, activable, retirable. Une
 * valeur retirée reste lisible dans l'historique des appels.
 */
export function LigneOrdonnee({
  children,
  actif,
  onActif,
  onMonter,
  onDescendre,
  onRetirer,
  premier,
  dernier,
}: {
  children: React.ReactNode;
  actif: boolean;
  onActif: (v: boolean) => void;
  onMonter: () => void;
  onDescendre: () => void;
  onRetirer: () => void;
  premier: boolean;
  dernier: boolean;
}) {
  const bouton = "p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent";
  return (
    <li className={`flex items-center gap-2 border border-gray-100 rounded-xl px-3 py-2 ${actif ? "bg-white" : "bg-gray-50"}`}>
      <div className="flex flex-col">
        <button type="button" onClick={onMonter} disabled={premier} className={bouton} aria-label="Monter">
          <ArrowUp className="w-3.5 h-3.5 text-gray-500" />
        </button>
        <button type="button" onClick={onDescendre} disabled={dernier} className={bouton} aria-label="Descendre">
          <ArrowDown className="w-3.5 h-3.5 text-gray-500" />
        </button>
      </div>
      <div className={`flex-1 min-w-0 ${actif ? "" : "opacity-60"}`}>{children}</div>
      <Toggle checked={actif} onChange={onActif} />
      <button type="button" onClick={onRetirer} className="p-1.5 rounded hover:bg-rose-50" aria-label="Retirer">
        <Trash2 className="w-4 h-4 text-rose-500" />
      </button>
    </li>
  );
}

export function deplacer<T extends { id: string }>(liste: T[], index: number, sens: -1 | 1): string[] {
  const ids = liste.map((x) => x.id);
  const cible = index + sens;
  [ids[index], ids[cible]] = [ids[cible], ids[index]];
  return ids;
}
