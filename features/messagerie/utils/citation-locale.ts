/**
 * CITATION construite dans le navigateur, à partir d'un message déjà affiché.
 *
 * Elle ne sert qu'à deux choses : l'aperçu « En réponse à … » au-dessus du
 * champ, et le message optimiste, pour que la citation ne clignote pas le
 * temps que le serveur réponde. Dès que le serveur a répondu, c'est SA
 * citation qui fait foi (extrait recalculé, original supprimé masqué).
 *
 * Mêmes règles que le serveur : blancs réduits, 160 caractères au plus coupés
 * au mot, repli « Photo » ou « Message vocal » effacé, première ligne d'une
 * alerte.
 */

import type { ICitationMessage, IMessage, TypeCitation } from '../types/conversation.type';

export const CORPS_MESSAGE_SUPPRIME = 'Ce message a été supprimé';
export const LONGUEUR_EXTRAIT = 160;

const reduireBlancs = (texte: string | null | undefined) => (texte ?? '').replace(/\s+/g, ' ').trim();

/**
 * Garde les `n` premières unités SANS séparer un emoji en deux, comme le
 * serveur (`couperSansCasser`). Un emoji occupe deux unités : trancher entre
 * les deux laisserait une moitié orpheline, affichée comme un losange.
 */
const couperSansCasser = (texte: string, n: number): string => {
  if (texte.length <= n) return texte;
  if (n <= 0) return '';
  const derniere = texte.charCodeAt(n - 1);
  return texte.slice(0, derniere >= 0xd800 && derniere <= 0xdbff ? n - 1 : n);
};

/**
 * Même coupe que le serveur (`couperAuMot`) : `max` caractères AU PLUS,
 * points de suspension compris, au dernier blanc s'il n'emporte pas plus de la
 * moitié du texte, et jamais au milieu d'un emoji. Une citation optimiste plus
 * longue que celle du serveur ferait sauter la bulle à son remplacement.
 */
export const tronquerAuMot = (texte: string, max = LONGUEUR_EXTRAIT): string => {
  const propre = reduireBlancs(texte);
  if (propre.length <= max) return propre;
  const tranche = couperSansCasser(propre, max - 1);
  const espace = tranche.lastIndexOf(' ');
  const coupe = espace >= Math.floor(max / 2) ? tranche.slice(0, espace) : tranche;
  return `${coupe.trimEnd()}…`;
};

const estAlerte = (msg: IMessage) => (msg.meta as { type?: unknown } | undefined)?.type === 'ALERTE';

/** Même ordre que le serveur : alerte, puis note vocale, puis photo. */
const typeDuMessage = (msg: IMessage): TypeCitation => {
  const meta = (msg.meta ?? {}) as { imageUrl?: unknown; audioUrl?: unknown };
  if (estAlerte(msg)) return 'alert';
  if (meta.audioUrl) return 'audio';
  if (meta.imageUrl) return 'image';
  return 'text';
};

/**
 * @param estConversationClient une conversation avec un client : un message
 * sans auteur y est une diffusion (« Chicken Nation »), ailleurs une alerte.
 */
export const citationDepuisMessage = (msg: IMessage, estConversationClient: boolean): ICitationMessage => {
  const supprime = !!msg.deleted;
  const kind: TypeCitation = supprime ? 'text' : typeDuMessage(msg);

  let excerpt: string;
  if (supprime) {
    excerpt = CORPS_MESSAGE_SUPPRIME;
  } else if (kind === 'alert') {
    excerpt = tronquerAuMot((msg.body ?? '').split(/\r?\n/).find((l) => l.trim()) ?? '');
  } else if (
    (kind === 'image' && reduireBlancs(msg.body) === 'Photo') ||
    (kind === 'audio' && reduireBlancs(msg.body) === 'Message vocal')
  ) {
    excerpt = '';
  } else {
    excerpt = tronquerAuMot(msg.body ?? '');
  }

  let author: ICitationMessage['author'];
  if (msg.authorUser) {
    author = { kind: 'user', id: msg.authorUser.id, name: msg.authorUser.name || 'Support' };
  } else if (msg.authorCustomer) {
    const c = msg.authorCustomer;
    const nom = `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || c.name?.trim() || 'Client';
    author = { kind: 'customer', id: c.id, name: nom };
  } else if (estConversationClient && !estAlerte(msg)) {
    author = { kind: 'broadcast', id: null, name: 'Chicken Nation' };
  } else {
    author = { kind: 'system', id: null, name: 'Système' };
  }

  return { id: msg.id, deleted: supprime, kind, excerpt, author, createdAt: msg.createdAt };
};

/** Nom à afficher pour l'auteur d'une citation : « Vous » si c'est moi. */
export const nomAuteurCitation = (citation: ICitationMessage, moiId?: string | null): string => {
  const { author } = citation;
  if (author.kind === 'user' && moiId && author.id === moiId) return 'Vous';
  if (author.kind === 'system') return author.name || 'Système';
  if (author.kind === 'broadcast') return author.name || 'Chicken Nation';
  return author.name || (author.kind === 'customer' ? 'Client' : 'Support');
};

/** « En réponse à Awa Koné », « En réponse à vous », « En réponse au système ». */
export const libelleEnReponseA = (citation: ICitationMessage, moiId?: string | null): string => {
  const nom = nomAuteurCitation(citation, moiId);
  if (nom === 'Vous') return 'En réponse à vous';
  if (citation.author.kind === 'system') return 'En réponse au système';
  return `En réponse à ${nom}`;
};

/** Ce que la citation affiche comme texte : l'extrait, ou « Photo » / « Message vocal ». */
export const texteCitation = (citation: ICitationMessage): string => {
  if (citation.deleted) return 'Message supprimé';
  if (citation.excerpt) return citation.excerpt;
  if (citation.kind === 'image') return 'Photo';
  if (citation.kind === 'audio') return 'Message vocal';
  return '';
};

/** Retouche une citation dont l'original vient d'être retiré. */
export const citationSupprimee = (citation: ICitationMessage): ICitationMessage => ({
  ...citation,
  deleted: true,
  kind: 'text',
  excerpt: CORPS_MESSAGE_SUPPRIME,
});
