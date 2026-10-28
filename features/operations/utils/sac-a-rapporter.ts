/**
 * « SAC RAPPORTÉ » (demande du 28/10, contrat `sac-rapporte-contrat.md`).
 *
 * Le livreur a annulé la livraison d'un client (« Annuler » de sa feuille
 * « Problème ») : la commande reste en livraison, le sac est chez lui. Quand
 * il le rapporte, le restaurant (ou l'admin) touche « Sac rapporté » : la
 * commande redevient prête et le planificateur la reprend dans une nouvelle
 * course (`POST /courses/operations/commandes/:orderId/sac-rapporte`).
 *
 * Champ lu : `sac_a_rapporter` de `GET /orders/operations/active`, rempli
 * pour une commande en livraison dont la livraison a été annulée par le
 * livreur, `null` sinon. ABSENT (serveur ancien) : rien ne s'affiche, le
 * geste est caché.
 *
 * Droit du geste : miroir du serveur (ADMIN, MANAGER, ASSISTANT_MANAGER,
 * CAISSIER), jamais le centre d'appels ni le suivi des livraisons.
 *
 * Fichier pur : testé par `bun test`.
 */

// ⚠️ Import RELATIF entre features : `@/` pointe sur src/, `features/` est à la racine.
import type { DeliveryFailureReason } from '../../courses/types/course.types';
import { peutConfirmerRecuperation } from './code-retrait';

export interface SacARapporter {
  livreur: { id: string; prenom: string | null; nom: string | null } | null;
  /** Heure de l'annulation par le livreur (ISO). */
  depuis: string | null;
  motif: DeliveryFailureReason | null;
}

/** Réponse du geste ; `deja` : rejeu (double toucher, seconde caisse), rien n'a été refait. */
export interface ReponseSacRapporte {
  order_id: string;
  reference: string;
  status: 'READY';
  livreur: { id: string; prenom: string | null } | null;
  deja: boolean;
}

export const LIBELLE_SAC_RAPPORTE = 'Sac rapporté';

const texte = (valeur: unknown): string | null => (typeof valeur === 'string' ? valeur : null);

/** Sac à rapporter d'une commande de la liste des Opérations, ou null (pas de sac, ou serveur ancien). */
export function sacARapporter(commande: { sac_a_rapporter?: unknown } | null | undefined): SacARapporter | null {
  const sac = commande?.sac_a_rapporter;
  if (!sac || typeof sac !== 'object') return null;
  const brut = sac as Record<string, unknown>;
  const livreur = brut.livreur && typeof brut.livreur === 'object' ? (brut.livreur as Record<string, unknown>) : null;
  return {
    livreur:
      livreur && typeof livreur.id === 'string'
        ? { id: livreur.id, prenom: texte(livreur.prenom), nom: texte(livreur.nom) }
        : null,
    depuis: texte(brut.depuis),
    motif: texte(brut.motif) as DeliveryFailureReason | null,
  };
}

/** Encadré du tiroir : « Sac à rapporter par Koffi », sans prénom « Sac à rapporter ». */
export function texteSacARapporter(sac: SacARapporter): string {
  const prenom = sac.livreur?.prenom?.trim();
  return prenom ? `Sac à rapporter par ${prenom}` : 'Sac à rapporter';
}

/** Toast de réussite, le même que la caisse : « Sac rapporté : ORD-123 de nouveau prête ». */
export function texteSacRapporte(reference: string | null | undefined): string {
  return reference ? `${LIBELLE_SAC_RAPPORTE} : ${reference} de nouveau prête` : LIBELLE_SAC_RAPPORTE;
}

/** Qui voit le bouton : droit de changer le statut ET rôle admis par le serveur. */
export function peutRapporterSac(
  peutChangerStatut: boolean,
  membre: { role?: string | null } | null | undefined,
): boolean {
  return peutChangerStatut && peutConfirmerRecuperation(membre);
}
