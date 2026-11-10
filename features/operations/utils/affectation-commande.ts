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
import { nomCourtRestaurant } from '../../restaurants/utils/nom-court';

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

// ============================================================
// LIVREURS D'UN AUTRE RESTAURANT (demande du 10/11)
// ============================================================

/**
 * Livreur d'un autre restaurant proposé à l'affectation : détecté près du
 * restaurant de la commande (renfort, règle du planificateur), ou déjà en
 * course pour lui. Son restaurant, et sa distance quand il est libre.
 */
export interface RenfortAffectation {
  restaurant_id: string | null;
  restaurant_name: string | null;
  /** À vol d'oiseau, en mètres ; `null` quand il est déjà en course pour ce restaurant. */
  distance_m: number | null;
}

/** « à 500 m du restaurant », « à 1,2 km du restaurant » ; null sans distance. */
export function distanceAuRestaurant(m: number | null | undefined): string | null {
  if (m === null || m === undefined || !Number.isFinite(m) || m < 0) return null;
  if (m < 1000) return `à ${Math.max(100, Math.round(m / 100) * 100)} m du restaurant`;
  return `à ${(m / 1000).toFixed(1).replace('.', ',')} km du restaurant`;
}

/**
 * Seconde ligne d'un livreur dans « Affecter à un livreur » :
 *  - du restaurant : « La commande rejoint sa course » en course, sinon son téléphone ;
 *  - d'un autre restaurant : « Livreur de FAYA », puis sa distance et son
 *    téléphone, ou « la commande rejoint sa course ».
 */
export function sousTitreAffectation(
  livreur: { phone?: string | null; renfort?: RenfortAffectation | null },
  enCourse: boolean,
): string {
  const telephone = livreur.phone?.trim() || null;
  if (!livreur.renfort) return enCourse ? 'La commande rejoint sa course' : (telephone ?? '');
  const nom = nomCourtRestaurant(livreur.renfort.restaurant_name);
  const origine = nom ? `Livreur de ${nom}` : "Livreur d'un autre restaurant";
  if (enCourse) return `${origine} · la commande rejoint sa course`;
  const ou = distanceAuRestaurant(livreur.renfort.distance_m);
  return [ou ? `${origine}, ${ou}` : origine, telephone].filter(Boolean).join(' · ');
}
