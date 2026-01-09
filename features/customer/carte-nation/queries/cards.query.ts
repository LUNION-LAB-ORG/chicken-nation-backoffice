import { useQuery } from "@tanstack/react-query";
import React from "react";
import { toast } from "react-hot-toast";
import { cardNationKeyQuery } from "./index.query";
import { getAllCards, getCardStats } from "../services/carte-nation.service";
import { NationCardQuery } from "../types/carte-nation.types";

export const cardListQueryOption = (query?: NationCardQuery) => ({
    queryKey: cardNationKeyQuery("cards-list", query),
    queryFn: () => getAllCards(query),
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000,
});

export const useCardListQuery = (query?: NationCardQuery) => {
    const result = useQuery(cardListQueryOption(query));
    React.useEffect(() => {
        if (result.isError) toast.error(result.error instanceof Error ? result.error.message : "Erreur");
    }, [result.isError, result.error]);
    return result;
};

export const useCardStatsQuery = () => {
    return useQuery({
        queryKey: cardNationKeyQuery("stats"),
        queryFn: getCardStats,
        staleTime: 10 * 60 * 1000,
    });
};