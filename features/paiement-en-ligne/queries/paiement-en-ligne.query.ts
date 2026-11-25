import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { paiementEnLigneAPI } from "../apis/paiement-en-ligne.api";
import type { ReglagesPaiementEnLigneDTO } from "../types/paiement-en-ligne.types";

export const paiementEnLigneKeys = {
  tout: ["paiement-en-ligne"] as const,
  configuration: () => [...paiementEnLigneKeys.tout, "configuration"] as const,
  sousComptes: () => [...paiementEnLigneKeys.tout, "sous-comptes"] as const,
};

export const useConfigurationPaiementQuery = () =>
  useQuery({
    queryKey: paiementEnLigneKeys.configuration(),
    queryFn: () => paiementEnLigneAPI.configuration(),
    staleTime: 15_000,
  });

/** Liste chez Paystack : seulement quand la clé est posée. */
export const useSousComptesPaystackQuery = (actif: boolean) =>
  useQuery({
    queryKey: paiementEnLigneKeys.sousComptes(),
    queryFn: () => paiementEnLigneAPI.sousComptes(),
    enabled: actif,
    staleTime: 60_000,
    retry: false,
  });

type ErreurApi = Error & { status?: number };

export const useReglagesPaiementMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: ReglagesPaiementEnLigneDTO) => paiementEnLigneAPI.reglages(dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: paiementEnLigneKeys.configuration() });
      toast.success("Réglage enregistré");
    },
    onError: (e: ErreurApi) => {
      toast.error(e.message || "Réglage non enregistré");
    },
  });
};

export const useRelierSousCompteMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ restaurantId, code }: { restaurantId: string; code: string | null; nom: string }) =>
      paiementEnLigneAPI.relier(restaurantId, code),
    onSuccess: (_r, { code, nom }) => {
      void queryClient.invalidateQueries({ queryKey: paiementEnLigneKeys.configuration() });
      toast.success(code ? `Sous-compte relié à ${nom}` : `Sous-compte retiré de ${nom}`);
    },
    onError: (e: ErreurApi) => {
      toast.error(e.message || "Sous-compte non relié");
    },
  });
};

/** Relit tout chez Paystack (bouton « Relire chez Paystack »). */
export const useRelireConfigurationPaiement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const c = await paiementEnLigneAPI.configuration(true);
      queryClient.setQueryData(paiementEnLigneKeys.configuration(), c);
      await queryClient.invalidateQueries({ queryKey: paiementEnLigneKeys.sousComptes() });
      return c;
    },
    onError: (e: ErreurApi) => {
      toast.error(e.message || "Paystack n'a pas répondu");
    },
  });
};
