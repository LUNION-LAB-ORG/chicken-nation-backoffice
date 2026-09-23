import { useQuery } from "@tanstack/react-query";

import {
  getProspectCoupons,
  getProspectSales,
  getProspectStats,
} from "../services/prospect.service";
import { prospectKeyQuery } from "./index.query";
import { SalesFiltres } from "../types/prospect.types";

export const useProspectStatsQuery = (restaurantId?: string) =>
  useQuery({
    queryKey: prospectKeyQuery("stats", restaurantId ?? "all"),
    queryFn: () => getProspectStats(restaurantId),
    staleTime: 30 * 1000,
  });

export const useProspectCouponsQuery = (restaurantId?: string) =>
  useQuery({
    queryKey: prospectKeyQuery("coupons", restaurantId ?? "all"),
    queryFn: () => getProspectCoupons(restaurantId),
    staleTime: 30 * 1000,
  });

export const useProspectSalesQuery = (filtres: SalesFiltres = {}) =>
  useQuery({
    // Chaque filtre entre dans la clé : sans cela, changer de période
    // réafficherait le résultat précédent jusqu'au rafraîchissement.
    queryKey: prospectKeyQuery(
      "sales",
      filtres.restaurantId ?? "all",
      filtres.platform ?? "all",
      filtres.startDate ?? "",
      filtres.endDate ?? "",
    ),
    queryFn: () => getProspectSales(filtres),
    staleTime: 30 * 1000,
  });
