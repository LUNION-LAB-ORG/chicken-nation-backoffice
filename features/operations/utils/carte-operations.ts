/**
 * CE QUE MONTRE LA CARTE D'UNE COMMANDE (onglet « En cours » de l'écran
 * Commandes). Mêmes mots et même ordre que la carte que les équipes
 * connaissent :
 *
 *   minuteur · référence ........................ montant (« 12.500 F »)
 *              ligne de suivi (« Plus tard · 20h00 », « Attendue par… »)
 *   STATUT · type (« À livrer ») · origine (« Site web », « Appli », « Manuel ») · « En retard »
 *   restaurant (compte du siège)
 *   client · téléphone
 *   adresse (commande à livrer)
 *   « Faire le paiement » ou « Paiement en attente »
 *
 * Demande du 24/10 : la carte ne grossit plus quand une information
 * s'ajoute. Chaque information tient sur UNE ligne, coupée proprement (le
 * texte entier en infobulle, le détail au tiroir) ; la ligne de suivi prend
 * la place libre à côté du minuteur, elle existe toujours.
 *
 * Fichier pur : testé par `bun test`.
 */

// ⚠️ Import RELATIF entre features : `@/` pointe sur src/, `features/` est à la racine.
import { AVANCE_PREPARATION_MS, estProgrammee, momentSouhaite } from '../../orders/utils/momentSouhaite';

/** Ce que la carte lit d'une commande (sous-ensemble de `Order`). */
export interface CommandeCarte {
  status: string;
  amount?: number | null;
  paied?: boolean | null;
  payment_method?: string | null;
  date?: string | Date | null;
  time?: string | null;
  created_at?: string | null;
  fullname?: string | null;
  customer?: { first_name?: string | null; last_name?: string | null } | null;
  address?: unknown;
  restaurant?: { name?: string | null } | null;
}

/**
 * Libellés alignés sur le mapper `orderMapper.ts` de la page Commandes :
 * aucune divergence tolérée, on affiche partout exactement ce que la page
 * Commandes affiche pour un statut donné.
 */
export const LIBELLES_STATUT: Record<string, string> = {
  PENDING: 'EN ATTENTE',
  ACCEPTED: 'NOUVELLE',
  IN_PROGRESS: 'EN PRÉPARATION',
  READY: 'PRÊT',
  PICKED_UP: 'EN LIVRAISON',
  COLLECTED: 'RÉCUPÉRÉE',
  COMPLETED: 'TERMINÉE',
  CANCELLED: 'ANNULÉE',
};

/** Statut de la pastille, en majuscules ; statut inconnu : sa valeur brute. */
export function libelleStatutCarte(status: string | null | undefined): string {
  return (status && LIBELLES_STATUT[status]) || status || '';
}

/** « 12.500 F » : montant de la carte, comme avant. */
export function formatPrix(n: number | null | undefined): string {
  const montant = typeof n === 'number' && Number.isFinite(n) ? n : 0;
  return montant.toLocaleString('fr-FR').replace(/\s/g, '.') + ' F';
}

/** Prénom et nom du client, sinon le nom saisi, sinon « Client ». */
export function nomClientCarte(commande: Pick<CommandeCarte, 'fullname' | 'customer'>): string {
  const complet = [commande.customer?.first_name, commande.customer?.last_name].filter(Boolean).join(' ').trim();
  return complet || commande.fullname || 'Client';
}

/**
 * Nom du restaurant sur la carte, entier : pour un compte du siège (admin,
 * centre d'appels), qui voit les commandes de tous les restaurants. Compte
 * de restaurant : rien, il ne voit que le sien.
 */
export function restaurantDeLaCarte(
  commande: Pick<CommandeCarte, 'restaurant'>,
  typeDuMembre: string | null | undefined,
): string | null {
  return typeDuMembre === 'BACKOFFICE' ? commande.restaurant?.name || null : null;
}

/** Adresse de livraison en texte (champ `address` en JSON ou en texte) ; vide si inconnue. */
export function adresseCourte(commande: Pick<CommandeCarte, 'address'>): string {
  const brute = commande.address;
  try {
    const adresse = typeof brute === 'string' ? JSON.parse(brute) : brute;
    const texte = (adresse as { address?: unknown } | null)?.address;
    return typeof texte === 'string' ? texte : '';
  } catch {
    return typeof brute === 'string' ? brute : '';
  }
}

/** Commandes encaissables depuis la carte : déjà récupérées ou livrées. */
const ENCAISSABLES = new Set(['PICKED_UP', 'COLLECTED', 'COMPLETED']);

/**
 * Pied de la carte :
 *  - payée : rien ;
 *  - non payée, paiement à la livraison, déjà récupérée ou livrée : bouton
 *    « Faire le paiement » (ouvre le tiroir sur Paiement) ;
 *  - non payée dans les autres cas : « Paiement en attente ».
 */
export function actionPaiement(commande: Pick<CommandeCarte, 'paied' | 'payment_method' | 'status'>): 'payer' | 'attente' | null {
  if (commande.paied) return null;
  return commande.payment_method === 'OFFLINE' && ENCAISSABLES.has(commande.status) ? 'payer' : 'attente';
}

/** « 20h00 » : heure murale d'Abidjan (UTC+0, `momentSouhaite`), écrite comme avant. */
const heure = (d: Date): string =>
  `${String(d.getUTCHours()).padStart(2, '0')}h${String(d.getUTCMinutes()).padStart(2, '0')}`;

export interface Programmee {
  /** « Plus tard · 20h00 » tant que la préparation n'est pas ouverte, « À préparer · 20h00 » ensuite. */
  texte: string;
  /** Infobulle : « À traiter plus tard : préparation à partir de 19h00 », « La préparation peut commencer ». */
  titre: string;
  plusTard: boolean;
}

/** Commande programmée (à traiter plus tard), sinon null. */
export function commandeProgrammee(
  commande: Pick<CommandeCarte, 'date' | 'time' | 'created_at'>,
  maintenant: Date,
): Programmee | null {
  const moment = momentSouhaite(commande.date ?? null, commande.time ?? null);
  if (!moment || !estProgrammee(moment, commande.created_at ?? undefined)) return null;
  const ouverture = new Date(moment.getTime() - AVANCE_PREPARATION_MS);
  const plusTard = maintenant.getTime() < ouverture.getTime();
  return {
    texte: `${plusTard ? 'Plus tard' : 'À préparer'} · ${heure(moment)}`,
    titre: plusTard ? `À traiter plus tard : préparation à partir de ${heure(ouverture)}` : 'La préparation peut commencer',
    plusTard,
  };
}
