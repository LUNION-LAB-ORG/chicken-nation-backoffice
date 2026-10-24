/**
 * PHRASES DES ALERTES DE LA LIVRAISON (conception du 24/10, 9.2 et 10.1),
 * règle pure testée par `bun test`.
 *
 * Une alerte du serveur (`signaux[]` de `GET /livraison/tableau`) se lit en
 * deux lignes :
 *  - L1 : ce qui ne va pas, « Koffi : tournée en retard de 12 min » ;
 *  - L2 : où, « Angré · CRS-241024-0042 ». Quand un seul restaurant est
 *    affiché, son nom part de L2.
 *
 * « À traiter » (écran Courses) montre la référence dans sa propre colonne :
 * `situationCourse` donne la même phrase sans elle.
 *
 * Mots de la section 3.3 : « Sans livreur », « Aucun livreur trouvé »,
 * « Au restaurant », « À encaisser ». Heures et durées comme le serveur
 * (« 9 min », « 1 h 05 »).
 */

import { vueIlYa } from '../../livreurs/utils/disponibilite';
import type { SignalLivraison } from '../types/tableau-livraison.types';
import { dureeLisible, estExpiree } from './tableau-livraison';

export interface TexteSignal {
  /** L1 : la phrase. */
  titre: string;
  /** L2 : restaurant, course, ou heure de l'appli ; vide s'il n'y a rien à dire. */
  detail: string;
}

export interface ContexteTexte {
  /** Nom du restaurant de l'alerte ; omis (ou null) quand un seul restaurant est affiché. */
  restaurant?: string | null;
  /** Pour « vue il y a 6 min ». */
  maintenant?: Date;
}

/** « Koffi », sinon « Livreur » (début de phrase « Livreur : … »). */
const nom = (s: SignalLivraison): string => s.livreur?.prenom?.trim() || 'Livreur';
/** « Koffi », sinon « Le livreur » (début de phrase « Le livreur attend… »). */
const sujet = (s: SignalLivraison): string => s.livreur?.prenom?.trim() || 'Le livreur';
const reference = (s: SignalLivraison): string => s.course?.reference ?? 'Course';

/** « ORD-1 », « ORD-1 et ORD-2 », « ORD-1, ORD-2 et ORD-3 ». */
function enumerer(elements: readonly string[]): string {
  const liste = elements.filter(Boolean);
  if (liste.length <= 1) return liste[0] ?? '';
  return `${liste.slice(0, -1).join(', ')} et ${liste[liste.length - 1]}`;
}

const nombreCommandes = (n: number): string => (n > 1 ? `${n} commandes` : `${n} commande`);

/** « depuis 9 min », ou rien sans durée connue. */
const depuis = (minutes: number | null): string => (minutes === null ? '' : ` depuis ${dureeLisible(minutes)}`);

/** Restaurant puis le reste, sans morceau vide. */
const lieu = (...parties: (string | null | undefined)[]): string => parties.filter(Boolean).join(' · ');

function creneau(s: SignalLivraison): string {
  if (s.creneau === 'MORNING') return 'ce matin';
  if (s.creneau === 'EVENING') return 'ce soir';
  return "aujourd'hui";
}

/** Phrase d'une alerte qui porte une course, sans sa référence (colonne « Situation » d'« À traiter »). */
export function situationCourse(s: SignalLivraison): string {
  switch (s.cle) {
    case 'SANS_LIVREUR':
      return estExpiree(s) ? 'Aucun livreur trouvé' : `Sans livreur${depuis(s.minutes)}`;
    case 'TOURNEE_EN_RETARD':
      return s.minutes !== null ? `${nom(s)} · en retard de ${dureeLisible(s.minutes)}` : `${nom(s)} · en retard`;
    case 'PARTI_SANS_SAC':
      return s.commandes.length > 0
        ? `${sujet(s)} est parti sans ${enumerer(s.commandes)}`
        : `${sujet(s)} est parti sans une commande`;
    case 'ATTENTE_AU_RESTAURANT':
      return `${sujet(s)} attend au restaurant${depuis(s.minutes)}`;
    case 'COURSE_ANNULEE_A_RELANCER':
      return s.commandes.length > 0 ? `Annulée, ${enumerer(s.commandes)} à relancer` : 'Annulée, à relancer';
    default:
      return texteSignal(s).titre;
  }
}

/** Les deux lignes d'une alerte (« À surveiller » d'En direct). */
export function texteSignal(s: SignalLivraison, contexte: ContexteTexte = {}): TexteSignal {
  const resto = contexte.restaurant?.trim() || null;
  const ref = s.course?.reference ?? null;

  switch (s.cle) {
    case 'TOURNEE_EN_RETARD':
      return {
        titre:
          s.minutes !== null
            ? `${nom(s)} : tournée en retard de ${dureeLisible(s.minutes)}`
            : `${nom(s)} : tournée en retard`,
        detail: lieu(resto, ref),
      };
    case 'SANS_LIVREUR':
      return {
        titre: estExpiree(s)
          ? `${reference(s)} : aucun livreur trouvé`
          : `${reference(s)} : sans livreur${depuis(s.minutes)}`,
        detail: lieu(resto, s.commandes.length > 0 ? nombreCommandes(s.commandes.length) : null),
      };
    case 'PARTI_SANS_SAC':
      return {
        titre:
          s.commandes.length > 0
            ? `${sujet(s)} est parti sans ${enumerer(s.commandes)}`
            : `${sujet(s)} est parti sans une commande`,
        detail: lieu(resto),
      };
    case 'COURSE_ANNULEE_A_RELANCER':
      return {
        titre:
          s.commandes.length > 0
            ? `${reference(s)} annulée, ${enumerer(s.commandes)} à relancer`
            : `${reference(s)} annulée, à relancer`,
        detail: lieu(resto),
      };
    case 'ATTENTE_AU_RESTAURANT':
      return { titre: `${sujet(s)} attend au restaurant${depuis(s.minutes)}`, detail: lieu(resto, ref) };
    case 'APPLI_FERMEE_EN_COURSE': {
      const vue = contexte.maintenant ? vueIlYa(s.appli_vue_a, contexte.maintenant) : null;
      return { titre: `${nom(s)} : appli fermée pendant une course`, detail: lieu(resto, vue) };
    }
    case 'POSITION_PERDUE_EN_COURSE':
      return {
        titre:
          s.minutes !== null
            ? `${nom(s)} : plus de position depuis ${dureeLisible(s.minutes)}`
            : `${nom(s)} : plus de position`,
        detail: lieu(resto, ref),
      };
    case 'A_ENCAISSER': {
      const n = Math.max(1, s.commandes.length);
      return {
        titre: `${nom(s)} : ${nombreCommandes(n)} à encaisser${depuis(s.minutes)}`,
        detail: lieu(resto),
      };
    }
    case 'PREVU_PAS_EN_SERVICE':
      return { titre: `${nom(s)} : prévu ${creneau(s)}, pas en service`, detail: lieu(resto) };
    default:
      // Alerte qu'un serveur plus récent connaît et pas cet écran : rien d'inventé.
      return { titre: ref ? `${ref} : à vérifier` : 'À vérifier', detail: lieu(resto) };
  }
}
