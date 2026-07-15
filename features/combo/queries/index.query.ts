import { useQueryClient } from "@tanstack/react-query";

export const comboKeyQuery = (...params: unknown[]) => {
  if (params.length === 0) {
    return ["combo"];
  }
  return ["combo", ...params];
};

export const useInvalidateComboQuery = () => {
  const queryClient = useQueryClient();

  return async (...params: unknown[]) => {
    await queryClient.invalidateQueries({
      queryKey: comboKeyQuery(...params),
      exact: false,
    });

    await queryClient.refetchQueries({
      queryKey: comboKeyQuery(),
      type: "active",
    });
  };
};
