import { useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { useInvalidateVoucherQuery } from "./index.query";
import {
    createVoucher,
    updateVoucher,
    cancelVoucher,
    removeVoucher,
    restoreVoucher,
} from "../services/voucher.service";
import { CreateVoucherDto, UpdateVoucherDto } from "../types/voucher.types";

// Créer un bon
export const useCreateVoucherMutation = () => {
    const invalidate = useInvalidateVoucherQuery();

    return useMutation({
        mutationFn: (data: CreateVoucherDto) => createVoucher(data),
        onSuccess: () => {
            invalidate("list");
            toast.success("Bon créé avec succès");
        },
        onError: (e: Error) => toast.error(e.message),
    });
};

// Mettre à jour un bon
export const useUpdateVoucherMutation = () => {
    const invalidate = useInvalidateVoucherQuery();

    return useMutation({
        mutationFn: ({ code, data }: { code: string; data: UpdateVoucherDto }) =>
            updateVoucher(code, data),
        onSuccess: (_, variables) => {
            invalidate("list");
            invalidate("detail", variables.code);
            toast.success("Bon mis à jour avec succès");
        },
        onError: (e: Error) => toast.error(e.message),
    });
};

// Annuler un bon
export const useCancelVoucherMutation = () => {
    const invalidate = useInvalidateVoucherQuery();

    return useMutation({
        mutationFn: (code: string) => cancelVoucher(code),
        onSuccess: (_, code) => {
            invalidate("list");
            invalidate("detail", code);
            toast.success("Bon annulé avec succès");
        },
        onError: (e: Error) => toast.error(e.message),
    });
};

// Supprimer un bon (soft delete)
export const useDeleteVoucherMutation = () => {
    const invalidate = useInvalidateVoucherQuery();

    return useMutation({
        mutationFn: (code: string) => removeVoucher(code),
        onSuccess: () => {
            invalidate("list");
            toast.success("Bon supprimé avec succès");
        },
        onError: (e: Error) => toast.error(e.message),
    });
};

// Restaurer un bon
export const useRestoreVoucherMutation = () => {
    const invalidate = useInvalidateVoucherQuery();

    return useMutation({
        mutationFn: (code: string) => restoreVoucher(code),
        onSuccess: (_, code) => {
            invalidate("list");
            invalidate("detail", code);
            toast.success("Bon restauré avec succès");
        },
        onError: (e: Error) => toast.error(e.message),
    });
};
