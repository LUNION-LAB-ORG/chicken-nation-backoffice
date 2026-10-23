// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  abonnerOperations,
  EVENEMENT_RECONNEXION,
  EVENEMENT_STATUT_COURSE,
  EVENEMENTS_COMMANDE,
  EVENEMENTS_COURSE,
  RELECTURE_OPERATIONS_MS,
} from '../synchro-operations';

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
    abonnerOperations(socket, { recharger: () => relectures++, surStatutCourse: () => undefined });
    socket.emettre(EVENEMENT_RECONNEXION);
    expect(relectures).toBe(1);
  });

  test('chaque événement de commande et de course relit la liste ; course:statut:changed passe par l’avis', () => {
    const socket = socketFactice();
    let relectures = 0;
    const statuts = [];
    abonnerOperations(socket, { recharger: () => relectures++, surStatutCourse: (p) => statuts.push(p) });
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
    const arreter = abonnerOperations(socket, { recharger: () => undefined, surStatutCourse: () => undefined });
    expect(socket.nombre()).toBeGreaterThan(1);
    arreter();
    expect(socket.nombre()).toBe(1);
    expect(socket.ecouteurs.get('connect').has(duStore)).toBe(true);
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
