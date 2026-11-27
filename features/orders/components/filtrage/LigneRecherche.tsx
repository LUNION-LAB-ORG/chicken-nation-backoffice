"use client";

interface Props {
  /** Saisie en cours, déjà lue (`lireRecherche`). */
  recherche: string;
  /** Nombre de commandes de l'onglet qui correspondent. */
  nombre: number;
  /** Ce que montre l'onglet : « à relancer ». */
  quoi: string;
  /** Passe sur l'onglet « Commandes », où la recherche couvre toutes les commandes. */
  onToutesLesCommandes: () => void;
  onEffacer: () => void;
}

/**
 * Rappel qu'une recherche filtre l'onglet « À relancer » (27/11). L'onglet
 * montre ce qu'il faut traiter : filtré sans le dire, un panier à rappeler
 * passerait inaperçu. La ligne dit donc ce qui est filtré, permet de
 * l'effacer, et mène à la recherche dans toutes les commandes.
 */
export function LigneRecherche({ recherche, nombre, quoi, onToutesLesCommandes, onEffacer }: Props) {
  if (!recherche) return null;
  const compte =
    nombre === 0 ? `Aucune commande ${quoi}` : `${nombre} commande${nombre > 1 ? "s" : ""} ${quoi}`;
  return (
    <div
      role="status"
      className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 flex flex-wrap items-center gap-x-4 gap-y-1"
    >
      <span>
        {compte} pour « <span className="font-semibold">{recherche}</span> »
      </span>
      <button type="button" onClick={onToutesLesCommandes} className="font-semibold underline cursor-pointer">
        Chercher dans toutes les commandes
      </button>
      <button type="button" onClick={onEffacer} className="font-semibold underline cursor-pointer">
        Effacer
      </button>
    </div>
  );
}
