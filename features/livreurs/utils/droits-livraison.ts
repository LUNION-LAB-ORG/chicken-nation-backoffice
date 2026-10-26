/**
 * DROITS DE L'EXPLOITATION DES LIVRAISONS (conception du 24/10, section 4.3).
 *
 * Règle du client : un bouton n'apparaît que pour qui peut faire ce qu'il
 * appelle. Chaque clé est le miroir d'une garde du serveur :
 *
 *  - `voirLivraison` : En direct, Courses et Livreurs. Le serveur garde ces
 *    lectures par une liste de rôles (`ROLES_SUIVI_LIVRAISON` : ADMIN,
 *    LIVRAISON_OPS et, depuis le 26/10, CALL_CENTER), que le droit LIVREURS
 *    READ suit à l'identique ;
 *  - `voirPlanning`, `creerPlanning` : droit PLANNING du serveur ;
 *  - `piloterCourses` : liste de rôles des gestes de `course-admin.controller.ts`
 *    (`ROLES_ACTIONS_COURSES` : ADMIN et, depuis le 26/10, CALL_CENTER) pour
 *    forcer, relancer, réessayer, confier à Turbo, reprendre en interne,
 *    annuler ;
 *  - `gererLivreurs`, `supprimerLivreur` : `@UserRoles(ADMIN)` de
 *    `deliverers-admin.controller.ts`, l'administrateur seul ;
 *  - `modifierPlanning`, `supprimerPlanning` : droit PLANNING et
 *    cloisonnement. Un compte de restaurant (manager, assistant) ne touche
 *    qu'aux plannings de son restaurant ; le serveur refuse les autres (403).
 *
 * Centre d'appels (CALL_CENTER, demande du 26/10 : « oui le call center peut
 * agir dans livraison ») : compte du siège, il agit sur les courses et sur le
 * planning de tous les restaurants, comme l'administrateur. La gestion des
 * comptes des livreurs (valider, refuser, forcer l'activation, suspendre,
 * réactiver, changer de restaurant, supprimer) reste à l'administrateur, même
 * si un droit LIVREURS d'écriture lui arrivait. Les réglages du planificateur
 * sont dans Paramètres (droit SETTINGS), que le centre d'appels n'a pas. Ses
 * boutons « Appeler » suivent leur règle à part (`calls/utils/appel-livreur.ts`).
 *
 * LIVRAISON_OPS a la lecture seule partout : toutes les clés d'action sont
 * fausses pour lui, quels que soient les droits reçus.
 *
 * Serveur plus ancien, rien n'est inventé : le planning suit le droit
 * PLANNING (sans lui, seul l'ADMIN l'a, par ALL). Les gestes des courses n'ont
 * pas de droit à eux (liste de rôles) : le serveur qui les ouvre au centre
 * d'appels lui donne en même temps le planning en écriture. Sans ce droit, le
 * centre d'appels reste en lecture, sans bouton qui finirait en refus.
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

/**
 * Rôles qui consultent la livraison sans jamais y agir (miroir du serveur :
 * lecture de LIVREURS et PLANNING seulement, routes d'écriture refusées).
 */
const ROLES_LECTURE_SEULE: readonly string[] = ['LIVRAISON_OPS'];

/** Compte qui voit la livraison sans aucun bouton d'action. */
export function lectureSeuleLivraison(membre: MembreLivraison | null | undefined): boolean {
  return ROLES_LECTURE_SEULE.includes(membre?.role ?? '');
}

export interface DroitsLivraison {
  /** Menu En direct, Courses, Livreurs (lecture). */
  voirLivraison: boolean;
  /** Menu Planning (lecture). */
  voirPlanning: boolean;
  /** Forcer l'affectation, relancer, réessayer, confier à Turbo, reprendre en interne, annuler une course. */
  piloterCourses: boolean;
  /** Valider, refuser, forcer l'activation, suspendre, réactiver, changer le restaurant d'un livreur. */
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
  const role = membre?.role ?? '';
  // Lecture seule : aucune action, même si un droit d'écriture arrivait par erreur.
  const agir = (module: Modules, action: Action) => !lectureSeuleLivraison(membre) && can(module, action);
  const lireLivraison = can(Modules.LIVREURS, Action.READ);
  const modifierPlannings = agir(Modules.PLANNING, Action.UPDATE);
  const effacerPlannings = agir(Modules.PLANNING, Action.DELETE);
  // Comptes des livreurs : l'administrateur seul (`@UserRoles(ADMIN)`). Il
  // pilote aussi les courses, avec ce même droit.
  const administrateur = role === 'ADMIN';
  const gererComptes = administrateur && can(Modules.LIVREURS, Action.UPDATE);
  // Centre d'appels : les gestes des courses, dès que le serveur lui ouvre
  // l'écriture (le planning en écriture arrive avec elle).
  const centreAppelsAgit = role === 'CALL_CENTER' && lireLivraison && modifierPlannings;

  return {
    voirLivraison: lireLivraison,
    voirPlanning: can(Modules.PLANNING, Action.READ),
    piloterCourses: gererComptes || centreAppelsAgit,
    gererLivreurs: gererComptes,
    supprimerLivreur: administrateur && can(Modules.LIVREURS, Action.DELETE),
    creerPlanning: agir(Modules.PLANNING, Action.CREATE),
    modifierPlanning: (restaurantId) => modifierPlannings && peutAgirSurRestaurant(membre, restaurantId),
    supprimerPlanning: (restaurantId) => effacerPlannings && peutAgirSurRestaurant(membre, restaurantId),
  };
}
