// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';

import {
  avancementTournee,
  comparerLivreursDuJour,
  detailEtatDuJour,
  dureeEnLigne,
  enTeteRestaurant,
  estReplie,
  jusquA,
  placeDansLaFile,
  planningDuJour,
  rangDuLivreur,
} from '../livreurs-du-jour';

/**
 * Vue Livreurs « Aujourd'hui » (conception du 24/10, 10.2) : détail de
 * l'état, planning du jour, temps en ligne, tri et repli des hors service.
 */

const MAINTENANT = new Date('2026-10-24T12:40:00Z');

const livraison = (statut) => ({ id: statut, statut, sequence_order: 1, order_reference: 'ORD', address: null });

describe('place dans la file', () => {
  test('« 1er de la file », « 2e de la file »', () => {
    expect(placeDansLaFile(1)).toBe('1er de la file');
    expect(placeDansLaFile(2)).toBe('2e de la file');
    expect(placeDansLaFile(null)).toBe(null);
    expect(placeDansLaFile(0)).toBe(null);
  });

  test('rang_file du serveur ; serveur ancien : queue_rank juste pour un seul restaurant', () => {
    expect(rangDuLivreur({ rang_file: 2, queue_rank: 5 }, false)).toBe(2);
    expect(rangDuLivreur({ rang_file: null, queue_rank: 5 }, true)).toBe(null);
    expect(rangDuLivreur({ queue_rank: 5 }, true)).toBe(5);
    expect(rangDuLivreur({ queue_rank: 5 }, false)).toBe(null);
  });
});

describe('tournée', () => {
  test('« 1 sur 3 livrée », « 2 sur 3 livrées », « Tout est livré »', () => {
    expect(avancementTournee([livraison('DELIVERED'), livraison('IN_ROUTE'), livraison('PENDING')])).toBe(
      '1 sur 3 livrée',
    );
    expect(avancementTournee([livraison('DELIVERED'), livraison('DELIVERED'), livraison('PENDING')])).toBe(
      '2 sur 3 livrées',
    );
    expect(avancementTournee([livraison('DELIVERED'), livraison('CANCELLED')])).toBe('Tout est livré');
    expect(avancementTournee([])).toBe(null);
  });
});

describe("détail de l'état", () => {
  test('disponible : place dans la file', () => {
    expect(detailEtatDuJour('DISPONIBLE', { rang: 1 }, MAINTENANT)).toEqual({
      texte: '1er de la file',
      retard: null,
      ambre: false,
    });
    expect(detailEtatDuJour('OFFRE_EN_ATTENTE', { rang: null }, MAINTENANT).texte).toBe(null);
  });

  test('en course : référence, avancement, retard en rouge', () => {
    const course = {
      id: 'c',
      reference: 'CRS-241024-0040',
      statut: 'IN_DELIVERY',
      assigned_at: null,
      deliveries: [livraison('DELIVERED'), livraison('IN_ROUTE'), livraison('PENDING')],
      en_retard: true,
      retard_min: 12,
    };
    expect(detailEtatDuJour('EN_COURSE', { course, rang: null }, MAINTENANT)).toEqual({
      texte: 'CRS-241024-0040 · 1 sur 3 livrée',
      retard: '+12 min',
      ambre: false,
    });
    expect(
      detailEtatDuJour('EN_COURSE', { course: { ...course, statut: 'ACCEPTED', en_retard: false }, rang: null }, MAINTENANT)
        .texte,
    ).toBe('CRS-241024-0040 · vers le restaurant');
    expect(
      detailEtatDuJour('EN_COURSE', { course: { ...course, statut: 'AT_RESTAURANT' }, rang: null }, MAINTENANT).texte,
    ).toBe('CRS-241024-0040 · au restaurant');
    // Serveur ancien : ni en_retard ni retard_min.
    const ancienne = { ...course, en_retard: undefined, retard_min: undefined };
    expect(detailEtatDuJour('EN_COURSE', { course: ancienne, rang: null }, MAINTENANT).retard).toBe(null);
  });

  test('pause : « jusqu’à 14 h 32 » ; pause sans fin : rien', () => {
    expect(detailEtatDuJour('EN_PAUSE', { pause_until: '2026-10-24T14:32:00Z', rang: null }, MAINTENANT).texte).toBe(
      "jusqu'à 14 h 32",
    );
    expect(
      detailEtatDuJour('PAUSE_AUTO', { auto_pause_until: '2026-10-24T13:05:00Z', rang: null }, MAINTENANT).texte,
    ).toBe("jusqu'à 13 h 05");
    expect(detailEtatDuJour('EN_PAUSE', { pause_until: '2099-12-31T23:59:59Z', rang: null }, MAINTENANT).texte).toBe(
      null,
    );
    expect(jusquA('2026-10-25T09:00:00Z', MAINTENANT)).toBe("jusqu'au 25/10 à 9 h 00");
  });

  test('appli fermée : « vue il y a 6 min »', () => {
    expect(
      detailEtatDuJour('APPLI_FERMEE', { appli_vue_a: '2026-10-24T12:34:00Z', rang: null }, MAINTENANT).texte,
    ).toBe('vue il y a 6 min');
  });

  test('hors service prévu au créneau : ambre ; sinon ligne vide', () => {
    expect(detailEtatDuJour('HORS_SERVICE', { rang: null, prevuAuCreneau: 'MORNING' }, MAINTENANT)).toEqual({
      texte: 'Prévu ce matin, pas en service',
      retard: null,
      ambre: true,
    });
    expect(detailEtatDuJour('HORS_SERVICE', { rang: null, prevuAuCreneau: 'EVENING' }, MAINTENANT).texte).toBe(
      'Prévu ce soir, pas en service',
    );
    expect(detailEtatDuJour('HORS_SERVICE', { rang: null }, MAINTENANT).texte).toBe(null);
  });
});

describe('planning du jour', () => {
  test('matin et soir confirmés : une seule mention', () => {
    expect(planningDuJour({ matin: 'CONFIRMED', soir: 'CONFIRMED', repos: false })).toEqual([
      { texte: 'Matin et soir', reponse: 'CONFIRMED' },
    ]);
  });

  test('réponses différentes : un morceau par créneau, refus en clair', () => {
    expect(planningDuJour({ matin: 'REFUSED', soir: 'ASSIGNED', repos: false })).toEqual([
      { texte: 'Matin refusé', reponse: 'REFUSED' },
      { texte: 'Soir', reponse: 'ASSIGNED' },
    ]);
    expect(planningDuJour({ matin: 'ASSIGNED', soir: null, repos: false })).toEqual([
      { texte: 'Matin', reponse: 'ASSIGNED' },
    ]);
  });

  test('repos, hors planning, serveur ancien', () => {
    expect(planningDuJour({ matin: 'CONFIRMED', soir: null, repos: true })).toEqual([{ texte: 'Repos', reponse: null }]);
    expect(planningDuJour({ matin: null, soir: null, repos: false })).toEqual([
      { texte: 'Hors planning', reponse: null },
    ]);
    expect(planningDuJour(undefined)).toBe(null);
  });
});

describe('temps en ligne', () => {
  test('« 3 h 12 », « 0 h 05 », vide si inconnu', () => {
    expect(dureeEnLigne(3 * 3600 + 12 * 60 + 30)).toBe('3 h 12');
    expect(dureeEnLigne(300)).toBe('0 h 05');
    expect(dureeEnLigne(0)).toBe('0 h 00');
    expect(dureeEnLigne(null)).toBe('');
    expect(dureeEnLigne(undefined)).toBe('');
  });
});

describe('tri et repli', () => {
  test('état, puis place dans la file, puis nom', () => {
    const liste = [
      { etat: 'EN_PAUSE', rang: null, nom: 'Diane' },
      { etat: 'DISPONIBLE', rang: 2, nom: 'Yao' },
      { etat: 'EN_COURSE', rang: null, nom: 'Awa' },
      { etat: 'DISPONIBLE', rang: 1, nom: 'Zoé' },
      { etat: 'HORS_SERVICE', rang: null, nom: 'Ali' },
      { etat: 'DISPONIBLE', rang: null, nom: 'Bintou' },
    ];
    expect([...liste].sort(comparerLivreursDuJour).map((l) => l.nom)).toEqual([
      'Zoé',
      'Yao',
      'Bintou',
      'Awa',
      'Diane',
      'Ali',
    ]);
  });

  test('hors service replié, sauf attendu au créneau', () => {
    expect(estReplie('HORS_SERVICE', null)).toBe(true);
    expect(estReplie('INACTIF', undefined)).toBe(true);
    expect(estReplie('HORS_SERVICE', 'MORNING')).toBe(false);
    expect(estReplie('EN_PAUSE', null)).toBe(false);
  });

  test('en-tête du restaurant', () => {
    expect(enTeteRestaurant('Angré', 6, 8, 7)).toBe('Angré · 6 en service sur 8 · 7 prévus');
    expect(enTeteRestaurant('Angré', 6, 8, null)).toBe('Angré · 6 en service sur 8');
    expect(enTeteRestaurant('Angré', 1, 2, 1)).toBe('Angré · 1 en service sur 2 · 1 prévu');
  });
});
