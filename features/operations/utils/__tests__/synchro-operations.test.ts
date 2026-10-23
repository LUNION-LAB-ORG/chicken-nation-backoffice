// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  abonnerOperations,
  ATTENTE_MAX_CONFIRMATION_MS,
  CACHE_SERVEUR_MS,
  EVENEMENT_RECONNEXION,
  EVENEMENT_STATUT_COURSE,
  EVENEMENTS_COMMANDE,
  EVENEMENTS_COURSE,
  RELECTURE_CONFIRMATION_MS,
  RELECTURE_OPERATIONS_MS,
  relectureDeConfirmation,
} from '../synchro-operations';

/** Minuterie à la main : `avancer(ms)` déclenche ce qui est échu, dans l'ordre. */
function minuterieFactice() {
  let t = 0;
  let n = 0;
  const attente = new Map();
  return {
    planifier(rappel, ms) {
      n += 1;
      attente.set(n, { a: t + ms, rappel });
      return n;
    },
    annuler(id) {
      attente.delete(id);
    },
    maintenant: () => t,
    avancer(ms) {
      const fin = t + ms;
      for (;;) {
        const prochain = [...attente.entries()].filter(([, v]) => v.a <= fin).sort((x, y) => x[1].a - y[1].a)[0];
        if (!prochain) break;
        attente.delete(prochain[0]);
        t = prochain[1].a;
        prochain[1].rappel();
      }
      t = fin;
    },
    enAttente: () => attente.size,
  };
}

/** Socket factice : garde les écouteurs posés, émet à la demande. */
function socketFactice() {
  const ecouteurs = new Map();
  return {
    ecouteurs,
    on(evenement, f) {
      if (!ecouteurs.has(evenement)) ecouteurs.set(evenement, new Set());
      ecouteurs.get(evenement).add(f);
    },
    off(evenement, f) {
      ecouteurs.get(evenement)?.delete(f);
    },
    emettre(evenement, payload) {
      for (const f of ecouteurs.get(evenement) ?? []) f(payload);
    },
    nombre() {
      let n = 0;
      for (const s of ecouteurs.values()) n += s.size;
      return n;
    },
  };
}

describe("écran Opérations : écouteurs du socket", () => {
  test('la reconnexion du socket relit la liste (événements perdus pendant la coupure)', () => {
    const socket = socketFactice();
    let relectures = 0;
    abonnerOperations(socket, { recharger: () => relectures++, surStatutCourse: () => undefined }, minuterieFactice());
    socket.emettre(EVENEMENT_RECONNEXION);
    expect(relectures).toBe(1);
  });

  test('chaque événement de commande et de course relit la liste ; course:statut:changed passe par l’avis', () => {
    const socket = socketFactice();
    let relectures = 0;
    const statuts = [];
    abonnerOperations(socket, { recharger: () => relectures++, surStatutCourse: (p) => statuts.push(p) }, minuterieFactice());
    for (const e of [...EVENEMENTS_COMMANDE, ...EVENEMENTS_COURSE]) socket.emettre(e, {});
    expect(relectures).toBe(EVENEMENTS_COMMANDE.length + EVENEMENTS_COURSE.length);
    socket.emettre(EVENEMENT_STATUT_COURSE, { reason: 'COMMANDE_AJOUTEE' });
    expect(statuts).toEqual([{ reason: 'COMMANDE_AJOUTEE' }]);
    expect(relectures).toBe(EVENEMENTS_COMMANDE.length + EVENEMENTS_COURSE.length);
  });

  test('le désabonnement retire nos écouteurs, et seulement eux', () => {
    const socket = socketFactice();
    const duStore = () => undefined;
    socket.on('connect', duStore);
    const minuterie = minuterieFactice();
    const arreter = abonnerOperations(socket, { recharger: () => undefined, surStatutCourse: () => undefined }, minuterie);
    expect(socket.nombre()).toBeGreaterThan(1);
    socket.emettre('order:created', {});
    expect(minuterie.enAttente()).toBe(1);
    arreter();
    expect(socket.nombre()).toBe(1);
    expect(minuterie.enAttente()).toBe(0);
    expect(socket.ecouteurs.get('connect').has(duStore)).toBe(true);
  });

  test('cache du serveur (1 s) : une relecture de confirmation suit la rafale, une seule, après la fin du cache', () => {
    // Banc du 23/10 : commande prête, course créée et offre proposée en 300 ms ;
    // les relectures immédiates recevaient la réponse en cache d'avant la course.
    expect(RELECTURE_CONFIRMATION_MS).toBeGreaterThan(CACHE_SERVEUR_MS);
    const socket = socketFactice();
    const minuterie = minuterieFactice();
    const lectures = [];
    abonnerOperations(socket, { recharger: () => lectures.push(minuterie.maintenant()), surStatutCourse: () => lectures.push(minuterie.maintenant()) }, minuterie);
    socket.emettre('order:statusUpdated', {});
    minuterie.avancer(200);
    socket.emettre(EVENEMENT_STATUT_COURSE, { reason: 'COURSE_CREEE' });
    minuterie.avancer(100);
    socket.emettre(EVENEMENT_STATUT_COURSE, { reason: 'OFFRE_PROPOSEE' });
    expect(lectures).toEqual([0, 200, 300]);
    minuterie.avancer(5_000);
    expect(lectures).toEqual([0, 200, 300, 300 + RELECTURE_CONFIRMATION_MS]);
    // La confirmation part après la fin de toute réponse mise en cache pendant la rafale.
    expect(lectures[3] - lectures[2]).toBeGreaterThan(CACHE_SERVEUR_MS);
  });

  test('rafale continue : confirmation au plus tard 3 s après le premier événement, puis encore après le dernier', () => {
    const minuterie = minuterieFactice();
    const lectures = [];
    const c = relectureDeConfirmation(() => lectures.push(minuterie.maintenant()), minuterie);
    for (let i = 0; i < 10; i++) {
      c.signaler();
      minuterie.avancer(500);
    }
    // Événements de 0 à 4 500 ms : forcée à 3 000, puis 1,2 s après le dernier (4 500).
    expect(lectures).toEqual([ATTENTE_MAX_CONFIRMATION_MS]);
    minuterie.avancer(10_000);
    expect(lectures).toEqual([ATTENTE_MAX_CONFIRMATION_MS, 4_500 + RELECTURE_CONFIRMATION_MS]);
  });

  test('les fonctions d’invalidation sont stables (useCallback) : les écouteurs ne sont pas reposés à chaque rendu', () => {
    // Sans cela, l'effet du hook retirait et reposait ses écouteurs à chaque
    // rendu et annulait la relecture de confirmation (banc du 23/10 : « Proposée
    // à Koffi » affiché 20 s après l'offre).
    for (const fichier of ['../../queries/index.query.ts', '../../../orders/queries/index.query.ts']) {
      const source = readFileSync(join(import.meta.dir, fichier), 'utf8');
      expect(source).toMatch(/return useCallback\(async/);
      expect(source).toMatch(/\}, \[queryClient\]\);/);
    }
    const hook = readFileSync(join(import.meta.dir, '../../hooks/useOperationsSocketSync.ts'), 'utf8');
    expect(hook).toMatch(/\[socket, invalidate, queryClient, ajouterAvis\]/);
  });

  test('relecture de filet toutes les 20 s (offres proposées, refusées ou expirées)', () => {
    expect(RELECTURE_OPERATIONS_MS).toBe(20_000);
    const requete = readFileSync(join(import.meta.dir, '../../queries/operations-active.query.ts'), 'utf8');
    expect(requete).toMatch(/refetchInterval:\s*RELECTURE_OPERATIONS_MS/);
  });
});

/**
 * Contrat avec le serveur : tout événement de course ou de commande émis vers
 * la salle du restaurant ou du siège est écouté par l'écran. Lu dans les
 * sources du serveur (dépôt voisin) quand elles sont là.
 */
const backend = join(import.meta.dir, '../../../../../backend/src');
const lire = (chemin) => readFileSync(join(backend, chemin), 'utf8');

function valeursEnum(source) {
  const valeurs = new Map();
  for (const m of source.matchAll(/(\w+)\s*=\s*'([^']+)'/g)) valeurs.set(m[1], m[2]);
  return valeurs;
}

function evenementsVersSalles(source, canaux, prefixe) {
  const trouves = new Set();
  const motif = new RegExp(`emitTo(?:Backoffice|Restaurant)\\((?:[^,()]+,\\s*)?${prefixe}\\.(\\w+)`, 'g');
  for (const m of source.matchAll(motif)) trouves.add(canaux.get(m[1]) ?? m[1]);
  return trouves;
}

describe.skipIf(!existsSync(backend))('contrat avec le serveur (salles du restaurant et du siège)', () => {
  test('tous les événements de course et de commande vers ces salles sont écoutés', () => {
    const canauxCourse = valeursEnum(lire('modules/course/enums/course-channels.ts'));
    const canauxCommande = valeursEnum(lire('modules/order/enums/order-channels.ts'));
    const emis = new Set([
      ...evenementsVersSalles(lire('modules/course/websockets/course-websocket.service.ts'), canauxCourse, 'CourseChannels'),
      ...evenementsVersSalles(lire('modules/order/websockets/order-websocket.service.ts'), canauxCommande, 'OrderChannels'),
    ]);
    expect(emis.size).toBeGreaterThanOrEqual(8);
    const ecoutes = new Set([...EVENEMENTS_COMMANDE, ...EVENEMENTS_COURSE, EVENEMENT_STATUT_COURSE]);
    const manquants = [...emis].filter((e) => !ecoutes.has(e));
    expect(manquants).toEqual([]);
  });
});
