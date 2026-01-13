import { useQuery } from "@tanstack/react-query";
import React from "react";
import { toast } from "react-hot-toast";
import { loyaltyKeyQuery } from "./index.query";
import {
    getConfig,
    getCustomerLoyaltyInfo,
    getAvailablePointsBreakdown,
    getAllLoyaltyPoints,
    calculatePointsForOrder,
    calculateAmountForPoints,
} from "../services/loyalty.service";
import { LoyaltyPointQuery } from "../types/loyalty.types";

// Configuration
export const useConfigQuery = () => {
    return useQuery({
        queryKey: loyaltyKeyQuery("config"),
        queryFn: getConfig,
        staleTime: 30 * 60 * 1000, // 30 minutes
    });
};

// Informations de fidélité d'un client
export const customerLoyaltyInfoQueryOption = (customerId: string) => ({
    queryKey: loyaltyKeyQuery("customer-info", customerId),
    queryFn: () => getCustomerLoyaltyInfo(customerId),
    enabled: !!customerId,
    staleTime: 5 * 60 * 1000,
});

export const useCustomerLoyaltyInfoQuery = (customerId: string) => {
    const result = useQuery(customerLoyaltyInfoQueryOption(customerId));
    React.useEffect(() => {
        if (result.isError) {
            toast.error(result.error instanceof Error ? result.error.message : "Erreur de chargement");
        }
    }, [result.isError, result.error]);
    return result;
};

// Breakdown des points disponibles
export const availablePointsBreakdownQueryOption = (customerId: string) => ({
    queryKey: loyaltyKeyQuery("points-breakdown", customerId),
    queryFn: () => getAvailablePointsBreakdown(customerId),
    enabled: !!customerId,
    staleTime: 5 * 60 * 1000,
});

export const useAvailablePointsBreakdownQuery = (customerId: string) => {
    const result = useQuery(availablePointsBreakdownQueryOption(customerId));
    React.useEffect(() => {
        if (result.isError) {
            toast.error(result.error instanceof Error ? result.error.message : "Erreur de chargement");
        }
    }, [result.isError, result.error]);
    return result;
};

// Liste des points de fidélité
export const loyaltyPointsListQueryOption = (query?: LoyaltyPointQuery) => ({
    queryKey: loyaltyKeyQuery("points-list", query),
    queryFn: () => getAllLoyaltyPoints(query),
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000,
});

export const useLoyaltyPointsListQuery = (query?: LoyaltyPointQuery) => {
    const result = useQuery(loyaltyPointsListQueryOption(query));
    React.useEffect(() => {
        if (result.isError) {
            toast.error(result.error instanceof Error ? result.error.message : "Erreur de chargement");
        }
    }, [result.isError, result.error]);
    return result;
};

// Calculer les points pour un montant
export const useCalculatePointsQuery = (amount: number) => {
    return useQuery({
        queryKey: loyaltyKeyQuery("calculate-points", amount),
        queryFn: () => calculatePointsForOrder(amount),
        enabled: amount > 0,
        staleTime: 10 * 60 * 1000,
    });
};

// Calculer le montant pour des points
export const useCalculateAmountQuery = (points: number) => {
    return useQuery({
        queryKey: loyaltyKeyQuery("calculate-amount", points),
        queryFn: () => calculateAmountForPoints(points),
        enabled: points > 0,
        staleTime: 10 * 60 * 1000,
    });
};