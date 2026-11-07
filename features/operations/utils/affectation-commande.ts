/**
 * « AFFECTER À UN LIVREUR » : qui peut recevoir la commande (demande du 06/11).
 *
 * Miroir de `refusLivreurAffectation` du serveur. Un livreur en course peut
 * toujours la recevoir, seul un compte inactif est refusé. Sans course, la
 * pause, le hors service et un téléphone injoignable refusent aussi. Appli
 * fermée ou coupée, offre en attente, en appel : jamais un refus, il est
 * prévenu par notification et son offre est close sans pénalité.
 *
 * Fichier pur : testé par `bun test`.
 */

// ⚠️ Import RELATIF entre features : `@/` pointe sur src/, `features/` est à la racine.
import type { DisponibiliteLivreur, EtatDisponibilite } from '../../livreurs/types/livreur.types';

const REFUS_SANS_COURSE: ReadonlySet<EtatDisponibilite> = new Set<EtatDisponibilite>([
  'INACTIF',
  'EN_PAUSE',
  'PAUSE_AUTO',
  'HORS_SERVICE',
  'INJOIGNABLE',
]);

export function peutRecevoirCommande(d: DisponibiliteLivreur | null | undefined): boolean {
  // Serveur plus ancien, état inconnu : le serveur tranchera.
  if (!d) return true;
  if (d.etat === 'INACTIF') return false;
  if (d.en_course) return true;
  return !REFUS_SANS_COURSE.has(d.etat);
}
