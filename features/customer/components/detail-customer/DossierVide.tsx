import { LucideIcon } from "lucide-react";

/**
 * Ce qu'un onglet du dossier affiche quand il n'a rien à montrer.
 *
 * ⚠️ Favoris, Adresses et Commandes n'en avaient aucun : ils parcouraient une
 * liste vide et ne dessinaient donc RIEN. En ouvrant « Favoris » sur un client
 * sans favori, on voyait une modale blanche, sans savoir si elle chargeait,
 * si elle avait échoué, ou s'il n'y avait simplement rien.
 */
export function DossierVide({ Icone, texte }: { Icone: LucideIcon; texte: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100">
        <Icone className="h-5 w-5 text-gray-400" />
      </span>
      <p className="text-sm text-gray-500">{texte}</p>
    </div>
  );
}
