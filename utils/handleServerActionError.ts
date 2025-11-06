export function handleServerActionError(error: unknown, defaultMessage: string): { success: false; error: string } {
	if (error instanceof Error) {
		return {
			success: false,
			error: error.message
		};
	}

	if (typeof error === 'string') {
		return {
			success: false,
			error: error
		};
	}

	return {
		success: false,
		error: defaultMessage
	};
}