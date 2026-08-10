import { useQuery } from "@tanstack/react-query";
import { getDishDetail } from "../services/dish-service";
import { Dish } from "../types/dish.types";
import { dishKeyQuery } from "./index.query";

/**
 * Détail d'un plat, donc ses groupes d'options.
 *
 * L'option de requête est exportée à part pour deux usages qui doivent partager
 * exactement la même clé de cache : le préchargement au survol d'une carte, et
 * l'hydratation des lignes déjà composées du panier. Sans clé commune, rouvrir
 * une ligne relancerait un appel réseau à chaque fois.
 *
 * La clé dérive de celle des plats : modifier la configuration d'un plat au
 * backoffice l'invalide donc automatiquement.
 */
export const dishOneQueryOption = (dishId?: string) => ({
  queryKey: dishKeyQuery("one", dishId),
  queryFn: () => getDishDetail(dishId as string),
  enabled: !!dishId,
  staleTime: 5 * 60 * 1000,
});

/**
 * Pas de message d'erreur global ici : la modale affiche l'échec à sa place,
 * avec un bouton pour réessayer. Un message flottant se répéterait à chaque
 * ouverture de plat et sortirait de son contexte.
 */
export const useDishOneQuery = (dishId?: string) =>
  useQuery<Dish>(dishOneQueryOption(dishId));
