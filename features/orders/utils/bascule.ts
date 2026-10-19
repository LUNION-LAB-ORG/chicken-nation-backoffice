import { OrderStatus } from "../types/order.types";
import { OrderTable } from "../types/ordersTable.types";
import { PaiementStatus } from "../types/paiement.types";

/**
 * BASCULE vers le call center, à la modification d'une commande passée par le
 * client (application ou site). Logique pure, miroir des règles du serveur
 * (`OrderService.update`, reprise par le personnel), testée seule
 * (`__tests__/bascule.test.ts`).
 */

type CommandeBascule = Pick<
  OrderTable,
  "orderType" | "rawStatus" | "paied" | "paiements" | "paymentChannel" | "amount" | "auto" | "channel"
>;

/**
 * Commande du site à payer à la livraison, que le centre d'appels n'a pas
 * encore confirmée : jumeau de `estAConfirmer` côté serveur
 * (backend/src/modules/order/helpers/paiement-livraison.rules.ts). Sur une
 * commande du client, « Restaurant » veut dire paiement OFFLINE
 * (`utils/orderMapper`).
 */
export function estAConfirmer(
  commande: Pick<OrderTable, "auto" | "channel" | "paymentChannel" | "paied" | "rawStatus">,
): boolean {
  return (
    !!commande.auto &&
    commande.channel === "WEB" &&
    commande.paymentChannel === "Restaurant" &&
    !commande.paied &&
    commande.rawStatus === OrderStatus.PENDING
  );
}

/**
 * Ce que deviendra la commande si elle passe au call center.
 *
 * Le MONTANT reste tel quel quand il est déjà engagé, par ordre de priorité :
 *  - `payee` : commande payée ;
 *  - `livraison` : commande à livrer prête ou plus loin (la course est partie
 *    avec ce montant à encaisser) ;
 *  - `site` : commande du site à payer à la livraison, le client a accepté ce
 *    total sur le site, frais de service compris.
 *
 * Le PAIEMENT passe à la caisse quand la commande était payable dans
 * l'application, qu'il reste à payer, et qu'aucun encaissement de livreur
 * n'attend sa confirmation. Un paiement en ligne partiel ne l'empêche pas :
 * la caisse encaisse le reste. `paymentChannel` vaut « Appli » pour une
 * commande de l'application payable en ligne.
 */
export function apresBascule(commande: CommandeBascule): {
  montantFige: "payee" | "livraison" | "site" | null;
  paiement: "caisse" | "livreur" | "inchange";
} {
  const livraisonLancee =
    commande.orderType === "À livrer" &&
    commande.rawStatus !== OrderStatus.PENDING &&
    commande.rawStatus !== OrderStatus.ACCEPTED &&
    commande.rawStatus !== OrderStatus.IN_PROGRESS;
  const fraisAcceptesSurLeSite =
    !commande.paied && commande.channel === "WEB" && commande.paymentChannel === "Restaurant" && !!commande.auto;
  const montantFige = commande.paied
    ? "payee"
    : livraisonLancee
      ? "livraison"
      : fraisAcceptesSurLeSite
        ? "site"
        : null;

  const paiements = commande.paiements ?? [];
  const dejaPercu = paiements
    .filter((p) => p.status === PaiementStatus.SUCCESS)
    .reduce((somme, p) => somme + (p.total ?? p.amount ?? 0), 0);
  let paiement: "caisse" | "livreur" | "inchange" = "inchange";
  if (commande.paymentChannel === "Appli" && !commande.paied && commande.amount - dejaPercu > 50) {
    paiement = paiements.some((p) => p.status === PaiementStatus.PENDING) ? "livreur" : "caisse";
  }
  return { montantFige, paiement };
}

/**
 * Commande annulée par son client sans avoir payé : le seul cas où une
 * commande annulée se reprend au téléphone. Panier de l'application payable
 * en ligne, ou commande du site à payer à la livraison. Le serveur reste juge
 * (409 si la commande n'est plus relançable).
 */
export function panierAnnuleParLeClient(
  commande: Pick<OrderTable, "rawStatus" | "auto" | "paymentChannel" | "paied" | "channel">,
): boolean {
  return (
    commande.rawStatus === OrderStatus.CANCELLED &&
    commande.auto &&
    (commande.paymentChannel === "Appli" ||
      (commande.channel === "WEB" && commande.paymentChannel === "Restaurant")) &&
    !commande.paied
  );
}

/** Livraison telle que le formulaire la porte : ce qui décide des frais. */
export interface LivraisonFormulaire {
  type: string;
  address: string;
  restaurant_id?: string;
}

/**
 * Frais de livraison à garder dans le formulaire, à chaque réponse de
 * l'aperçu (`GET /orders/frais-livraison`).
 *
 * `fraisFiges` : reprise d'une commande du site à payer à la livraison
 * (`apresBascule` donne `site`), avec la livraison et les frais de la
 * commande. Le client a accepté ces frais sur le site : tant que l'adresse,
 * le restaurant et le type restent ceux de la commande, ils restent, comme
 * le serveur les garde (`OrderService.update`). L'aperçu ne connaît pas le
 * client : une offre de livraison réservée à son niveau, ou limitée par
 * client, y est sautée, et l'écran aurait affiché d'autres frais que ceux
 * enregistrés. Livraison changée par l'agent, ou toute autre commande : les
 * frais de l'aperçu.
 */
export function fraisLivraisonRetenus(
  livraison: LivraisonFormulaire,
  apercu: number,
  fraisFiges?: (LivraisonFormulaire & { delivery_fee: number }) | null,
): number {
  if (!fraisFiges) return apercu;
  const memeLivraison =
    livraison.type === fraisFiges.type &&
    (livraison.restaurant_id ?? "") === (fraisFiges.restaurant_id ?? "") &&
    livraison.address.trim() === fraisFiges.address.trim();
  return memeLivraison ? fraisFiges.delivery_fee : apercu;
}
