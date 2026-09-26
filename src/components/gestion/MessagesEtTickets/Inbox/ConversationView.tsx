"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { MessageCircle, Send, ArrowLeft, AlertTriangle, ImagePlus, X, Loader2, Mic, Check, CheckCheck, MoreVertical, Info, AtSign } from 'lucide-react';
import { toast } from 'react-hot-toast';
import InboxRightbar from './InboxRightbar';
import MobileRightSidebar from './MobileRightSidebar';
import EscalateTicketModal from './EscalateTicketModal';
import {
  useConversationListInfiniteQuery,
  useMessageListQuery,
  useEnvoyerMessageMutation,
  useMarquerLuMutation,
  useMessagerieSocketSync,
  useEnregistrementVocal,
  formaterDuree,
  LecteurVocal,
  Reactions,
  SupprimerMessage,
  useBasculerReactionMessageMutation,
  useSupprimerMessageMutation,
  useConversationDetailQuery,
  useAllerAuMessage,
  useMentionsComposeur,
  estMentionnable,
  citationDepuisMessage,
  cleJour,
  libelleJour,
  libelleVu,
  dansLaFenetreDeRegroupement,
  msAvantProchainJour,
  prenom,
  HeureMessage,
  ReserveHeure,
  BarreActionsMessage,
  ApercuReponse,
  CitationMessage,
  ListeMentions,
  TexteAvecMentions,
} from '../../../../../features/messagerie';
import type {
  IMessage,
  ICitationMessage,
  IConversation,
  IParticipantConversation,
  VarianteBulle,
} from '../../../../../features/messagerie';
import { formatImageUrl } from '@/utils/imageHelpers';
import { useAuthStore } from '../../../../../features/users/hook/authStore';

interface ConversationViewProps {
  conversationId: string | null;
  onBack?: () => void;
  /**
   * Message à atteindre dès l'ouverture (clic sur une notification de mention
   * ou de réponse). Le fil y défile et le surligne au lieu d'aller en bas.
   */
  messageCibleId?: string | null;
  /** Appelé une fois la tentative faite, réussie ou non : la cible est consommée. */
  onMessageCibleTraite?: () => void;
}

/** Liste vide partagée : un nouveau tableau à chaque rendu relancerait les calculs. */
const AUCUN_PARTICIPANT: IParticipantConversation[] = [];

/** Distance au bas du fil sous laquelle un nouveau message y ramène. */
const SEUIL_BAS_DU_FIL_PX = 150;

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 Mo

/** URL affichable d'une image de message (object URL local ou clé S3). */
const resolveMessageImage = (url?: string | null): string | null => {
  if (!url) return null;
  if (url.startsWith('blob:') || url.startsWith('data:')) return url;
  return formatImageUrl(url);
};

const getMessageImage = (msg: IMessage): string | null => {
  const meta = msg.meta as { imageUrl?: string | null } | undefined;
  return resolveMessageImage(meta?.imageUrl);
};

/**
 * URL écoutable d'une note vocale. Même résolution que les images : un aperçu
 * local pendant l'envoi, une clé de stockage ensuite.
 */
const getMessageAudio = (msg: IMessage): string | null => {
  const meta = msg.meta as { audioUrl?: string | null } | undefined;
  return resolveMessageImage(meta?.audioUrl);
};

const MAX_AUDIO_SIZE = 16 * 1024 * 1024; // 16 Mo, aligné sur la limite du serveur

function ConversationView({ conversationId, onBack, messageCibleId = null, onMessageCibleTraite }: ConversationViewProps) {
  /** Sert à reconnaître SES messages parmi ceux des collègues dans un groupe. */
  const utilisateurConnecteId = useAuthStore((etat) => etat.user?.id);
  /** Un administrateur peut retirer le message d'un collègue parti en tournée. */
  const estAdmin = useAuthStore((etat) => etat.user?.role) === 'ADMIN';
  const basculerReaction = useBasculerReactionMessageMutation();
  const supprimerMessage = useSupprimerMessageMutation();
  const [message, setMessage] = useState('');
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [pendingAudio, setPendingAudio] = useState<{
    fichier: File;
    dureeMs: number;
    urlLocale: string;
  } | null>(null);
  const vocal = useEnregistrementVocal();
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  /**
   * Panneau d'informations, à la manière de WhatsApp : il ne s'ouvre QUE
   * lorsqu'on le demande, par le menu de l'en-tête. Affiché en permanence, il
   * mangeait un tiers de la largeur pour une information qu'on ne consulte
   * qu'occasionnellement.
   *
   * Un seul état pour les deux formats : sur grand écran c'est une colonne, en
   * dessous un tiroir, et c'est la feuille de style qui choisit lequel des deux
   * se montre. Deux états auraient fini par diverger.
   */
  const [infosOuvertes, setInfosOuvertes] = useState(false);
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [isEscalateModalOpen, setIsEscalateModalOpen] = useState(false);
  /**
   * Message auquel on répond, résumé comme le serveur le résumera. Il suffit
   * à l'aperçu au-dessus du champ et à la citation du message optimiste.
   */
  const [reponseA, setReponseA] = useState<ICitationMessage | null>(null);
  /**
   * « Maintenant », pour écrire « Aujourd'hui » ou « Hier » dans les bulles.
   * Rafraîchi à minuit (heure d'Abidjan) plutôt que chaque minute : le fil
   * entier n'a besoin d'être redessiné qu'une fois par jour.
   */
  const [maintenant, setMaintenant] = useState(() => new Date());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const refChamp = useRef<HTMLTextAreaElement | null>(null);
  /** Vrai tant que l'utilisateur lit le bas du fil : un nouveau message l'y garde. */
  const presDuBasRef = useRef(true);
  /** Dernier message déjà vu, pour ne défiler qu'à l'arrivée d'un NOUVEAU dernier. */
  const dernierIdRef = useRef<string | null>(null);
  /** Conversation affichée, lue après un envoi asynchrone. */
  const conversationCouranteRef = useRef(conversationId);
  useEffect(() => {
    conversationCouranteRef.current = conversationId;
  }, [conversationId]);
  const queryClient = useQueryClient();

  useEffect(() => {
    const minuterie = setTimeout(() => setMaintenant(new Date()), msAvantProchainJour(maintenant));
    return () => clearTimeout(minuterie);
  }, [maintenant]);

  // 🔌 React Query hooks
  const {
    data: messagesPagesData,
    isLoading: isLoadingMessages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: relireMessages,
  } = useMessageListQuery(conversationId);

  const sendMessageMutation = useEnvoyerMessageMutation();
  const marquerLuMutation = useMarquerLuMutation();

  /**
   * Toutes les pages chargées, du plus ancien au plus récent, SANS DOUBLON.
   *
   * La pagination se fait par décalage : un message arrivé pendant qu'on
   * charge des pages plus anciennes décale tout d'un cran, et le dernier
   * message d'une page réapparaît en tête de la suivante. Plus on charge de
   * pages (remonter l'historique, aller à un message cité), plus c'est
   * fréquent. Deux lignes de même clé troublent le rendu de React et la
   * recherche du message par son identifiant. On garde la première copie,
   * celle de la page la plus récente.
   */
  const conversationMessages = useMemo(() => {
    const pages = (messagesPagesData?.pages || []) as any[];
    const vus = new Set<string>();
    const all: IMessage[] = [];
    for (const m of pages.flatMap((p) => p?.data || []) as IMessage[]) {
      if (!m?.id || vus.has(m.id)) continue;
      vus.add(m.id);
      all.push(m);
    }
    // Même ordre que le serveur à heure égale (identifiant en départage).
    return all.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime() ||
        (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
    );
  }, [messagesPagesData]);

  /**
   * Le fil découpé PAR JOUR (heure d'Abidjan). Chaque jour a sa section, et son
   * séparateur ne colle en haut que tant qu'on lit ce jour-là : le suivant le
   * pousse au lieu de se poser par-dessus. Sans ce découpage, une étiquette
   * plus large (« Jeudi 24 septembre 2026 ») dépassait derrière une plus
   * courte (« Hier »).
   */
  const joursDuFil = useMemo(() => {
    const jours: { cle: string; premier: string; indices: number[] }[] = [];
    conversationMessages.forEach((m, index) => {
      const cle = cleJour(m.createdAt);
      const dernier = jours[jours.length - 1];
      if (!dernier || dernier.cle !== cle) {
        jours.push({ cle: cle || `jour-${index}`, premier: m.createdAt, indices: [index] });
      } else {
        dernier.indices.push(index);
      }
    });
    return jours;
  }, [conversationMessages]);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const isInitialLoadRef = useRef(true);

  /**
   * La conversation ouverte, prise dans la liste, EN S'Y ABONNANT.
   *
   * Deux défauts se cumulaient ici. La clé lue était ['conversation','list'],
   * que plus personne ne remplit depuis le passage à la liste infinie : cet
   * objet valait donc `null` en permanence et l'en-tête affichait son texte de
   * repli. Et surtout, un `useMemo` sur `queryClient.getQueryData` ne s'abonne
   * à rien : invalider le cache ne le recalculait pas, si bien qu'un ajout de
   * membre ou un renommage ne se voyait jamais sans recharger la page.
   *
   * On utilise donc la requête elle-même. Elle est déjà montée par la liste et
   * partage sa clé : aucun appel réseau supplémentaire, seulement un abonnement
   * aux mêmes données.
   */
  const { data: listeConversations } = useConversationListInfiniteQuery();

  const conversationDeLaListe = useMemo(() => {
    if (!conversationId) return null;
    const pages = (listeConversations as { pages?: Array<{ data?: any[] }> } | undefined)?.pages ?? [];
    const toutes = pages.flatMap((page) => page?.data ?? []);
    return toutes.find((c: any) => c?.id === conversationId) ?? null;
  }, [conversationId, listeConversations]);

  /**
   * Repli quand la conversation n'est pas dans les pages déjà chargées de la
   * liste (lien profond, vieux groupe) : on la lit seule. Sans ce repli,
   * l'en-tête restait sur « Conversation non trouvée » et personne ne pouvait
   * être mentionné.
   */
  const { data: conversationSeule } = useConversationDetailQuery(
    conversationId,
    !!conversationId && !conversationDeLaListe,
  );

  const currentConversation: IConversation | null =
    conversationDeLaListe ??
    (conversationSeule && conversationSeule.id === conversationId ? conversationSeule : null);

  /** Participants de la conversation : source des mentions. */
  const participants = useMemo(
    () => (currentConversation?.users?.length ? currentConversation.users : AUCUN_PARTICIPANT),
    [currentConversation],
  );

  /**
   * Groupe interne : aucun client et plus de deux participants. Le serveur
   * tranche via `isGroup` ; le repli sur le nombre de participants couvre les
   * conversations servies par une version antérieure du backend.
   */
  const estGroupe = useMemo(
    () =>
      !!currentConversation &&
      !currentConversation.customer &&
      (currentConversation.isGroup ??
        (currentConversation.users?.length ?? 0) > 2),
    [currentConversation],
  );

  // Fonction utilitaire pour obtenir les informations d'affichage de la conversation
  const getConversationInfo = useMemo(() => {
    if (!currentConversation) {
      return {
        name: 'Conversation non trouvée',
        image: null,
        email: null,
        isInternal: false,
        participantCount: 1
      };
    }

    const isInternal = !currentConversation.customer;

    if (isInternal) {
      // Conversation interne
      const participantNames = currentConversation.users?.map((user: any) => user.fullName).join(', ') || 'Discussion interne';
      const participantCount = Math.max(1, currentConversation.users?.length || 1);
      /**
       * Un GROUPE s'annonce par son NOM. L'énumération des participants tient
       * à deux, plus du tout à cinq, et elle ne dit pas de quoi on parle.
       */
      const estGroupe = currentConversation.isGroup ?? participantCount > 2;
      const nomGroupe = currentConversation.subject?.trim();

      return {
        name: estGroupe && nomGroupe ? nomGroupe : participantNames,
        image: currentConversation.users?.[0]?.image || null,
        email: null,
        isInternal: true,
        participantCount
      };
    } else {
      // Conversation avec client
      const customer = currentConversation.customer;
      return {
        name: customer ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Client' : 'Client inconnu',
        image: customer?.image || null,
        email: customer?.email || null,
        isInternal: false,
        participantCount: 1
      };
    }
  }, [currentConversation]);

  // 🔌 Hook WebSocket pour les mises à jour en temps réel
  useMessagerieSocketSync({
    conversationId,
    enabled: !!conversationId,
    // Retiré du groupe ouvert : on quitte l'écran plutôt que de laisser lire et
    // écrire dans une conversation à laquelle on n'a plus accès.
    onRetireDuGroupe: () => {
      toast('Vous ne faites plus partie de ce groupe');
      onBack?.();
    },
  });

  /**
   * ALLER À UN MESSAGE : clic sur une citation, lien de la cloche. Suspend le
   * défilement automatique vers le bas pendant qu'il cherche.
   */
  const {
    allerAuMessage,
    messageSurligne,
    rechercheEnCours,
    rechercheEnCoursRef,
    annonce,
  } = useAllerAuMessage({
    conversationId,
    conteneurRef: scrollContainerRef,
    nombrePages: messagesPagesData?.pages?.length ?? 0,
    hasNextPage: !!hasNextPage,
    fetchNextPage,
    rafraichir: relireMessages,
  });

  /**
   * MENTIONS, entre collègues seulement : face à un client, « @Nom » partirait
   * chez lui, et le serveur refuse de toute façon. Le client est reconnu à sa
   * fiche OU à son identifiant : une conversation dont la fiche client n'a pas
   * été servie reste une conversation client.
   */
  const mentionsActives =
    getConversationInfo.isInternal &&
    !!currentConversation &&
    !currentConversation.customerId;
  const mentions = useMentionsComposeur({
    actif: mentionsActives,
    participants,
    moiId: utilisateurConnecteId,
    texte: message,
    setTexte: setMessage,
    refChamp,
  });

  /**
   * Qui sera prévenu à l'envoi : les personnes mentionnées dont le nom est
   * encore écrit, et, en interne, l'auteur du message auquel on répond (s'il
   * peut l'être, et si ce n'est pas soi). Un champ de saisie ne sait pas
   * surligner : cette ligne rend visible ce que la cloche fera.
   */
  const prevenus = useMemo(() => {
    if (!mentionsActives) return [] as string[];
    const noms: string[] = [];
    const vus = new Set<string>();
    for (const m of mentions.mentionsAEnvoyer(message)) {
      if (vus.has(m.userId)) continue;
      vus.add(m.userId);
      noms.push(m.label);
    }
    const auteur = reponseA?.author;
    if (auteur?.kind === 'user' && auteur.id && auteur.id !== utilisateurConnecteId && !vus.has(auteur.id)) {
      const participant = participants.find((p) => p.id === auteur.id);
      if (participant && estMentionnable(participant)) noms.push(participant.fullName);
    }
    return noms;
  }, [mentionsActives, mentions, message, reponseA, utilisateurConnecteId, participants]);

  // Marquer comme lu via l'API serveur quand la conversation change
  useEffect(() => {
    if (conversationId) {
      marquerLuMutation.mutate(conversationId);
    }
  }, [conversationId]);

  /**
   * ⚠️ Le composeur est VIDE à chaque changement de conversation.
   *
   * Sans cette remise à zéro, le contenu en attente suivait l'agent d'un fil à
   * l'autre : ce composant n'est jamais démonté quand on change de
   * conversation, le parent le rend sans clé et seul l'identifiant change.
   *
   * Le scénario n'a rien de théorique. L'agent enregistre « Bonjour Awa, votre
   * commande part dans dix minutes », un message d'un autre client arrive, il
   * clique dessus, tape « Bonjour » et valide : la note vocale nommant Awa part
   * chez l'autre client. Le même trou existait pour l'image en attente et pour
   * le texte saisi, il est refermé d'un coup.
   *
   * L'enregistrement en cours est arrêté et le micro rendu : laisser tourner un
   * micro au dessus d'une autre conversation serait pire encore.
   */
  useEffect(() => {
    setMessage('');
    setPendingImage(null);
    setPendingPreview(null);
    setPendingAudio(null);
    vocal.annuler();
    // La réponse et les mentions en cours appartiennent à l'ancienne
    // conversation : les garder ferait citer un message d'ailleurs.
    setReponseA(null);
    mentions.reinitialiser();
    // Nouvelle conversation : premier affichage en bas du fil.
    isInitialLoadRef.current = true;
    presDuBasRef.current = true;
    dernierIdRef.current = null;
    setMaintenant(new Date());
    /**
     * ⚠️ On ne révoque volontairement PAS les aperçus locaux ici.
     *
     * Le message optimiste qui vient de partir s'appuie sur la même adresse
     * locale pour afficher sa photo et faire écouter sa note vocale, le temps
     * que le serveur réponde. La révoquer au moindre changement d'état
     * casserait la lecture de ce qu'on vient d'envoyer. L'adresse abandonnée
     * est reprise par le navigateur au rechargement de la page, ce qui est un
     * coût négligeable comparé au défaut qu'on éviterait.
     */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // 📜 Scroll automatique vers le bas - avec gestion intelligente
  const scrollToBottom = (behavior: 'smooth' | 'instant' = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Charger plus d'anciens messages quand on scroll vers le haut
  const handleScroll = useCallback(async () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    presDuBasRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < SEUIL_BAS_DU_FIL_PX;
    // La recherche d'un message cité charge elle-même ses pages.
    if (!hasNextPage || isFetchingNextPage || rechercheEnCoursRef.current) return;
    // si on est proche du top (ex: scrollTop < 100px)
    if (el.scrollTop < 120) {
      // Préserver la position actuelle
      const previousHeight = el.scrollHeight;
      await fetchNextPage();
      // Après chargement, recalculer et restaurer le scrollTop pour préserver la vue actuelle
      requestAnimationFrame(() => {
        try {
          const newHeight = el.scrollHeight;
          el.scrollTop = newHeight - previousHeight + el.scrollTop;
        } catch (err) {
          console.warn('Erreur en restaurant la position de scroll', err);
        }
      });
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, rechercheEnCoursRef]);

  /**
   * DÉFILEMENT VERS LE BAS, déclenché par le DERNIER message et lui seul.
   *
   * L'ancienne version réagissait au nombre de messages : charger des
   * messages plus anciens en remontant ramenait aussitôt tout en bas, ce qui
   * rendait l'historique illisible et aurait annulé tout saut vers un message
   * cité.
   *
   * - Premier affichage d'une conversation : en bas, d'un coup (ou sur le
   *   message demandé par la cloche, voir plus bas).
   * - Nouveau dernier message : on descend si on lisait déjà le bas du fil,
   *   ou si c'est le sien. Quelqu'un qui relit plus haut n'est pas dérangé.
   * - Pendant la recherche d'un message cité : on ne bouge pas.
   */
  const dernierMessage = conversationMessages[conversationMessages.length - 1];
  const dernierId = dernierMessage?.id ?? null;
  const dernierEstMoi =
    !!dernierMessage?.authorUser &&
    (dernierMessage.authorUser.id === utilisateurConnecteId || dernierMessage.authorUser.id === 'current-user');

  useEffect(() => {
    if (!conversationId || !dernierId) return;
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      dernierIdRef.current = dernierId;
      presDuBasRef.current = true;
      if (!messageCibleId) scrollToBottom('instant');
      return;
    }
    if (dernierIdRef.current === dernierId) return;
    dernierIdRef.current = dernierId;
    if (rechercheEnCoursRef.current) return;
    if (presDuBasRef.current || dernierEstMoi) {
      const minuterie = setTimeout(() => scrollToBottom('smooth'), 60);
      return () => clearTimeout(minuterie);
    }
    // `messageCibleId` et `dernierEstMoi` sont lus au moment où le dernier
    // message change : ils ne doivent pas relancer le défilement à eux seuls.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, dernierId]);

  /**
   * LIEN PROFOND jusqu'à un message (clic sur une notification de mention ou
   * de réponse) : une fois les messages chargés, on y va, puis la cible est
   * rendue. Si le message reste introuvable, on retombe en bas du fil.
   */
  const cibleTraiteeRef = useRef<string | null>(null);
  useEffect(() => {
    if (!messageCibleId) {
      cibleTraiteeRef.current = null;
      return;
    }
    if (!conversationId || isLoadingMessages) return;
    const cle = `${conversationId}:${messageCibleId}`;
    if (cibleTraiteeRef.current === cle) return;
    cibleTraiteeRef.current = cle;
    const lancer = async () => {
      // Une image pour laisser le fil se dessiner avant de chercher le message.
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      const atteint = await allerAuMessage(messageCibleId, 'lien');
      // Introuvable : retour en bas du fil, sauf si une autre recherche (clic
      // sur une citation) est en cours, qu'on ne vient pas contrarier.
      if (
        !atteint &&
        !rechercheEnCoursRef.current &&
        conversationCouranteRef.current === conversationId
      ) {
        scrollToBottom('instant');
      }
      onMessageCibleTraite?.();
    };
    void lancer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageCibleId, conversationId, isLoadingMessages]);

  /**
   * Le message auquel on répond vient d'être RETIRÉ (par son auteur, ou par
   * un administrateur) : l'aperçu ne doit plus montrer son contenu, et le
   * serveur refuserait de toute façon la réponse. On l'annule et on le dit.
   */
  const citeRetire =
    !!reponseA && conversationMessages.some((m) => m.id === reponseA.id && !!m.deleted);
  useEffect(() => {
    if (!citeRetire) return;
    setReponseA(null);
    toast('Le message auquel vous répondiez a été supprimé');
  }, [citeRetire]);

  // Fermer le lightbox avec Échap
  useEffect(() => {
    if (!lightboxUrl) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxUrl(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxUrl]);

  if (!conversationId) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400">
        <div className="mb-4">
          <MessageCircle className="w-16 h-16 mx-auto text-gray-300" />
        </div>
        <h3 className="text-lg font-medium text-gray-600 mb-2">Sélectionnez une conversation</h3>
        <p className="text-sm text-gray-400">Choisissez une conversation dans la liste pour voir les messages</p>
      </div>
    );
  }

  // --- Pièce jointe image ---

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // permet de re-sélectionner le même fichier
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Seules les images sont acceptées');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error('Image trop volumineuse (max 5 Mo)');
      return;
    }
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    setPendingImage(file);
    setPendingPreview(URL.createObjectURL(file));
  };

  const clearPendingImage = () => {
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    setPendingImage(null);
    setPendingPreview(null);
  };

  const handleSendMessage = async () => {
    const body = message.trim();
    if ((!body && !pendingImage && !pendingAudio) || !conversationId || sendMessageMutation.isPending) return;

    const image = pendingImage;
    const previewUrl = pendingPreview;
    const audio = pendingAudio;
    const reponse = reponseA;
    // Seules les mentions dont « @Nom » est encore écrit partent.
    const mentionsEnvoyees = mentionsActives ? mentions.mentionsAEnvoyer(body) : [];
    const conversationEnvoi = conversationId;

    // Vider immédiatement (optimiste)
    setMessage('');
    setPendingImage(null);
    setPendingPreview(null);
    setPendingAudio(null);
    setReponseA(null);
    mentions.reinitialiser();

    try {
      await sendMessageMutation.mutateAsync({
        conversationId: conversationEnvoi,
        body,
        image: image ?? undefined,
        previewUrl: previewUrl ?? undefined,
        audio: audio?.fichier,
        audioDurationMs: audio?.dureeMs,
        audioPreviewUrl: audio?.urlLocale,
        replyToId: reponse?.id,
        replyTo: reponse,
        mentionUserIds: mentionsEnvoyees.map((m) => m.userId),
        mentions: mentionsEnvoyees,
      });
      // Le message serveur (URL de stockage) remplace l'optimiste, on libère
      // les aperçus locaux.
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (audio) URL.revokeObjectURL(audio.urlLocale);
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      const statut = (error as { status?: number } | null)?.status;
      const texteServeur = error instanceof Error ? error.message : '';
      /**
       * La CITATION est-elle la cause du refus ? Original disparu (404), ou
       * refus qui parle du message cité (« Impossible de répondre à un
       * message supprimé »). Un autre refus (mentions, taille…) ne doit pas
       * coûter la citation à l'agent.
       */
      const citationRefusee =
        !!reponse &&
        (statut === 404 || (statut === 400 && /cité|supprimé/i.test(texteServeur)));
      if (reponse && statut === 404) {
        // L'original a disparu entre-temps : la réponse ne peut plus partir.
        toast.error("Message d'origine introuvable");
      } else if (statut === 400 && texteServeur) {
        // Refus métier écrit pour l'utilisateur.
        toast.error(texteServeur);
      } else {
        toast.error("Échec de l'envoi du message");
      }
      // Restaurer en cas d'erreur, et SEULEMENT dans la conversation d'où le
      // message est parti : l'agent a pu changer de fil pendant l'envoi.
      if (conversationCouranteRef.current !== conversationEnvoi) return;
      setMessage(body);
      if (image) {
        setPendingImage(image);
        setPendingPreview(previewUrl);
      }
      if (audio) setPendingAudio(audio);
      // Une citation refusée n'est pas remise, et une réponse choisie entre-temps
      // (le bouton « Répondre » reste actif pendant l'envoi) n'est pas écrasée.
      if (reponse && !citationRefusee) setReponseA((actuelle) => actuelle ?? reponse);
      mentions.restaurer(mentionsEnvoyees);
    }
  };

  // --- Réponse à un message ---

  const repondreA = (msg: IMessage) => {
    setReponseA(citationDepuisMessage(msg, !getConversationInfo.isInternal));
    // Le focus revient au champ : on peut écrire aussitôt.
    requestAnimationFrame(() => refChamp.current?.focus());
  };

  const copierTexte = async (texte: string) => {
    try {
      await navigator.clipboard.writeText(texte);
      toast.success('Texte copié');
    } catch {
      toast.error('Impossible de copier le texte');
    }
  };

  // --- Note vocale ---

  const basculerEnregistrement = async () => {
    if (vocal.enregistre) {
      const resultat = await vocal.arreter();
      if (!resultat) {
        toast.error("Rien n'a été enregistré");
        return;
      }
      if (resultat.dureeMs < 700) {
        // Un appui involontaire ne doit pas partir comme une note vocale.
        URL.revokeObjectURL(resultat.urlLocale);
        toast.error('Note vocale trop courte');
        return;
      }
      if (resultat.fichier.size > MAX_AUDIO_SIZE) {
        URL.revokeObjectURL(resultat.urlLocale);
        toast.error('Note vocale trop longue (16 Mo maximum)');
        return;
      }
      setPendingAudio(resultat);
      return;
    }
    if (pendingAudio) {
      toast.error('Envoyez ou supprimez la note vocale en attente');
      return;
    }
    const demarre = await vocal.demarrer();
    if (!demarre && vocal.erreur) toast.error(vocal.erreur);
  };

  const annulerVocal = () => {
    if (vocal.enregistre) {
      vocal.annuler();
      return;
    }
    if (pendingAudio) {
      URL.revokeObjectURL(pendingAudio.urlLocale);
      setPendingAudio(null);
    }
  };

  /**
   * Clavier du champ, par ordre de priorité :
   * 1. saisie en cours d'une lettre composée (accents sur certains claviers) :
   *    on n'intercepte rien ;
   * 2. liste des mentions ouverte : flèches, Entrée, Tab et Échap servent à
   *    choisir, et Entrée n'envoie PAS le message ;
   * 3. Échap annule la réponse en cours ;
   * 4. Entrée envoie, Maj + Entrée va à la ligne.
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // `keyCode` 229 : Safari signale encore la touche Entrée qui VALIDE une
    // composition avec `isComposing` à faux. Sans ce second test, choisir un
    // caractère dans l'éditeur de saisie enverrait le message.
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    if (mentions.gererTouche(e)) return;
    if (e.key === 'Escape' && reponseA) {
      e.preventDefault();
      setReponseA(null);
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const canSend =
    (message.trim().length > 0 || !!pendingImage || !!pendingAudio) &&
    !vocal.enregistre &&
    !sendMessageMutation.isPending;

  return (
    <div className="h-full flex">
      {/* Zone principale de conversation */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header de conversation */}
        <div className="md:px-6 md:py-3.5 px-4 py-3 bg-white border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center md:space-x-4 space-x-3 min-w-0">
            {/* Bouton retour - visible sur tous les écrans */}
            {onBack && (
              <button
                onClick={onBack}
                title="Retour à la liste"
                className="md:p-2 p-1 cursor-pointer hover:bg-orange-100 rounded-full shrink-0"
              >
                <ArrowLeft className="md:w-5 md:h-5 w-4 h-4 text-slate-600" />
              </button>
            )}

            {/* Info conversation - Cliquable sur mobile/tablette */}
            <div
              className="flex items-center md:space-x-4 space-x-3 xl:cursor-default cursor-pointer xl:pointer-events-none min-w-0"
              onClick={() => setInfosOuvertes(true)}
            >
              {/* Avatar */}
              <div className="relative md:w-11 md:h-11 w-10 h-10 shrink-0">
                {getConversationInfo.isInternal ? (
                  // Affichage pour conversation interne - deux avatars côte à côte
                  <div className="relative w-full h-full">
                    {currentConversation?.users?.slice(0, 2).map((user: any, index: number) => {
                      const size = index === 0 ? 'md:w-8 md:h-8 w-7 h-7' : 'md:w-7 md:h-7 w-6 h-6';
                      const position = index === 0 ? 'absolute top-0 left-0' : 'absolute bottom-5 right-0';

                      return (
                        <div key={user.id} className={`${size} ${position}`}>
                          <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center border-2 border-white overflow-hidden">
                            {user.image ? (
                              <Image
                                src={formatImageUrl(user.image)}
                                alt={user.fullName}
                                width={32}
                                height={32}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <span className="md:text-xs text-xs font-bold text-gray-600 uppercase">
                                {user.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  // Affichage pour conversation avec client
                  <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center border-2 border-white overflow-hidden">
                    <Image
                      src={getConversationInfo.image ? formatImageUrl(getConversationInfo.image) : "/icons/imageprofile.png"}
                      alt={getConversationInfo.name}
                      width={44}
                      height={44}
                      className="md:w-11 md:h-11 w-10 h-10 rounded-full object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Informations conversation */}
              <div className="flex-1 min-w-0">
                <h3 className="md:text-base text-sm font-semibold text-gray-900 truncate">
                  {getConversationInfo.name}
                </h3>
                <div className="flex items-center md:space-x-2 space-x-1.5 mt-0.5 min-w-0">
                  {getConversationInfo.email && (
                    <span className="text-gray-500 text-xs truncate md:inline hidden">
                      {getConversationInfo.email}
                    </span>
                  )}
                  <span className="border-gray-200 border text-gray-600 px-2 py-0.5 rounded-full text-[11px] whitespace-nowrap">
                    {currentConversation?.restaurant?.name || 'Chicken Nation'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions : tout passe par un menu, comme sur WhatsApp. */}
          <div className="relative flex items-center shrink-0">
            <button
              onClick={() => setMenuOuvert((v) => !v)}
              aria-label="Menu de la discussion"
              aria-expanded={menuOuvert}
              className="h-9 w-9 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {menuOuvert && (
              <>
                {/*
                  Voile transparent plein écran : il ferme le menu au premier
                  clic n'importe où. Plus sûr qu'un écouteur global, qui se
                  déclenche aussi sur le bouton lui-même et le rouvre aussitôt.
                */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuOuvert(false)}
                />
                <div className="absolute right-0 top-11 z-50 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOuvert(false);
                      setInfosOuvertes(true);
                    }}
                    className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] text-gray-700 hover:bg-gray-50 cursor-pointer"
                  >
                    <Info className="h-4 w-4 text-gray-400" />
                    {estGroupe
                      ? 'Infos du groupe'
                      : getConversationInfo.isInternal
                        ? 'Infos de la discussion'
                        : 'Infos du contact'}
                  </button>

                  {/* Un ticket de support se rattache à un CLIENT : le proposer
                      sur un échange interne n'a pas de sens. */}
                  {!getConversationInfo.isInternal && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOuvert(false);
                        setIsEscalateModalOpen(true);
                      }}
                      className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] text-gray-700 hover:bg-gray-50 cursor-pointer"
                    >
                      <AlertTriangle className="h-4 w-4 text-gray-400" />
                      Convertir en ticket
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto bg-[#FAFAFA] md:px-6 md:py-4 px-4 py-3">
          {/*
            Recherche d'un message cité plus ancien que ce qui est chargé.
            Hauteur nulle et collé en haut : il flotte sur le fil sans le
            décaler, ce qui dérouterait la recherche elle-même.
          */}
          {rechercheEnCours && (
            <div className="sticky top-2 z-20 flex h-0 justify-center overflow-visible pointer-events-none">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-[11px] font-medium text-gray-600 shadow-sm">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#F17922]" />
                Recherche du message…
              </span>
            </div>
          )}
          {/* Annonces pour les lecteurs d'écran : recherche, puis message atteint. */}
          <div aria-live="polite" className="sr-only">
            {annonce}
          </div>

          {/* Loading des messages */}
          {isLoadingMessages && (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F17922]"></div>
            </div>
          )}

          {isFetchingNextPage && (
            <div className="flex justify-center py-2">
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            </div>
          )}

          {/* Messages */}
          <div className="space-y-1.5">
            {conversationMessages.length === 0 && !isLoadingMessages ? (
              <div className="text-center text-gray-500 py-8">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Aucun message dans cette conversation</p>
                <p className="text-sm mt-2">Envoyez le premier message pour commencer la discussion</p>
              </div>
            ) : (
              joursDuFil.map((jour) => (
                <div key={jour.cle} className="space-y-1.5">
                  {/*
                    Séparateur de jour, COLLANT : il reste en haut du fil tant
                    qu'on lit les messages de ce jour, puis le jour suivant le
                    pousse. Il ne capte aucun clic.
                  */}
                  <div className="sticky top-2 z-10 flex items-center justify-center py-3 pointer-events-none">
                    <span className="px-3 py-1 bg-white border border-gray-200 rounded-full text-[11px] font-medium text-gray-500 shadow-sm">
                      {libelleJour(jour.premier, maintenant)}
                    </span>
                  </div>
                  {jour.indices.map((index) => {
                const msg = conversationMessages[index];
                const prev = conversationMessages[index - 1];
                /**
                 * IDENTITE de l'auteur : « écrit par le personnel ».
                 *
                 * ⚠️ Ne JAMAIS y mêler « écrit par moi ». Cette variable décide
                 * aussi du NOM et de la PHOTO affichés, et sa branche contraire
                 * retombe sur le client de la conversation. Un message de
                 * collègue jugé « pas à moi » s'afficherait donc signé du nom et
                 * de la photo du CLIENT : faux, et trompeur dans une boîte de
                 * réception partagée entre caissiers et call center.
                 */
                const isAgent = !!msg.authorUser;
                /**
                 * Message du SYSTÈME : aucun auteur, ni personnel ni client.
                 * C'est une alerte, elle ne doit ressembler à la bulle de
                 * personne, et surtout pas emprunter le nom du client par le
                 * jeu des replis.
                 */
                const estSysteme = !msg.authorUser && !msg.authorCustomer;

                /**
                 * ALIGNEMENT, qui est une tout autre question.
                 *
                 * Face à un client, le partage se fait par camp : le personnel à
                 * droite, le client à gauche, quel que soit l'agent qui a écrit.
                 * Dans une conversation interne, tout le monde est du personnel :
                 * le partage se fait alors entre MES messages et ceux des autres,
                 * sans quoi un groupe de cinq devient une colonne unique où l'on
                 * ne reconnaît plus rien.
                 *
                 * « current-user » est l'identifiant provisoire que porte un
                 * message tant que le serveur ne l'a pas confirmé. Sans lui,
                 * chacun de mes envois basculerait du mauvais côté pendant tout
                 * l'aller-retour, plusieurs secondes sur une photo.
                 */
                const estMoi =
                  !!msg.authorUser &&
                  (msg.authorUser.id === utilisateurConnecteId ||
                    msg.authorUser.id === 'current-user');
                const aDroite = getConversationInfo.isInternal ? estMoi : isAgent;
                // Jour calculé à l'heure d'Abidjan, comme tout le reste du fil.
                const newDay = !prev || cleJour(prev.createdAt) !== cleJour(msg.createdAt);
                /**
                 * REGROUPEMENT : avatar et nom ne sont répétés que quand
                 * l'auteur change, quand le jour change, ou après cinq minutes
                 * de silence. Chaque bulle porte de toute façon sa propre date
                 * et heure.
                 *
                 * ⚠️ Deux alertes ne se regroupent que si elles sont proches :
                 * sans auteur ni l'une ni l'autre, l'ancienne comparaison
                 * (`undefined === undefined`) les réunissait toutes sous un seul
                 * en-tête « Système » pour la journée.
                 */
                const idAuteurPersonnel = (m?: IMessage) =>
                  m?.authorUser?.id === 'current-user' ? utilisateurConnecteId : m?.authorUser?.id;
                const prevIsAgent = prev ? !!prev.authorUser : null;
                const prevEstSysteme = !!prev && !prev.authorUser && !prev.authorCustomer;
                const sameAuthorAsPrev =
                  !!prev &&
                  !newDay &&
                  dansLaFenetreDeRegroupement(prev.createdAt, msg.createdAt) &&
                  (estSysteme
                    ? prevEstSysteme
                    : prevIsAgent === isAgent &&
                      (isAgent
                        ? idAuteurPersonnel(prev) === idAuteurPersonnel(msg)
                        : !!msg.authorCustomer && prev?.authorCustomer?.id === msg.authorCustomer?.id));

                const imageUrl = getMessageImage(msg);
                const audioUrl = getMessageAudio(msg);
                // ⚠️ Le corps de repli écrit par le serveur (« Photo »,
                // « Message vocal ») ne doit pas s'afficher SOUS la pièce
                // jointe : il n'existe que pour que les clients qui ignorent
                // `meta` voient quelque chose.
                const corpsDeRepli =
                  (!!imageUrl && msg.body === 'Photo') ||
                  (!!audioUrl && msg.body === 'Message vocal');
                const hasBody =
                  !!msg.body && msg.body.trim().length > 0 && !corpsDeRepli;
                const isTemp = String(msg.id).startsWith('temp-');

                const authorName = estSysteme
                  ? 'Système'
                  : isAgent
                  ? (msg.authorUser?.name || 'Support')
                  : (msg.authorCustomer?.name ||
                      `${msg.authorCustomer?.first_name || ''} ${msg.authorCustomer?.last_name || ''}`.trim() ||
                      getConversationInfo.name);

                const avatarSrc = isAgent
                  ? (msg.authorUser?.image ? formatImageUrl(msg.authorUser.image) : '/icons/imageprofile.png')
                  : (msg.authorCustomer?.image
                      ? formatImageUrl(msg.authorCustomer.image)
                      : currentConversation?.customer?.image
                        ? formatImageUrl(currentConversation.customer.image)
                        : '/icons/imageprofile.png');

                /**
                 * Une bulle qui ME mentionne ressort : liseré orange et fond
                 * orangé très pâle. On la retrouve d'un coup d'œil en arrivant
                 * par la cloche.
                 */
                const meMentionne =
                  !aDroite &&
                  !estSysteme &&
                  !msg.deleted &&
                  !!utilisateurConnecteId &&
                  (msg.mentions ?? []).some((m) => m.userId === utilisateurConnecteId);
                const variante: VarianteBulle = estSysteme ? 'alerte' : aDroite ? 'orange' : 'blanc';
                // Le contenu d'un message retiré a disparu : sa citation aussi.
                const citation = !msg.deleted ? msg.replyTo ?? null : null;
                const surligne = messageSurligne === msg.id;

                /**
                 * « Répondre en mentionnant Awa » : en interne, quand l'auteur
                 * est un collègue qu'on peut mentionner, et pas soi-même.
                 */
                const participantAuteur =
                  mentionsActives && isAgent && !estMoi
                    ? participants.find((p) => p.id === msg.authorUser?.id)
                    : undefined;
                const optionMentionner =
                  participantAuteur && estMentionnable(participantAuteur)
                    ? {
                        prenom: prenom(participantAuteur.fullName),
                        onChoisir: () => {
                          repondreA(msg);
                          mentions.mentionner(participantAuteur);
                        },
                      }
                    : null;

                return (
                  <React.Fragment key={msg.id}>
                    {/* `group` : les actions (répondre, réagir, retirer) ne se montrent qu'au
                        survol de CE message, sinon le fil serait parsemé d'icônes.
                        `data-message-id` et `tabIndex` permettent d'y revenir depuis une
                        citation ou une notification, souris ou clavier. */}
                    <div
                      data-message-id={msg.id}
                      tabIndex={-1}
                      className={`group flex focus:outline-none ${aDroite ? 'justify-end' : 'justify-start'} ${sameAuthorAsPrev ? 'mt-0.5' : 'mt-3'}`}
                    >
                      <div className={`flex items-end gap-2 md:max-w-[70%] max-w-[85%] ${aDroite ? 'flex-row-reverse' : ''}`}>
                        {/* Avatar (uniquement sur le premier message du groupe) */}
                        <div className="w-8 h-8 shrink-0">
                          {!sameAuthorAsPrev && (
                            <Image
                              src={avatarSrc}
                              alt={authorName}
                              width={32}
                              height={32}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          )}
                        </div>

                        <div className={`flex flex-col ${aDroite ? 'items-end' : 'items-start'} min-w-0`}>
                          {/* Nom (premier message du groupe). L'heure est dans la bulle. */}
                          {!sameAuthorAsPrev && (
                            <div className={`flex items-center gap-1.5 mb-1 px-1 ${aDroite ? 'flex-row-reverse' : ''}`}>
                              <span className="text-xs font-semibold text-gray-700">{authorName}</span>
                            </div>
                          )}

                          {/* Bulle et, à côté, côté intérieur du fil, ses actions. */}
                          <div className={`flex max-w-full items-center gap-1 ${aDroite ? 'flex-row-reverse' : ''}`}>
                          <div
                            className={`relative min-w-0 rounded-2xl overflow-hidden transition-shadow duration-300 ${
                              estSysteme
                                ? // Une alerte ne ressemble à la bulle de personne : ni la
                                  // couleur du personnel, ni celle du client. Elle se
                                  // repère d'un coup d'œil en remontant le fil.
                                  'bg-[#FDF3E7] text-[#8A4B00] border border-[#F3D5B0] rounded-bl-md'
                                : aDroite
                                ? 'bg-[#F17922] text-white rounded-br-md'
                                : meMentionne
                                ? 'bg-orange-50/80 text-gray-900 border border-orange-100 border-l-4 border-l-[#F17922] shadow-sm rounded-bl-md'
                                : 'bg-white text-gray-900 border border-gray-100 shadow-sm rounded-bl-md'
                            } ${isTemp ? 'opacity-70' : ''} ${
                              surligne ? 'ring-2 ring-[#F17922]/60 ring-offset-2 ring-offset-[#FAFAFA]' : ''
                            }`}
                          >
                            {/* Message cité, en tête de bulle : un clic y ramène. */}
                            {citation && (
                              <CitationMessage
                                citation={citation}
                                moiId={utilisateurConnecteId}
                                variante={variante}
                                onAller={(id) => void allerAuMessage(id)}
                              />
                            )}
                            {/* Image jointe */}
                            {imageUrl && (
                              <div className={`relative ${citation ? 'mt-1.5' : ''}`}>
                                <button
                                  type="button"
                                  onClick={() => setLightboxUrl(imageUrl)}
                                  className="block cursor-zoom-in"
                                  title="Agrandir l'image"
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={imageUrl}
                                    alt="Image jointe"
                                    className="max-w-[260px] md:max-w-[320px] max-h-[280px] object-cover block"
                                  />
                                </button>
                                {/* Photo sans légende : l'heure se pose sur l'image. */}
                                {!hasBody && (
                                  <HeureMessage iso={msg.createdAt} maintenant={maintenant} variante={variante} position="pastille" />
                                )}
                              </div>
                            )}
                            {audioUrl && (
                              <>
                                <LecteurVocal
                                  url={audioUrl}
                                  dureeMs={
                                    typeof msg.meta?.audioDurationMs === 'number'
                                      ? (msg.meta.audioDurationMs as number)
                                      : null
                                  }
                                  sombre={aDroite}
                                />
                                {!hasBody && (
                                  <HeureMessage iso={msg.createdAt} maintenant={maintenant} variante={variante} position="ligne" />
                                )}
                              </>
                            )}
                            {hasBody && (
                              <p
                                className={`md:text-sm text-xs leading-relaxed whitespace-pre-wrap break-words px-3.5 py-2.5 ${
                                  msg.deleted ? 'italic opacity-80' : ''
                                }`}
                              >
                                {estSysteme || msg.deleted ? (
                                  msg.body
                                ) : (
                                  <TexteAvecMentions
                                    texte={msg.body}
                                    mentions={msg.mentions}
                                    variante={variante}
                                    moiId={utilisateurConnecteId}
                                  />
                                )}
                                {/* Place gardée pour la date et l'heure, posées dans le coin. */}
                                <ReserveHeure iso={msg.createdAt} maintenant={maintenant} />
                              </p>
                            )}
                            {hasBody && (
                              <HeureMessage iso={msg.createdAt} maintenant={maintenant} variante={variante} position="coin" />
                            )}
                            {/* Ni texte, ni photo, ni vocal : l'heure garde quand même sa place. */}
                            {!hasBody && !imageUrl && !audioUrl && (
                              <HeureMessage iso={msg.createdAt} maintenant={maintenant} variante={variante} position="ligne" />
                            )}
                          </div>

                          {/*
                            Répondre, et le menu « Plus ». Proposés aussi sur les
                            alertes (« je m'en occupe » en citant l'alerte), jamais
                            sur un message pas encore confirmé ni sur un message
                            retiré.
                          */}
                          {!isTemp && !msg.deleted && (
                            <BarreActionsMessage
                              aDroite={aDroite}
                              onRepondre={() => repondreA(msg)}
                              mentionner={optionMentionner}
                              texteACopier={hasBody ? msg.body : null}
                              onCopier={copierTexte}
                            />
                          )}
                          </div>

                          {/*
                            Accusé de lecture, sous les seules bulles de
                            l'agent. Un accusé sous le message du client
                            n'aurait aucun sens : c'est nous qui l'avons lu.

                            ⚠️ Vocabulaire honnête. « Vu » signifie que le
                            client a OUVERT la conversation dans son
                            application, et non qu'il a lu ce message précis.
                            C'est le seul signal dont dispose le serveur, et
                            promettre davantage serait mentir.

                            Les messages encore en cours d'envoi n'affichent
                            rien : un accusé sur un message non parti serait
                            pire que pas d'accusé du tout.
                          */}
                          {/*
                            RÉACTIONS, sous la bulle. Posées avant l'accusé de
                            lecture pour que l'ordre de lecture reste naturel :
                            le message, ce qu'on en pense, puis son état.
                          */}
                          {/*
                            Retrait proposé sur SES propres messages, et sur
                            ceux du personnel quand on est administrateur. Le
                            serveur applique la même règle : ce qui est montré
                            ici ne fait qu'éviter un bouton qui échouerait.
                          */}
                          {!isTemp && !estSysteme && !msg.deleted && isAgent &&
                            (msg.authorUser?.id === utilisateurConnecteId || estAdmin) && (
                            <div className={`flex ${aDroite ? 'justify-end' : 'justify-start'} mt-0.5`}>
                              <SupprimerMessage
                                aDroite={aDroite}
                                onSupprimer={() =>
                                  supprimerMessage.mutateAsync({
                                    conversationId: conversationId!,
                                    messageId: msg.id,
                                  })
                                }
                              />
                            </div>
                          )}

                          {!isTemp && !estSysteme && !msg.deleted && (
                            <Reactions
                              reactions={msg.reactions}
                              aDroite={aDroite}
                              onBasculer={(emoji) =>
                                conversationId &&
                                basculerReaction.mutate({
                                  parentId: conversationId,
                                  messageId: msg.id,
                                  emoji,
                                })
                              }
                            />
                          )}

                          {aDroite && !isTemp && (
                            <div className="flex items-center justify-end gap-1 mt-0.5 px-1">
                              {msg.isRead ? (
                                <>
                                  <CheckCheck className="w-3.5 h-3.5 text-[#F17922]" />
                                  <span className="text-[10px] text-gray-400">
                                    {/* « Vu hier à 18:26 » : le jour compte quand ce n'est pas aujourd'hui. */}
                                    {msg.readAt ? libelleVu(msg.readAt, maintenant) : 'Vu'}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Check className="w-3.5 h-3.5 text-gray-300" />
                                  <span className="text-[10px] text-gray-300">Envoyé</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
                  })}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Zone de saisie */}
        <div className="md:px-6 md:py-3.5 px-4 py-3 bg-white border-t border-slate-200">
          {/* Réponse en cours : le message cité, en premier, pleine largeur. */}
          {reponseA && (
            <ApercuReponse
              citation={reponseA}
              moiId={utilisateurConnecteId}
              desactive={sendMessageMutation.isPending}
              onAnnuler={() => {
                setReponseA(null);
                refChamp.current?.focus();
              }}
            />
          )}

          {/* Qui la cloche préviendra : un champ de saisie ne sait pas surligner. */}
          {prevenus.length > 0 && (
            <p className="mb-2 flex items-center gap-1.5 px-1 text-[11px] text-gray-500">
              <AtSign aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-[#F17922]" />
              <span className="truncate">
                {prevenus.length > 1 ? 'Seront prévenus : ' : 'Sera prévenu : '}
                <span className="font-medium text-gray-700">{prevenus.join(', ')}</span>
              </span>
            </p>
          )}

          {/* Aperçu de l'image à envoyer */}
          {pendingPreview && (
            <div className="mb-2.5 inline-flex items-center gap-3 bg-orange-50/60 border border-orange-100 rounded-xl p-2 pr-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pendingPreview}
                alt="Aperçu"
                className="w-12 h-12 rounded-lg object-cover"
              />
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-700 truncate max-w-[180px]">
                  {pendingImage?.name || 'Image'}
                </p>
                <p className="text-[11px] text-gray-400">Sera envoyée avec votre message</p>
              </div>
              <button
                onClick={clearPendingImage}
                disabled={sendMessageMutation.isPending}
                className="p-1 hover:bg-orange-100 rounded-full transition-colors"
                title="Retirer l'image"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          )}

          {/* Enregistrement en cours */}
          {vocal.enregistre && (
            <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-red-50 border border-red-100 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
              <span className="text-xs text-red-600 font-medium tabular-nums">
                {formaterDuree(vocal.dureeMs)}
              </span>
              <span className="text-xs text-gray-500 flex-1">Enregistrement en cours</span>
              <button
                onClick={annulerVocal}
                className="p-1 hover:bg-red-100 rounded-full transition-colors"
                title="Annuler l'enregistrement"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          )}

          {/* Note vocale prête à partir */}
          {pendingAudio && !vocal.enregistre && (
            <div className="mb-2 px-2 py-1 bg-orange-50 border border-orange-100 rounded-xl">
              <div className="flex items-center gap-1">
                <div className="flex-1 min-w-0">
                  <LecteurVocal url={pendingAudio.urlLocale} dureeMs={pendingAudio.dureeMs} />
                </div>
                <button
                  onClick={annulerVocal}
                  disabled={sendMessageMutation.isPending}
                  className="p-1 hover:bg-orange-100 rounded-full transition-colors shrink-0"
                  title="Supprimer la note vocale"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <p className="text-[11px] text-gray-500 px-2 pb-1.5 leading-relaxed">
                Une note vocale n'est écoutable que sur la nouvelle version de
                l'application. Les clients qui ne l'ont pas encore installée
                verront la mention « Message vocal » sans pouvoir l'écouter.
              </p>
            </div>
          )}

          {/* Champ de saisie. `relative` : la liste des mentions s'ouvre juste au-dessus. */}
          <div className="relative flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-2 py-1.5 focus-within:ring-2 focus-within:ring-[#F17922] focus-within:border-transparent transition-shadow">
            {mentions.ouverte && (
              <ListeMentions
                idListe={mentions.idListe}
                idOption={mentions.idOption}
                options={mentions.options}
                indexActif={mentions.indexActif}
                terme={mentions.terme}
                onChoisir={(option) => mentions.choisir(option.participant)}
                onSurvol={mentions.setIndexActif}
                resoudreImage={formatImageUrl}
              />
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={sendMessageMutation.isPending || vocal.enregistre}
              className="p-2 rounded-full hover:bg-orange-100 transition-colors shrink-0 cursor-pointer disabled:opacity-50"
              title="Joindre une image"
            >
              <ImagePlus className="w-5 h-5 text-[#F17922]" />
            </button>
            <button
              onClick={basculerEnregistrement}
              disabled={sendMessageMutation.isPending}
              className={`p-2 rounded-full transition-colors shrink-0 cursor-pointer disabled:opacity-50 ${
                vocal.enregistre ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-orange-100'
              }`}
              title={vocal.enregistre ? "Terminer l'enregistrement" : 'Enregistrer une note vocale'}
            >
              <Mic className={`w-5 h-5 ${vocal.enregistre ? 'text-red-500' : 'text-[#F17922]'}`} />
            </button>
            <textarea
              ref={refChamp}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                mentions.analyser(e.target.value, e.target.selectionStart);
              }}
              // Le curseur a bougé (clic, flèches) : la recherche suit le « @ » le plus proche.
              onSelect={(e) => mentions.analyser(e.currentTarget.value, e.currentTarget.selectionStart)}
              onBlur={mentions.masquer}
              onKeyDown={handleKeyDown}
              placeholder={mentionsActives ? 'Écrire un message… (@ pour mentionner)' : 'Écrire un message…'}
              aria-label="Message"
              {...mentions.attributsChamp}
              className="flex-1 max-h-32 px-1 py-2 text-slate-700 bg-transparent resize-none focus:outline-none md:text-sm text-xs"
              rows={2}
              disabled={sendMessageMutation.isPending}
            />
            <button
              title="Envoyer le message"
              onClick={handleSendMessage}
              disabled={!canSend}
              className="bg-[#F17922] text-white p-2.5 cursor-pointer rounded-full hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 transition-colors"
            >
              {sendMessageMutation.isPending ? (
                <div className="animate-spin rounded-full w-4 h-4 border-b-2 border-white"></div>
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Panneau d'informations, sur demande seulement (grand écran). */}
      <div className={infosOuvertes ? 'hidden xl:block' : 'hidden'}>
        <InboxRightbar
          conversationId={conversationId}
          clientName={getConversationInfo.name}
          clientEmail={getConversationInfo.email}
          clientImage={getConversationInfo.image}
          clientPhone={getConversationInfo.isInternal ? "" : currentConversation?.customer?.phone || ""}
          isInternal={getConversationInfo.isInternal}
          participants={currentConversation?.users || []}
          isGroup={estGroupe}
          groupName={currentConversation?.subject}
          recoitAlertes={!!currentConversation?.receivesAlerts}
          onClose={() => setInfosOuvertes(false)}
          onQuitteGroupe={onBack}
        />
      </div>

      {/*
        Même panneau, en tiroir, sous le seuil où la colonne s'affiche. Le
        `xl:hidden` l'empêche de se superposer à la colonne quand les deux
        seraient ouverts par le même état.
      */}
      <div className="xl:hidden">
      <MobileRightSidebar
        isOpen={infosOuvertes}
        onClose={() => setInfosOuvertes(false)}
        conversationId={conversationId}
        clientName={getConversationInfo.name}
        clientEmail={getConversationInfo.email}
        clientImage={getConversationInfo.image}
        clientPhone={getConversationInfo.isInternal ? "" : currentConversation?.customer?.phone || ""}
        isInternal={getConversationInfo.isInternal}
        participants={currentConversation?.users || []}
        isGroup={estGroupe}
        groupName={currentConversation?.subject}
        recoitAlertes={!!currentConversation?.receivesAlerts}
        onQuitteGroupe={() => {
          setInfosOuvertes(false);
          onBack?.();
        }}
      />
      </div>

      {/* Modal d'escalation */}
      <EscalateTicketModal
        isOpen={isEscalateModalOpen}
        onClose={() => setIsEscalateModalOpen(false)}
        conversationId={conversationId}
        clientName={getConversationInfo.name}
      />

      {/* Visionneuse d'image plein écran */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-6 cursor-zoom-out"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            title="Fermer"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxUrl}
            alt="Image"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

export default ConversationView;
