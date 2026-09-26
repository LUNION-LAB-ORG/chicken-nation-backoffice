// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';
import {
  citationDepuisMessage,
  citationSupprimee,
  libelleEnReponseA,
  nomAuteurCitation,
  texteCitation,
  tronquerAuMot,
} from '../citation-locale';

const base = { id: 'm1', isRead: false, createdAt: '2026-09-26T18:26:00Z', updatedAt: '2026-09-26T18:26:00Z' };

describe('citation construite localement', () => {
  test('texte long coupé au mot', () => {
    const long = 'mot '.repeat(60);
    const extrait = tronquerAuMot(long);
    expect(extrait.endsWith('…')).toBe(true);
    // Comme le serveur : 160 caractères au plus, points de suspension compris.
    expect(extrait.length).toBeLessThanOrEqual(160);
    expect(extrait).toBe(`${'mot '.repeat(39).trim()}…`);
    expect(tronquerAuMot('  deux   espaces  ')).toBe('deux espaces');
  });

  test('photo avec le corps de repli : pas d’extrait', () => {
    const c = citationDepuisMessage(
      { ...base, body: 'Photo', meta: { imageUrl: 'k' }, authorUser: { id: 'u1', name: 'Awa Koné', email: '' } },
      false,
    );
    expect(c.kind).toBe('image');
    expect(c.excerpt).toBe('');
    expect(texteCitation(c)).toBe('Photo');
  });

  test('note vocale avec le corps de repli : pas d’extrait, même avec des blancs', () => {
    const c = citationDepuisMessage(
      { ...base, body: ' Message vocal ', meta: { audioUrl: 'k' }, authorUser: { id: 'u1', name: 'Awa Koné', email: '' } },
      false,
    );
    expect(c.kind).toBe('audio');
    expect(c.excerpt).toBe('');
    expect(texteCitation(c)).toBe('Message vocal');
  });

  test('alerte : première ligne, auteur Système', () => {
    const c = citationDepuisMessage(
      { ...base, body: '\nCommande en retard\nDétails…', meta: { type: 'ALERTE' }, authorUser: null, authorCustomer: null },
      false,
    );
    expect(c.kind).toBe('alert');
    expect(c.excerpt).toBe('Commande en retard');
    expect(libelleEnReponseA(c)).toBe('En réponse au système');
  });

  test('diffusion dans une conversation client', () => {
    const c = citationDepuisMessage({ ...base, body: 'Promo', authorUser: null, authorCustomer: null }, true);
    expect(c.author).toEqual({ kind: 'broadcast', id: null, name: 'Chicken Nation' });
  });

  test('message retiré : aucune fuite du contenu', () => {
    const c = citationDepuisMessage({ ...base, body: 'Ce message a été supprimé', deleted: true, meta: null }, false);
    expect(c.deleted).toBe(true);
    expect(texteCitation(c)).toBe('Message supprimé');
    const retouchee = citationSupprimee({ ...c, deleted: false, kind: 'image', excerpt: 'secret' });
    expect(retouchee.excerpt).toBe('Ce message a été supprimé');
    expect(retouchee.kind).toBe('text');
  });

  test('« Vous » pour ses propres messages', () => {
    const c = citationDepuisMessage({ ...base, body: 'OK', authorUser: { id: 'moi', name: 'Andy', email: '' } }, false);
    expect(nomAuteurCitation(c, 'moi')).toBe('Vous');
    expect(libelleEnReponseA(c, 'moi')).toBe('En réponse à vous');
    expect(libelleEnReponseA(c, 'autre')).toBe('En réponse à Andy');
  });

  test('jamais une moitié d\'emoji en fin d\'extrait, comme le serveur', () => {
    // Décalages de 0 à 3 : la coupe tombe tour à tour sur chaque moitié.
    for (let decalage = 0; decalage < 4; decalage++) {
      const texte = 'a'.repeat(decalage) + '👍'.repeat(120);
      const extrait = tronquerAuMot(texte);
      expect(extrait.length).toBeLessThanOrEqual(160);
      const avantPoints = extrait.charCodeAt(extrait.length - 2);
      expect(avantPoints >= 0xd800 && avantPoints <= 0xdbff).toBe(false);
      expect(extrait.endsWith('…')).toBe(true);
    }
  });
});
