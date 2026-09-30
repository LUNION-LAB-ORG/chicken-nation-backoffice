import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { contactAPI } from "../apis/contact.api";
import { IContactFiltres } from "../types/contact.type";
import { crmKeyQuery } from "./index.query";

export const useContactsQuery = (filtres: IContactFiltres, actif = true) =>
  useQuery({
    queryKey: crmKeyQuery("contacts", filtres),
    queryFn: () => contactAPI.obtenirTous(filtres),
    placeholderData: keepPreviousData,
    staleTime: 20_000,
    enabled: actif,
  });

export const useContactFicheQuery = (id: string | null, telephone?: string) =>
  useQuery({
    queryKey: crmKeyQuery("fiche", id, telephone ?? null),
    queryFn: () => contactAPI.obtenirParId(id!, telephone),
    enabled: !!id,
  });

/**
 * Client qui appelle : recherche par numéro complet. `valide` : saisie jugée
 * complète (10 chiffres, ou Entrée pour un numéro étranger plus court).
 */
export const useRechercheNumeroQuery = (telephone: string, valide: boolean) => {
  const chiffres = telephone.replace(/\D/g, "");
  return useQuery({
    queryKey: crmKeyQuery("recherche", chiffres),
    queryFn: () => contactAPI.rechercher(chiffres),
    enabled: valide && chiffres.length >= 8,
    staleTime: 10_000,
  });
};

export const useMaFileQuery = (actif = true) =>
  useQuery({
    queryKey: crmKeyQuery("ma-file"),
    queryFn: () => contactAPI.maFile(),
    staleTime: 15_000,
    refetchInterval: 60_000,
    enabled: actif,
  });

/** `actif` à faux pour un profil sans droit CRM : la route lui répondrait 403. */
export const useAgentsQuery = (actif = true) =>
  useQuery({
    queryKey: crmKeyQuery("agents"),
    queryFn: () => contactAPI.agents(),
    staleTime: 60_000,
    enabled: actif,
  });

export const useExportsQuery = (page: number, actif: boolean) =>
  useQuery({
    queryKey: crmKeyQuery("exports", page),
    queryFn: () => contactAPI.exports(page),
    enabled: actif,
  });

/**
 * Décompte par public. Le public et l'état de compte sont retirés de la clé :
 * la réponse ne dépend pas d'eux (le serveur les ignore), donc changer de
 * public ne doit pas relancer la requête ni faire clignoter la bande.
 */
export const useRepartitionQuery = (filtres: IContactFiltres) => {
  const { segment: _s, compte: _c, page: _p, limit: _l, ...reste } = filtres;
  return useQuery({
    queryKey: crmKeyQuery("repartition", reste),
    queryFn: () => contactAPI.repartition(reste as IContactFiltres),
    staleTime: 30_000,
  });
};
