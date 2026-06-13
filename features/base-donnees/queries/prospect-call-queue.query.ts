import { useQuery } from "@tanstack/react-query";

import { getCallQueue } from "../services/prospect.service";
import { prospectKeyQuery } from "./index.query";

export const useCallQueueQuery = (
  restaurantId?: string,
  startDate?: string,
  endDate?: string,
) =>
  useQuery({
    queryKey: prospectKeyQuery(
      "call-queue",
      restaurantId ?? "all",
      startDate ?? "",
      endDate ?? "",
    ),
    queryFn: () => getCallQueue(restaurantId, startDate, endDate),
    refetchInterval: 30 * 1000,
    refetchIntervalInBackground: false,
    staleTime: 10 * 1000,
  });
