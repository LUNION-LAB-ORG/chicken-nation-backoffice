import { useQuery } from "@tanstack/react-query";

import { getCallQueue } from "../services/prospect.service";
import { prospectKeyQuery } from "./index.query";

export const useCallQueueQuery = (restaurantId?: string) =>
  useQuery({
    queryKey: prospectKeyQuery("call-queue", restaurantId ?? "all"),
    queryFn: () => getCallQueue(restaurantId),
    refetchInterval: 30 * 1000,
    refetchIntervalInBackground: false,
    staleTime: 10 * 1000,
  });
