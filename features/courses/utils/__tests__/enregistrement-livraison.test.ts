// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  champsAEcrire,
  etatEnregistrementPage,
  garderSiModifie,
  memeListe,
  rehydrater,
  texteModifications,
} from '../enregistrement-livraison';
import {
  CLE_METHODE,
  GROUPE_ANCIENNE_METHODE,
  GROUPES_NOUVELLE_METHODE,
  TEXTE_ANCIENNE_METHODE_CHOISIE,
  TEXTE_PLAFOND_GOOGLE,
  TOUS_LES_REGLAGES,
  planEnregistrement,
  valeurAppliquee,
  verifierSaisie,
} from '../reglages-regroupement';

/**
 * Seconde passe de la relecture du 23/10 : Paramètres > Livraison.
 * Chaque test échoue sur le code d'avant la correction.
 */

const def = (cle) => {
  const trouve = TOUS_LES_REGLAGES.find((d) => d.cle === cle);
  if (!trouve) throw new Error(`réglage absent : ${cle}`);
  return trouve;
};

describe('relecture des réglages sans effacer les saisies', () => {
  test('première lecture : tout vient de la base', () => {
    expect(rehydrater({ locales: {}, hydratees: null, serveur: { a: '1', b: '2' } })).toEqual({ a: '1', b: '2' });
  });

  test("« Enregistrer le regroupement » relit les réglages : la grille et les champs modifiés de la page restent", () => {
    const hydratees = { 'course.offer_duration_seconds': '120', 'deliverer.gps_update_interval_seconds': '60' };
    const locales = { ...hydratees, 'course.offer_duration_seconds': '90' }; // saisie en cours
    const serveur = { ...hydratees, 'course.planificateur': 'v1' }; // relecture après l'autre bouton
    expect(rehydrater({ locales, hydratees, serveur })).toEqual({
      'course.offer_duration_seconds': '90',
      'deliverer.gps_update_interval_seconds': '60',
      'course.planificateur': 'v1',
    });
  });

  test('champ non modifié : reprend la nouvelle valeur de la base ; clé effacée en base : disparaît', () => {
    const hydratees = { a: '1', b: '2' };
    expect(rehydrater({ locales: { a: '1', b: '2' }, hydratees, serveur: { a: '5' } })).toEqual({ a: '5' });
  });

  test('bouton du bas qui réécrit une clé « course.* » : la méthode choisie (« Ancienne ») n’est plus remise à « Nouvelle »', () => {
    expect(garderSiModifie({ locale: 'v1', hydratee: 'v2', serveur: 'v2' })).toBe('v1');
    // Pas touchée : la base l'emporte.
    expect(garderSiModifie({ locale: 'v2', hydratee: 'v2', serveur: 'v1' })).toBe('v1');
  });

  test('listes (restaurants cochés, grille des frais) comparées par leur contenu', () => {
    const grille = [{ maxKm: '2', price: '1000' }];
    const modifiee = [{ maxKm: '2', price: '1200' }];
    expect(garderSiModifie({ locale: modifiee, hydratee: grille, serveur: grille, egal: memeListe })).toBe(modifiee);
    const relue = [{ maxKm: '2', price: '1500' }];
    expect(garderSiModifie({ locale: [...grille], hydratee: grille, serveur: relue, egal: memeListe })).toBe(relue);
    expect(memeListe(['a'], undefined)).toBe(false);
  });
});

describe('un seul « Enregistrer » pour toute la page', () => {
  test('seuls les champs modifiés et non vides sont écrits', () => {
    const hydratees = { a: '1', b: '2', c: '3' };
    expect(champsAEcrire(['a', 'b', 'c', 'd'], { a: '1', b: '4', c: '', d: '7' }, hydratees)).toEqual(['b', 'd']);
  });

  test('« Ancienne » choisie puis le bouton du bas : la méthode fait partie de ce qui est enregistré', () => {
    const plan = planEnregistrement({ saisies: {}, enregistrees: {}, methode: 'v1', restaurants: [] });
    expect(plan.changements).toEqual([
      { cle: CLE_METHODE, action: 'ecrire', valeur: 'v1', description: 'Méthode de regroupement : v2 (nouvelle) ou v1 (ancienne)' },
    ]);
    const etat = etatEnregistrementPage({ page: 0, regroupement: { changements: plan.changements.length, erreurs: 0 } });
    expect(etat).toEqual({ total: 1, bloque: null });
    expect(texteModifications(etat.total)).toBe('1 modification');
  });

  test('valeur refusée dans le regroupement : le bouton du bas est bloqué, le message le dit', () => {
    expect(etatEnregistrementPage({ page: 2, regroupement: { changements: 1, erreurs: 1 } })).toEqual({
      total: 3,
      bloque: 'Regroupement : 1 valeur refusée, corrigez-la pour enregistrer.',
    });
    expect(etatEnregistrementPage({ page: 0, regroupement: { changements: 0, erreurs: 2 } }).bloque).toBe(
      'Regroupement : 2 valeurs refusées, corrigez-les pour enregistrer.',
    );
    expect(texteModifications(0)).toBeNull();
    expect(texteModifications(3)).toBe('3 modifications');
  });

  test('la page branche la section sur son bouton du bas', () => {
    const page = readFileSync(
      join(import.meta.dir, '../../../../src/components/gestion/Settings/tabs/DeliverySettings.tsx'),
      'utf8',
    );
    expect(page).toMatch(/<RegroupementSettings ref=\{regroupementRef\} surEtat=\{setEtatRegroupement\} \/>/);
    expect(page).toMatch(/regroupementRef\.current\?\.enregistrer\(\)/);
    // Les relectures fusionnent au lieu d'écraser.
    expect(page).toMatch(/rehydrater\(\{ locales, hydratees: avant, serveur: map \}\)/);
    expect(page).not.toMatch(/setValues\(map\)/);
  });
});

describe('textes fidèles au serveur', () => {
  test("ancienne méthode choisie : la note ne dit plus que les limites ne servent qu'à la nouvelle", () => {
    expect(TEXTE_ANCIENNE_METHODE_CHOISIE).not.toMatch(/ne servent qu/);
    expect(TEXTE_ANCIENNE_METHODE_CHOISIE).toContain("Aussi pour l'ancienne méthode");
  });

  test("réglages lus aussi par l'ancienne méthode : repérés", () => {
    const aussi = TOUS_LES_REGLAGES.filter((d) => d.aussiAncienne).map((d) => d.cle).sort();
    expect(aussi).toEqual(
      [
        'course.delay_alert_factor',
        'course.max_orders_per_course',
        'course.no_deliverer_alert_after_min',
        'course.no_deliverer_max_wait_min',
        'course.turbo_fallback_enabled',
        'deliverer.appli_fermee_apres_s',
        'deliverer.hors_service_sans_signal_min',
        'deliverer.travel_time_ranking',
        'maps.plafond_appels_jour',
      ].sort(),
    );
    // Aucun réglage du groupe « Ancienne méthode » n'a besoin du repère.
    expect(GROUPE_ANCIENNE_METHODE.reglages.some((d) => d.aussiAncienne)).toBe(false);
  });

  test('« Ancienne méthode » : les trois réglages du lot servent encore aux commandes Turbo', () => {
    expect(GROUPE_ANCIENNE_METHODE.description).not.toMatch(/seulement/);
    expect(GROUPE_ANCIENNE_METHODE.description).toContain('Turbo');
    expect(GROUPE_ANCIENNE_METHODE.reglages.slice(0, 3).map((d) => d.cle)).toEqual([
      'course.batch_window_seconds',
      'course.batch_min_wait_seconds',
      'course.lookahead_in_progress',
    ]);
  });

  test('plafond Google : il coupe aussi le temps de trajet qui classe les livreurs', () => {
    expect(TEXTE_PLAFOND_GOOGLE).toMatch(/livreurs/);
  });
});

describe('alertes absentes de l’écran jusqu’ici (conception 6.1)', () => {
  const alertes = {
    'course.no_deliverer_alert_after_min': '5',
    'course.no_deliverer_max_wait_min': '60',
    'course.delay_alert_factor': '1.5',
  };

  test.each(Object.entries(alertes))('%s : défaut %s, rangé avec Turbo', (cle, defaut) => {
    expect(def(cle).defaut).toBe(defaut);
    const groupe = GROUPES_NOUVELLE_METHODE.find((g) => g.reglages.some((d) => d.cle === cle));
    expect(groupe?.titre).toBe('Turbo, alertes et Google');
  });

  test('lecture historique du serveur : 0 et les nombres négatifs refusés et signalés', () => {
    for (const cle of Object.keys(alertes)) {
      expect(verifierSaisie(def(cle), '0').ok).toBe(false);
      expect(verifierSaisie(def(cle), '-2').ok).toBe(false);
      expect(valeurAppliquee(def(cle), '0')).toMatchObject({ refusee: true, valeur: alertes[cle] });
    }
    expect(verifierSaisie(def('course.delay_alert_factor'), '1,8')).toEqual({ ok: true, valeur: '1.8' });
    expect(verifierSaisie(def('course.no_deliverer_alert_after_min'), '3')).toEqual({ ok: true, valeur: '3' });
  });

  test('aide de l’alerte : la nouvelle méthode attend la bascule vers Turbo', () => {
    expect(def('course.no_deliverer_alert_after_min').aide).toMatch(/Turbo plus 1 minute/);
  });
});

/** Quand les sources du serveur sont là : clés et défauts lus par le serveur. */
const course = join(import.meta.dir, '../../../../../backend/src/modules/course/helpers/course-settings.helper.ts');
describe.skipIf(!existsSync(course))('alertes : mêmes clés et défauts que le serveur', () => {
  test('clés lues par le `toNumber` historique avec ces défauts', () => {
    const source = readFileSync(course, 'utf8');
    expect(source).toMatch(/no_deliverer_alert_after_min:\s*5\b/);
    expect(source).toMatch(/no_deliverer_max_wait_min:\s*60\b/);
    expect(source).toMatch(/delay_alert_factor:\s*1\.5\b/);
    for (const cle of ['no_deliverer_alert_after_min', 'no_deliverer_max_wait_min', 'delay_alert_factor']) {
      expect(source).toMatch(new RegExp(`this\\.toNumber\\(map\\['course\\.${cle}'\\]`));
    }
  });
});
