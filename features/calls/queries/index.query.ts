import { useQueryClient } from "@tanstack/react-query";

export const callsKeyQuery = (...params: unknown[]) => ["calls", ...params];

export const useInvalidateCallsQuery = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["calls"] });
};
