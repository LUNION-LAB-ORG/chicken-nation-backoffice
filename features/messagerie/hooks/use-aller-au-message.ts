"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import type React from 'react';
import { toast } from 'react-hot-toast';
import { conversationAPI } from '../apis/conversation.api';
import { TAILLE_PAGE_MESSAGES } from '../queries/message-list.query';

/** Au delà de 20 pages (2 000 messages), on renonce plutôt que de tout charger. */
export const PLAFOND_PAGES_RECHERCHE = 20;

/** Durée du surlignage du message atteint. */
const DUREE_SURLIGNAGE_MS = 1600;

interface ResultatPageSuivante {
  data?: { pages?: unknown[] } | undefined;
  hasNextPage?: boolean;
  isError?: boolean;
}

interface Parametres {
  conversationId: string | null;
  /** Le conteneur qui défile : on y défile, et jamais la page entière. */
  conteneurRef: React.RefObject<HTMLDivElement | null>;
  nombrePages: number;
  hasNextPage: boolean;
  fetchNextPage: () => Promise<ResultatPageSuivante>;
  /**
   * Relit les pages déjà chargées. Sert quand le serveur situe le message
   * dans une page déjà là mais qu'il n'y est pas encore : cas d'une mention
   * toute fraîche, arrivée avant que le fil ne soit rafraîchi.
   */
  rafraichir?: () => Promise<unknown>;
}

/**
 * D'où vient la demande : une citation (« message d'origine ») ou un lien de
 * la cloche (le message lui-même). Seuls les textes changent.
 */
export type ContexteRecherche = 'citation' | 'lien';

const TEXTES: Record<ContexteRecherche, { introuvable: string; tropAncien: string; atteint: string }> = {
  citation: {
    introuvable: "Message d'origine introuvable",
    tropAncien: "Message d'origine trop ancien pour être affiché",
    atteint: 'Message cité affiché',
  },
  lien: {
    introuvable: 'Message introuvable',
    tropAncien: 'Message trop ancien pour être affiché',
    atteint: 'Message affiché',
  },
};

const prochaineImage = () =>
  new Promise<void>((resolve) => {
    if (typeof requestAnimationFrame === 'undefined') {
      setTimeout(resolve, 16);
      return;
    }
    requestAnimationFrame(() => resolve());
  });

const echapperSelecteur = (valeur: string) =>
  typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
    ? CSS.escape(valeur)
    : valeur.replace(/["\\]/g, '\\$&');

/**
 * ALLER JUSQU'À UN MESSAGE précis du fil : clic sur une citation, lien de la
 * cloche.
 *
 * 1. Le message est déjà affiché : on le centre, on le surligne un instant et
 *    on y place le focus, pour qu'un lecteur d'écran y arrive aussi.
 * 2. Il ne l'est pas encore : le serveur dit dans quelle page il se trouve,
 *    et on charge les pages plus anciennes jusqu'à lui (20 au plus).
 *
 * Pendant la recherche, `rechercheEnCoursRef` suspend le défilement
 * automatique vers le bas, qui sinon ramènerait le fil en bas à chaque page.
 */
export const useAllerAuMessage = ({
  conversationId,
  conteneurRef,
  nombrePages,
  hasNextPage,
  fetchNextPage,
  rafraichir,
}: Parametres) => {
  const [messageSurligne, setMessageSurligne] = useState<string | null>(null);
  const [rechercheEnCours, setRechercheEnCours] = useState(false);
  /** Texte lu par la zone `aria-live`. */
  const [annonce, setAnnonce] = useState('');
  const rechercheEnCoursRef = useRef(false);
  const minuterieRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Valeurs lues au fil d'une recherche asynchrone : toujours les dernières.
  const conversationRef = useRef(conversationId);
  const pagesRef = useRef(nombrePages);
  const encoreRef = useRef(hasNextPage);
  const fetchRef = useRef(fetchNextPage);
  const rafraichirRef = useRef(rafraichir);
  useEffect(() => {
    pagesRef.current = nombrePages;
    encoreRef.current = hasNextPage;
    fetchRef.current = fetchNextPage;
    rafraichirRef.current = rafraichir;
  });

  // Changement de conversation : on oublie tout, une recherche en cours s'arrête.
  useEffect(() => {
    conversationRef.current = conversationId;
    rechercheEnCoursRef.current = false;
    setRechercheEnCours(false);
    setMessageSurligne(null);
    setAnnonce('');
  }, [conversationId]);

  useEffect(
    () => () => {
      if (minuterieRef.current) clearTimeout(minuterieRef.current);
    },
    [],
  );

  const trouverNoeud = useCallback(
    (messageId: string): HTMLElement | null =>
      conteneurRef.current?.querySelector<HTMLElement>(
        `[data-message-id="${echapperSelecteur(messageId)}"]`,
      ) ?? null,
    [conteneurRef],
  );

  const attendreNoeud = useCallback(
    async (messageId: string, images: number): Promise<HTMLElement | null> => {
      for (let i = 0; i < images; i++) {
        const noeud = trouverNoeud(messageId);
        if (noeud) return noeud;
        await prochaineImage();
      }
      return trouverNoeud(messageId);
    },
    [trouverNoeud],
  );

  const montrer = useCallback(
    (noeud: HTMLElement, messageId: string) => {
      const conteneur = conteneurRef.current;
      const reduit =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      if (conteneur) {
        const rc = conteneur.getBoundingClientRect();
        const rn = noeud.getBoundingClientRect();
        const haut = conteneur.scrollTop + (rn.top - rc.top) - (conteneur.clientHeight - rn.height) / 2;
        conteneur.scrollTo({ top: Math.max(0, haut), behavior: reduit ? 'auto' : 'smooth' });
      }
      setMessageSurligne(messageId);
      if (minuterieRef.current) clearTimeout(minuterieRef.current);
      minuterieRef.current = setTimeout(() => setMessageSurligne(null), DUREE_SURLIGNAGE_MS);
      noeud.focus({ preventScroll: true });
    },
    [conteneurRef],
  );

  /**
   * Renvoie vrai si le message a été atteint. Les échecs sont annoncés par un
   * message à l'écran : l'appelant n'a rien à ajouter.
   */
  const allerAuMessage = useCallback(
    async (messageId: string, contexte: ContexteRecherche = 'citation'): Promise<boolean> => {
      const conversation = conversationRef.current;
      if (!conversation || !messageId) return false;
      const textes = TEXTES[contexte];

      const present = trouverNoeud(messageId);
      if (present) {
        montrer(present, messageId);
        setAnnonce(textes.atteint);
        return true;
      }
      if (rechercheEnCoursRef.current) return false;

      rechercheEnCoursRef.current = true;
      setRechercheEnCours(true);
      setAnnonce('Recherche du message…');
      const echec = (texte: string) => {
        toast.error(texte);
        setAnnonce(texte);
        return false;
      };
      try {
        let pageCible: number | null = null;
        try {
          const position = await conversationAPI.positionMessage(conversation, messageId, TAILLE_PAGE_MESSAGES);
          pageCible = typeof position?.page === 'number' && position.page > 0 ? position.page : null;
        } catch (erreur) {
          if (conversationRef.current !== conversation) return false;
          if ((erreur as { status?: number })?.status === 404) return echec(textes.introuvable);
          // Autre échec : on cherche quand même, page après page.
          pageCible = null;
        }
        if (conversationRef.current !== conversation) return false;

        if (pageCible !== null && pageCible > PLAFOND_PAGES_RECHERCHE) return echec(textes.tropAncien);

        /**
         * Le serveur le situe dans une page DÉJÀ chargée, et pourtant il n'est
         * pas affiché : ces pages sont périmées (une mention qu'on ouvre depuis
         * la cloche arrive souvent avant que le fil ne soit relu). On les relit
         * une fois avant de chercher plus loin.
         */
        let noeud: HTMLElement | null = null;
        if (pageCible !== null && pageCible <= pagesRef.current && rafraichirRef.current) {
          try {
            await rafraichirRef.current();
          } catch {
            // Rien : la recherche page par page prend le relais.
          }
          if (conversationRef.current !== conversation) return false;
          noeud = await attendreNoeud(messageId, 8);
        }

        // Une page de marge : des messages arrivés entre-temps décalent les pages.
        const limite =
          pageCible !== null ? Math.min(PLAFOND_PAGES_RECHERCHE, pageCible + 1) : PLAFOND_PAGES_RECHERCHE;
        let pages = pagesRef.current;
        let encore = encoreRef.current;
        /**
         * ⚠️ Borne DURE sur le nombre d'appels. Une page qui échoue laisse le
         * nombre de pages inchangé et `hasNextPage` vrai : sans cette borne, et
         * sans l'arrêt sur échec ou sur page qui n'avance pas, la boucle
         * relançait le serveur indéfiniment.
         */
        let appels = 0;
        let chargementEchoue = false;
        while (!noeud && encore && pages < limite && appels < PLAFOND_PAGES_RECHERCHE) {
          appels++;
          const resultat = await fetchRef.current();
          if (conversationRef.current !== conversation) return false;
          const pagesApres = resultat?.data?.pages?.length ?? pages;
          encore = !!resultat?.hasNextPage;
          noeud = await attendreNoeud(messageId, 4);
          if (resultat?.isError || pagesApres <= pages) {
            chargementEchoue = !noeud && !!resultat?.isError;
            pages = pagesApres;
            break;
          }
          pages = pagesApres;
        }
        noeud = noeud ?? (await attendreNoeud(messageId, 30));
        if (conversationRef.current !== conversation) return false;

        if (!noeud) {
          if (chargementEchoue) return echec('Chargement des messages impossible, réessayez');
          const tropAncien = encore && pages >= PLAFOND_PAGES_RECHERCHE;
          return echec(tropAncien ? textes.tropAncien : textes.introuvable);
        }
        montrer(noeud, messageId);
        setAnnonce(textes.atteint);
        return true;
      } finally {
        if (conversationRef.current === conversation) {
          rechercheEnCoursRef.current = false;
          setRechercheEnCours(false);
        }
      }
    },
    [trouverNoeud, montrer, attendreNoeud],
  );

  return { allerAuMessage, messageSurligne, rechercheEnCours, rechercheEnCoursRef, annonce };
};
