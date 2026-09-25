import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { campagneAPI } from "../apis/campagne.api";
import { Public } from "../types/contact.type";
import { IApercuInput, ICampagneDTO, ICampagnesFiltres, ICloture, ILancement } from "../types/campagne.type";
import { accord, fmtNombre } from "../utils/crm-ui";
import { crmKeyQuery, useInvalidateCrmQuery } from "./index.query";

/**
 * Liste des campagnes ; sans filtre, toutes celles que l'utilisateur peut voir.
 * `actif` faux pour un compte de point de vente : le serveur lui refuse les
 * campagnes, la requête ne part pas.
 */
export const useCampagnesQuery = (filtres: ICampagnesFiltres = {}, actif = true) =>
  useQuery({
    queryKey: crmKeyQuery("campagnes", "liste", filtres),
    queryFn: () => campagneAPI.obtenirTous(filtres),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
    enabled: actif,
  });

/** Détail d'une campagne : l'écran reste ouvert même si un filtre de la liste l'écarte après un geste. */
export const useCampagneQuery = (id: string | null) =>
  useQuery({
    queryKey: crmKeyQuery("campagnes", "detail", id),
    queryFn: () => campagneAPI.obtenirParId(id!),
    enabled: !!id,
    staleTime: 30_000,
  });

export const useCampagneStatsQuery = (id: string | null) =>
  useQuery({
    queryKey: crmKeyQuery("campagnes", "stats", id),
    queryFn: () => campagneAPI.stats(id!),
    enabled: !!id,
    refetchInterval: 60_000,
  });

export const useComparatifQuery = (actif: boolean, segment?: Public) =>
  useQuery({
    queryKey: crmKeyQuery("campagnes", "comparatif", segment ?? "tous"),
    queryFn: () => campagneAPI.comparer(segment),
    enabled: actif,
    placeholderData: keepPreviousData,
  });

/** Estimation de la population : rien n'est écrit, aucun cache à invalider. */
export const useApercuMutation = () =>
  useMutation({
    mutationFn: (dto: IApercuInput) => campagneAPI.apercu(dto),
    onError: (e: Error) => toast.error(e.message),
  });

export const useEnregistrerCampagneMutation = () => {
  const invalider = useInvalidateCrmQuery();
  return useMutation({
    mutationFn: ({ id, dto }: { id?: string; dto: Partial<ICampagneDTO> }) =>
      id ? campagneAPI.modifier(id, dto) : campagneAPI.ajouter(dto as ICampagneDTO),
    onSuccess: (_, { id }) => {
      invalider("campagnes");
      toast.success(id ? "Campagne modifiée" : "Campagne créée : lancez-la quand l'équipe est prête");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export type Geste = "lancer" | "suspendre" | "reprendre" | "terminer";

export type ResultatGeste =
  | { geste: "lancer"; lancement: ILancement }
  | { geste: "terminer"; cloture: ICloture }
  | { geste: "suspendre" | "reprendre" };

function messageGeste(r: ResultatGeste): string {
  if (r.geste === "lancer") {
    const { cibles, repartis } = r.lancement;
    return `Campagne lancée : ${fmtNombre(cibles)} ${accord(cibles, "contact ciblé", "contacts ciblés")}, ${fmtNombre(repartis)} ${accord(
      repartis,
      "réparti",
    )}`;
  }
  if (r.geste === "terminer") return `Campagne terminée : ${r.cloture.message}`;
  return r.geste === "suspendre" ? "Campagne suspendue : les files sont en pause" : "Campagne reprise";
}

/**
 * Les gestes qui changent la vie d'une campagne touchent aussi les files des
 * agents : on invalide tout le module, pas seulement la liste des campagnes.
 * La réponse du lancement et de la clôture revient à l'écran, qui la détaille.
 */
export const useGesteCampagneMutation = () => {
  const invalider = useInvalidateCrmQuery();
  return useMutation({
    mutationFn: async ({ id, geste }: { id: string; geste: Geste }): Promise<ResultatGeste> => {
      if (geste === "lancer") return { geste, lancement: await campagneAPI.lancer(id) };
      if (geste === "terminer") return { geste, cloture: await campagneAPI.terminer(id) };
      await campagneAPI[geste](id);
      return { geste };
    },
    onSuccess: (r) => {
      invalider();
      toast.success(messageGeste(r));
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useEquipeMutation = () => {
  const invalider = useInvalidateCrmQuery();
  return useMutation({
    mutationFn: ({ id, agentIds, piloteId }: { id: string; agentIds: string[]; piloteId?: string }) =>
      campagneAPI.equipe(id, agentIds, piloteId),
    onSuccess: () => {
      invalider();
      toast.success("Équipe mise à jour");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useDistribuerMutation = () => {
  const invalider = useInvalidateCrmQuery();
  return useMutation({
    mutationFn: ({ id, inclureNonAppeles }: { id: string; inclureNonAppeles: boolean }) =>
      campagneAPI.distribuer(id, inclureNonAppeles),
    onSuccess: (r) => {
      invalider();
      toast.success(
        r.repartis
          ? `${fmtNombre(r.repartis)} ${accord(r.repartis, "contact réparti", "contacts répartis")}`
          : "Rien à répartir : tout le monde a son agent",
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });
};
