/**
 * RETENUE EN DEUX LIGNES COURTES (groupe d'une course et pied du tiroir).
 *
 * Demande du 24/10 (« reste simple ») : la caissière n'a besoin que de savoir
 * quelle commande préparer en priorité et pour quand : « Attendre CMD-B, prête
 * vers 12 h 41 ». Le nom du livreur et le code de retrait sont déjà ailleurs
 * sur la carte : ils ne sont pas répétés.
 *
 * Demande du 27/10 : l'attente du livreur avant son départ est dite sous la
 * ligne de la retenue : « Départ au plus tard 12 h 44 », les mêmes mots que la
 * carte en cuisine. Les commandes déjà dans la course sont les cartes du
 * groupe, celles qui la rejoindront sont nommées par la première ligne : pas
 * de liste en plus.
 *
 * Fichier pur : testé par `bun test`.
 */

import { enumerer, heureCourte, retenueEnCours, type CourseOperations } from './suivi-course';

/**
 * « Attendre CMD-B, prête vers 12 h 41 » ; heure inconnue ou déjà passée :
 * « Attendre CMD-B » ; plusieurs : « Attendre CMD-B et CMD-C, prêtes vers
 * 12 h 43 » (la plus tardive, seulement si chacune a son heure à venir).
 * Retenue « trajet long » donnée par le serveur : « Trajet long : attendre
 * CMD-B, prête vers 12 h 55 ». Pas de retenue en cours : null.
 */
export function ligneRetenue(course: CourseOperations, maintenant: Date): string | null {
  const retenue = retenueEnCours(course, maintenant);
  if (!retenue) return null;

  const references = retenue.attendues.map((a) => a.reference);
  // Une heure passée ne dit plus rien (l'estimation recule en cuisine) : inconnue.
  const heures = retenue.attendues.map((a) => (a.prete_vers ? Date.parse(a.prete_vers) : Number.NaN));
  const toutesAVenir = heures.length > 0 && heures.every((h) => Number.isFinite(h) && h > maintenant.getTime());
  const plusieurs = references.length > 1;
  const prete = toutesAVenir
    ? `, ${plusieurs ? 'prêtes' : 'prête'} vers ${heureCourte(new Date(Math.max(...heures)))}`
    : '';

  return `${retenue.trajetLong ? 'Trajet long : attendre' : 'Attendre'} ${enumerer(references)}${prete}`;
}

/**
 * Seconde ligne de la retenue (demande du 27/10) : « Départ au plus tard
 * 12 h 44 », l'échéance de la retenue (`retenue_jusqua`), la même dans tous les
 * cas. Pas de retenue en cours : null.
 */
export function ligneDepart(course: CourseOperations, maintenant: Date): string | null {
  const retenue = retenueEnCours(course, maintenant);
  if (!retenue) return null;
  return `Départ au plus tard ${heureCourte(retenue.jusqua)}`;
}
