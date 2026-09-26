// @ts-nocheck -- lancé par `bun test` (intégré à Bun) : ses types ne sont pas installés dans le backoffice.
import { describe, expect, test } from 'bun:test';
import {
  correspond,
  decouperMentions,
  detecterDeclencheur,
  insererMention,
  libelleMention,
  mentionsPresentes,
  positionSansAccents,
  prenom,
  sansAccents,
} from '../mentions-texte';

describe('détection du « @ »', () => {
  test('en début de mot, juste avant le curseur', () => {
    expect(detecterDeclencheur('Bonjour @aw', 11)).toEqual({ debut: 8, terme: 'aw' });
    expect(detecterDeclencheur('@', 1)).toEqual({ debut: 0, terme: '' });
    expect(detecterDeclencheur('(@awa', 5)).toEqual({ debut: 1, terme: 'awa' });
  });

  test('deux mots au plus', () => {
    expect(detecterDeclencheur('@awa ko', 7)).toEqual({ debut: 0, terme: 'awa ko' });
    expect(detecterDeclencheur('@awa ko t', 9)).toBeNull();
    expect(detecterDeclencheur('@awa  ko', 8)).toBeNull();
  });

  test('refusé : adresse électronique, saut de ligne, espace initiale', () => {
    expect(detecterDeclencheur('test@aw', 7)).toBeNull();
    expect(detecterDeclencheur('@awa\nko', 7)).toBeNull();
    expect(detecterDeclencheur('@ awa', 5)).toBeNull();
  });

  test('le curseur compte, pas la fin du texte', () => {
    expect(detecterDeclencheur('@aw puis la suite', 3)).toEqual({ debut: 0, terme: 'aw' });
  });
});

describe('recherche sans accents', () => {
  test('repli', () => {
    expect(sansAccents('Koné Élodie')).toBe('kone elodie');
  });

  test('correspondance', () => {
    expect(correspond('Awa Koné', 'kon')).toBe(true);
    expect(correspond('Awa Koné', 'awa ko')).toBe(true);
    expect(correspond('Awa Koné', 'AWA KONE')).toBe(true);
    expect(correspond('Awa Koné', 'ko awa')).toBe(false);
    expect(correspond('Awa Koné', '')).toBe(true);
    expect(correspond('Jean-Marc Yao', 'yao')).toBe(true);
  });

  test('position de la partie trouvée, dans le texte original', () => {
    expect(positionSansAccents('Awa Koné', 'kone')).toEqual([4, 8]);
    expect(positionSansAccents('Élodie', 'elo')).toEqual([0, 3]);
    expect(positionSansAccents('Awa', 'zz')).toBeNull();
  });
});

describe('insertion', () => {
  test('remplace la recherche par le nom suivi d’une espace', () => {
    expect(insererMention('Salut @aw', 6, 9, 'Awa Koné')).toEqual({ texte: 'Salut @Awa Koné ', curseur: 16 });
  });

  test('au milieu du texte, sans doubler l’espace', () => {
    expect(insererMention('a @aw b', 2, 5, 'Awa Koné')).toEqual({ texte: 'a @Awa Koné b', curseur: 12 });
  });

  test('seules les mentions encore écrites partent', () => {
    const choisies = [
      { userId: '1', label: 'Awa Koné' },
      { userId: '2', label: 'Jean Yao' },
      { userId: '1', label: 'Awa Koné' },
    ];
    expect(mentionsPresentes('@Awa Koné tu peux voir ?', choisies)).toEqual([{ userId: '1', label: 'Awa Koné' }]);
    expect(mentionsPresentes('plus personne', choisies)).toEqual([]);
  });

  test('pas de mention fantôme : nom plus long, ou nom prolongé par une lettre', () => {
    const choisies = [
      { userId: '1', label: 'Awa Koné' },
      { userId: '2', label: 'Awa Koné Traoré' },
      { userId: '3', label: 'Awa' },
    ];
    // Seul le nom long est écrit : ni « Awa Koné » ni « Awa » ne partent.
    expect(mentionsPresentes('@Awa Koné Traoré tu passes ?', choisies)).toEqual([choisies[1]]);
    // « @Awaken » n'est pas « @Awa ».
    expect(mentionsPresentes('@Awaken', choisies)).toEqual([]);
    // Ponctuation juste après le nom : la mention compte.
    expect(mentionsPresentes('Merci @Awa, et @Awa Koné.', choisies)).toEqual([choisies[0], choisies[2]]);
    // « @ » collé à un mot : ce n'est pas une mention (le serveur la refuse).
    expect(mentionsPresentes('contact@Awa Koné', choisies)).toEqual([]);
  });

  test('mêmes règles que le serveur : casse et blancs ignorés', () => {
    const choisies = [{ userId: '1', label: 'Awa Koné' }];
    expect(mentionsPresentes('@awa   KONÉ ?', choisies)).toEqual(choisies);
    expect(libelleMention('  Awa   Koné ')).toBe('Awa Koné');
  });

  test('prénom', () => {
    expect(prenom('  Awa Koné ')).toBe('Awa');
  });
});

describe('découpage pour le surlignage', () => {
  test('sans mention : le texte tel quel', () => {
    expect(decouperMentions('Bonjour @Paul', [])).toEqual([{ texte: 'Bonjour @Paul' }]);
  });

  test('accents et noms composés, les plus longs d’abord', () => {
    const mentions = [
      { userId: '1', label: 'Awa Koné' },
      { userId: '2', label: 'Awa Koné Traoré' },
    ];
    expect(decouperMentions('@Awa Koné Traoré et @Awa Koné, merci', mentions)).toEqual([
      { texte: '@Awa Koné Traoré', mention: mentions[1] },
      { texte: ' et ' },
      { texte: '@Awa Koné', mention: mentions[0] },
      { texte: ', merci' },
    ]);
  });

  test('caractères spéciaux du nom échappés', () => {
    const mentions = [{ userId: '1', label: 'Jean (Chef)' }];
    expect(decouperMentions('Vu @Jean (Chef).', mentions)).toEqual([
      { texte: 'Vu ' },
      { texte: '@Jean (Chef)', mention: mentions[0] },
      { texte: '.' },
    ]);
  });

  test('un nom prolongé par une lettre n’est pas surligné', () => {
    const mentions = [{ userId: '1', label: 'Awa' }];
    expect(decouperMentions('@Awaken et @Awa!', mentions)).toEqual([
      { texte: '@Awaken et ' },
      { texte: '@Awa', mention: mentions[0] },
      { texte: '!' },
    ]);
  });

  test('casse, blancs, et « @ » collé à un mot', () => {
    const mentions = [{ userId: '1', label: 'Awa Koné' }];
    expect(decouperMentions('@awa  koné et mail@Awa Koné', mentions)).toEqual([
      { texte: '@awa  koné', mention: mentions[0] },
      { texte: ' et mail@Awa Koné' },
    ]);
  });

  test('accent saisi en deux temps (NFD) : retenu et surligné, comme le serveur', () => {
    const decompose = '@Awa Kone\u0301 tu peux voir ?';
    const choisies = [{ userId: '1', label: 'Awa Koné' }];
    expect(mentionsPresentes(decompose, choisies)).toEqual(choisies);
    const segments = decouperMentions(decompose, choisies);
    expect(segments[0]).toEqual({ texte: '@Awa Koné', mention: choisies[0] });
    expect(segments.map((s) => s.texte).join('')).toBe(decompose.normalize('NFC'));
  });

  test('un « @ » sans mention retenue reste du texte', () => {
    const mentions = [{ userId: '1', label: 'Awa Koné' }];
    expect(decouperMentions('@Paul et @Awa Koné', mentions)).toEqual([
      { texte: '@Paul et ' },
      { texte: '@Awa Koné', mention: mentions[0] },
    ]);
  });
});
