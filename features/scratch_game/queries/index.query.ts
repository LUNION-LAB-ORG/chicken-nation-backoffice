import { useQueryClient } from "@tanstack/react-query";

export const scratchKeyQuery = (...params: unknown[]) => {
  if (params.length === 0) {
    return ["scratch"];
  }
  return ["scratch", ...params];
};

export const useInvalidateScratchQuery = () => {
  const queryClient = useQueryClient();

  return async (...params: unknown[]) => {
    await queryClient.invalidateQueries({
      queryKey: scratchKeyQuery(...params),
      exact: false,
    });

    await queryClient.refetchQueries({
      queryKey: scratchKeyQuery(),
      type: "active",
    });
  };
};
