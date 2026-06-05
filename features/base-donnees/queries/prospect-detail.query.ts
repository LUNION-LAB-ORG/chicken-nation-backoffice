import { useQuery } from "@tanstack/react-query";

import { getProspectDetail } from "../services/prospect.service";
import { prospectKeyQuery } from "./index.query";

export const useProspectDetailQuery = (id: string | null | undefined) =>
  useQuery({
    queryKey: prospectKeyQuery("detail", id),
    queryFn: () => getProspectDetail(id as string),
    enabled: Boolean(id),
    staleTime: 10 * 1000,
  });
