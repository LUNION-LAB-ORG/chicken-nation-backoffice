/**
 * GESTES SUR UN PLANNING, SELON SON ÉTAT ET LE RÔLE (conception du 24/10,
 * section 10.3).
 *
 * Un planning se modifie dans ses quatre états : Brouillon, Envoyé, Confirmé,
 * Archivé. Seul le geste principal change avec l'état (Envoyer,
 * Confirmer, Archiver) ; dates, ajout, retrait, jour et suppression restent.
 *
 * Droits (section 4) : `modifierPlanning(restaurantId)` pour tout geste sauf
 * la suppression, `supprimerPlanning(restaurantId)` pour elle. Un manager ne
 * touche qu'au planning de son restaurant ; le centre d'appels (26/10),
 * compte du siège, a tous les gestes sur tous les restaurants ;
 * LIVRAISON_OPS ne voit aucun geste.
 *
 * Ce que la fenêtre dit après le geste dépend de l'état : rien sur un
 * brouillon (le livreur ne le voit pas), le livreur est prévenu sur un
 * planning envoyé ou confirmé, le changement est noté au journal sur un
 * archivé. Ce sont les règles du serveur (`planning.rules.ts`).
 *
 * Fichier pur (aucun React), testé par `bun test`.
 */

import type { DroitsLivraison } from '../../livreurs/utils/droits-livraison';
import type { SchedulePlanStatus } from '../types/schedule.types';

/** Geste qui fait avancer le planning d'un état. */
export type GestePrincipal = 'envoyer' | 'confirmer' | 'archiver';

export const GESTE_PRINCIPAL: Record<SchedulePlanStatus, GestePrincipal | null> = {
  DRAFT: 'envoyer',
  SENT: 'confirmer',
  CONFIRMED: 'archiver',
  ARCHIVED: null,
};

export const LIBELLE_GESTE: Record<GestePrincipal, string> = {
  envoyer: 'Envoyer',
  confirmer: 'Confirmer',
  archiver: 'Archiver',
};

/** Message après le geste principal, avec le mot d'avant pour un plan de la liste (« Plan supprimé »). */
export const MESSAGE_GESTE: Record<GestePrincipal, string> = {
  envoyer: 'Plan envoyé aux livreurs',
  confirmer: 'Plan confirmé',
  archiver: 'Plan archivé',
};

export const LIBELLE_ETAT: Record<SchedulePlanStatus, string> = {
  DRAFT: 'Brouillon',
  SENT: 'Envoyé',
  CONFIRMED: 'Confirmé',
  ARCHIVED: 'Archivé',
};

export interface ActionsPlanning {
  /** Bouton qui fait avancer l'état ; aucun sur un archivé. */
  principal: GestePrincipal | null;
  modifierDates: boolean;
  ajouterLivreur: boolean;
  /** ⋮ de la ligne d'un livreur : « Retirer du planning ». */
  retirerLivreur: boolean;
  /** Toucher une case de la grille. */
  changerJour: boolean;
  /** Brouillon : la case bascule tout de suite, sans fenêtre. */
  jourSansFenetre: boolean;
  /** ⋮ de l'en-tête : « Supprimer ». */
  supprimer: boolean;
}

export const AUCUNE_ACTION: ActionsPlanning = {
  principal: null,
  modifierDates: false,
  ajouterLivreur: false,
  retirerLivreur: false,
  changerJour: false,
  jourSansFenetre: false,
  supprimer: false,
};

export function actionsPlanning({
  statut,
  restaurantId,
  droits,
  retraitDisponible = true,
}: {
  statut: SchedulePlanStatus;
  restaurantId: string | null | undefined;
  droits: Pick<DroitsLivraison, 'modifierPlanning' | 'supprimerPlanning'>;
  /**
   * Le serveur connaît le retrait (`DELETE …/deliverers/:id`). Faux sur un
   * serveur plus ancien (le détail n'a pas `livreurs`) : le ⋮ ne s'affiche
   * pas. Les autres gestes existent déjà : un refus du serveur ancien est
   * montré tel quel.
   */
  retraitDisponible?: boolean;
}): ActionsPlanning {
  const modifier = droits.modifierPlanning(restaurantId);
  const supprimer = droits.supprimerPlanning(restaurantId);
  if (!modifier && !supprimer) return AUCUNE_ACTION;

  return {
    principal: modifier ? GESTE_PRINCIPAL[statut] : null,
    modifierDates: modifier,
    ajouterLivreur: modifier,
    retirerLivreur: modifier && retraitDisponible,
    changerJour: modifier,
    jourSansFenetre: modifier && statut === 'DRAFT',
    supprimer,
  };
}

/** Ce qui suit un geste : rien, le livreur prévenu, ou une ligne au journal. */
export type SuiteGeste = 'aucune' | 'prevenu' | 'journal';

export function suiteGeste(statut: SchedulePlanStatus): SuiteGeste {
  if (statut === 'SENT' || statut === 'CONFIRMED') return 'prevenu';
  if (statut === 'ARCHIVED') return 'journal';
  return 'aucune';
}

const NOTE_JOURNAL = 'Plan archivé : noté au journal.';

/** Textes des fenêtres, selon l'état du planning. `prenom` : le livreur concerné. */
export function textesFenetres(statut: SchedulePlanStatus, prenom = 'Le livreur') {
  const suite = suiteGeste(statut);
  return {
    /** Pied de la fenêtre d'un jour (le brouillon n'en a pas). */
    jour: suite === 'prevenu' ? `${prenom} sera prévenu.` : suite === 'journal' ? NOTE_JOURNAL : null,
    /** Pied de la fenêtre « Ajouter un livreur ». */
    ajout: suite === 'prevenu' ? 'Il sera prévenu.' : suite === 'journal' ? NOTE_JOURNAL : null,
    retrait:
      suite === 'prevenu'
        ? 'Ses jours de travail sont effacés et il est prévenu.'
        : suite === 'journal'
          ? 'Ses jours de travail sont effacés. Le changement est noté au journal.'
          : 'Ses jours de travail sont effacés.',
    dates:
      statut === 'DRAFT'
        ? 'Le plan sera régénéré pour les nouvelles dates.'
        : statut === 'SENT'
          ? 'Le plan sera régénéré pour les nouvelles dates et repassera en brouillon : envoyez-le à nouveau. Les livreurs sont prévenus.'
          : statut === 'CONFIRMED'
            ? 'Le plan sera régénéré pour les nouvelles dates et repassera en brouillon. Les réponses des livreurs sont effacées et ils sont prévenus.'
            : 'Le plan sera régénéré pour les nouvelles dates et repassera en brouillon. Les réponses des livreurs sont effacées. Le changement est noté au journal.',
    suppression:
      statut === 'DRAFT'
        ? 'Vous pourrez en régénérer un.'
        : statut === 'SENT'
          ? 'Les livreurs sont prévenus et ne le verront plus.'
          : statut === 'CONFIRMED'
            ? 'Les livreurs sont prévenus et ne le verront plus. La suppression est notée au journal.'
            : "L'historique de ce plan est effacé. La suppression est notée au journal.",
  };
}
