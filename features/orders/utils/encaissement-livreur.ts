/**
 * Encaissements déclarés par le livreur et paiements de trop (18/11).
 *
 * Ce que la commande a reçu, ce qui attend la décision de la caisse, et ce
 * qu'il reste à encaisser. Mêmes règles qu'au serveur
 * (`encaissement.helper.ts`), qui tranche : jamais plus que le prix de la
 * commande, et la déclaration du livreur compte tant qu'elle n'est pas
 * refusée.
 */

type PaiementCompte = {
  status: string;
  amount: number | null | undefined;
  failure_code?: string | null;
};

/** Motifs posés par le serveur quand une déclaration du livreur est refusée. */
export const CODES_REFUS = ["REFUSE_PAR_LE_RESTAURANT", "REFUSE_PAYEE_EN_LIGNE"];

/** Déclaration du livreur refusée (à la main, ou d'office après un paiement en ligne). */
export function estRefuse(p: PaiementCompte): boolean {
  return p.status === "FAILED" && CODES_REFUS.includes(p.failure_code ?? "");
}

/** Reçu (paiements réussis) et déclaré par le livreur, pas encore décidé (en attente). */
export function cumulPaiements(paiements: PaiementCompte[]): { recu: number; enAttente: number } {
  let recu = 0;
  let enAttente = 0;
  for (const p of paiements) {
    if (p.status === "SUCCESS") recu += p.amount ?? 0;
    else if (p.status === "PENDING") enAttente += p.amount ?? 0;
  }
  return { recu, enAttente };
}

/** Ce que la caisse peut encore encaisser : le prix, moins le reçu, moins le déclaré. */
export function resteAEncaisser(montantCommande: number, paiements: PaiementCompte[]): number {
  const { recu, enAttente } = cumulPaiements(paiements);
  return Math.max(0, montantCommande - recu - enAttente);
}

/**
 * La déclaration peut-elle être confirmée sans dépasser le prix ? Sinon elle
 * est de trop (la caisse a déjà encaissé, ou paiement en ligne) : seul le
 * refus reste proposé.
 */
export function peutConfirmer(
  montantCommande: number,
  paiements: PaiementCompte[],
  declaration: PaiementCompte,
): boolean {
  const { recu } = cumulPaiements(paiements);
  return Math.round(declaration.amount ?? 0) <= Math.round(Math.max(0, montantCommande - recu));
}
