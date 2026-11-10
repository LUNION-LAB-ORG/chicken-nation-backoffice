// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  COLONNES,
  alerteDeCarte,
  colonneParDefaut,
  colonneVoisine,
  correspondRecherche,
  heureLisible,
  nombreDeLaColonne,
  nomDuLivreur,
  parColonne,
  peutPrendreCourse,
  signauxParCourse,
  tempsDeLaCarte,
  texteCommandes,
} from '../en-direct';

/** Kanban « En direct » de l'écran Courses (demande du 10/11). */

const M = new Date('2026-11-10T20:30:00.000Z');
const carte = (p = {}) => ({
  id: 'c1',
  reference: 'CRS-1',
  code: '305',
  statut: 'PENDING_ASSIGNMENT',
  colonne: 'A_AFFECTER',
  restaurant: { id: 'r', nom: 'CHICKEN NATION ZONE 4' },
  livreur: null,
  turbo: false,
  expiree: false,
  proposee_a: null,
  commandes: { total: 1, livrees: 0, references: ['ORD-1'] },
  depuis: new Date(M.getTime() - 12 * 60_000).toISOString(),
  fin_prevue: null,
  retard_min: null,
  frais: 500,
  livreur_modifiable: true,
  ...p,
});

describe('colonnes', () => {
  test('cinq, dans l’ordre du trajet', () => {
    expect(COLONNES.map((c) => c.titre)).toEqual([
      'À affecter',
      'Vers le restaurant',
      'Au restaurant',
      'En livraison',
      'Terminées',
    ]);
  });

  test('regroupement, nombre des terminées de la journée, colonne ouverte sur téléphone', () => {
    const g = parColonne([carte(), carte({ id: 'c2', colonne: 'EN_LIVRAISON' }), carte({ id: 'c3', colonne: 'TERMINEE' })]);
    expect(g.A_AFFECTER.map((c) => c.id)).toEqual(['c1']);
    expect(nombreDeLaColonne('TERMINEE', g, 33)).toBe(33);
    expect(colonneParDefaut(g)).toBe('A_AFFECTER');
    expect(colonneParDefaut(parColonne([carte({ colonne: 'EN_LIVRAISON' })]))).toBe('EN_LIVRAISON');
    expect(colonneParDefaut(parColonne([]))).toBe('A_AFFECTER');
  });

  test('glisser : colonne voisine, sans sortir des cinq', () => {
    expect(colonneVoisine('A_AFFECTER', 1)).toBe('VERS_RESTAURANT');
    expect(colonneVoisine('A_AFFECTER', -1)).toBe('A_AFFECTER');
    expect(colonneVoisine('TERMINEE', 1)).toBe('TERMINEE');
  });
});

describe('carte', () => {
  test('commandes : nombre, puis livrées en livraison et terminée', () => {
    expect(texteCommandes(carte())).toBe('1 commande');
    expect(texteCommandes(carte({ commandes: { total: 2, livrees: 0, references: [] } }))).toBe('2 commandes');
    expect(texteCommandes(carte({ colonne: 'EN_LIVRAISON', commandes: { total: 2, livrees: 1, references: [] } }))).toBe(
      '1 sur 2 livrée',
    );
    expect(texteCommandes(carte({ colonne: 'TERMINEE', commandes: { total: 2, livrees: 2, references: [] } }))).toBe('2 livrées');
  });

  test('temps dans l’étape ; terminée : son heure', () => {
    expect(tempsDeLaCarte(carte(), M)).toBe('12 min');
    expect(tempsDeLaCarte(carte({ depuis: null }), M)).toBeNull();
    const fin = new Date(2026, 10, 10, 20, 5).toISOString();
    expect(tempsDeLaCarte(carte({ colonne: 'TERMINEE', depuis: fin }), M)).toBe('20 h 05');
    expect(heureLisible('pas une date')).toBeNull();
  });

  test('alerte : celle du tableau (rouge d’abord), sinon aucun livreur trouvé ou retard', () => {
    const signaux = signauxParCourse([
      { cle: 'ATTENTE_AU_RESTAURANT', gravite: 'ambre', course: { id: 'c1' }, livreur: { prenom: 'Koffi' }, minutes: 12, commandes: [] },
      { cle: 'SANS_LIVREUR', gravite: 'rouge', course: { id: 'c1', statut: 'PENDING_ASSIGNMENT', expiree: false }, minutes: 50, commandes: [] },
    ]);
    expect(alerteDeCarte(carte(), signaux)).toEqual({ ton: 'rouge', texte: "En attente d'affectation depuis 50 min" });
    const vide = new Map();
    expect(alerteDeCarte(carte({ expiree: true }), vide)).toEqual({ ton: 'rouge', texte: 'Aucun livreur trouvé' });
    expect(alerteDeCarte(carte({ colonne: 'EN_LIVRAISON', retard_min: 29 }), vide)).toEqual({
      ton: 'rouge',
      texte: 'En retard de 29 min',
    });
    expect(alerteDeCarte(carte(), vide)).toBeNull();
  });

  test('nom du livreur', () => {
    expect(nomDuLivreur({ id: 'l', prenom: 'Koffi', nom: 'Kouassi', telephone: null })).toBe('Koffi Kouassi');
    expect(nomDuLivreur(null)).toBe('Livreur');
  });
});

describe('menu « Livreur »', () => {
  const dispo = (p = {}) => ({ etat: 'DISPONIBLE', en_course: false, ...p });
  test('libre et joignable seulement (le serveur refuse un livreur en course)', () => {
    expect(peutPrendreCourse(dispo())).toBe(true);
    expect(peutPrendreCourse(dispo({ etat: 'EN_COURSE', en_course: true }))).toBe(false);
    for (const etat of ['EN_PAUSE', 'PAUSE_AUTO', 'HORS_SERVICE', 'INJOIGNABLE', 'INACTIF']) {
      expect(peutPrendreCourse(dispo({ etat }))).toBe(false);
    }
    expect(peutPrendreCourse(null)).toBe(true);
  });

  test('recherche par nom ou téléphone, sans accents', () => {
    const l = { first_name: 'Élodie', last_name: 'Koné', phone: '+2250707' };
    expect(correspondRecherche(l, 'elo')).toBe(true);
    expect(correspondRecherche(l, 'KONE')).toBe(true);
    expect(correspondRecherche(l, '0707')).toBe(true);
    expect(correspondRecherche(l, 'yann')).toBe(false);
    expect(correspondRecherche(l, '  ')).toBe(true);
  });
});

describe('écran', () => {
  const lire = (chemin) => readFileSync(join(import.meta.dir, chemin), 'utf8');
  test('Courses : trois vues ; « Carte live » quitte le menu et y mène', () => {
    const page = lire('../../../../src/components/gestion/Courses/index.tsx');
    expect(page).toContain("{onglet === 'en_direct' && <TableauEnDirect");
    expect(page).toContain("{onglet === 'carte' && <EnDirect integre />}");
    expect(page).toContain("{onglet === 'historique' && (");
    const menu = lire('../../../../src/hooks/useMenuConfig.tsx');
    expect(menu).not.toContain('label: "Carte live"');
    expect(lire('../../../../src/components/gestion/DynamicModuleLoader.tsx')).toContain(
      'en_direct: dynamic(() => import("@/components/gestion/Courses")',
    );
  });

  test('menu « Livreur » : jamais un bouton dans le bouton de la carte, clic qui ne remonte pas', () => {
    const menu = lire('../../components/en-direct/ChoixLivreurCourse.tsx');
    expect(menu).toContain('createPortal(');
    expect(menu).toContain('e.stopPropagation();');
    expect(menu).not.toMatch(/\bconfirm\(/);
  });
});
