/* eslint-disable @typescript-eslint/ban-ts-comment -- tests bun : leurs types ne sont pas installés dans le backoffice. */
// @ts-nocheck
import { describe, expect, test } from 'bun:test';

import { dossiersDeLaFile, fileVide, lignesDesPages, pastilleFile, resumeDossiers, totalRappels } from '../dossiers-file';
import { lignePause, ligneSuivi, motRestants, phraseDossiers } from '../textes-file';

/**
 * « Ma file » (correction du 02/11). Les listes reçues sont coupées à 50
 * lignes par rubrique : les nombres et les dossiers viennent désormais du
 * serveur. Face à un serveur plus ancien, l'ancien calcul reste en place.
 */

let n = 0;
const ligne = (campagne?: { id: string; name: string }, extra = {}) => ({
  id: `c-${++n}`,
  nom: 'Client',
  campaign: campagne ? { ...campagne, status: 'ACTIVE' } : null,
  campaign_id: campagne?.id ?? null,
  ...extra,
});

const A = { id: 'camp-a', name: 'Relance inscrits' };
const B = { id: 'camp-b', name: 'Reconquête inactifs' };

const fileVideDeBase = () => ({
  rappels: [],
  interesses: [],
  nouveaux: [],
  relances: [],
  coupons: [],
  rappels_planifies: [],
  commune: [],
  indicateurs: { appels_jour: 0, joints_jour: 0, coupons_jour: 0, conversions_jour: 0, portefeuille: 0, jamais_appeles: 0 },
});

const comptes = (c = {}) => ({
  interesses: 0,
  nouveaux: 0,
  relances: 0,
  coupons: 0,
  rappels_planifies: 0,
  commune: 0,
  total: 0,
  jamais_appeles: 0,
  a_relancer: 0,
  ...c,
});

const suivi = (extra = {}) => ({
  campaign_id: A.id,
  nom: A.name,
  statut: 'ACTIVE',
  mode: 'AUTOMATIQUE',
  restants: 40,
  jamais_appeles: 25,
  sans_agent: 3,
  par_agent: [{ agent_id: 'ag-1', nom: 'Awa', restants: 37, jamais_appeles: 22 }],
  ...extra,
});

describe('serveur plus ancien : l’ancien calcul sur les lignes reçues', () => {
  test('sans « dossiers », les dossiers se tirent des lignes, comme avant', () => {
    const file = {
      ...fileVideDeBase(),
      nouveaux: [ligne(A), ligne(A)],
      relances: [ligne()],
      commune: [ligne(), ligne(), ligne()],
    };
    const d = dossiersDeLaFile(file);
    expect(d.map((x) => [x.nom, x.genre, x.total, x.jamais_appeles, x.a_relancer])).toEqual([
      ['Relance inscrits', 'campagne', 2, 2, 0],
      ['File commune Glovo/Yango', 'commune', 3, 3, 0],
      ['Hors campagne', 'sans-campagne', 1, 0, 1],
    ]);
    // Pas de comptes : le dossier n'ira chercher aucune ligne à l'ouverture.
    expect(d.every((x) => x.comptes === undefined)).toBe(true);
    expect(pastilleFile({ ...file, rappels: [ligne()], interesses: [ligne(A)] })).toBe(2);
  });
});

describe('dossiers comptés par le serveur', () => {
  test('une campagne sans aucune ligne reçue a quand même son dossier, avec ses vrais nombres', () => {
    // 60 Glovo récents ont rempli les 50 lignes : la campagne B n'a aucune ligne dans la réponse.
    const file = {
      ...fileVideDeBase(),
      nouveaux: Array.from({ length: 50 }, () => ligne(A)),
      comptes: { rappels: 0, interesses: 0, nouveaux: 70, relances: 0, coupons: 0, rappels_planifies: 0, commune: 300 },
      dossiers: [
        { cle: A.id, genre: 'campagne', nom: A.name, campaign_id: A.id, comptes: comptes({ nouveaux: 60, total: 60, jamais_appeles: 60 }) },
        { cle: B.id, genre: 'campagne', nom: B.name, campaign_id: B.id, comptes: comptes({ nouveaux: 10, total: 10, jamais_appeles: 10 }) },
        {
          cle: 'commune',
          genre: 'commune',
          nom: 'File commune Glovo/Yango',
          campaign_id: null,
          comptes: comptes({ commune: 300, total: 300, jamais_appeles: 280, a_relancer: 20 }),
        },
      ],
      commune: Array.from({ length: 50 }, () => ligne()),
    };
    const d = dossiersDeLaFile(file);
    expect(d.map((x) => [x.nom, x.total, x.jamais_appeles + x.a_relancer])).toEqual([
      ['Reconquête inactifs', 10, 10],
      ['Relance inscrits', 60, 60],
      ['File commune Glovo/Yango', 300, 300],
    ]);
    // Les lignes déjà reçues s'affichent en attendant celles du dossier.
    expect(d[1].sections.nouveaux).toHaveLength(50);
    expect(d[0].sections.nouveaux).toHaveLength(0);
    expect(d[2].sections.commune).toHaveLength(50);
    expect(d[0].comptes).toEqual({ interesses: 0, nouveaux: 10, relances: 0, coupons: 0, rappels_planifies: 0, commune: 0 });
  });

  test('ordre : campagne, suivi, commune, hors campagne, pause', () => {
    const file = {
      ...fileVideDeBase(),
      dossiers: [
        { cle: 'sans-campagne', genre: 'sans-campagne', nom: 'Hors campagne', campaign_id: null, comptes: comptes({ relances: 4, total: 4, a_relancer: 4 }) },
        { cle: 'camp-s', genre: 'pause', nom: 'Suspendue', campaign_id: 'camp-s', comptes: comptes({ total: 7, jamais_appeles: 5 }) },
        { cle: 'commune', genre: 'commune', nom: 'File commune Glovo/Yango', campaign_id: null, comptes: comptes({ commune: 9, total: 9, jamais_appeles: 9 }) },
        { cle: A.id, genre: 'campagne', nom: A.name, campaign_id: A.id, comptes: comptes({ nouveaux: 2, total: 2, jamais_appeles: 2 }) },
      ],
      suivi: [suivi()],
    };
    expect(dossiersDeLaFile(file).map((x) => x.genre)).toEqual(['campagne', 'suivi', 'commune', 'sans-campagne', 'pause']);
  });

  test('le pilote a un dossier de suivi distinct de ses propres contacts de la même campagne', () => {
    const file = {
      ...fileVideDeBase(),
      dossiers: [{ cle: A.id, genre: 'campagne', nom: A.name, campaign_id: A.id, comptes: comptes({ nouveaux: 3, total: 3, jamais_appeles: 3 }) }],
      suivi: [suivi()],
    };
    const d = dossiersDeLaFile(file);
    expect(d.map((x) => x.cle)).toEqual([A.id, `suivi-${A.id}`]);
    expect(d[1].suivi.restants).toBe(40);
  });

  test('un genre inconnu d’un serveur plus récent est ignoré au lieu de casser l’écran', () => {
    const file = { ...fileVideDeBase(), dossiers: [{ cle: 'x', genre: 'autre', nom: 'X', campaign_id: null, comptes: comptes({ total: 1 }) }] };
    expect(dossiersDeLaFile(file)).toEqual([]);
  });
});

describe('ce que l’accueil annonce', () => {
  const file = {
    ...fileVideDeBase(),
    dossiers: [
      { cle: A.id, genre: 'campagne', nom: A.name, campaign_id: A.id, comptes: comptes({ nouveaux: 60, relances: 5, total: 70, jamais_appeles: 60, a_relancer: 5 }) },
      { cle: 'sans-campagne', genre: 'sans-campagne', nom: 'Hors campagne', campaign_id: null, comptes: comptes({ relances: 4, total: 4, a_relancer: 4 }) },
      { cle: 'commune', genre: 'commune', nom: 'File commune Glovo/Yango', campaign_id: null, comptes: comptes({ commune: 300, total: 300, jamais_appeles: 300 }) },
      { cle: 'camp-s', genre: 'pause', nom: 'Suspendue', campaign_id: 'camp-s', comptes: comptes({ total: 7, jamais_appeles: 7 }) },
    ],
    suivi: [suivi()],
  };

  test('« à appeler en tout » : ses dossiers seulement ; la file commune est annoncée à part', () => {
    const d = dossiersDeLaFile(file);
    expect(resumeDossiers(d)).toEqual({ aAppeler: 69, commune: 300 });
    expect(phraseDossiers(d)).toBe(
      '69 contacts à appeler en tout, plus 300 dans la file commune. Ouvrez un dossier pour le traiter.',
    );
  });

  test('sans file commune : la phrase d’avant', () => {
    const d = dossiersDeLaFile({ ...file, dossiers: file.dossiers.filter((x) => x.genre !== 'commune') });
    expect(phraseDossiers(d)).toBe('69 contacts à appeler en tout. Ouvrez un dossier pour le traiter.');
  });

  test('la capture du 02/11 : 4 hors campagne et 300 en file commune ne font plus « 54 »', () => {
    const d = dossiersDeLaFile({
      ...fileVideDeBase(),
      dossiers: [
        { cle: 'commune', genre: 'commune', nom: 'File commune Glovo/Yango', campaign_id: null, comptes: comptes({ commune: 300, total: 300, jamais_appeles: 300 }) },
        { cle: 'sans-campagne', genre: 'sans-campagne', nom: 'Hors campagne', campaign_id: null, comptes: comptes({ relances: 4, total: 4, a_relancer: 4 }) },
      ],
    });
    expect(phraseDossiers(d)).toBe('4 contacts à appeler en tout, plus 300 dans la file commune. Ouvrez un dossier pour le traiter.');
  });

  test('pastille : vrais nombres des rappels dus et des intéressés', () => {
    const f = {
      ...fileVideDeBase(),
      rappels: Array.from({ length: 50 }, () => ligne()),
      comptes: { rappels: 120, interesses: 8, nouveaux: 0, relances: 0, coupons: 0, rappels_planifies: 0, commune: 0 },
    };
    expect(pastilleFile(f)).toBe(128);
    expect(totalRappels(f)).toBe(120);
    expect(totalRappels({ ...fileVideDeBase(), rappels: [ligne(), ligne()] })).toBe(2);
  });

  test('file vide : ni dossier, ni suivi, ni rappel dû', () => {
    expect(fileVide(fileVideDeBase(), [])).toBe(true);
    const pilote = { ...fileVideDeBase(), dossiers: [], suivi: [suivi()] };
    expect(fileVide(pilote, dossiersDeLaFile(pilote))).toBe(false);
    const rappelsAuDela = {
      ...fileVideDeBase(),
      dossiers: [],
      comptes: { rappels: 3, interesses: 0, nouveaux: 0, relances: 0, coupons: 0, rappels_planifies: 0, commune: 0 },
    };
    expect(fileVide(rappelsAuDela, [])).toBe(false);
  });
});

describe('cartes de pause et de suivi', () => {
  test('pause : « contact » au singulier pour 1', () => {
    expect(lignePause(1)).toBe('1 contact en attente de la reprise');
    expect(lignePause(12)).toBe('12 contacts en attente de la reprise');
  });

  test('suivi : jamais appelés, sans agent, et « en pause » si la campagne est suspendue', () => {
    expect(ligneSuivi(suivi())).toBe('25 jamais appelés · 3 sans agent');
    expect(ligneSuivi(suivi({ statut: 'SUSPENDED', jamais_appeles: 1, sans_agent: 0 }))).toBe('1 jamais appelé · 0 sans agent · en pause');
    expect(motRestants(1)).toBe('restant');
    expect(motRestants(40)).toBe('restants');
  });
});

describe('pages d’une rubrique', () => {
  test('un contact qui glisse d’une page à l’autre n’apparaît qu’une fois', () => {
    const a = ligne();
    const b = ligne();
    const c = ligne();
    expect(lignesDesPages([{ data: [a, b] }, { data: [b, c] }]).map((l) => l.id)).toEqual([a.id, b.id, c.id]);
  });
});
