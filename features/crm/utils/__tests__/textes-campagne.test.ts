/* eslint-disable @typescript-eslint/ban-ts-comment -- tests bun : leurs types ne sont pas installés dans le backoffice. */
// @ts-nocheck
import { describe, expect, test } from 'bun:test';

import * as textes from '../textes-campagne';
import {
  closeSansLancement,
  ligneAuPilote,
  ligneDateDebut,
  ligneMode,
  ligneSansAgent,
  rapportDisponible,
  texteEquipe,
  texteLancer,
} from '../textes-campagne';

/**
 * Écrans de campagne (correction du 02/11) : lancement à la date de début,
 * mode manuel confié au pilote, contacts sans agent. Les champs nouveaux sont
 * absents d'un serveur plus ancien : aucune phrase ne doit alors apparaître.
 */

describe('campagne planifiée dont la date de début est passée', () => {
  test('sans erreur : lancement automatique dans l’heure', () => {
    expect(ligneDateDebut({ status: 'PLANIFIED', date_debut_passee: true, launch_error: null })).toBe(
      "Date de début passée : lancement automatique dans l'heure.",
    );
  });

  test('avec le refus du lancement automatique, première lettre en minuscule', () => {
    expect(
      ligneDateDebut({ status: 'PLANIFIED', date_debut_passee: true, launch_error: 'Aucun contact disponible pour cette population' }),
    ).toBe('Date de début passée. Lancement impossible : aucun contact disponible pour cette population');
  });

  test('rien à dire : date à venir, campagne lancée, ou serveur plus ancien', () => {
    expect(ligneDateDebut({ status: 'PLANIFIED', date_debut_passee: false })).toBeNull();
    expect(ligneDateDebut({ status: 'ACTIVE', date_debut_passee: true })).toBeNull();
    expect(ligneDateDebut({ status: 'PLANIFIED' })).toBeNull();
  });
});

describe('campagne close sans avoir été lancée', () => {
  test('reconnue, et sans rapport', () => {
    const close = { status: 'COMPLETED', started_at: null };
    expect(closeSansLancement(close)).toBe(true);
    expect(rapportDisponible(close)).toBe(false);
    const finie = { status: 'COMPLETED', started_at: '2026-10-01T08:00:00.000Z' };
    expect(closeSansLancement(finie)).toBe(false);
    expect(rapportDisponible(finie)).toBe(true);
    expect(rapportDisponible({ status: 'PLANIFIED', started_at: null })).toBe(false);
  });
});

describe('choix d’une campagne au tableau de bord et au rapport (relecture du 02/11)', () => {
  test('une campagne close sans avoir été lancée n’est pas proposée : elle donnerait un tableau vide', () => {
    const toutes = [
      { id: 'planifiee', status: 'PLANIFIED', started_at: null },
      { id: 'close-sans-lancement', status: 'COMPLETED', started_at: null },
      { id: 'en-cours', status: 'ACTIVE', started_at: '2026-10-20T08:00:00.000Z' },
      { id: 'suspendue', status: 'SUSPENDED', started_at: '2026-10-10T08:00:00.000Z' },
      { id: 'terminee', status: 'COMPLETED', started_at: '2026-10-01T08:00:00.000Z' },
    ];
    expect(toutes.filter(rapportDisponible).map((c) => c.id)).toEqual(['en-cours', 'suspendue', 'terminee']);
  });
});

describe('lancement selon le mode de répartition', () => {
  test('automatique : les inscrits et inactifs à reprendre la rejoignent chaque jour', () => {
    expect(texteLancer('AUTOMATIQUE')).toBe(
      "Elle prend les contacts disponibles de chaque public, selon ses critères, et les répartit dans l'équipe. Ses critères ne pourront plus changer ; chaque jour, les inscrits et les inactifs à reprendre qui y répondent la rejoignent. Estimez-la d'abord si besoin.",
    );
  });

  test('manuel : les contacts vont au pilote', () => {
    expect(texteLancer('MANUEL')).toBe(
      "Elle prend les contacts disponibles de chaque public, selon ses critères, et les confie au pilote, qui les répartit dans l'équipe. La population ne pourra plus changer. Estimez-la d'abord si besoin.",
    );
  });

  test('compte rendu : la ligne « confiés au pilote » n’apparaît que s’il y en a', () => {
    expect(ligneAuPilote({ au_pilote: 12 })).toBe("12 confiés au pilote, à répartir dans l'équipe.");
    expect(ligneAuPilote({ au_pilote: 1 })).toBe("1 confié au pilote, à répartir dans l'équipe.");
    expect(ligneAuPilote({ au_pilote: 0 })).toBeNull();
    expect(ligneAuPilote({})).toBeNull();
  });
});

describe('détail d’une campagne', () => {
  test('mode affiché en fin de ligne', () => {
    expect(ligneMode('AUTOMATIQUE')).toBe('répartition automatique');
    expect(ligneMode('MANUEL')).toBe('répartition manuelle');
  });

  test('contacts sans agent d’une campagne en cours', () => {
    expect(ligneSansAgent({ status: 'ACTIVE', resume: { sans_agent: 3 } })).toBe(
      '3 contacts sans agent : répartissez-les avec le bouton « Équipe ».',
    );
    expect(ligneSansAgent({ status: 'SUSPENDED', resume: { sans_agent: 1 } })).toBe(
      '1 contact sans agent : répartissez-le avec le bouton « Équipe ».',
    );
    expect(ligneSansAgent({ status: 'ACTIVE', resume: { sans_agent: 0 } })).toBeNull();
    expect(ligneSansAgent({ status: 'ACTIVE', resume: {} })).toBeNull();
    expect(ligneSansAgent({ status: 'COMPLETED', resume: { sans_agent: 4 } })).toBeNull();
  });

  test('équipe : ce que fait un ajout ou un retrait, selon le mode', () => {
    expect(texteEquipe('AUTOMATIQUE')).toBe(
      'Un agent retiré rend ses contacts, aussitôt confiés aux autres agents. Un agent ajouté reçoit sa part des contacts jamais appelés.',
    );
    expect(texteEquipe('MANUEL')).toBe(
      'Un agent retiré rend ses contacts au pilote. Un agent ajouté ne reçoit rien tout seul : répartissez ci-dessous.',
    );
  });
});

test('aucun tiret cadratin ni demi-cadratin dans les textes', () => {
  const tous = [
    ...Object.values(textes).filter((v) => typeof v === 'string'),
    texteLancer('AUTOMATIQUE'),
    texteLancer('MANUEL'),
    texteEquipe('AUTOMATIQUE'),
    texteEquipe('MANUEL'),
    ligneDateDebut({ status: 'PLANIFIED', date_debut_passee: true }),
  ];
  for (const t of tous) expect(/[\u2013\u2014]/.test(t)).toBe(false);
});
