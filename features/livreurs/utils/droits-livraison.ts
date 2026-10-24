/**
 * DROITS DE L'EXPLOITATION DES LIVRAISONS (conception du 24/10, section 4.3).
 *
 * Règle du client : un bouton n'apparaît que pour qui peut faire ce qu'il
 * appelle. Chaque clé est le miroir d'une garde du serveur :
 *
 *  - `voirLivraison` : En direct, Courses et Livreurs. Le serveur garde ces
 *    lectures par une liste de rôles (`ROLES_SUIVI_LIVRAISON` : ADMIN et
 *    LIVRAISON_OPS), que le droit LIVREURS READ suit à l'identique ;
 *  - `voirPlanning`, `creerPlanning` : droit PLANNING du serveur ;
 *  - `piloterCourses` : `@UserRoles(ADMIN)` de `course-admin.controller.ts`
 *    (forcer, relancer, Turbo, reprendre en interne, annuler) ;
 *  - `gererLivreurs`, `supprimerLivreur` : `@UserRoles(ADMIN)` de
 *    `deliverers-admin.controller.ts` ;
 *  - `modifierPlanning`, `supprimerPlanning` : droit PLANNING et
 *    cloisonnement. Un compte de restaurant (manager, assistant) ne touche
 *    qu'aux plannings de son restaurant ; le serveur refuse les autres (403).
 *
 * LIVRAISON_OPS a la lecture seule partout : toutes les clés d'action sont
 * fausses pour lui.
 *
 * Tant que le serveur ne renvoie pas le droit PLANNING (serveur pas encore
 * déployé), seul l'ADMIN l'a (par ALL) : le planning disparaît pour les
 * autres, rien n'est inventé.
 *
 * Fichier pur (aucun React), testé par `bun test`. Le crochet est
 * `useDroitsLivraison` (`../hook/use-droits-livraison.ts`).
 */

import { Action, Modules } from '../../users/types/auth.type';
import { estCompteDeRestaurant } from '../../operations/utils/code-retrait';

/** `can` du magasin des droits (`authStore`). */
export type PeutFaire = (module: Modules, action: Action) => boolean;

/** Ce qu'il faut savoir du compte connecté pour le cloisonnement. */
export interface MembreLivraison {
  type?: string | null;
  role?: string | null;
  restaurant_id?: string | null;
}

export interface DroitsLivraison {
  /** Menu En direct, Courses, Livreurs (lecture). */
  voirLivraison: boolean;
  /** Menu Planning (lecture). */
  voirPlanning: boolean;
  /** Forcer l'affectation, relancer, confier à Turbo, reprendre en interne, annuler une course. */
  piloterCourses: boolean;
  /** Valider, refuser, suspendre, réactiver, affecter un livreur. */
  gererLivreurs: boolean;
  /** Supprimer un livreur. */
  supprimerLivreur: boolean;
  /** Bouton « Nouveau planning ». */
  creerPlanning: boolean;
  /** Envoyer, confirmer, archiver, dates, ajouter, retirer, changer un jour, sur le planning de ce restaurant. */
  modifierPlanning: (restaurantId: string | null | undefined) => boolean;
  /** Supprimer le planning de ce restaurant. */
  supprimerPlanning: (restaurantId: string | null | undefined) => boolean;
}

/**
 * Le compte peut-il agir sur ce restaurant ? Un compte du siège : tous. Un
 * compte de restaurant : le sien seulement (règle `assertCanAccessRestaurant`
 * du serveur) ; sans restaurant rattaché, aucun.
 */
export function peutAgirSurRestaurant(
  membre: MembreLivraison | null | undefined,
  restaurantId: string | null | undefined,
): boolean {
  if (!membre) return false;
  if (!estCompteDeRestaurant(membre)) return true;
  return !!restaurantId && !!membre.restaurant_id && restaurantId === membre.restaurant_id;
}

export function droitsLivraison({
  can,
  membre,
}: {
  can: PeutFaire;
  membre: MembreLivraison | null | undefined;
}): DroitsLivraison {
  const lireLivraison = can(Modules.LIVREURS, Action.READ);
  const modifierLivreurs = can(Modules.LIVREURS, Action.UPDATE);
  const modifierPlannings = can(Modules.PLANNING, Action.UPDATE);
  const effacerPlannings = can(Modules.PLANNING, Action.DELETE);

  return {
    voirLivraison: lireLivraison,
    voirPlanning: can(Modules.PLANNING, Action.READ),
    piloterCourses: modifierLivreurs,
    gererLivreurs: modifierLivreurs,
    supprimerLivreur: can(Modules.LIVREURS, Action.DELETE),
    creerPlanning: can(Modules.PLANNING, Action.CREATE),
    modifierPlanning: (restaurantId) => modifierPlannings && peutAgirSurRestaurant(membre, restaurantId),
    supprimerPlanning: (restaurantId) => effacerPlannings && peutAgirSurRestaurant(membre, restaurantId),
  };
}
