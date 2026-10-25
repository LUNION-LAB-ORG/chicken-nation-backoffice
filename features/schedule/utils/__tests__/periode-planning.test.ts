// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';

import {
  cleAujourdhui,
  couvre,
  dateCourte,
  estJourSansRepos,
  jourCourt,
  joursDuPlanning,
  joursEntre,
  nomLivreur,
  periode,
  planningParDefaut,
  prenomLivreur,
  suivantManquant,
  textePrevus,
  texteReponses,
} from '../periode-planning';

/** Dates et textes du planning (conception du 24/10, 10.3). */

const plan = (id, status, debut, fin) => ({
  id,
  status,
  period_start: `${debut}T00:00:00.000Z`,
  period_end: `${fin}T00:00:00.000Z`,
});

describe('dates', () => {
  test('« 27 oct. → 09 nov. 2026 » depuis les dates ISO du serveur, le format d’avant', () => {
    expect(dateCourte('2026-10-27T00:00:00.000Z')).toBe('27/10');
    expect(periode('2026-10-27T00:00:00.000Z', '2026-11-09T00:00:00.000Z')).toBe('27 oct. → 09 nov. 2026');
    expect(periode('2026-12-28T00:00:00.000Z', '2027-01-10T00:00:00.000Z')).toBe('28 déc. → 10 janv. 2027');
  });

  test('en-tête de colonne « lun. 27/10 »', () => {
    expect(jourCourt('2026-10-26')).toBe('lun. 26/10');
    expect(jourCourt('2026-11-01T00:00:00.000Z')).toBe('dim. 01/11');
  });

  test('tous les jours de la période, passage de mois compris', () => {
    expect(joursDuPlanning('2026-10-30T00:00:00.000Z', '2026-11-02T00:00:00.000Z')).toEqual([
      '2026-10-30',
      '2026-10-31',
      '2026-11-01',
      '2026-11-02',
    ]);
    expect(joursDuPlanning('2026-11-02', '2026-10-30')).toEqual([]);
  });

  test('aujourd’hui à l’heure du poste', () => {
    expect(cleAujourdhui(new Date(2026, 9, 24, 23, 59))).toBe('2026-10-24');
    expect(cleAujourdhui(new Date(2026, 0, 5, 0, 1))).toBe('2026-01-05');
  });

  test('jours entre deux dates', () => {
    expect(joursEntre('2026-10-24', '2026-10-27T00:00:00.000Z')).toBe(3);
    expect(joursEntre('2026-10-31', '2026-11-01')).toBe(1);
    expect(joursEntre('2026-10-27', '2026-10-24')).toBe(-3);
  });

  test('jour sans repos (réglage du serveur)', () => {
    const regle = ['friday', 'saturday', 'sunday'];
    expect(estJourSansRepos('2026-10-30', regle)).toBe(true); // vendredi
    expect(estJourSansRepos('2026-11-01', regle)).toBe(true); // dimanche
    expect(estJourSansRepos('2026-10-26', regle)).toBe(false); // lundi
    expect(estJourSansRepos('2026-10-30', undefined)).toBe(false); // serveur ancien
    expect(estJourSansRepos('2026-10-30', [])).toBe(false);
  });
});

describe('planning choisi à l’arrivée', () => {
  const aujourdhui = '2026-10-28';

  test('celui qui couvre aujourd’hui, envoyé ou confirmé d’abord', () => {
    const plans = [
      plan('brouillon', 'DRAFT', '2026-10-27', '2026-11-09'),
      plan('confirme', 'CONFIRMED', '2026-10-27', '2026-11-09'),
      plan('suivant', 'DRAFT', '2026-11-10', '2026-11-23'),
    ];
    expect(planningParDefaut(plans, aujourdhui).id).toBe('confirme');
    expect(couvre(plans[0], aujourdhui)).toBe(true);
    expect(couvre(plans[2], aujourdhui)).toBe(false);
  });

  test('un brouillon qui couvre aujourd’hui passe avant un planning futur', () => {
    const plans = [
      plan('suivant', 'SENT', '2026-11-10', '2026-11-23'),
      plan('brouillon', 'DRAFT', '2026-10-27', '2026-11-09'),
    ];
    expect(planningParDefaut(plans, aujourdhui).id).toBe('brouillon');
  });

  test('sinon le plus récent', () => {
    const plans = [
      plan('ancien', 'ARCHIVED', '2026-09-29', '2026-10-12'),
      plan('recent', 'ARCHIVED', '2026-10-13', '2026-10-26'),
    ];
    expect(planningParDefaut(plans, aujourdhui).id).toBe('recent');
  });

  test('aucun planning', () => {
    expect(planningParDefaut([], aujourdhui)).toBeNull();
    expect(planningParDefaut(undefined, aujourdhui)).toBeNull();
  });

  test('premier et dernier jour compris', () => {
    const p = plan('p', 'SENT', '2026-10-27', '2026-11-09');
    expect(couvre(p, '2026-10-27')).toBe(true);
    expect(couvre(p, '2026-11-09')).toBe(true);
    expect(couvre(p, '2026-11-10')).toBe(false);
  });
});

describe('aperçu des plannings', () => {
  test('réponses : zéros omis sauf les confirmés, accords', () => {
    expect(texteReponses({ confirmees: 12, en_attente: 3, refusees: 1 })).toBe('12 confirmés · 3 en attente · 1 refusé');
    expect(texteReponses({ confirmees: 0, en_attente: 0, refusees: 0 })).toBe('0 confirmé');
    expect(texteReponses({ confirmees: 1, en_attente: 0, refusees: 2 })).toBe('1 confirmé · 2 refusés');
  });

  test('livreurs prévus', () => {
    expect(textePrevus(6)).toBe('6 prévus');
    expect(textePrevus(1)).toBe('1 prévu');
    expect(textePrevus(0)).toBe('0 prévu');
  });

  test('« Aucun » suivant en rouge quand le planning en cours finit dans 3 jours ou moins', () => {
    const enCours = (fin) => ({
      id: 'p',
      statut: 'CONFIRMED',
      debut: '2026-10-13T00:00:00.000Z',
      fin: `${fin}T00:00:00.000Z`,
      reponses: { confirmees: 1, en_attente: 0, refusees: 0 },
    });
    expect(suivantManquant({ en_cours: enCours('2026-10-27'), suivant: null }, '2026-10-24')).toBe(true);
    expect(suivantManquant({ en_cours: enCours('2026-10-28'), suivant: null }, '2026-10-24')).toBe(false);
    expect(
      suivantManquant(
        { en_cours: enCours('2026-10-25'), suivant: { id: 's', statut: 'DRAFT', debut: '', fin: '' } },
        '2026-10-24',
      ),
    ).toBe(false);
    expect(suivantManquant({ en_cours: null, suivant: null }, '2026-10-24')).toBe(false);
  });
});

describe('noms', () => {
  test('prénom, puis nom, puis « Le livreur »', () => {
    expect(prenomLivreur({ first_name: 'Koffi', last_name: 'Yao' })).toBe('Koffi');
    expect(prenomLivreur({ first_name: ' ', last_name: 'Yao' })).toBe('Yao');
    expect(prenomLivreur(null)).toBe('Le livreur');
    expect(nomLivreur({ first_name: 'Koffi', last_name: 'Yao' })).toBe('Koffi Yao');
    expect(nomLivreur({ first_name: null, last_name: null })).toBe('Livreur');
  });
});
