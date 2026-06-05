import { useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

import {
  markProspectCall,
  sendProspectCoupon,
} from "../services/prospect.service";
import { CallResult } from "../types/prospect.types";
import { useInvalidateProspectQuery } from "./index.query";

export const useMarkCallMutation = () => {
  const invalidate = useInvalidateProspectQuery();
  return useMutation({
    mutationFn: (vars: { id: string; result: CallResult; note?: string }) =>
      markProspectCall(vars.id, { result: vars.result, note: vars.note }),
    onSuccess: async () => {
      await invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useSendCouponMutation = () => {
  const invalidate = useInvalidateProspectQuery();
  return useMutation({
    mutationFn: (id: string) => sendProspectCoupon(id),
    onSuccess: async (res) => {
      await invalidate();
      toast.success(`Coupon ${res.coupon.code} envoyé`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
};
