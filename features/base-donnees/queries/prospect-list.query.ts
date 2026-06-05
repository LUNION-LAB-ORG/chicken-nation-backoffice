import { useQuery } from "@tanstack/react-query";
import React from "react";
import { toast } from "react-hot-toast";

import { getAllProspects } from "../services/prospect.service";
import { ProspectQuery } from "../types/prospect.types";
import { prospectKeyQuery } from "./index.query";

export const useProspectListQuery = (query?: ProspectQuery) => {
  const result = useQuery({
    queryKey: prospectKeyQuery("list", query),
    queryFn: () => getAllProspects(query),
    staleTime: 30 * 1000,
  });

  React.useEffect(() => {
    if (result.isError) {
      toast.error((result.error as Error)?.message);
    }
  }, [result.isError, result.error]);

  return result;
};
