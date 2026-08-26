'use client';

import { useCallback, useEffect, useRef } from 'react';

/**
 * Défilement infini : charge la page suivante quand le bas de la liste entre
 * dans le champ de vision.
 *
 * ⚠️ Trois pièges, tous rencontrés en revue, et tous fermés ici.
 *
 * 1. L'OBSERVATEUR N'EST CRÉÉ QU'UNE FOIS. La version naïve met
 *    `hasNextPage && !isFetching` dans les dépendances de l'effet : à chaque
 *    page reçue l'effet se rejoue, un nouvel observateur est construit, et
 *    `observe()` rappelle IMMÉDIATEMENT sa fonction sur une cible déjà visible.
 *    Résultat, une cascade qui télécharge la table entière d'un trait, surtout
 *    sur un onglet peu peuplé où la sentinelle ne quitte jamais l'écran. Ici,
 *    l'état vit dans une référence, l'observateur ne bouge pas.
 *
 * 2. LA RACINE EST LE CONTENEUR, PAS LA FENÊTRE. Les deux listes défilent dans
 *    un bloc `overflow-y-auto`. Sans `root`, la marge de préchargement est
 *    inopérante : le rectangle de la cible est d'abord découpé par les
 *    conteneurs à débordement, et seulement ensuite comparé à la fenêtre.
 *
 * 3. ON NE CHARGE PAS PENDANT UN RAFRAÎCHISSEMENT. `enCours` couvre aussi le
 *    refetch déclenché par le socket, sinon la liste et le temps réel se
 *    renvoient la balle et plus rien n'avance.
 */
export function useSentinelleDefilement({
  encore,
  enCours,
  charger,
}: {
  /** Reste-t-il une page à charger ? */
  encore: boolean;
  /** Un chargement est-il déjà en vol, page suivante ou rafraîchissement ? */
  enCours: boolean;
  /** Demande la page suivante. */
  charger: () => void;
}) {
  const conteneurRef = useRef<HTMLDivElement | null>(null);
  const sentinelleRef = useRef<HTMLDivElement | null>(null);

  // L'état le plus frais, lu par l'observateur sans le reconstruire.
  const etat = useRef({ encore, enCours, charger });
  etat.current = { encore, enCours, charger };

  useEffect(() => {
    const cible = sentinelleRef.current;
    if (!cible || typeof IntersectionObserver === 'undefined') return;

    const observateur = new IntersectionObserver(
      (entrees) => {
        if (!entrees.some((e) => e.isIntersecting)) return;
        const { encore: reste, enCours: occupe, charger: demander } = etat.current;
        if (reste && !occupe) demander();
      },
      { root: conteneurRef.current ?? null, rootMargin: '300px' },
    );

    observateur.observe(cible);
    return () => observateur.disconnect();
    // Volontairement vide : voir le piège 1 ci-dessus.
  }, []);

  /**
   * Repasse quand un chargement se termine : si la sentinelle est TOUJOURS
   * visible (liste courte, écran haut), l'observateur ne réémettra rien, il
   * n'émet que sur changement d'intersection. Une seule page de plus, jamais
   * en rafale, puisque la condition est réévaluée à chaque fois.
   */
  const relancerSiVisible = useCallback(() => {
    const cible = sentinelleRef.current;
    const racine = conteneurRef.current;
    if (!cible || !racine) return;
    const c = cible.getBoundingClientRect();
    const r = racine.getBoundingClientRect();
    const visible = c.top <= r.bottom && c.bottom >= r.top;
    const { encore: reste, enCours: occupe, charger: demander } = etat.current;
    if (visible && reste && !occupe) demander();
  }, []);

  useEffect(() => {
    if (!enCours) relancerSiVisible();
  }, [enCours, relancerSiVisible]);

  return { conteneurRef, sentinelleRef };
}
