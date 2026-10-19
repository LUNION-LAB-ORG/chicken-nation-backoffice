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
