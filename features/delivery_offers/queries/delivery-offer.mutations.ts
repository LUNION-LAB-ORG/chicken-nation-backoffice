import { useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  createDeliveryOffer,
  deleteDeliveryOffer,
  toggleDeliveryOffer,
  updateDeliveryOffer,
} from "../services/delivery-offer.service";
import {
  CreateDeliveryOfferDto,
  UpdateDeliveryOfferDto,
} from "../types/delivery-offer.types";
import { useInvalidateDeliveryOfferQuery } from "./index.query";

export const useCreateDeliveryOfferMutation = () => {
  const invalidate = useInvalidateDeliveryOfferQuery();
  return useMutation({
    mutationFn: (data: CreateDeliveryOfferDto) => createDeliveryOffer(data),
    onSuccess: () => {
      invalidate("list");
      invalidate("stats");
      toast.success("Offre de livraison créée");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useUpdateDeliveryOfferMutation = () => {
  const invalidate = useInvalidateDeliveryOfferQuery();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDeliveryOfferDto }) =>
      updateDeliveryOffer(id, data),
    onSuccess: () => {
      invalidate("list");
      invalidate("stats");
      toast.success("Offre de livraison mise à jour");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useDeleteDeliveryOfferMutation = () => {
  const invalidate = useInvalidateDeliveryOfferQuery();
  return useMutation({
    mutationFn: (id: string) => deleteDeliveryOffer(id),
    onSuccess: () => {
      invalidate("list");
      invalidate("stats");
      toast.success("Offre de livraison supprimée");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useToggleDeliveryOfferMutation = () => {
  const invalidate = useInvalidateDeliveryOfferQuery();
  return useMutation({
    mutationFn: (id: string) => toggleDeliveryOffer(id),
    onSuccess: () => {
      invalidate("list");
      invalidate("stats");
      toast.success("Statut de l'offre mis à jour");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};
