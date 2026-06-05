import { useQuery } from "@tanstack/react-query";

import {
  getProspectCoupons,
  getProspectSales,
  getProspectStats,
} from "../services/prospect.service";
import { prospectKeyQuery } from "./index.query";

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

export const useProspectSalesQuery = (restaurantId?: string) =>
  useQuery({
    queryKey: prospectKeyQuery("sales", restaurantId ?? "all"),
    queryFn: () => getProspectSales(restaurantId),
    staleTime: 30 * 1000,
  });
