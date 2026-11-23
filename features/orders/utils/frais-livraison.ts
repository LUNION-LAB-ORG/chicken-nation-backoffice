import { fraisLivraisonRetenus, LivraisonFormulaire } from "./bascule";

/**
 * FRAIS DE LIVRAISON DU FORMULAIRE DE COMMANDE (23/11).
 *
 * Trois sources, par ordre de priorité :
 *  1. ce que l'agent a saisi dans le champ, zéro compris (livraison offerte) :
 *     plus rien ne l'écrase, ni l'aperçu ni un changement de panier ;
 *  2. en modification, les frais ENREGISTRÉS avec la commande, tant que sa
 *     livraison (type, adresse, restaurant) reste la même : ouvrir une
 *     commande ne refait plus son calcul ;
 *  3. l'aperçu du serveur (`GET /orders/frais-livraison`) : nouvelle commande,
 *     ou livraison changée par l'agent.
 *
 * Tout est pur : aucun état, aucun appel réseau.
 */

/** Livraison et frais de la commande modifiée, tels qu'enregistrés. */
export type FraisEnregistres = LivraisonFormulaire & { delivery_fee: number };

/** La livraison du formulaire est-elle encore celle de la commande enregistrée ? */
export const livraisonInchangee = (
  livraison: LivraisonFormulaire,
  enregistres?: FraisEnregistres | null,
): boolean =>
  !!enregistres &&
  livraison.type === enregistres.type &&
  (livraison.restaurant_id ?? "") === (enregistres.restaurant_id ?? "") &&
  livraison.address.trim() === enregistres.address.trim();

/**
 * Frais que l'écran pose de lui-même, ou `undefined` s'il n'a rien à poser
 * (saisie de l'agent, ou aperçu pas encore arrivé pour une livraison nouvelle).
 */
export function fraisAutomatiques(args: {
  livraison: LivraisonFormulaire;
  /** Frais calculés par le serveur pour maintenant, s'il a répondu. */
  apercu?: number;
  /** Modification : livraison et frais de la commande. */
  enregistres?: FraisEnregistres | null;
  /** L'agent a écrit dans le champ. */
  saisis: boolean;
}): number | undefined {
  const { livraison, apercu, enregistres, saisis } = args;
  if (saisis) return undefined;
  // Les frais enregistrés n'attendent pas l'aperçu : ils sont déjà connus.
  if (livraisonInchangee(livraison, enregistres)) return enregistres!.delivery_fee;
  if (apercu === undefined) return undefined;
  return fraisLivraisonRetenus(livraison, apercu, enregistres);
}

/** Valeur du champ : vide quand rien n'est posé, « 0 » pour une livraison offerte. */
export const valeurChampFrais = (frais?: number | null): string =>
  frais === undefined || frais === null ? "" : String(frais);

/**
 * Lecture de la saisie : champ vidé, rien n'est posé (le serveur calculera) ;
 * sinon un montant jamais négatif (le serveur refuse des frais sous zéro).
 */
export const lireSaisieFrais = (saisie: string): number | undefined => {
  if (saisie.trim() === "") return undefined;
  const montant = Number(saisie);
  return Number.isFinite(montant) ? Math.max(0, montant) : 0;
};

/** Ce que le champ dit sous lui, selon l'origine des frais affichés. */
export function aideFrais(args: {
  /** Frais acceptés par le client sur le site, livraison inchangée : champ fermé. */
  verrouilles: boolean;
  /** L'agent a écrit dans le champ. */
  saisis: boolean;
  /** Modification, livraison inchangée, champ jamais touché. */
  enregistres: boolean;
  /** Distance de l'aperçu, en kilomètres. */
  distance?: number;
}): string | null {
  if (args.verrouilles) {
    return "Frais acceptés par le client sur le site : ils restent tant que l'adresse et le restaurant ne changent pas.";
  }
  if (args.saisis) {
    return "Montant saisi à la main : il n'est plus recalculé. « Auto » remet les frais calculés.";
  }
  if (args.enregistres) {
    return "Frais enregistrés avec la commande : ils ne sont pas recalculés. Modifiez le champ pour changer le montant.";
  }
  if (args.distance !== undefined) {
    return `Calculé automatiquement selon la zone (${args.distance.toFixed(1)} km). Modifiez le champ pour forcer un autre montant.`;
  }
  return null;
}
