import { useQuery } from "@tanstack/react-query";
import React from "react";
import { toast } from "react-hot-toast";
import {
  getDeliveryOffers,
  getDeliveryOfferStats,
} from "../services/delivery-offer.service";
import { DeliveryOfferQuery } from "../types/delivery-offer.types";
import { deliveryOfferKeyQuery } from "./index.query";

export const useDeliveryOffersQuery = (query?: DeliveryOfferQuery) => {
  const result = useQuery({
    queryKey: deliveryOfferKeyQuery("list", query),
    queryFn: () => getDeliveryOffers(query),
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000,
  });

  React.useEffect(() => {
    if (result.isError) {
      toast.error(
        result.error instanceof Error
          ? result.error.message
          : "Erreur de chargement",
      );
    }
  }, [result.isError, result.error]);

  return result;
};

export const useDeliveryOfferStatsQuery = () => {
  return useQuery({
    queryKey: deliveryOfferKeyQuery("stats"),
    queryFn: getDeliveryOfferStats,
    staleTime: 5 * 60 * 1000,
  });
};
