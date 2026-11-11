// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  COLONNES,
  alerteDeCarte,
  basculeFlotte,
  colonneParDefaut,
  colonneVoisine,
  correspondRecherche,
  finDeReference,
  nomDuLivreur,
  parColonne,
  peutPrendreCourse,
  heureLisible,
  ligneDeLaCarte,
  signauxParCourse,
  texteCommandes,
  texteEtape,
  texteTemps,
} from '../en-direct';
import { lienAppel, lienWhatsApp, telephoneLisible } from '../../../livreurs/utils/telephone';

/** Kanban « En direct » de l'écran Courses (demande du 10/11). */

const M = new Date('2026-11-10T20:30:00.000Z');
const carte = (p = {}) => ({
  id: 'c1',
  reference: 'CRS-1',
  code: '305',
  statut: 'PENDING_ASSIGNMENT',
  colonne: 'A_AFFECTER',
  etape: 'RECHERCHE',
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

describe('colonnes (retour du 10/11)', () => {
  test('quatre : trois étapes et Turbo à part, plus de terminées', () => {
    expect(COLONNES.map((c) => c.titre)).toEqual(['À affecter', 'Livreur affecté', 'En livraison', 'Turbo']);
  });

  test('regroupement, colonne inconnue laissée de côté, colonne ouverte sur téléphone', () => {
    const g = parColonne([carte(), carte({ id: 'c2', colonne: 'EN_LIVRAISON' }), carte({ id: 'c3', colonne: 'TERMINEE' })]);
    expect(g.A_AFFECTER.map((c) => c.id)).toEqual(['c1']);
    expect(Object.keys(g)).toEqual(['A_AFFECTER', 'LIVREUR_AFFECTE', 'EN_LIVRAISON', 'TURBO']);
    expect(colonneParDefaut(g)).toBe('A_AFFECTER');
    expect(colonneParDefaut(parColonne([carte({ colonne: 'TURBO' }), carte({ colonne: 'EN_LIVRAISON' })]))).toBe('EN_LIVRAISON');
    expect(colonneParDefaut(parColonne([]))).toBe('A_AFFECTER');
  });

  test('glisser : colonne voisine, sans sortir des quatre', () => {
    expect(colonneVoisine('A_AFFECTER', 1)).toBe('LIVREUR_AFFECTE');
    expect(colonneVoisine('A_AFFECTER', -1)).toBe('A_AFFECTER');
    expect(colonneVoisine('TURBO', 1)).toBe('TURBO');
  });

  test('étape d’une course Turbo écrite sur sa carte, nulle part ailleurs', () => {
    expect(texteEtape(carte())).toBeNull();
    expect(texteEtape(carte({ colonne: 'LIVREUR_AFFECTE', etape: 'AU_RESTAURANT' }))).toBeNull();
    expect(texteEtape(carte({ colonne: 'TURBO', etape: 'RECHERCHE', turbo: true }))).toBe('Turbo cherche un livreur');
    expect(texteEtape(carte({ colonne: 'TURBO', etape: 'EN_LIVRAISON', turbo: true }))).toBe('Livreur Turbo en livraison');
  });

  test('badge Turbo qui agit : seulement tant que personne n’a pris la course', () => {
    expect(basculeFlotte(carte())).toBe('VERS_TURBO');
    expect(basculeFlotte(carte({ turbo: true }))).toBe('VERS_INTERNE');
    expect(basculeFlotte(carte({ turbo: true, etape: 'VERS_RESTAURANT' }))).toBeNull();
    expect(basculeFlotte(carte({ etape: 'AUCUN_LIVREUR' }))).toBeNull();
  });
});

describe('carte', () => {
  test('commandes : nombre, puis livrées en livraison (Turbo compris)', () => {
    expect(texteCommandes(carte())).toBe('1 commande');
    expect(texteCommandes(carte({ commandes: { total: 2, livrees: 0, references: [] } }))).toBe('2 commandes');
    expect(texteCommandes(carte({ etape: 'EN_LIVRAISON', commandes: { total: 2, livrees: 1, references: [] } }))).toBe(
      '1 sur 2 livrée',
    );
    expect(
      texteCommandes(carte({ colonne: 'TURBO', etape: 'EN_LIVRAISON', commandes: { total: 2, livrees: 2, references: [] } })),
    ).toBe('2 sur 2 livrées');
  });

  test('temps en toutes lettres (retour du 10/11 : « 45 min » seul ne disait pas ce qu’il comptait)', () => {
    expect(texteTemps(carte(), M)).toBe('attend depuis 12 min');
    expect(texteTemps(carte({ etape: 'VERS_RESTAURANT' }), M)).toBe('en route depuis 12 min');
    expect(texteTemps(carte({ etape: 'AU_RESTAURANT' }), M)).toBe('au restaurant depuis 12 min');
    const depart = new Date(2026, 10, 10, 21, 46).toISOString();
    expect(texteTemps(carte({ etape: 'EN_LIVRAISON', depuis: depart }), M)).toBe('parti à 21 h 46');
    expect(texteTemps(carte({ depuis: null }), M)).toBeNull();
    expect(heureLisible('pas une date')).toBeNull();
    expect(ligneDeLaCarte(carte({ etape: 'AU_RESTAURANT' }), M)).toBe('1 commande · au restaurant depuis 12 min');
    expect(
      ligneDeLaCarte(carte({ etape: 'EN_LIVRAISON', depuis: depart, commandes: { total: 3, livrees: 2, references: [] } }), M),
    ).toBe('2 sur 3 livrées · parti à 21 h 46');
  });

  test('alerte : celle du tableau (rouge d’abord), sinon aucun livreur trouvé ou retard', () => {
    const signaux = signauxParCourse([
      { cle: 'ATTENTE_AU_RESTAURANT', gravite: 'ambre', course: { id: 'c1' }, livreur: { prenom: 'Koffi' }, minutes: 12, commandes: [] },
      { cle: 'SANS_LIVREUR', gravite: 'rouge', course: { id: 'c1', statut: 'PENDING_ASSIGNMENT', expiree: false }, minutes: 50, commandes: [] },
    ]);
    expect(alerteDeCarte(carte(), signaux)).toEqual({ ton: 'rouge', texte: "En attente d'affectation depuis 50 min" });
    const vide = new Map();
    expect(alerteDeCarte(carte({ expiree: true }), vide)).toEqual({ ton: 'rouge', texte: 'Aucun livreur trouvé' });
    expect(alerteDeCarte(carte({ colonne: 'EN_LIVRAISON', etape: 'EN_LIVRAISON', retard_min: 29 }), vide)).toEqual({
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

describe('commandes dépliées sur la carte (11/11)', () => {
  test('fin de la référence, assez pour la reconnaître', () => {
    expect(finDeReference('ORD-261110-50950')).toBe('…50950');
    expect(finDeReference('SANSTIRET')).toBe('SANSTIRET');
  });

  test('un clic sur la ligne déplie, la référence mène à la commande, le reste ne remonte pas à la carte', () => {
    const carte = readFileSync(join(import.meta.dir, '../../components/en-direct/CarteCourseEnDirect.tsx'), 'utf8');
    expect(carte).toContain('aria-expanded={details}');
    expect(carte).toContain('onClick={() => ouvrirCommande(c.reference)}');
    expect(carte).toContain('{formatPrix(c.montant)}');
    expect(carte).toMatch(/<ul onClick=\{stop\}/);
  });
});

describe('fiche rapide du livreur : son numéro pour l’appeler hors de l’appli', () => {
  test('numéro lisible par paires, liens d’appel et WhatsApp', () => {
    expect(telephoneLisible('+2250556440504')).toBe('+225 05 56 44 05 04');
    expect(telephoneLisible('0556440504')).toBe('0556440504');
    expect(telephoneLisible('  ')).toBeNull();
    expect(lienAppel('+225 05 56 44 05 04')).toBe('tel:+2250556440504');
    expect(lienAppel(null)).toBeNull();
    expect(lienWhatsApp('+2250556440504')).toBe('https://wa.me/2250556440504');
    expect(lienWhatsApp('12')).toBeNull();
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

  test('le nom ouvre la fiche rapide ; « Changer » ouvre la liste', () => {
    const menu = lire('../../components/en-direct/ChoixLivreurCourse.tsx');
    expect(menu).toContain('<FicheLivreurRapide livreur={course.livreur}');
    expect(menu).toContain("compact ? 'Changer' : 'Choisir un livreur'");
    const fiche = lire('../../../livreurs/components/FicheLivreurRapide.tsx');
    expect(fiche).toContain('href={appel}');
    expect(fiche).toContain('href={whatsapp}');
    expect(fiche).toContain('Copier');
  });

  test('badge Turbo : mêmes routes que la fiche de la course, une question avant', () => {
    const badge = lire('../../components/en-direct/BadgeFlotte.tsx');
    expect(badge).toContain('useCourseVersInterneMutation');
    expect(badge).toContain('useCourseVersTurboMutation');
    expect(badge).toContain("'Turbo · Reprendre en interne'");
    expect(badge).not.toMatch(/\bconfirm\(/);
  });
});
