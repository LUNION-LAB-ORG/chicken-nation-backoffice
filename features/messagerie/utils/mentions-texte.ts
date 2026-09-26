/**
 * MENTIONS « @Prénom Nom » : détection pendant la saisie, insertion, et
 * découpage pour le surlignage.
 *
 * Fonctions pures, sans React : elles se testent seules (bun test) et le
 * composeur comme la bulle s'appuient sur les mêmes règles.
 *
 * Le texte « @Prénom Nom » reste écrit en clair dans le message : la caisse,
 * les aperçus de liste et les applications qui ignorent les mentions restent
 * lisibles. Le surlignage, lui, ne porte que sur les noms que le SERVEUR a
 * retenus (`mentions`), jamais sur n'importe quel « @ ».
 */

import type { IMentionMessage } from '../types/conversation.type';

/** Au plus deux mots après « @ » : « @awa », « @awa ko ». */
const MOTS_RECHERCHE_MAX = 2;

/**
 * Minuscules et sans accents, caractère par caractère : « Koné » devient
 * « kone ». Un caractère qui se décompose (« é » en « e » plus un accent) ne
 * donne jamais plus d'un caractère utile, ce qui garde les positions alignées.
 */
const replierCaractere = (c: string) =>
  c.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export const sansAccents = (texte: string): string =>
  Array.from(texte ?? '').map(replierCaractere).join('');

/**
 * Position, dans le texte ORIGINAL, de la première occurrence de `terme`
 * comparée sans accents ni majuscules. Sert à mettre en gras la partie trouvée
 * du nom (« Ko » dans « Awa Koné ») sans décaler d'un caractère.
 */
export const positionSansAccents = (texte: string, terme: string): [number, number] | null => {
  const cible = sansAccents(terme);
  if (!cible) return null;
  // Table de correspondance : indice replié -> indice original.
  const carte: number[] = [];
  let replie = '';
  let indice = 0;
  for (const c of Array.from(texte ?? '')) {
    const r = replierCaractere(c);
    for (let k = 0; k < r.length; k++) carte.push(indice);
    replie += r;
    indice += c.length;
  }
  const debut = replie.indexOf(cible);
  if (debut < 0) return null;
  const finReplie = debut + cible.length;
  const debutOriginal = carte[debut];
  const finOriginal = finReplie < carte.length ? carte[finReplie] : texte.length;
  return [debutOriginal, finOriginal];
};

export interface DeclencheurMention {
  /** Indice du « @ » dans le texte. */
  debut: number;
  /** Ce qui a été tapé après le « @ », jusqu'au curseur. */
  terme: string;
}

/**
 * Un « @ » en début de mot juste avant le curseur ouvre la liste.
 *
 * Refusé : un « @ » collé à un mot (une adresse électronique), un saut de
 * ligne entre le « @ » et le curseur, plus de deux mots tapés, ou deux espaces
 * de suite (on a manifestement cessé de chercher).
 */
export const detecterDeclencheur = (texte: string, curseur: number): DeclencheurMention | null => {
  if (!texte || curseur <= 0 || curseur > texte.length) return null;
  const avant = texte.slice(0, curseur);
  const debut = avant.lastIndexOf('@');
  if (debut < 0) return null;
  const precedent = debut > 0 ? avant[debut - 1] : '';
  if (precedent && !/[\s([{"'«]/.test(precedent)) return null;
  const terme = avant.slice(debut + 1);
  if (/[\n\r@]/.test(terme)) return null;
  if (/^\s/.test(terme) || /\s{2,}/.test(terme)) return null;
  const mots = terme.split(' ');
  if (mots.length > MOTS_RECHERCHE_MAX) return null;
  return { debut, terme };
};

/**
 * Le nom correspond-il à ce qui est tapé ? Chaque mot tapé doit commencer un
 * mot du nom, dans l'ordre (« awa ko » trouve « Awa Koné »), ou à défaut
 * figurer dans le nom (« kon » trouve « Awa Koné »).
 */
export const correspond = (nom: string, terme: string): boolean => {
  const t = sansAccents(terme).trim();
  if (!t) return true;
  const n = sansAccents(nom);
  if (n.includes(t)) return true;
  const motsNom = n.split(/\s+/);
  const motsTerme = t.split(/\s+/);
  let depuis = 0;
  for (const mot of motsTerme) {
    const trouve = motsNom.findIndex((m, i) => i >= depuis && m.startsWith(mot));
    if (trouve < 0) return false;
    depuis = trouve + 1;
  }
  return true;
};

/**
 * Remplace « @ter » (du « @ » jusqu'au curseur) par « @Prénom Nom » suivi
 * d'une espace, et renvoie la nouvelle position du curseur, juste après.
 */
export const insererMention = (
  texte: string,
  debut: number,
  curseur: number,
  libelle: string,
): { texte: string; curseur: number } => {
  const avant = texte.slice(0, debut);
  const apres = texte.slice(curseur);
  const insertion = `@${libelle}${apres.startsWith(' ') ? '' : ' '}`;
  const nouveau = `${avant}${insertion}${apres}`;
  const position = avant.length + insertion.length + (apres.startsWith(' ') ? 1 : 0);
  return { texte: nouveau, curseur: position };
};

const echapper = (texte: string) => texte.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Blancs réduits à une espace : c'est ainsi que le serveur fige un libellé. */
export const libelleMention = (nom: string): string => (nom ?? '').replace(/\s+/g, ' ').trim();

/**
 * Forme comparable, comme sur le serveur : accents recomposés (NFC), blancs
 * réduits, casse ignorée. Un « é » écrit en deux temps (« e » plus accent,
 * certains copier-coller) vaut ainsi le « é » du nom.
 */
const cleComparable = (texte: string) => libelleMention(texte).normalize('NFC').toLocaleLowerCase('fr');

/** Texte aux accents recomposés : la forme dans laquelle le serveur cherche. */
const recompose = (texte: string) => (texte ?? '').normalize('NFC');

/** Lettre (accents compris), marque combinante ou chiffre : un mot continue. */
const CARACTERE_DE_MOT = /[\p{L}\p{M}\p{N}]/u;

/**
 * Motif de TOUS les « @Libellé » à la fois, avec les MÊMES règles que le
 * serveur, qui décide seul qui est prévenu :
 *  - casse ignorée, et n'importe quel blanc entre les mots ;
 *  - libellés les plus longs d'abord : « @Awa Koné Traoré » n'est pas
 *    « @Awa Koné » suivi de « Traoré » ;
 *  - rien ne prolonge le nom : « @Awaken » ne mentionne pas « Awa ».
 * Le caractère AVANT le « @ » est contrôlé à part (voir `occurrences`) :
 * l'assertion arrière n'existe pas dans les anciens Safari, et une expression
 * refusée ferait tomber tout le fil.
 */
const motifMentions = (libelles: string[]) =>
  new RegExp(
    `@(${[...libelles]
      .map((l) => l.normalize('NFC'))
      .sort((a, b) => b.length - a.length)
      .map((l) => echapper(l).replace(/ /g, '\\s+'))
      .join('|')})(?![\\p{L}\\p{M}\\p{N}])`,
    'giu',
  );

/**
 * Occurrences réelles des libellés dans le texte : le « @ » ne doit pas être
 * collé à un mot (« contact@Awa Koné » n'est pas une mention).
 */
const occurrences = (texte: string, libelles: string[]) => {
  const resultat: { indice: number; longueur: number; cle: string }[] = [];
  for (const trouve of Array.from(texte.matchAll(motifMentions(libelles)))) {
    const indice = trouve.index ?? 0;
    if (indice > 0 && CARACTERE_DE_MOT.test(texte[indice - 1])) continue;
    resultat.push({ indice, longueur: trouve[0].length, cle: cleComparable(trouve[1]) });
  }
  return resultat;
};

/**
 * Mentions choisies dont le « @Nom » figure ENCORE dans le texte, écrit en
 * entier. Une mention effacée à la main ne doit prévenir personne, et un nom
 * qui n'apparaît plus que comme le début d'un nom plus long non plus : on
 * n'envoie, et on n'annonce (« Sera prévenu »), que ce que le serveur retiendra.
 */
export const mentionsPresentes = <T extends { label: string }>(texte: string, choisies: T[]): T[] => {
  const libelles = Array.from(new Set(choisies.map((m) => libelleMention(m.label)).filter(Boolean)));
  if (!texte || libelles.length === 0) return [];
  const trouves = new Set(occurrences(recompose(texte), libelles).map((o) => o.cle));
  const vues = new Set<string>();
  return choisies.filter((m) => {
    const cle = cleComparable(m.label);
    if (!cle || vues.has(cle) || !trouves.has(cle)) return false;
    vues.add(cle);
    return true;
  });
};

export interface SegmentTexte {
  texte: string;
  mention?: IMentionMessage;
}

/**
 * Découpe un corps de message en morceaux de texte et en mentions à surligner.
 *
 * Seuls les libellés retenus par le serveur sont cherchés, avec ses règles
 * (voir `motifMentions`). Le rendu reste du texte React : jamais de HTML
 * injecté.
 */
export const decouperMentions = (brut: string, mentions?: IMentionMessage[] | null): SegmentTexte[] => {
  if (!brut) return [];
  // Accents recomposés, comme le serveur qui a retenu la mention : le rendu
  // est identique à l'œil, et un nom saisi en deux temps est bien surligné.
  const texte = recompose(brut);
  const parCle = new Map<string, IMentionMessage>();
  for (const m of mentions ?? []) {
    const cle = m?.label ? cleComparable(m.label) : '';
    if (cle && !parCle.has(cle)) parCle.set(cle, m);
  }
  if (parCle.size === 0) return [{ texte: brut }];
  const libelles = Array.from(parCle.values()).map((m) => libelleMention(m.label));

  const segments: SegmentTexte[] = [];
  let dernier = 0;
  for (const o of occurrences(texte, libelles)) {
    const mention = parCle.get(o.cle);
    if (!mention) continue;
    if (o.indice > dernier) segments.push({ texte: texte.slice(dernier, o.indice) });
    segments.push({ texte: texte.slice(o.indice, o.indice + o.longueur), mention });
    dernier = o.indice + o.longueur;
  }
  if (dernier < texte.length) segments.push({ texte: texte.slice(dernier) });
  return segments;
};

/** « Awa » pour « Awa Koné » : pour les libellés courts du menu. */
export const prenom = (nomComplet: string): string => nomComplet?.trim().split(/\s+/)[0] ?? '';
