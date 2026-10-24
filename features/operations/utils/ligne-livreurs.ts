/**
 * LIGNE LIVREURS DE L'ÉCRAN COMMANDES (conception du 24/10, 6.2), règle pure
 * testée par `bun test`.
 *
 * Une pastille par livreur en service du restaurant affiché, couleur de son
 * état : « Koffi au restaurant », « Koffi vers le restaurant », « Awa en
 * livraison », « Yao 1er de la file », « Inès offre en attente », « Koffi en
 * appel », « Diane en pause », « Ali appli fermée ». Hors service et inactifs
 * n'y sont pas.
 *
 * Données : `restaurants[].liste[]` de `GET /livraison/tableau`, déjà
 * rangées par le serveur (état, puis place dans la file) : l'ordre est gardé.
 */

import { etatAffichable } from '../../courses/utils/tableau-livraison';
import type { LivreurDuTableau } from '../../courses/types/tableau-livraison.types';
import type { EtatDisponibilite } from '../../livreurs/types/livreur.types';
import { estEnService, placeDansLaFile } from '../../livreurs/utils/livreurs-du-jour';
import { estCompteDeRestaurant } from './code-retrait';

export interface PastilleLivreur {
  id: string;
  etat: EtatDisponibilite;
  /** « Koffi au restaurant ». */
  texte: string;
}

export const AUCUN_LIVREUR_EN_SERVICE = 'Aucun livreur en service';

/**
 * Restaurant dont la ligne montre les livreurs : le sien pour un compte de
 * restaurant (même si un autre est resté choisi dans le navigateur), celui
 * choisi pour un compte du siège ; null sur « Tous les restaurants » (pas de
 * ligne).
 */
export function restaurantDeLaLigne(
  membre: { type?: string | null; role?: string | null; restaurant_id?: string | null } | null | undefined,
  restaurantChoisi: string | null | undefined,
): string | null {
  if (estCompteDeRestaurant(membre)) return membre?.restaurant_id || null;
  return restaurantChoisi || null;
}

/** Ce que fait le livreur, après son prénom. */
function activite(l: LivreurDuTableau, etat: EtatDisponibilite): string {
  switch (etat) {
    case 'EN_COURSE':
      if (l.course?.statut === 'AT_RESTAURANT') return 'au restaurant';
      if (l.course?.statut === 'ACCEPTED') return 'vers le restaurant';
      return 'en livraison';
    case 'DISPONIBLE':
      return placeDansLaFile(l.rang_file) ?? 'disponible';
    case 'OFFRE_EN_ATTENTE':
      return 'offre en attente';
    case 'EN_APPEL':
      return 'en appel';
    case 'EN_PAUSE':
      return 'en pause';
    case 'PAUSE_AUTO':
      return 'pause automatique';
    case 'APPLI_FERMEE':
      return 'appli fermée';
    default:
      return 'hors service';
  }
}

/** « Koffi au restaurant » ; « Livreur … » sans prénom. */
export function texteLivreurDeLigne(l: LivreurDuTableau): string {
  const etat = etatAffichable(l.etat);
  return `${l.prenom?.trim() || 'Livreur'} ${activite(l, etat)}`;
}

/** Pastilles des livreurs en service, dans l'ordre du serveur. */
export function pastillesLivreurs(liste: readonly LivreurDuTableau[]): PastilleLivreur[] {
  return liste
    .map((l) => ({ l, etat: etatAffichable(l.etat) }))
    .filter(({ etat }) => estEnService(etat))
    .map(({ l, etat }) => ({ id: l.id, etat, texte: texteLivreurDeLigne(l) }));
}
