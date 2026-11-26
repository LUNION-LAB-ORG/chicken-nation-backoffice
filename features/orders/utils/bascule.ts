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
  "orderType" | "rawStatus" | "paied" | "paiements" | "paymentChannel" | "amount" | "auto" | "channel" | "a_confirmer"
>;

/**
 * Les deux façons d'être « à confirmer » : la commande vient du site, comme
 * avant, ou elle porte le repère posé à la création (26/11, application
 * comprise, quand le réglage demande une confirmation). Jumeau de
 * `siteOuRepere` côté serveur.
 */
export const siteOuRepere = (commande: Pick<OrderTable, "channel" | "a_confirmer">): boolean =>
  commande.channel === "WEB" || commande.a_confirmer === true;

/**
 * Commande à payer à la réception (du site, ou de l'application avec le
 * repère), que le centre d'appels n'a pas encore confirmée : jumeau de
 * `estAConfirmer` côté serveur
 * (backend/src/modules/order/helpers/paiement-livraison.rules.ts). Sur une
 * commande du client, « Restaurant » veut dire paiement OFFLINE
 * (`utils/orderMapper`).
 */
export function estAConfirmer(
  commande: Pick<OrderTable, "auto" | "channel" | "a_confirmer" | "paymentChannel" | "paied" | "rawStatus">,
): boolean {
  return (
    !!commande.auto &&
    siteOuRepere(commande) &&
    commande.paymentChannel === "Restaurant" &&
    !commande.paied &&
    commande.rawStatus === OrderStatus.PENDING
  );
}

/**
 * Ce que deviendra la commande si elle passe au call center.
 *
 * Demande du 24/10 : la taxe tombe à zéro et le total est refait, y compris
 * pour une commande du site à payer à la livraison ou une livraison déjà
 * prête. Le MONTANT ne reste tel quel que pour une commande déjà payée
 * (`payee`). Une livraison déjà confiée à Turbo garde aussi son montant :
 * l'écran ne le sait pas, le serveur le dit à l'agent après l'enregistrement.
 *
 * `fraisDuSite` : commande du site à payer à la livraison ; ses frais de
 * LIVRAISON restent tant que la livraison ne change pas (serveur, même règle).
 *
 * Le PAIEMENT passe à la caisse quand la commande était payable dans
 * l'application, qu'il reste à payer, et qu'aucun encaissement de livreur
 * n'attend sa confirmation. Un paiement en ligne partiel ne l'empêche pas :
 * la caisse encaisse le reste. `paymentChannel` vaut « Appli » pour une
 * commande de l'application payable en ligne.
 */
export function apresBascule(commande: CommandeBascule): {
  montantFige: "payee" | null;
  fraisDuSite: boolean;
  paiement: "caisse" | "livreur" | "inchange";
} {
  // Du site, ou de l'application à confirmer : le client a validé ces frais.
  const fraisDuSite =
    !commande.paied && siteOuRepere(commande) && commande.paymentChannel === "Restaurant" && !!commande.auto;
  const montantFige = commande.paied ? "payee" : null;

  const paiements = commande.paiements ?? [];
  const dejaPercu = paiements
    .filter((p) => p.status === PaiementStatus.SUCCESS)
    .reduce((somme, p) => somme + (p.total ?? p.amount ?? 0), 0);
  let paiement: "caisse" | "livreur" | "inchange" = "inchange";
  if (commande.paymentChannel === "Appli" && !commande.paied && commande.amount - dejaPercu > 50) {
    paiement = paiements.some((p) => p.status === PaiementStatus.PENDING) ? "livreur" : "caisse";
  }
  return { montantFige, fraisDuSite, paiement };
}

/**
 * Commande annulée par son client sans avoir payé : le seul cas où une
 * commande annulée se reprend au téléphone. Panier de l'application payable
 * en ligne, ou commande du site à payer à la livraison. Le serveur reste juge
 * (409 si la commande n'est plus relançable).
 */
export function panierAnnuleParLeClient(
  commande: Pick<OrderTable, "rawStatus" | "auto" | "paymentChannel" | "paied" | "channel" | "a_confirmer">,
): boolean {
  return (
    commande.rawStatus === OrderStatus.CANCELLED &&
    commande.auto &&
    (commande.paymentChannel === "Appli" ||
      (siteOuRepere(commande) && commande.paymentChannel === "Restaurant")) &&
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
 * le serveur les garde (`OrderService.update`). L'aperçu, lui, calcule pour
 * maintenant : une offre finie ou épuisée depuis y serait sautée, et l'écran
 * aurait affiché d'autres frais que ceux enregistrés. Livraison changée par
 * l'agent, ou nouvelle commande : les frais de l'aperçu.
 *
 * Depuis le 23/11, TOUTE commande modifiée passe ici avec ses frais
 * enregistrés (`utils/frais-livraison.ts`, qui ajoute la saisie de l'agent) :
 * ouvrir une commande ne refait plus le calcul de ses frais.
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
