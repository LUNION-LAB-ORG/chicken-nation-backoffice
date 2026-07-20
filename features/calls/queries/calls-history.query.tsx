import { useQuery } from "@tanstack/react-query";
import { callsApi } from "../apis/calls.api";
import { callsKeyQuery } from "./index.query";

export const useCallHistoryQuery = (limit = 30) =>
  useQuery({
    queryKey: callsKeyQuery("history", limit),
    queryFn: () => callsApi.history(limit),
    staleTime: 30 * 1000,
  });
