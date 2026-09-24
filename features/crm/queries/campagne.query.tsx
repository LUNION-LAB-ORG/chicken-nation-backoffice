import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { campagneAPI } from "../apis/campagne.api";
import { ICampagneDTO } from "../types/campagne.type";
import { crmKeyQuery, useInvalidateCrmQuery } from "./index.query";

export const useCampagnesQuery = () =>
  useQuery({ queryKey: crmKeyQuery("campagnes"), queryFn: () => campagneAPI.obtenirTous(), staleTime: 30_000 });

export const useCampagneStatsQuery = (id: string | null) =>
  useQuery({
    queryKey: crmKeyQuery("campagnes", "stats", id),
    queryFn: () => campagneAPI.stats(id!),
    enabled: !!id,
    refetchInterval: 60_000,
  });

export const useComparatifQuery = (actif: boolean) =>
  useQuery({ queryKey: crmKeyQuery("campagnes", "comparatif"), queryFn: campagneAPI.comparer, enabled: actif });

export const useEnregistrerCampagneMutation = () => {
  const invalider = useInvalidateCrmQuery();
  return useMutation({
    mutationFn: ({ id, dto }: { id?: string; dto: ICampagneDTO }) =>
      id ? campagneAPI.modifier(id, dto) : campagneAPI.ajouter(dto),
    onSuccess: (_, { id }) => {
      invalider("campagnes");
      toast.success(id ? "Campagne modifiée" : "Campagne créée : lancez-la quand l'équipe est prête");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

type Geste = "lancer" | "suspendre" | "reprendre" | "terminer";

/**
 * Les gestes qui changent la vie d'une campagne touchent aussi les files des
 * agents : on invalide tout le module, pas seulement la liste des campagnes.
 */
export const useGesteCampagneMutation = () => {
  const invalider = useInvalidateCrmQuery();
  return useMutation({
    mutationFn: async ({ id, geste }: { id: string; geste: Geste }) => {
      if (geste === "lancer") {
        const r = await campagneAPI.lancer(id);
        return `Campagne lancée : ${r.cibles} contacts, ${r.repartis} répartis`;
      }
      if (geste === "terminer") {
        const r = await campagneAPI.terminer(id);
        return `Campagne terminée : ${r.liberes} contacts libérés, rapport figé`;
      }
      await campagneAPI[geste](id);
      return geste === "suspendre" ? "Campagne suspendue : les files sont en pause" : "Campagne reprise";
    },
    onSuccess: (message) => {
      invalider();
      toast.success(message);
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
      toast.success(r.repartis ? `${r.repartis} contacts répartis` : "Rien à répartir : tout le monde a son agent");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};
