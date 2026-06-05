import { useQueryClient } from "@tanstack/react-query";

// Clé de cache
export const prospectKeyQuery = (...params: unknown[]) => {
  if (params.length === 0) {
    return ["prospect"];
  }
  return ["prospect", ...params];
};

// Hook d'invalidation
export const useInvalidateProspectQuery = () => {
  const queryClient = useQueryClient();

  return async (...params: unknown[]) => {
    await queryClient.invalidateQueries({
      queryKey: prospectKeyQuery(...params),
      exact: false,
    });

    await queryClient.refetchQueries({
      queryKey: prospectKeyQuery(),
      type: "active",
    });
  };
};
