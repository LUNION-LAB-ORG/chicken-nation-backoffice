"use client";

import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import type React from 'react';
import type { IMentionMessage, IParticipantConversation } from '../types/conversation.type';
import {
  correspond,
  detecterDeclencheur,
  insererMention,
  libelleMention,
  mentionsPresentes,
  type DeclencheurMention,
} from '../utils/mentions-texte';

/**
 * Rôles sans accès à la messagerie. Ne sert que de REPLI, tant que le serveur
 * n'envoie pas encore `mentionnable` : c'est lui qui fait foi, et qui refuse de
 * toute façon une mention vers ces comptes.
 */
const ROLES_SANS_MESSAGERIE = ['MARKETING', 'COMPTABLE', 'CUISINE'];

export const estMentionnable = (p: IParticipantConversation): boolean =>
  p.mentionnable ?? !ROLES_SANS_MESSAGERIE.includes(p.role);

export interface OptionMention {
  participant: IParticipantConversation;
  mentionnable: boolean;
}

/** Liste vide PARTAGÉE : un nouveau tableau à chaque rendu relancerait les effets. */
const AUCUNE_OPTION: OptionMention[] = [];

interface Parametres {
  /** Conversation interne seulement : aucune mention face à un client. */
  actif: boolean;
  participants: IParticipantConversation[];
  moiId?: string | null;
  texte: string;
  setTexte: (valeur: string) => void;
  refChamp: React.RefObject<HTMLTextAreaElement | null>;
}

/**
 * MENTIONS dans le composeur : « @ » ouvre la liste des participants, le
 * clavier la parcourt, le choix insère « @Prénom Nom ».
 *
 * La liste vient de la conversation elle-même (`users`), accessible à tout
 * rôle qui lit la messagerie. L'annuaire du personnel exigerait un droit que
 * caissiers et call center n'ont pas.
 */
export const useMentionsComposeur = ({
  actif,
  participants,
  moiId,
  texte,
  setTexte,
  refChamp,
}: Parametres) => {
  const [declencheur, setDeclencheur] = useState<DeclencheurMention | null>(null);
  const [indexActif, setIndexActif] = useState(0);
  const [choisies, setChoisies] = useState<IMentionMessage[]>([]);
  /** « @ » que l'utilisateur a refermé avec Échap : il ne se rouvre pas tout seul. */
  const [debutIgnore, setDebutIgnore] = useState<number | null>(null);
  const idListe = `mentions-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

  const options: OptionMention[] = useMemo(() => {
    if (!actif || !declencheur) return AUCUNE_OPTION;
    return participants
      .filter((p) => !!p?.id && p.id !== moiId && !!p.fullName?.trim())
      .filter((p) => correspond(p.fullName, declencheur.terme))
      .map((p) => ({ participant: p, mentionnable: estMentionnable(p) }))
      .sort(
        (a, b) =>
          Number(b.mentionnable) - Number(a.mentionnable) ||
          a.participant.fullName.localeCompare(b.participant.fullName, 'fr'),
      );
  }, [actif, declencheur, participants, moiId]);

  const ouverte = actif && !!declencheur && options.length > 0;

  // L'option active revient sur la première qu'on peut choisir à chaque frappe.
  useEffect(() => {
    const premiere = options.findIndex((o) => o.mentionnable);
    setIndexActif(premiere < 0 ? 0 : premiere);
  }, [options]);

  /** Relit le texte autour du curseur : à chaque frappe et à chaque déplacement. */
  const analyser = useCallback(
    (valeur: string, curseur: number | null | undefined) => {
      if (!actif) {
        setDeclencheur(null);
        return;
      }
      const trouve = detecterDeclencheur(valeur, curseur ?? valeur.length);
      // Nom déjà choisi puis suivi d'une espace : la recherche est terminée.
      const dejaChoisi =
        !!trouve &&
        choisies.some((m) => trouve.terme === m.label || trouve.terme.startsWith(`${m.label} `));
      if (!trouve || dejaChoisi) {
        setDeclencheur(null);
        if (!trouve) setDebutIgnore(null);
        return;
      }
      if (trouve.debut === debutIgnore) {
        setDeclencheur(null);
        return;
      }
      setDebutIgnore(null);
      setDeclencheur((avant) =>
        avant && avant.debut === trouve.debut && avant.terme === trouve.terme ? avant : trouve,
      );
    },
    [actif, choisies, debutIgnore],
  );

  const placerCurseur = useCallback(
    (position: number) => {
      requestAnimationFrame(() => {
        const champ = refChamp.current;
        if (!champ) return;
        champ.focus();
        champ.setSelectionRange(position, position);
      });
    },
    [refChamp],
  );

  /**
   * Le libellé retenu est le nom aux blancs réduits : c'est celui que le
   * serveur fige, et donc celui que la bulle cherchera pour le surligner.
   */
  const retenir = useCallback((p: IParticipantConversation) => {
    setChoisies((avant) =>
      avant.some((m) => m.userId === p.id)
        ? avant
        : [...avant, { userId: p.id, label: libelleMention(p.fullName) }],
    );
  }, []);

  const choisir = useCallback(
    (p: IParticipantConversation) => {
      if (!declencheur || !estMentionnable(p)) return;
      const fin = declencheur.debut + 1 + declencheur.terme.length;
      const resultat = insererMention(texte, declencheur.debut, fin, libelleMention(p.fullName));
      setTexte(resultat.texte);
      retenir(p);
      setDeclencheur(null);
      placerCurseur(resultat.curseur);
    },
    [declencheur, texte, setTexte, retenir, placerCurseur],
  );

  /**
   * « Répondre en mentionnant Awa » : le nom est posé en tête du message s'il
   * n'y figure pas déjà, et le curseur va en fin de texte.
   */
  const mentionner = useCallback(
    (p: IParticipantConversation) => {
      if (!actif || !estMentionnable(p) || p.id === moiId) return;
      const libelle = libelleMention(p.fullName);
      if (!libelle) return;
      const deja = mentionsPresentes(texte, [{ label: libelle }]).length > 0;
      const nouveau = deja ? texte : `@${libelle} ${texte.replace(/^\s+/, '')}`;
      setTexte(nouveau);
      retenir(p);
      setDeclencheur(null);
      placerCurseur(nouveau.length);
    },
    [actif, moiId, texte, setTexte, retenir, placerCurseur],
  );

  const fermer = useCallback(() => {
    if (declencheur) setDebutIgnore(declencheur.debut);
    setDeclencheur(null);
  }, [declencheur]);

  /**
   * Le champ perd le focus : la liste se cache, sans être « refermée ». En
   * revenant dans le champ, le même « @ » la rouvre.
   */
  const masquer = useCallback(() => setDeclencheur(null), []);

  const deplacer = useCallback(
    (sens: 1 | -1) => {
      if (options.length === 0) return;
      let i = indexActif;
      for (let pas = 0; pas < options.length; pas++) {
        i = (i + sens + options.length) % options.length;
        if (options[i].mentionnable) {
          setIndexActif(i);
          return;
        }
      }
    },
    [options, indexActif],
  );

  /**
   * Touches du champ quand la liste est ouverte. Renvoie vrai si la touche a
   * été consommée : Entrée ne doit PAS envoyer le message pendant qu'on choisit
   * quelqu'un.
   */
  const gererTouche = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>): boolean => {
      if (!ouverte) return false;
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          deplacer(1);
          return true;
        case 'ArrowUp':
          e.preventDefault();
          deplacer(-1);
          return true;
        case 'Enter':
        case 'Tab': {
          if (e.key === 'Tab' && e.shiftKey) return false;
          const option = options[indexActif];
          if (option?.mentionnable) {
            e.preventDefault();
            choisir(option.participant);
            return true;
          }
          /**
           * Rien à choisir (seulement des membres sans accès) : la liste se
           * ferme. Entrée n'envoie toujours pas, pour qu'on voie d'abord que
           * personne n'a été retenu ; Tab garde son rôle et quitte le champ.
           */
          fermer();
          if (e.key === 'Enter') {
            e.preventDefault();
            return true;
          }
          return false;
        }
        case 'Escape':
          e.preventDefault();
          fermer();
          return true;
        default:
          return false;
      }
    },
    [ouverte, deplacer, options, indexActif, choisir, fermer],
  );

  /** Mentions à envoyer : celles dont « @Nom » est encore écrit. */
  const mentionsAEnvoyer = useCallback((valeur: string) => mentionsPresentes(valeur, choisies), [choisies]);

  const reinitialiser = useCallback(() => {
    setDeclencheur(null);
    setChoisies([]);
    setDebutIgnore(null);
  }, []);

  /** Rétablit des mentions après un envoi raté. */
  const restaurer = useCallback((mentions: IMentionMessage[]) => {
    setChoisies(mentions);
  }, []);

  const idOption = useCallback((i: number) => `${idListe}-option-${i}`, [idListe]);

  /** Attributs du motif « combobox » posés sur le champ de saisie. */
  const attributsChamp = actif
    ? ({
        role: 'combobox',
        'aria-autocomplete': 'list',
        'aria-expanded': ouverte,
        // La liste n'existe dans la page que lorsqu'elle est ouverte.
        'aria-controls': ouverte ? idListe : undefined,
        'aria-activedescendant': ouverte ? idOption(indexActif) : undefined,
      } as const)
    : {};

  return {
    ouverte,
    options,
    indexActif,
    setIndexActif,
    terme: declencheur?.terme ?? '',
    idListe,
    idOption,
    analyser,
    choisir,
    mentionner,
    fermer,
    masquer,
    gererTouche,
    mentionsAEnvoyer,
    reinitialiser,
    restaurer,
    attributsChamp,
  };
};
