import React, { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import OrderDetailModal from "../../../orders/components/detail-order/OrderDetailModal";
import { orderDetailQueryOption } from "../../../orders/queries/order-detail.query";
import { mapApiOrderToUiOrder } from "../../../orders/utils/orderMapper";
import { Bouton } from "../commun/Champs";
import { Chargement } from "../commun/Etats";

/**
 * Détail d'une commande, ouvert depuis les ventes d'une campagne : la modale
 * de la page Commandes, en lecture seule. La campagne reste affichée derrière.
 *
 * La requête est celle de la page Commandes (même clé, même cache), mais pas
 * son crochet `useOrderDetailQuery` : il ajoute une notification d'erreur à
 * chaque nouveau rendu, alors que l'erreur s'affiche déjà ici.
 */
export function DetailCommande({ id, onFermer }: { id: string; onFermer: () => void }) {
  const { data, isError, error } = useQuery(orderDetailQueryOption(id));
  const commande = React.useMemo(() => (data ? mapApiOrderToUiOrder(data) : null), [data]);
  const refBoite = useRef<HTMLDivElement>(null);
  // Le parent recrée `onFermer` à chaque rendu : on garde la dernière sans relancer l'effet (ni reprendre le focus).
  const fermer = useRef(onFermer);
  useEffect(() => {
    fermer.current = onFermer;
  });

  // Attente et erreur : le focus entre dans la boîte, Échap la ferme.
  useEffect(() => {
    if (commande) return;
    refBoite.current?.focus();
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === "Escape") fermer.current();
    };
    window.addEventListener("keydown", surTouche);
    return () => window.removeEventListener("keydown", surTouche);
  }, [commande]);

  if (commande) return <OrderDetailModal order={commande} onClose={onFermer} />;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onFermer}>
      <div
        ref={refBoite}
        role="dialog"
        aria-modal="true"
        aria-label="Détail de la commande"
        tabIndex={-1}
        className="bg-white rounded-2xl shadow-xl mx-4 w-full max-w-sm p-6 focus:outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        {isError ? (
          <div className="space-y-4 text-center" role="alert">
            <p className="text-sm text-gray-700">{(error as Error)?.message || "Impossible d'ouvrir cette commande."}</p>
            <Bouton onClick={onFermer}>Fermer</Bouton>
          </div>
        ) : (
          <Chargement texte="Ouverture de la commande…" />
        )}
      </div>
    </div>
  );
}
