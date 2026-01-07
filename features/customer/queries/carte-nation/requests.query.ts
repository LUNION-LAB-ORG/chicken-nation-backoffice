import { useQuery } from "@tanstack/react-query";
import React from "react";
import { toast } from "react-hot-toast";
import { cardNationKeyQuery } from "./index.query";
import { getAllRequests, getRequestById } from "../../services/carte-nation.service";
import { CardRequestQuery } from "../../types/carte-nation.types";

// Options pour la liste des demandes
export const requestListQueryOption = (query?: CardRequestQuery) => ({
    queryKey: cardNationKeyQuery("requests-list", query),
    queryFn: () => getAllRequests(query),
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000,
});

export const useRequestListQuery = (query?: CardRequestQuery) => {
    const result = useQuery(requestListQueryOption(query));
    React.useEffect(() => {
        if (result.isError) toast.error(result.error instanceof Error ? result.error.message : "Erreur de chargement");
    }, [result.isError, result.error]);
    return result;
};

// Options pour le détail d'une demande
export const requestDetailQueryOption = (id: string) => ({
    queryKey: cardNationKeyQuery("request-detail", id),
    queryFn: () => getRequestById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
});

export const useRequestDetailQuery = (id: string) => {
    const result = useQuery(requestDetailQueryOption(id));
    React.useEffect(() => {
        if (result.isError) toast.error(result.error instanceof Error ? result.error.message : "Erreur de chargement");
    }, [result.isError, result.error]);
    return result;
};