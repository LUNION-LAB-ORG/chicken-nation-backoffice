import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  copyDishOptionConfiguration,
  getDishGiftUsages,
  getDishOptionConfiguration,
  repointGiftReward,
  revokeGiftReward,
  saveDishOptionConfiguration,
} from "../services/dish-option-service";
import {
  DishOptionConfiguration,
  DishOptionGroupPayload,
} from "../types/dish-option.types";
import { dishKeyQuery } from "./index.query";

/**
 * MENUS COMPOSABLES — accès à la configuration d'un plat.
 *
 * La clé de cache dérive de celle des plats : enregistrer une configuration
 * change aussi le plat lui-même, qui devient composable ou cesse de l'être.
 */

export const dishOptionKeyQuery = (dishId?: string) =>
  dishId ? dishKeyQuery("options", dishId) : dishKeyQuery("options");

export const useDishOptionConfigurationQuery = (dishId?: string) => {
  const result = useQuery<DishOptionConfiguration>({
    queryKey: dishOptionKeyQuery(dishId),
    queryFn: () => getDishOptionConfiguration(dishId as string),
    // Sans identifiant, il n'y a rien à charger : c'est le cas d'un plat en
    // cours de création, dont la configuration se garde en mémoire jusqu'à
    // l'enregistrement.
    enabled: !!dishId,
    staleTime: 60 * 1000,
  });

  return result;
};

export const useSaveDishOptionConfigurationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      dishId,
      groups,
    }: {
      dishId: string;
      groups: DishOptionGroupPayload[];
    }) => saveDishOptionConfiguration(dishId, groups),
    onSuccess: async (data) => {
      queryClient.setQueryData(dishOptionKeyQuery(data.dish_id), data);
      // La liste des plats affiche le marqueur composable : la rafraîchir.
      await queryClient.invalidateQueries({
        queryKey: dishKeyQuery(),
        exact: false,
      });
      toast.success(
        data.groups.length > 0
          ? "Configuration enregistrée"
          : "Le plat n'a plus d'options",
      );
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useCopyDishOptionConfigurationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sourceDishId,
      cibleDishId,
    }: {
      sourceDishId: string;
      cibleDishId: string;
    }) => copyDishOptionConfiguration(sourceDishId, cibleDishId),
    onSuccess: async (data) => {
      queryClient.setQueryData(dishOptionKeyQuery(data.dish_id), data);
      await queryClient.invalidateQueries({
        queryKey: dishKeyQuery(),
        exact: false,
      });
      toast.success("Configuration copiée");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};



/** Fait pointer un cadeau déjà distribué sur un autre plat. */
export const useRepointGiftRewardMutation = () =>
  useMutation({
    mutationFn: ({ rewardId, dishId }: { rewardId: string; dishId: string }) =>
      repointGiftReward(rewardId, dishId),
    onSuccess: () => {
      toast.success("Cadeau repointé");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

/** Annule un cadeau déjà distribué. */
export const useRevokeGiftRewardMutation = () =>
  useMutation({
    mutationFn: ({ rewardId, motif }: { rewardId: string; motif?: string }) =>
      revokeGiftReward(rewardId, motif),
    onSuccess: () => {
      toast.success("Cadeau annulé");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

/**
 * Ce qui empêche un plat de devenir composable.
 *
 * Interrogé dès que le gestionnaire DÉSIGNE un plat cible, avant toute
 * tentative : il vaut mieux prévenir que refuser. La clé porte le suffixe
 * `usages-cadeau` pour ne pas écraser la configuration du plat en cache.
 */
export const useDishGiftUsagesQuery = (dishId?: string) =>
  useQuery({
    queryKey: [...dishOptionKeyQuery(dishId ?? ""), "usages-cadeau"],
    queryFn: () => getDishGiftUsages(dishId as string),
    enabled: Boolean(dishId),
    staleTime: 0,
  });
