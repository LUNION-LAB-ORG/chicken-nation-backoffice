/**
 * CARTE D'UNE COMMANDE SUR L'ÉCRAN COMMANDES, ONGLET « EN COURS » (demande du
 * 24/10 au soir : les cartes grossissaient à mesure que les informations
 * s'ajoutaient).
 *
 * La carte a une hauteur fixe de trois lignes, jamais de retour à la ligne :
 *  - L1 : référence, minuteur, montant ;
 *  - L2 : restaurant (siège sur « Tous »), client, type, canal en icône ;
 *  - L3 : UNE seule ligne, la plus utile (`ligneTrois`).
 * Le reste (téléphone, adresse, paiement) est dans le tiroir.
 *
 * Fichier pur : testé par `bun test`.
 */

// ⚠️ Import RELATIF entre features : `@/` pointe sur src/, `features/` est à la racine.
import { AVANCE_PREPARATION_MS, estProgrammee, momentSouhaite } from '../../orders/utils/momentSouhaite';
import { heureCourte } from './suivi-course';

/** Ce que la carte lit d'une commande (sous-ensemble de `Order`). */
export interface CommandeCarte {
  status: string;
  date?: string | null;
  time?: string | null;
  created_at?: string | null;
  fullname?: string | null;
  customer?: { first_name?: string | null; last_name?: string | null } | null;
}

export type TonLigne = 'ambre' | 'gris';

export interface LigneTrois {
  texte: string;
  ton: TonLigne;
}

/** « 12.500 F » : séparateur de milliers en point, comme le reste du backoffice. */
export function formatPrix(montant: number | null | undefined): string {
  const n = typeof montant === 'number' && Number.isFinite(montant) ? Math.round(montant) : 0;
  return `${n.toLocaleString('fr-FR').replace(/\s/g, '.')} F`;
}

/** Prénom et nom du client, sinon le nom saisi, sinon « Client ». */
export function nomClient(commande: Pick<CommandeCarte, 'fullname' | 'customer'>): string {
  const complet = [commande.customer?.first_name, commande.customer?.last_name]
    .map((v) => (typeof v === 'string' ? v.trim() : ''))
    .filter(Boolean)
    .join(' ');
  return complet || commande.fullname?.trim() || 'Client';
}

/** Statut en mots simples, pour la troisième ligne : « Nouvelle », « En préparation », « Prête ». */
export function libelleStatut(status: string | null | undefined): string {
  switch (status) {
    case 'PENDING':
    case 'ACCEPTED':
      return 'Nouvelle';
    case 'IN_PROGRESS':
      return 'En préparation';
    case 'READY':
      return 'Prête';
    case 'PICKED_UP':
      return 'Récupérée';
    case 'COLLECTED':
      return 'Livrée';
    case 'COMPLETED':
      return 'Terminée';
    case 'CANCELLED':
      return 'Annulée';
    default:
      return '';
  }
}

/** Statuts d'une commande pas encore prête : l'heure souhaitée y décide quand la préparer. */
const AVANT_PRETE = new Set(['PENDING', 'ACCEPTED', 'IN_PROGRESS']);

/**
 * Troisième ligne de la carte, une seule information, par priorité :
 *  1. commande programmée pas encore prête : « Plus tard · 20 h 00 » tant
 *     que la préparation n'est pas ouverte, « À préparer · 20 h 00 » ensuite
 *     (ambre) ;
 *  2. commande en cuisine attendue par une course retenue : « Attendue par
 *     Koffi, départ 12 h 44 » (ambre, texte de `attentesParCommande`) ;
 *  3. sinon le statut, en gris ; une commande prête n'en dit rien : elle
 *     est dans « Prêtes », la ligne reste vide (3.1).
 */
export function ligneTrois(
  commande: CommandeCarte,
  ctx: { maintenant: Date; attente?: string | null },
): LigneTrois {
  const moment = momentSouhaite(commande.date ?? null, commande.time ?? null);
  if (moment && AVANT_PRETE.has(commande.status) && estProgrammee(moment, commande.created_at ?? undefined)) {
    const ouverture = moment.getTime() - AVANCE_PREPARATION_MS;
    const plusTard = ctx.maintenant.getTime() < ouverture;
    // Heure murale d'Abidjan, gardée en UTC (`momentSouhaite`).
    return { texte: `${plusTard ? 'Plus tard' : 'À préparer'} · ${heureCourte(moment)}`, ton: 'ambre' };
  }
  if (ctx.attente) return { texte: ctx.attente, ton: 'ambre' };
  if (commande.status === 'READY') return { texte: '', ton: 'gris' };
  return { texte: libelleStatut(commande.status), ton: 'gris' };
}

/** Une commande prête depuis 30 min ou plus attend trop (même seuil que `isReadyLate`). */
export const PRETE_TROP_LONGTEMPS_MIN = 30;

/**
 * « Prête depuis 34 min », « Prête depuis 1 h 05 » pour la commande prête
 * depuis le plus longtemps, à partir de 30 min ; sinon null.
 */
export function preteDepuis(pretesA: readonly (string | null | undefined)[], maintenant: Date): string | null {
  const instants = pretesA.map((v) => (v ? Date.parse(v) : Number.NaN)).filter(Number.isFinite);
  if (instants.length === 0) return null;
  const minutes = Math.floor((maintenant.getTime() - Math.min(...instants)) / 60_000);
  if (minutes < PRETE_TROP_LONGTEMPS_MIN) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const duree = h === 0 ? `${m} min` : m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, '0')}`;
  return `Prête depuis ${duree}`;
}
