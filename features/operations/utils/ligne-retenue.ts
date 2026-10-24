/**
 * RETENUE EN UNE LIGNE COURTE (carte d'une course et pied du tiroir, demande
 * du 24/10 : « reste simple »).
 *
 * La caissière n'a besoin que de savoir quelle commande préparer en priorité
 * et pour quand : « Attendre CMD-B, prête vers 12 h 41 ». L'heure limite du
 * départ, le nom du livreur et le code de retrait sont déjà ailleurs sur la
 * carte : ils ne sont pas répétés.
 *
 * Fichier pur : testé par `bun test`.
 */

import { enumerer, heureCourte, retenueEnCours, type CourseOperations } from './suivi-course';

/**
 * « Attendre CMD-B, prête vers 12 h 41 » ; heure inconnue : « Attendre CMD-B » ;
 * plusieurs : « Attendre CMD-B et CMD-C, prêtes vers 12 h 43 » (la plus
 * tardive, seulement si chacune a son heure). Retenue « trajet long » donnée
 * par le serveur : « Trajet long : attendre CMD-B, prête vers 12 h 55 ».
 * Pas de retenue en cours : null.
 */
export function ligneRetenue(course: CourseOperations, maintenant: Date): string | null {
  const retenue = retenueEnCours(course, maintenant);
  if (!retenue) return null;

  const references = retenue.attendues.map((a) => a.reference);
  const heures = retenue.attendues.map((a) => (a.prete_vers ? Date.parse(a.prete_vers) : Number.NaN));
  const toutesConnues = heures.length > 0 && heures.every((h) => Number.isFinite(h));
  const plusieurs = references.length > 1;
  const prete = toutesConnues
    ? `, ${plusieurs ? 'prêtes' : 'prête'} vers ${heureCourte(new Date(Math.max(...heures)))}`
    : '';

  return `${retenue.trajetLong ? 'Trajet long : attendre' : 'Attendre'} ${enumerer(references)}${prete}`;
}
