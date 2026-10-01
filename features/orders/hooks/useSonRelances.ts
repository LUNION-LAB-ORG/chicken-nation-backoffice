"use client";

import { useCallback, useEffect, useRef } from "react";
import SoundManager from "../../websocket/class/sound.manager";
import {
  requestNotificationPermission,
  showTaggedNotification,
  startTitleFlash,
  stopTitleFlash,
} from "../../calls/utils/notifications";
import { useDashboardStore } from "@/store/dashboardStore";
import {
  CLE_SONS_JOUES,
  ETIQUETTE_NOTIFICATION,
  SON_RELANCE,
  SONS_JOUES_MAX,
  VERROU_SON,
} from "../constantes/relance.constante";
import { useRelanceSonStore } from "../stores/relance-son.store";
import { useRelanceUiStore } from "../stores/relance-ui.store";
import { RelancesReponse } from "../types/relance.types";
import { cleAlerte, reglesDe, texteBandeau } from "../utils/relance";

/**
 * Son des relances, côté navigateur : UNE sonnerie par poste pour chaque
 * commande nouvellement alertée, quel que soit le nombre d'onglets ouverts.
 *
 * Le son ne passe pas par SOUND_RULES et NotificationSoundEngine : ce moteur
 * réagit à un état, ici on réagit à un événement qu'il faut dédoublonner.
 *
 * Anti-doublon entre onglets :
 *  - une alerte porte une clé par groupe (tête et instant de l'alerte, voir
 *    cleAlerte) ; les clés déjà jouées sont gardées dans le stockage du
 *    navigateur (les 50 dernières) : une alerte dont toutes les clés sont
 *    connues ne sonne plus ;
 *  - les onglets font la queue sur le verrou `navigator.locks`, l'onglet
 *    regardé d'abord, puis ceux qui ont déjà reçu un geste (seuls à pouvoir
 *    jouer), les autres ensuite ;
 *  - celui qui obtient le verrou relit les clés, les inscrit et joue. Si le
 *    navigateur refuse le son, il rend les clés et libère le verrou : l'onglet
 *    suivant de la queue tente à son tour ;
 *  - sans `navigator.locks` : la liste des clés seule.
 */

const TITRE_CLIGNOTANT = "Commande à relancer";
const PROPRIETAIRE_TITRE = "relance";

let lecteur: SoundManager | null = null;

/** Joue le son une fois. `false` : le navigateur l'a refusé. */
async function jouerSon(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  lecteur ??= new SoundManager({ src: SON_RELANCE, mode: "once" });
  // Un son « once » ne se réarme qu'après stop() : chaque alerte doit sonner.
  lecteur.stop();
  const joue = await lecteur.play();
  useRelanceUiStore.getState().setSonBloque(!joue);
  return joue;
}

const lireCles = (): string[] => {
  try {
    const brut = JSON.parse(window.localStorage.getItem(CLE_SONS_JOUES) ?? "[]");
    return Array.isArray(brut) ? brut.filter((c): c is string => typeof c === "string") : [];
  } catch {
    return [];
  }
};

/** Repli en mémoire quand le stockage est refusé (fenêtre privée, données bloquées). */
const clesEnMemoire = new Set<string>();

const dejaJouee = (cle: string) => clesEnMemoire.has(cle) || lireCles().includes(cle);

const desinscrire = (cle: string) => {
  clesEnMemoire.delete(cle);
  try {
    window.localStorage.setItem(CLE_SONS_JOUES, JSON.stringify(lireCles().filter((c) => c !== cle)));
  } catch {
    /* stockage refusé : la mémoire de cette page suffit */
  }
};

const inscrire = (cle: string) => {
  clesEnMemoire.add(cle);
  try {
    const cles = lireCles().filter((c) => c !== cle);
    cles.push(cle);
    window.localStorage.setItem(CLE_SONS_JOUES, JSON.stringify(cles.slice(-SONS_JOUES_MAX)));
  } catch {
    /* stockage refusé : la mémoire de cette page suffit */
  }
};

const attendre = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Au-delà, l'onglet renonce : un autre s'en est chargé, ou aucun ne peut jouer. */
const ATTENTE_VERROU_MS = 8000;

/**
 * La page a-t-elle déjà reçu un geste de l'agent ? `null` quand le
 * navigateur ne le dit pas. Sans geste, la lecture du son est refusée.
 */
const aRecuUnGeste = (): boolean | null => {
  const activation = typeof navigator !== "undefined" ? navigator.userActivation : undefined;
  return activation ? activation.hasBeenActive : null;
};

/** Ordre de passage : l'onglet regardé, puis ceux qui peuvent jouer, puis les autres. */
const delaiDePassage = () => (document.hidden ? 400 : 0) + (aRecuUnGeste() === false ? 800 : 0);

/**
 * Exécute `action` dans UN seul onglet du navigateur pour une alerte.
 * `action` renvoie `false` quand le son a été refusé : les clés sont rendues
 * et l'onglet suivant de la queue tente à son tour. Renvoie `true` si cet
 * onglet s'en est chargé.
 */
async function avecVerrou(cles: string[], action: () => Promise<boolean>): Promise<boolean> {
  const dejaFaite = () => cles.every(dejaJouee);
  if (typeof window === "undefined" || cles.length === 0 || dejaFaite()) return false;

  const tenter = async () => {
    const nouvelles = cles.filter((c) => !dejaJouee(c));
    if (nouvelles.length === 0) return false;
    nouvelles.forEach(inscrire);
    let fait = false;
    try {
      fait = await action();
    } catch {
      /* échec imprévu : traité comme un refus, l'onglet suivant tente */
    }
    if (!fait) nouvelles.forEach(desinscrire);
    return fait;
  };

  const locks = typeof navigator !== "undefined" ? navigator.locks : undefined;
  if (!locks?.request) return tenter();

  await attendre(delaiDePassage());
  if (dejaFaite()) return false;

  // Sans `ifAvailable` : les onglets attendent leur tour au lieu de renoncer,
  // pour qu'un refus du son passe la main au suivant.
  const arret = new AbortController();
  const minuterie = window.setTimeout(() => arret.abort(), ATTENTE_VERROU_MS);
  try {
    return await locks.request(VERROU_SON, { signal: arret.signal }, () => tenter());
  } catch {
    // Attente dépassée : on renonce. Autre erreur : le verrou est indisponible.
    return arret.signal.aborted ? false : tenter();
  } finally {
    window.clearTimeout(minuterie);
  }
}

/**
 * Sans geste depuis le chargement, le navigateur refusera le son : on le
 * devine sans jouer, pour afficher « Activer le son » d'emblée.
 */
const lectureBloquee = (): boolean => {
  const nav = navigator as Navigator & { getAutoplayPolicy?: (type: string) => string };
  if (typeof nav.getAutoplayPolicy === "function") {
    try {
      return nav.getAutoplayPolicy("mediaelement") !== "allowed";
    } catch {
      /* repli sur l'activation ci-dessous */
    }
  }
  return aRecuUnGeste() === false;
};

/** Onglet masqué, ou fenêtre visible mais sans le focus (autre application devant, second écran). */
const fenetreInactive = () => document.hidden || !document.hasFocus();

/** Le clignotement du titre s'arrête quand l'agent revient sur l'onglet. */
const clignoterSiInactive = () => {
  if (typeof document === "undefined" || !fenetreInactive()) return;
  startTitleFlash(TITRE_CLIGNOTANT, PROPRIETAIRE_TITRE);
};

/**
 * Geste de l'agent (« Activer le son ») : il débloque la lecture pour la
 * page, et la permission des notifications du système se demande sur ce
 * même geste.
 */
export async function activerSonRelances(): Promise<boolean> {
  void requestNotificationPermission();
  return jouerSon();
}

/**
 * Demande la permission des notifications du système sur un geste de
 * l'agent : interrupteur, « Voir », compteur, onglet « À relancer », « Je
 * m'en occupe ». Le navigateur ne pose la question qu'une fois ; ensuite
 * l'appel ne fait rien.
 */
export function demanderPermissionNotifications() {
  void requestNotificationPermission();
}

/**
 * Branche le son sur la liste des relances : alertes, rappel et premier
 * chargement. Monté une seule fois (useRelancesWatcher).
 */
export function useSonRelances(data: RelancesReponse | undefined) {
  const sonCoupe = useRelanceSonStore((s) => s.sonCoupe);
  const openRelances = useDashboardStore((s) => s.openRelances);

  // Dernières valeurs lues par les minuteries, sans les réarmer à chaque rendu.
  const etat = useRef({ data, sonCoupe });
  useEffect(() => {
    etat.current = { data, sonCoupe };
  }, [data, sonCoupe]);

  /**
   * Alerte serveur : `cles` sont les clés d'alerte (cleAlerte) des groupes
   * qui viennent de passer le délai, ou dont la prise vient d'expirer, et
   * sont encore à relancer. Notification du système et clignotement même son
   * coupé : seule la sonnerie se tait.
   */
  const alerter = useCallback(
    async (cles: string[], relue?: RelancesReponse) => {
      await avecVerrou(cles, async () => {
        // `relue` : la réponse que l'alerte vient de relire, plus fraîche que le dernier rendu.
        const courant = relue ?? etat.current.data;
        const joue = useRelanceSonStore.getState().sonCoupe ? true : await jouerSon();
        const maintenant = Date.now() + useRelanceUiStore.getState().ecartHorloge;
        showTaggedNotification(
          ETIQUETTE_NOTIFICATION,
          TITRE_CLIGNOTANT,
          texteBandeau(courant?.groupes ?? [], maintenant) || "Un panier attend un appel.",
          { onClick: openRelances },
        );
        clignoterSiInactive();
        return joue;
      });
    },
    [openRelances],
  );

  // Retour sur l'onglet ou sur la fenêtre : le titre redevient normal.
  useEffect(() => {
    const surRetour = () => {
      if (!fenetreInactive()) stopTitleFlash(PROPRIETAIRE_TITRE);
    };
    document.addEventListener("visibilitychange", surRetour);
    window.addEventListener("focus", surRetour);
    return () => {
      document.removeEventListener("visibilitychange", surRetour);
      window.removeEventListener("focus", surRetour);
      stopTitleFlash(PROPRIETAIRE_TITRE);
    };
  }, []);

  // Un booléen, pas le nombre : la minuterie du rappel ne doit pas repartir
  // de zéro à chaque commande prise ou alertée.
  const aDesRelances = (data?.compteurs?.a_relancer ?? 0) > 0;
  const rappelMinutes = reglesDe(data).rappel_minutes;

  // Plus rien à relancer : inutile de faire clignoter le titre.
  useEffect(() => {
    if (!aDesRelances) stopTitleFlash(PROPRIETAIRE_TITRE);
  }, [aDesRelances]);

  /**
   * Rappel : tant qu'une commande attend sans que personne ne la prenne, le
   * son revient toutes les `rappel_minutes`. La clé est la tranche de temps
   * du serveur : tous les onglets tombent sur la même, un seul sonne.
   */
  useEffect(() => {
    if (sonCoupe || rappelMinutes <= 0 || !aDesRelances) return;
    const periode = rappelMinutes * 60_000;
    const id = window.setInterval(() => {
      if ((etat.current.data?.compteurs?.a_relancer ?? 0) === 0 || etat.current.sonCoupe) return;
      const maintenant = Date.now() + useRelanceUiStore.getState().ecartHorloge;
      void avecVerrou([`rappel-${Math.floor(maintenant / periode)}`], async () => {
        const joue = await jouerSon();
        clignoterSiInactive();
        return joue;
      });
    }, periode);
    return () => window.clearInterval(id);
  }, [sonCoupe, rappelMinutes, aDesRelances]);

  /**
   * Premier chargement avec des commandes à relancer : on tente le son. Un
   * refus (aucun geste depuis l'ouverture) fait apparaître « Activer le son ».
   * Mêmes clés que l'alerte : des commandes déjà sonnées ne sonnent pas deux
   * fois. Après un rechargement où tout a déjà sonné, rien ne se rejoue, mais
   * la page n'a reçu aucun geste : on vérifie quand même que la lecture est
   * permise, pour que « Activer le son » apparaisse avant la prochaine alerte.
   */
  const ouvertureFaite = useRef(false);
  useEffect(() => {
    if (ouvertureFaite.current || !data) return;
    ouvertureFaite.current = true;
    if (sonCoupe) return;
    const cles = data.groupes.filter((g) => g.etat === "A_RELANCER").map(cleAlerte);
    if (cles.length === 0) return;
    if (cles.every(dejaJouee)) {
      if (lectureBloquee()) useRelanceUiStore.getState().setSonBloque(true);
      return;
    }
    void avecVerrou(cles, jouerSon);
  }, [data, sonCoupe]);

  return { alerter };
}
