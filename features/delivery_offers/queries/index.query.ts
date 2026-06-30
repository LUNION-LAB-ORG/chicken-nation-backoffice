import { useQueryClient } from "@tanstack/react-query";

export const deliveryOfferKeyQuery = (...params: unknown[]) => {
  if (params.length === 0) return ["delivery-offers"];
  return ["delivery-offers", ...params];
};

export const useInvalidateDeliveryOfferQuery = () => {
  const queryClient = useQueryClient();
  return async (...params: unknown[]) => {
    await queryClient.invalidateQueries({
      queryKey: deliveryOfferKeyQuery(...params),
      exact: false,
    });
    await queryClient.refetchQueries({
      queryKey: deliveryOfferKeyQuery(),
      type: "active",
    });
  };
};
