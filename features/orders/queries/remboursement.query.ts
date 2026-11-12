import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { remboursementAPI } from "../apis/remboursement.api";
import { useInvalidateOrderQuery } from "./index.query";

export const cleVerification = (paiementId: string) => ["remboursement", "verification", paiementId] as const;

/** Vérification chez KKiaPay, relue à chaque ouverture de la fenêtre : jamais un état ancien. */
export const useVerificationRemboursementQuery = (paiementId: string, actif: boolean) =>
  useQuery({
    queryKey: cleVerification(paiementId),
    queryFn: () => remboursementAPI.verifier(paiementId),
    enabled: actif,
    staleTime: 0,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
  });

/** Rembourser, ou enregistrer un remboursement déjà fait : la commande est relue partout ensuite. */
export const useRemboursementMutation = (paiementId: string) => {
  const queryClient = useQueryClient();
  const invalidateOrderQuery = useInvalidateOrderQuery();
  const relire = async () => {
    await Promise.all([
      invalidateOrderQuery(),
      queryClient.invalidateQueries({ queryKey: ["operations"] }),
      queryClient.invalidateQueries({ queryKey: ["courses"] }),
    ]);
  };
  return useMutation({
    mutationFn: ({ reference, constater }: { reference: string; constater?: boolean }) =>
      constater ? remboursementAPI.constater(paiementId, reference) : remboursementAPI.rembourser(paiementId, reference),
    onSuccess: async (resultat) => {
      toast.success(resultat.message);
      await relire();
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: cleVerification(paiementId) }),
  });
};
