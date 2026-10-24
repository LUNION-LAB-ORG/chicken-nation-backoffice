// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  CLE_METHODE,
  CLE_RESTAURANTS,
  GROUPE_ANCIENNE_METHODE,
  GROUPES_NOUVELLE_METHODE,
  METHODES,
  TEXTE_PLAFOND_GOOGLE,
  TOUS_LES_REGLAGES,
  ecrireRestaurants,
  libelleAvecUnite,
  lireMethode,
  lireRestaurants,
  planEnregistrement,
  resumeRestaurants,
  valeurAppliquee,
  verifierSaisie,
} from '../reglages-regroupement';

/**
 * Paramètres > Livraison, section « Regroupement des commandes » (conception
 * 6.1). L'écran lit chaque valeur comme le serveur la lit : 0 accepté là où
 * il a un sens pour la nouvelle méthode, refusé par l'ancienne (son
 * `toNumber` remplace 0 par le défaut sans prévenir). Une valeur refusée est
 * signalée au lieu d'être enregistrée ou appliquée en silence.
 */

const def = (cle) => {
  const trouve = TOUS_LES_REGLAGES.find((d) => d.cle === cle);
  if (!trouve) throw new Error(`réglage absent : ${cle}`);
  return trouve;
};

describe('les réglages de la conception 6.1, avec leur défaut', () => {
  const attendus = {
    'course.attente_max_commande_prete_s': '300',
    'course.horizon_preparation_s': '420',
    'course.petit_retard_retour_min': '5',
    'course.attente_max_trajet_long_s': '1200',
    'course.retenue_meme_si_livreur_libre': '0',
    'course.max_orders_per_course': '3',
    'course.max_route_duration_min': '25',
    'course.promesse_client_min': '35',
    'course.retard_max_client_min': '5',
    'course.detour_max_ajout_min': '8',
    'course.direction_couloir_m': '600',
    'course.direction_zone_rayon_m': '800',
    'course.direction_angle_max_deg': '35',
    'course.direction_detour_max_min': '6',
    'course.direction_detour_max_pct': '40',
    'course.direction_google': '1',
    'course.ajout_apres_retrait': '1',
    'course.ajout_apres_retrait_max_s': '240',
    'course.depart_rayon_m': '250',
    'course.vitesse_moyenne_kmh': '22',
    'course.vitesse_pointe_kmh': '16',
    'course.turbo_fallback_after_min_v2': '6',
    'course.turbo_attente_retour_max_min': '4',
    'course.trajet_sans_coordonnees_min': '12',
    'deliverer.eta_par_defaut_min': '8',
    'course.planificateur_tache_s': '10',
    'deliverer.hors_service_sans_signal_min': '20',
    'deliverer.au_restaurant_rayon_m': '200',
    'deliverer.au_restaurant_fraicheur_min': '15',
    'deliverer.travel_time_ranking': '0',
    'preparation.duree_defaut_min': '12',
    'preparation.duree_p80_min': '18',
    'maps.plafond_appels_jour': '2000',
  };

  test.each(Object.entries(attendus))('%s : défaut %s', (cle, defaut) => {
    expect(def(cle).defaut).toBe(defaut);
  });

  test("chaque clé n'apparaît qu'une fois", () => {
    const cles = TOUS_LES_REGLAGES.map((d) => d.cle);
    expect(new Set(cles).size).toBe(cles.length);
    expect(cles).not.toContain(CLE_METHODE);
    expect(cles).not.toContain(CLE_RESTAURANTS);
  });

  test('les réglages des lots sont rangés sous « Ancienne méthode », le réglage mort a disparu', () => {
    expect(GROUPE_ANCIENNE_METHODE.titre).toBe('Ancienne méthode');
    const anciens = GROUPE_ANCIENNE_METHODE.reglages.map((d) => d.cle);
    expect(anciens).toEqual([
      'course.batch_window_seconds',
      'course.batch_min_wait_seconds',
      'course.lookahead_in_progress',
      'course.rebalance_enabled',
      'course.max_detour_meters',
      'course.turbo_fallback_after_min',
    ]);
    const nouveaux = GROUPES_NOUVELLE_METHODE.flatMap((g) => g.reglages.map((d) => d.cle));
    for (const cle of anciens) expect(nouveaux).not.toContain(cle);
    expect(TOUS_LES_REGLAGES.map((d) => d.cle)).not.toContain('course.rebalance_interval_seconds');
  });
});

describe('libellés', () => {
  test('libellé et unité, comme la conception', () => {
    expect(libelleAvecUnite(def('course.attente_max_commande_prete_s'))).toBe(
      "Attente maximale d'une commande prête (secondes)",
    );
    expect(libelleAvecUnite(def('course.horizon_preparation_s'))).toBe(
      'Attendre une commande en préparation si elle est prête dans moins de (secondes)',
    );
    expect(libelleAvecUnite(def('course.max_route_duration_min'))).toBe("Durée maximale d'une tournée (minutes)");
    expect(libelleAvecUnite(def('course.promesse_client_min'))).toBe('Délai promis au client (minutes)');
    expect(libelleAvecUnite(def('course.retard_max_client_min'))).toBe('Retard toléré sur la promesse (minutes)');
    expect(libelleAvecUnite(def('course.detour_max_ajout_min'))).toBe('Retard maximal imposé par un ajout (minutes)');
    expect(libelleAvecUnite(def('course.direction_couloir_m'))).toBe('Largeur du couloir le long du trajet (mètres)');
    expect(libelleAvecUnite(def('course.direction_zone_rayon_m'))).toBe("Rayon d'une même zone (mètres)");
    expect(libelleAvecUnite(def('course.ajout_apres_retrait_max_s'))).toBe('Pendant (secondes)');
    expect(libelleAvecUnite(def('course.depart_rayon_m'))).toBe('Rayon de départ du restaurant (mètres)');
    expect(libelleAvecUnite(def('course.turbo_fallback_after_min_v2'))).toBe(
      'Bascule vers Turbo après (minutes, depuis la commande prête)',
    );
    expect(libelleAvecUnite(def('maps.plafond_appels_jour'))).toBe("Plafond d'appels Google par jour (appels)");
    expect(libelleAvecUnite(def('course.retenue_meme_si_livreur_libre'))).toBe(
      'Attendre même si un autre livreur est libre',
    );
  });

  test('trajet long (demande du 24/10) : libellés, unités, rangés dans « Attente au comptoir »', () => {
    expect(libelleAvecUnite(def('course.petit_retard_retour_min'))).toBe(
      'Petit retard toléré au retour du livreur (minutes)',
    );
    expect(libelleAvecUnite(def('course.attente_max_trajet_long_s'))).toBe(
      'Attente maximale quand le trajet est long (secondes)',
    );
    const comptoir = GROUPES_NOUVELLE_METHODE.find((g) => g.titre === 'Attente au comptoir');
    expect(comptoir.reglages.map((d) => d.cle)).toEqual([
      'course.attente_max_commande_prete_s',
      'course.horizon_preparation_s',
      'course.petit_retard_retour_min',
      'course.attente_max_trajet_long_s',
      'course.retenue_meme_si_livreur_libre',
    ]);
    expect(comptoir.description).toContain('le trajet est long');
    expect(def('course.petit_retard_retour_min').aide).toContain('0 : aucun retard toléré');
    // Au serveur, 0 coupe seulement l'attente courte : le trajet long garde son réglage.
    expect(def('course.attente_max_commande_prete_s').aide).toContain('que pour un trajet long');
    expect(def('course.horizon_preparation_s').aide).toContain('que pour un trajet long');
    expect(def('course.attente_max_trajet_long_s').aide).toContain("0 : jamais, seule l'attente courte reste");
  });

  test('méthodes : Nouvelle en premier, Ancienne ensuite', () => {
    expect(METHODES.map((m) => m.libelle)).toEqual(['Nouvelle', 'Ancienne']);
    expect(METHODES.map((m) => m.valeur)).toEqual(['v2', 'v1']);
  });

  test('aucun texte avec tiret cadratin, aucune valeur technique dans les libellés', () => {
    const textes = [
      ...METHODES.flatMap((m) => [m.libelle, m.description]),
      ...[...GROUPES_NOUVELLE_METHODE, GROUPE_ANCIENNE_METHODE].flatMap((g) => [
        g.titre,
        g.description,
        ...g.reglages.flatMap((d) => [d.libelle, d.unite ?? '', d.aide ?? '']),
      ]),
    ];
    for (const t of textes) {
      expect(t).not.toContain('—');
      expect(t).not.toMatch(/\b(PENDING|READY|IN_DELIVERY|CHICKEN_NATION|true|false)\b/);
      expect(t).not.toMatch(/\bv[12]\b/);
    }
  });
});

describe('méthode et restaurants', () => {
  test('nouvelle méthode par défaut', () => {
    expect(lireMethode(undefined)).toEqual({ methode: 'v2', refusee: false });
    expect(lireMethode('')).toEqual({ methode: 'v2', refusee: false });
    expect(lireMethode('v1')).toEqual({ methode: 'v1', refusee: false });
    expect(lireMethode(' V1 ')).toEqual({ methode: 'v1', refusee: false });
    expect(lireMethode('1')).toEqual({ methode: 'v1', refusee: false });
    expect(lireMethode('2')).toEqual({ methode: 'v2', refusee: false });
    expect(lireMethode('nouvelle')).toEqual({ methode: 'v2', refusee: true });
  });

  test('restaurants : vide = tous, virgules, espaces ou JSON', () => {
    expect(lireRestaurants('')).toEqual({ ids: [], refusee: false });
    expect(lireRestaurants('a, b;c  d')).toEqual({ ids: ['a', 'b', 'c', 'd'], refusee: false });
    expect(lireRestaurants('["a"," b "]')).toEqual({ ids: ['a', 'b'], refusee: false });
    expect(lireRestaurants('[1,2]')).toEqual({ ids: [], refusee: true });
    expect(lireRestaurants('[cassé')).toEqual({ ids: [], refusee: true });
    expect(ecrireRestaurants(['b', 'a', 'b', ' '])).toBe('a,b');
    expect(resumeRestaurants([])).toBe('Tous les restaurants');
    expect(resumeRestaurants(['a'])).toBe('1 restaurant');
    expect(resumeRestaurants(['a', 'b'])).toBe('2 restaurants');
  });
});

describe('saisie : 0 permis là où il a un sens, valeur refusée signalée', () => {
  test('nouvelle méthode : 0 accepté pour les attentes, retards, détours et la fenêtre', () => {
    for (const cle of [
      'course.attente_max_commande_prete_s',
      'course.horizon_preparation_s',
      'course.petit_retard_retour_min',
      'course.attente_max_trajet_long_s',
      'course.retard_max_client_min',
      'course.detour_max_ajout_min',
      'course.ajout_apres_retrait_max_s',
      'course.turbo_fallback_after_min_v2',
      'course.direction_couloir_m',
      'course.direction_zone_rayon_m',
      'course.direction_angle_max_deg',
      'deliverer.hors_service_sans_signal_min',
      'maps.plafond_appels_jour',
    ]) {
      expect(verifierSaisie(def(cle), '0')).toEqual({ ok: true, valeur: '0' });
    }
  });

  test('0 refusé là où il n’a pas de sens', () => {
    expect(verifierSaisie(def('course.max_orders_per_course'), '0')).toEqual({
      ok: false,
      message: 'Valeur attendue entre 1 et 10',
    });
    expect(verifierSaisie(def('course.promesse_client_min'), '0').ok).toBe(false);
    expect(verifierSaisie(def('course.depart_rayon_m'), '0').ok).toBe(false);
    expect(verifierSaisie(def('preparation.duree_defaut_min'), '0')).toEqual({
      ok: false,
      message: 'Durée supérieure à 0 attendue',
    });
    expect(verifierSaisie(def('course.planificateur_tache_s'), '2')).toEqual({
      ok: false,
      message: 'Valeur attendue entre 5 et 300',
    });
  });

  test('trajet long : mêmes contrôles que les réglages voisins', () => {
    expect(verifierSaisie(def('course.petit_retard_retour_min'), '7,5')).toEqual({ ok: true, valeur: '7.5' });
    expect(verifierSaisie(def('course.petit_retard_retour_min'), '121')).toEqual({ ok: false, message: 'Valeur attendue entre 0 et 120' });
    expect(verifierSaisie(def('course.petit_retard_retour_min'), '-1')).toEqual({ ok: false, message: 'Valeur attendue entre 0 et 120' });
    expect(verifierSaisie(def('course.attente_max_trajet_long_s'), '900')).toEqual({ ok: true, valeur: '900' });
    expect(verifierSaisie(def('course.attente_max_trajet_long_s'), '3601')).toEqual({ ok: false, message: 'Valeur attendue entre 0 et 3600' });
    expect(verifierSaisie(def('course.attente_max_trajet_long_s'), 'vingt')).toEqual({ ok: false, message: 'Nombre attendu' });
  });

  test("ancienne méthode : 0 n'est jamais accepté", () => {
    expect(verifierSaisie(def('course.batch_min_wait_seconds'), '0')).toEqual({
      ok: false,
      message: "0 n'est pas accepté par l'ancienne méthode",
    });
    expect(verifierSaisie(def('course.batch_window_seconds'), '180')).toEqual({ ok: true, valeur: '180' });
  });

  test('bornes, entiers, texte, virgule décimale, vide', () => {
    expect(verifierSaisie(def('course.attente_max_commande_prete_s'), '3601').ok).toBe(false);
    expect(verifierSaisie(def('course.max_orders_per_course'), '2.5')).toEqual({ ok: false, message: 'Nombre entier attendu' });
    expect(verifierSaisie(def('course.direction_couloir_m'), 'abc')).toEqual({ ok: false, message: 'Nombre attendu' });
    expect(verifierSaisie(def('course.direction_couloir_m'), '-5')).toEqual({ ok: false, message: 'Nombre négatif refusé' });
    expect(verifierSaisie(def('course.direction_angle_max_deg'), '181').ok).toBe(false);
    expect(verifierSaisie(def('course.vitesse_moyenne_kmh'), '22,5')).toEqual({ ok: true, valeur: '22.5' });
    expect(verifierSaisie(def('course.vitesse_moyenne_kmh'), '  ')).toEqual({ ok: true, valeur: '' });
  });

  test('oui ou non', () => {
    expect(verifierSaisie(def('course.ajout_apres_retrait'), '0')).toEqual({ ok: true, valeur: '0' });
    expect(verifierSaisie(def('course.ajout_apres_retrait'), 'oui')).toEqual({ ok: true, valeur: '1' });
    expect(verifierSaisie(def('course.direction_google'), 'peut-être')).toEqual({ ok: false, message: 'Oui ou non attendu' });
  });
});

describe('valeur en base : ce que le serveur applique', () => {
  test('absente : le défaut, sans alerte', () => {
    expect(valeurAppliquee(def('course.attente_max_commande_prete_s'), undefined)).toEqual({
      valeur: '300',
      refusee: false,
      message: null,
    });
  });

  test("0 en base pour l'ancienne méthode : refusé, 120 appliqué (le défaut qui remplaçait 0 sans prévenir)", () => {
    expect(valeurAppliquee(def('course.batch_min_wait_seconds'), '0')).toEqual({
      valeur: '120',
      refusee: true,
      message: 'Valeur enregistrée « 0 » refusée : le serveur applique 120.',
    });
  });

  test('0 en base pour la nouvelle méthode : gardé', () => {
    expect(valeurAppliquee(def('course.attente_max_commande_prete_s'), '0')).toEqual({
      valeur: '0',
      refusee: false,
      message: null,
    });
  });

  test('hors bornes, illisible, oui ou non inconnu', () => {
    expect(valeurAppliquee(def('course.max_orders_per_course'), '0').message).toBe(
      'Valeur enregistrée « 0 » refusée : le serveur applique 3.',
    );
    expect(valeurAppliquee(def('course.direction_couloir_m'), 'large').refusee).toBe(true);
    expect(valeurAppliquee(def('course.direction_google'), 'yes')).toEqual({
      valeur: '1',
      refusee: true,
      message: 'Valeur enregistrée « yes » refusée : le serveur applique oui.',
    });
    expect(valeurAppliquee(def('course.ajout_apres_retrait'), 'yes')).toEqual({ valeur: '1', refusee: false, message: null });
  });

  test("ancienne lecture des oui ou non : jamais refusée, tout ce qui n'est pas « oui » vaut non", () => {
    expect(valeurAppliquee(def('course.rebalance_enabled'), 'oui')).toEqual({ valeur: '0', refusee: false, message: null });
    expect(valeurAppliquee(def('course.rebalance_enabled'), 'true')).toEqual({ valeur: '1', refusee: false, message: null });
  });

  test('trajet long : absent, le défaut ; refusé en base, signalé avec le défaut appliqué', () => {
    expect(valeurAppliquee(def('course.petit_retard_retour_min'), undefined)).toEqual({ valeur: '5', refusee: false, message: null });
    expect(valeurAppliquee(def('course.attente_max_trajet_long_s'), '0')).toEqual({ valeur: '0', refusee: false, message: null });
    expect(valeurAppliquee(def('course.attente_max_trajet_long_s'), '5000')).toEqual({
      valeur: '1200',
      refusee: true,
      message: 'Valeur enregistrée « 5000 » refusée : le serveur applique 1200.',
    });
    expect(valeurAppliquee(def('course.petit_retard_retour_min'), 'long').message).toBe(
      'Valeur enregistrée « long » refusée : le serveur applique 5.',
    );
  });

  test('plafond Google : arrondi vers le bas, négatif refusé', () => {
    expect(valeurAppliquee(def('maps.plafond_appels_jour'), '1500.7').valeur).toBe('1500');
    expect(valeurAppliquee(def('maps.plafond_appels_jour'), '-1').refusee).toBe(true);
  });
});

describe('enregistrement', () => {
  const base = { saisies: {}, enregistrees: {}, methode: 'v2', restaurants: [] };

  test('rien ne change : rien à écrire, la nouvelle méthode par défaut reste absente', () => {
    expect(planEnregistrement(base)).toEqual({ changements: [], erreurs: {} });
  });

  test('valeur changée écrite, inchangée ignorée, vidée effacée', () => {
    const plan = planEnregistrement({
      ...base,
      enregistrees: { 'course.attente_max_commande_prete_s': '300', 'course.horizon_preparation_s': '420', 'course.retard_max_client_min': '5' },
      saisies: { 'course.attente_max_commande_prete_s': '180', 'course.horizon_preparation_s': '420', 'course.retard_max_client_min': '' },
    });
    expect(plan.erreurs).toEqual({});
    expect(plan.changements).toEqual([
      {
        cle: 'course.attente_max_commande_prete_s',
        action: 'ecrire',
        valeur: '180',
        description: "Attente maximale d'une commande prête (secondes)",
      },
      { cle: 'course.retard_max_client_min', action: 'effacer' },
    ]);
  });

  test('valeur refusée déjà en base et laissée telle quelle : signalée à part, ne bloque rien', () => {
    const plan = planEnregistrement({
      ...base,
      enregistrees: { 'course.batch_min_wait_seconds': '0', 'course.direction_google': 'yes' },
      saisies: { 'course.batch_min_wait_seconds': '0', 'course.direction_google': 'yes', 'course.promesse_client_min': '40' },
    });
    expect(plan.erreurs).toEqual({});
    expect(plan.changements.map((c) => c.cle)).toEqual(['course.promesse_client_min']);
  });

  test('« true » en base lu comme oui : pas réécrit en « 1 »', () => {
    const plan = planEnregistrement({
      ...base,
      enregistrees: { 'course.ajout_apres_retrait': 'true' },
      saisies: { 'course.ajout_apres_retrait': '1' },
    });
    expect(plan.changements).toEqual([]);
  });

  test('saisie refusée : signalée, pas écrite', () => {
    const plan = planEnregistrement({ ...base, saisies: { 'course.max_orders_per_course': '0' } });
    expect(plan.erreurs).toEqual({ 'course.max_orders_per_course': 'Valeur attendue entre 1 et 10' });
    expect(plan.changements).toEqual([]);
  });

  test('passage à l’ancienne méthode, puis retour à la nouvelle', () => {
    expect(planEnregistrement({ ...base, methode: 'v1' }).changements).toEqual([
      { cle: CLE_METHODE, action: 'ecrire', valeur: 'v1', description: 'Méthode de regroupement : v2 (nouvelle) ou v1 (ancienne)' },
    ]);
    expect(planEnregistrement({ ...base, enregistrees: { [CLE_METHODE]: 'v1' } }).changements[0]).toMatchObject({
      cle: CLE_METHODE,
      valeur: 'v2',
    });
    expect(planEnregistrement({ ...base, enregistrees: { [CLE_METHODE]: 'v2' } }).changements).toEqual([]);
  });

  test('restaurants concernés : triés, effacés quand on revient à tous', () => {
    expect(planEnregistrement({ ...base, restaurants: ['r2', 'r1'] }).changements).toEqual([
      { cle: CLE_RESTAURANTS, action: 'ecrire', valeur: 'r1,r2', description: 'Restaurants concernés par la nouvelle méthode (vide = tous)' },
    ]);
    expect(planEnregistrement({ ...base, enregistrees: { [CLE_RESTAURANTS]: 'r2 r1' }, restaurants: ['r1', 'r2'] }).changements).toEqual([]);
    expect(planEnregistrement({ ...base, enregistrees: { [CLE_RESTAURANTS]: 'r1' } }).changements).toEqual([
      { cle: CLE_RESTAURANTS, action: 'effacer' },
    ]);
    expect(planEnregistrement({ ...base, enregistrees: { [CLE_RESTAURANTS]: '[cassé' } }).changements).toEqual([
      { cle: CLE_RESTAURANTS, action: 'effacer' },
    ]);
  });
});

/**
 * Relecture du 23/10 (constat « le plafond Google du planificateur coupe
 * aussi les frais de livraison et le choix du restaurant ») : l'aide disait
 * « Au-delà, le regroupement continue sans Google ». Elle doit dire ce que le
 * serveur coupe vraiment, lu dans ses sources quand elles sont là.
 */
const maps = join(import.meta.dir, '../../../../../backend/src/modules/maps');
describe.skipIf(!existsSync(maps))('aide du plafond Google, fidèle au serveur', () => {
  test("l'aide nomme les frais de livraison tant que l'itinéraire du serveur est plafonné", () => {
    const compteur = readFileSync(join(maps, 'compteur-appels-google.service.ts'), 'utf8');
    const service = readFileSync(join(maps, 'maps.service.ts'), 'utf8');
    const plafonnees = compteur.match(/FONCTIONS_PLAFONNEES[^=]*=\s*new Set<[^>]*>\(\[([^\]]*)\]/)?.[1] ?? '';
    const itinerairePlafonne =
      /'itineraire'/.test(plafonnees) && /reserver\('itineraire'\)/.test(service) && /distanceRoutiereMetres/.test(service);
    const aide = def('maps.plafond_appels_jour').aide;
    expect(aide).toBe(TEXTE_PLAFOND_GOOGLE);
    expect(/frais de livraison/.test(aide)).toBe(itinerairePlafonne);
    expect(aide).not.toMatch(/le regroupement continue sans Google/);
  });
});

/**
 * Seconde relecture du 23/10 : le serveur avait deux réglages neufs
 * (`course.turbo_attente_retour_max_min`, `course.trajet_sans_coordonnees_min`)
 * et un ancien (`deliverer.eta_par_defaut_min`) que l'écran ne montrait pas.
 * Chaque réglage chiffré du planificateur, lu dans ses sources quand elles
 * sont là, doit être à l'écran avec ses bornes, son défaut et 0 accepté ou
 * refusé comme au serveur.
 */
const planification = join(import.meta.dir, '../../../../../backend/src/modules/course/helpers/planification.rules.ts');
describe.skipIf(!existsSync(planification))('réglages du planificateur, fidèles au serveur', () => {
  const source = existsSync(planification) ? readFileSync(planification, 'utf8') : '';
  const bornes = [...source.matchAll(/(\w+): \{ cle: '([^']+)', min: (\d+), max: (\d+), zero: (true|false)/g)].map((m) => ({
    nom: m[1],
    cle: m[2],
    min: Number(m[3]),
    max: Number(m[4]),
    zero: m[5] === 'true',
  }));
  const blocDefauts = source.match(/REGLAGES_PLANIFICATION_DEFAUT[^=]*=\s*Object\.freeze\(\{([\s\S]*?)\}\);/)?.[1] ?? '';
  const defautServeur = (nom) => blocDefauts.match(new RegExp(`\\b${nom}: ([\\d.]+),`))?.[1];
  // Montré dans un autre onglet de Paramètres > Livraison.
  const ailleurs = ['deliverer.gps_expiration_minutes'];

  test('les bornes sont bien lues dans les sources du serveur', () => {
    expect(bornes.length).toBeGreaterThanOrEqual(18);
    expect(bornes.map((b) => b.cle)).toContain('course.turbo_attente_retour_max_min');
  });

  test('chaque réglage chiffré du serveur est à l’écran, mêmes bornes, même défaut', () => {
    for (const b of bornes.filter((x) => !ailleurs.includes(x.cle))) {
      const d = def(b.cle);
      expect({ cle: b.cle, min: d.min, max: d.max, defaut: d.defaut }).toEqual({
        cle: b.cle,
        min: b.min,
        max: b.max,
        defaut: defautServeur(b.nom),
      });
      expect({ cle: b.cle, zero: verifierSaisie(d, '0').ok }).toEqual({ cle: b.cle, zero: b.zero && b.min === 0 });
    }
  });

  test('Turbo attend un livreur qui revient : 0 accepté (jamais), 31 refusé ; trajet sans position : 0 refusé', () => {
    expect(verifierSaisie(def('course.turbo_attente_retour_max_min'), '0')).toEqual({ ok: true, valeur: '0' });
    expect(verifierSaisie(def('course.turbo_attente_retour_max_min'), '31')).toEqual({ ok: false, message: 'Valeur attendue entre 0 et 30' });
    expect(verifierSaisie(def('course.trajet_sans_coordonnees_min'), '0')).toEqual({ ok: false, message: 'Valeur attendue entre 1 et 120' });
    expect(valeurAppliquee(def('course.trajet_sans_coordonnees_min'), '0')).toEqual({
      valeur: '12',
      refusee: true,
      message: 'Valeur enregistrée « 0 » refusée : le serveur applique 12.',
    });
  });
});
