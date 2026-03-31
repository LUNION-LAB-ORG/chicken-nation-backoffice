import { useQuery } from "@tanstack/react-query";
import React from "react";
import { toast } from "react-hot-toast";
import { voucherKeyQuery } from "./index.query";
import {
    getAllVouchers,
    getVoucherByCode,
    getVoucherRedemptions,
} from "../services/voucher.service";
import { VoucherQuery } from "../types/voucher.types";

// Liste des bons de réduction
export const voucherListQueryOption = (query?: VoucherQuery) => ({
    queryKey: voucherKeyQuery("list", query),
    queryFn: () => getAllVouchers(query),
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000,
});

export const useVoucherListQuery = (query?: VoucherQuery) => {
    const result = useQuery(voucherListQueryOption(query));
    React.useEffect(() => {
        if (result.isError) {
            toast.error(result.error instanceof Error ? result.error.message : "Erreur de chargement");
        }
    }, [result.isError, result.error]);
    return result;
};

// Détail d'un bon par code
export const voucherDetailQueryOption = (code: string) => ({
    queryKey: voucherKeyQuery("detail", code),
    queryFn: () => getVoucherByCode(code),
    enabled: !!code,
    staleTime: 5 * 60 * 1000,
});

export const useVoucherDetailQuery = (code: string) => {
    const result = useQuery(voucherDetailQueryOption(code));
    React.useEffect(() => {
        if (result.isError) {
            toast.error(result.error instanceof Error ? result.error.message : "Erreur de chargement");
        }
    }, [result.isError, result.error]);
    return result;
};

// Historique des utilisations
export const voucherRedemptionsQueryOption = (code: string) => ({
    queryKey: voucherKeyQuery("redemptions", code),
    queryFn: () => getVoucherRedemptions(code),
    enabled: !!code,
    staleTime: 5 * 60 * 1000,
});

export const useVoucherRedemptionsQuery = (code: string) => {
    const result = useQuery(voucherRedemptionsQueryOption(code));
    React.useEffect(() => {
        if (result.isError) {
            toast.error(result.error instanceof Error ? result.error.message : "Erreur de chargement");
        }
    }, [result.isError, result.error]);
    return result;
};
