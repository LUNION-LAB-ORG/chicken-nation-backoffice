import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { callsApi } from "../apis/calls.api";
import { callsKeyQuery, useInvalidateCallsQuery } from "./index.query";
import type { ICallsConfig } from "../types/call.type";

export const useCallsConfigQuery = () =>
  useQuery({
    queryKey: callsKeyQuery("config"),
    queryFn: () => callsApi.getConfig(),
    staleTime: 5 * 60 * 1000,
  });

export const useUpdateCallsConfigMutation = () => {
  const invalidate = useInvalidateCallsQuery();
  return useMutation({
    mutationFn: (data: ICallsConfig) => callsApi.updateConfig(data),
    onSuccess: () => {
      invalidate();
      toast.success("Configuration des appels enregistrée");
    },
    onError: (error: unknown) =>
      toast.error(error instanceof Error ? error.message : "Erreur d'enregistrement"),
  });
};
