import { useQueryClient } from '@tanstack/react-query';

export const cardNationKeyQuery = (...params: unknown[]) => {
	if (params.length === 0) {
		return ['card-nation'];
	}
	return ['card-nation', ...params];
};

export const useInvalidateCardNationQuery = () => {
	const queryClient = useQueryClient();

	return async (...params: unknown[]) => {
		await queryClient.invalidateQueries({
			queryKey: cardNationKeyQuery(...params),
			exact: false
		});

		await queryClient.refetchQueries({
			queryKey: cardNationKeyQuery(),
			type: 'active'
		});
	};
};