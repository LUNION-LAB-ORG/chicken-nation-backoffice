import { useQuery } from "@tanstack/react-query";
import { getDishesPourClient } from "../services/dish-service";
import { Dish } from "../types/dish.types";
import { dishKeyQuery } from "./index.query";

/**
 * Plats que le client choisi peut commander (masque d'audience du serveur).
 *
 * Pas de message d'erreur global : la recherche d'un plat retombe alors sur la
 * grille par catégorie, qui reste la référence.
 */
export const useDishListClientQuery = (customerId?: string) =>
  useQuery<Dish[]>({
    queryKey: dishKeyQuery("list", "client", customerId),
    queryFn: () => getDishesPourClient(customerId as string),
    enabled: !!customerId,
    staleTime: 5 * 60 * 1000,
  });
