import React from "react";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import Toggle from "@/components/ui/Toggle";

/** État d'une entrée, en lecture seule : à la place de l'interrupteur. `feminin` : raison, offre. */
export function EtatActif({ actif, feminin = false }: { actif: boolean; feminin?: boolean }) {
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        actif ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-600"
      }`}
    >
      {`${actif ? "Actif" : "Désactivé"}${feminin ? "e" : ""}`}
    </span>
  );
}

/**
 * Une entrée de liste configurable : déplaçable, activable, retirable. Une
 * valeur retirée reste lisible dans l'historique des appels. En lecture
 * seule, ni flèches, ni interrupteur, ni retrait : l'entrée et son état.
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
  lectureSeule = false,
  feminin = false,
}: {
  children: React.ReactNode;
  actif: boolean;
  onActif: (v: boolean) => void;
  onMonter: () => void;
  onDescendre: () => void;
  onRetirer: () => void;
  premier: boolean;
  dernier: boolean;
  lectureSeule?: boolean;
  /** Accord de l'état affiché en lecture seule (une raison est « active », un statut « actif »). */
  feminin?: boolean;
}) {
  const bouton = "p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent";
  return (
    <li className={`flex items-center gap-2 border border-gray-100 rounded-xl px-3 py-2 ${actif ? "bg-white" : "bg-gray-50"}`}>
      {!lectureSeule && (
        <div className="flex flex-col">
          <button type="button" onClick={onMonter} disabled={premier} className={bouton} aria-label="Monter">
            <ArrowUp className="w-3.5 h-3.5 text-gray-500" />
          </button>
          <button type="button" onClick={onDescendre} disabled={dernier} className={bouton} aria-label="Descendre">
            <ArrowDown className="w-3.5 h-3.5 text-gray-500" />
          </button>
        </div>
      )}
      <div className={`flex-1 min-w-0 ${actif ? "" : "opacity-60"}`}>{children}</div>
      {lectureSeule ? (
        <EtatActif actif={actif} feminin={feminin} />
      ) : (
        <>
          <Toggle checked={actif} onChange={onActif} />
          <button type="button" onClick={onRetirer} className="p-1.5 rounded hover:bg-rose-50" aria-label="Retirer">
            <Trash2 className="w-4 h-4 text-rose-500" />
          </button>
        </>
      )}
    </li>
  );
}

export function deplacer<T extends { id: string }>(liste: T[], index: number, sens: -1 | 1): string[] {
  const ids = liste.map((x) => x.id);
  const cible = index + sens;
  [ids[index], ids[cible]] = [ids[cible], ids[index]];
  return ids;
}
