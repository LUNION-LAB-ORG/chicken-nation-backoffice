import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  copyDishOptionConfiguration,
  getDishOptionConfiguration,
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
