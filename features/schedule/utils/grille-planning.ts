/**
 * GRILLE DU PLANNING (conception du 24/10, 10.3) : une ligne par livreur du
 * planning, une colonne par jour, deux mini-pastilles (Matin, Soir) par case.
 *
 * Lignes : `livreurs[]` du serveur (même ceux qui n'ont que des repos, triés
 * par prénom). Serveur plus ancien (champ absent) : les livreurs des
 * affectations, comme avant, et aucune information de repos.
 *
 * Fichier pur (aucun React), testé par `bun test`.
 */

import type {
  IShiftAssignment,
  ISchedulePlanDetail,
  RestDaySource,
  ShiftAssignmentStatus,
  ShiftType,
} from '../types/schedule.types';
import { cleJour, joursDuPlanning } from './periode-planning';

export interface LigneGrille {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

export interface Grille {
  jours: string[];
  livreurs: LigneGrille[];
  /** Affectation d'un livreur un jour, matin ou soir. */
  affectation: (livreurId: string, jour: string, type: ShiftType) => IShiftAssignment | undefined;
  /** Origine du repos posé ce jour-là ; `undefined` si le serveur ne le dit pas. */
  repos: (livreurId: string, jour: string) => RestDaySource | undefined;
  /** « 09:00 à 15:00 », lu dans les créneaux du planning. */
  horaires: Partial<Record<ShiftType, string>>;
  /** Le serveur envoie `livreurs`, `repos` et `regles` (serveur du 24/10). */
  serveurAJour: boolean;
}

export const LIBELLE_REPONSE: Record<ShiftAssignmentStatus, string> = {
  ASSIGNED: 'En attente',
  CONFIRMED: 'Confirmé',
  REFUSED: 'Refusé',
};

export const LIBELLE_CRENEAU: Record<ShiftType, string> = {
  MORNING: 'Matin',
  EVENING: 'Soir',
};

/** « Matin : En attente », « Soir : Refusé : malade ». */
export function texteCreneau(type: ShiftType, a: Pick<IShiftAssignment, 'status' | 'refusal_reason'>): string {
  const motif = a.status === 'REFUSED' && a.refusal_reason?.trim() ? ` : ${a.refusal_reason.trim()}` : '';
  return `${LIBELLE_CRENEAU[type]} : ${LIBELLE_REPONSE[a.status]}${motif}`;
}

const parPrenom = (a: LigneGrille, b: LigneGrille) =>
  (a.first_name ?? '').localeCompare(b.first_name ?? '', 'fr') ||
  (a.last_name ?? '').localeCompare(b.last_name ?? '', 'fr');

export function grillePlanning(plan: ISchedulePlanDetail): Grille {
  const cases = new Map<string, IShiftAssignment>();
  const desAffectations = new Map<string, LigneGrille>();
  const jours = new Set(joursDuPlanning(plan.period_start, plan.period_end));
  const horaires: Partial<Record<ShiftType, string>> = {};

  for (const shift of plan.shifts ?? []) {
    const jour = cleJour(shift.date);
    jours.add(jour);
    if (!horaires[shift.type] && shift.start_time && shift.end_time) {
      horaires[shift.type] = `${shift.start_time} à ${shift.end_time}`;
    }
    for (const a of shift.assignments ?? []) {
      cases.set(`${a.deliverer.id}|${jour}|${shift.type}`, a);
      if (!desAffectations.has(a.deliverer.id)) {
        desAffectations.set(a.deliverer.id, {
          id: a.deliverer.id,
          first_name: a.deliverer.first_name,
          last_name: a.deliverer.last_name,
        });
      }
    }
  }

  const serveurAJour = Array.isArray(plan.livreurs);
  const livreurs = serveurAJour
    ? plan.livreurs!.map((l) => ({ id: l.id, first_name: l.first_name, last_name: l.last_name }))
    : [...desAffectations.values()].sort(parPrenom);

  const repos = new Map<string, RestDaySource>();
  for (const r of plan.repos ?? []) repos.set(`${r.deliverer_id}|${cleJour(r.date)}`, r.source);

  return {
    jours: [...jours].sort(),
    livreurs,
    affectation: (id, jour, type) => cases.get(`${id}|${jour}|${type}`),
    repos: (id, jour) => repos.get(`${id}|${jour}`),
    horaires,
    serveurAJour,
  };
}
