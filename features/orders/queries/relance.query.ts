import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useAuthStore } from "../../users/hook/authStore";
import { relanceAPI } from "../apis/relance.api";
import { peutVoirLesBrouillons } from "../utils/brouillons";
import { orderKeyQuery } from "./index.query";

/**
 * Sous la racine « order » : les relectures déjà branchées sur `order:*`
 * (useOrdersSocketSync, useOperationsSocketSync) rafraîchissent aussi la
 * relance quand un panier est créé, payé, annulé ou repris, sans écouteur de
 * plus. `relance:changed` ne couvre que ce qu'aucune commande ne signale :
 * gestes d'agent, passage du délai, reprise au téléphone.
 */
export const relancesKey = (...params: unknown[]) => orderKeyQuery("relances", ...params);

/** Une seule lecture « tous restaurants » : l'onglet filtre lui-même par restaurant. */
export const RELANCES_CLE = relancesKey("tous");
export const RELANCES_IGNOREES_CLE = relancesKey("ignorees");

/** Le compte connecté voit-il les paniers non payés ? Sinon, aucune requête ne part. */
export const usePeutVoirLesBrouillons = () => peutVoirLesBrouillons(useAuthStore((s) => s.user));

/**
 * Liste des relances.
 *
 * `pilote` : seul le guetteur global (useRelancesWatcher) relit à intervalle
 * et au retour sur la fenêtre. Les lecteurs (compteur, badge, onglet)
 * partagent le même cache sans minuterie à eux : chaque abonné à intervalle
 * relirait la liste pour son compte.
 */
export const useRelancesQuery = (options: { pilote?: boolean } = {}) => {
  const habilite = usePeutVoirLesBrouillons();
  return useQuery({
    queryKey: RELANCES_CLE,
    queryFn: () => relanceAPI.lister(),
    enabled: habilite,
    staleTime: 5_000,
    refetchInterval: options.pilote ? 60_000 : false,
    refetchOnWindowFocus: !!options.pilote,
    refetchOnMount: !!options.pilote,
  });
};

/** Ignorées depuis 24 h, lues seulement quand la vue est ouverte. */
export const useRelancesIgnoreesQuery = (ouverte: boolean) => {
  const habilite = usePeutVoirLesBrouillons();
  return useQuery({
    queryKey: RELANCES_IGNOREES_CLE,
    queryFn: () => relanceAPI.listerIgnorees(),
    enabled: habilite && ouverte,
    staleTime: 5_000,
  });
};

/** Relit la liste et les ignorées (fonction stable : le temps réel s'y abonne). */
export const useInvalidateRelances = () => {
  const queryClient = useQueryClient();
  return useCallback(
    () => queryClient.invalidateQueries({ queryKey: relancesKey(), exact: false }),
    [queryClient],
  );
};

/**
 * Nombre de groupes à relancer, pour les pastilles. Zéro pour un rôle non
 * habilité : une requête désactivée rend encore ses dernières données, celles
 * d'un compte précédent dans le même onglet.
 */
export const useNombreARelancer = (): number => {
  const habilite = usePeutVoirLesBrouillons();
  const { data } = useRelancesQuery();
  return habilite ? (data?.compteurs?.a_relancer ?? 0) : 0;
};
