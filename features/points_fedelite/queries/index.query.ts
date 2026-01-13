import { useQueryClient } from '@tanstack/react-query';

export const loyaltyKeyQuery = (...params: unknown[]) => {
    if (params.length === 0) {
        return ['loyalty'];
    }
    return ['loyalty', ...params];
};

export const useInvalidateLoyaltyQuery = () => {
    const queryClient = useQueryClient();

    return async (...params: unknown[]) => {
        await queryClient.invalidateQueries({
            queryKey: loyaltyKeyQuery(...params),
            exact: false
        });

        await queryClient.refetchQueries({
            queryKey: loyaltyKeyQuery(),
            type: 'active'
        });
    };
};