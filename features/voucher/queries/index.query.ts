import { useQueryClient } from '@tanstack/react-query';

export const voucherKeyQuery = (...params: unknown[]) => {
    if (params.length === 0) {
        return ['voucher'];
    }
    return ['voucher', ...params];
};

export const useInvalidateVoucherQuery = () => {
    const queryClient = useQueryClient();

    return async (...params: unknown[]) => {
        await queryClient.invalidateQueries({
            queryKey: voucherKeyQuery(...params),
            exact: false
        });

        await queryClient.refetchQueries({
            queryKey: voucherKeyQuery(),
            type: 'active'
        });
    };
};
