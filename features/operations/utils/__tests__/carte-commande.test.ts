// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';

import { formatPrix, libelleStatut, ligneTrois, nomClient, preteDepuis } from '../carte-commande';

/**
 * Demande du 24/10 au soir : « au niveau d'en cours, les cartes grossissent à
 * cause des informations qui s'ajoutent ». La carte garde trois lignes ; la
 * troisième ne porte qu'UNE information, la plus utile. Heures d'Abidjan = UTC.
 */

const A = (hhmm) => new Date(`2026-10-24T${hhmm}:00Z`);
const ISO = (hhmm) => A(hhmm).toISOString();

const commande = (champs = {}) => ({
  status: 'IN_PROGRESS',
  date: '2026-10-24T00:00:00.000Z',
  time: '12:00',
  created_at: ISO('11:55'),
  customer: { first_name: 'Aya', last_name: 'Koné' },
  ...champs,
});

describe('troisième ligne : une seule information, par priorité', () => {
  test('commande programmée pas encore prête : « Plus tard · 20 h 00 », puis « À préparer · 20 h 00 »', () => {
    const programmee = commande({ status: 'ACCEPTED', time: '20:00', created_at: ISO('12:00') });
    expect(ligneTrois(programmee, { maintenant: A('12:30') })).toEqual({ texte: 'Plus tard · 20 h 00', ton: 'ambre' });
    expect(ligneTrois(programmee, { maintenant: A('19:10') })).toEqual({ texte: 'À préparer · 20 h 00', ton: 'ambre' });
    // Même attendue par une course, l'heure souhaitée passe avant.
    expect(ligneTrois(programmee, { maintenant: A('12:30'), attente: 'Attendue par Koffi, départ 12 h 44' }).texte).toBe(
      'Plus tard · 20 h 00',
    );
  });

  test('programmée mais déjà prête : son statut, pas l’heure souhaitée', () => {
    const prete = commande({ status: 'READY', time: '20:00', created_at: ISO('12:00') });
    expect(ligneTrois(prete, { maintenant: A('19:30') })).toEqual({ texte: 'Prête', ton: 'gris' });
  });

  test('attendue par une course retenue : le texte court de la retenue, en ambre', () => {
    expect(ligneTrois(commande(), { maintenant: A('12:30'), attente: 'Attendue par Koffi, départ 12 h 44' })).toEqual({
      texte: 'Attendue par Koffi, départ 12 h 44',
      ton: 'ambre',
    });
  });

  test('sinon le statut en gris', () => {
    expect(ligneTrois(commande({ status: 'ACCEPTED' }), { maintenant: A('12:30') })).toEqual({ texte: 'Nouvelle', ton: 'gris' });
    expect(ligneTrois(commande({ status: 'PENDING' }), { maintenant: A('12:30') }).texte).toBe('Nouvelle');
    expect(ligneTrois(commande(), { maintenant: A('12:30') }).texte).toBe('En préparation');
    expect(ligneTrois(commande({ status: 'READY' }), { maintenant: A('12:30') }).texte).toBe('Prête');
    expect(ligneTrois(commande({ date: null, time: null }), { maintenant: A('12:30') }).texte).toBe('En préparation');
  });
});

describe('textes de la carte', () => {
  test('montant « 12.500 F »', () => {
    expect(formatPrix(12500)).toBe('12.500 F');
    expect(formatPrix(800)).toBe('800 F');
    expect(formatPrix(null)).toBe('0 F');
  });

  test('client : prénom et nom, sinon le nom saisi, sinon « Client »', () => {
    expect(nomClient({ customer: { first_name: 'Aya', last_name: 'Koné' } })).toBe('Aya Koné');
    expect(nomClient({ customer: { first_name: ' ', last_name: null }, fullname: 'Yao B.' })).toBe('Yao B.');
    expect(nomClient({})).toBe('Client');
  });

  test('statuts en mots simples', () => {
    expect(libelleStatut('IN_PROGRESS')).toBe('En préparation');
    expect(libelleStatut('INCONNU')).toBe('');
  });

  test('« Prête depuis 34 min » à partir de 30 min, la plus ancienne compte', () => {
    expect(preteDepuis([ISO('12:00')], A('12:29'))).toBeNull();
    expect(preteDepuis([ISO('12:10'), ISO('12:00')], A('12:34'))).toBe('Prête depuis 34 min');
    expect(preteDepuis([ISO('11:00')], A('12:05'))).toBe('Prête depuis 1 h 05');
    expect(preteDepuis([ISO('11:00')], A('13:00'))).toBe('Prête depuis 2 h');
    expect(preteDepuis([null, 'pas une date'], A('13:00'))).toBeNull();
  });

  test('aucun tiret cadratin', () => {
    const textes = [
      ligneTrois(commande({ status: 'ACCEPTED', time: '20:00', created_at: ISO('12:00') }), { maintenant: A('12:30') }).texte,
      ligneTrois(commande(), { maintenant: A('12:30') }).texte,
      preteDepuis([ISO('11:00')], A('12:05')),
      formatPrix(12500),
    ];
    for (const t of textes) expect(t).not.toContain('—');
  });
});
