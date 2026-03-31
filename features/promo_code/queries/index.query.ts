import { useQueryClient } from '@tanstack/react-query';

export const promoCodeKeyQuery = (...params: unknown[]) => {
  if (params.length === 0) {
    return ['promo-code'];
  }
  return ['promo-code', ...params];
};

export const useInvalidatePromoCodeQuery = () => {
  const queryClient = useQueryClient();

  return async (...params: unknown[]) => {
    await queryClient.invalidateQueries({
      queryKey: promoCodeKeyQuery(...params),
      exact: false,
    });

    await queryClient.refetchQueries({
      queryKey: promoCodeKeyQuery(),
      type: 'active',
    });
  };
};
