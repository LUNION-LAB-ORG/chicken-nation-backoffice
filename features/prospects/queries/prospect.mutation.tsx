import { useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { prospectAPI } from "../apis/prospect.api";
import { IAppelDTO, IAssignerDTO } from "../types/prospect.type";
import { CANAL_LABEL, STATUT_META } from "../utils/prospect-ui";
import { useInvalidateConversionQuery } from "./index.query";

export const useAssignerMutation = () => {
  const invalider = useInvalidateConversionQuery();
  return useMutation({
    mutationFn: (dto: IAssignerDTO) => prospectAPI.assigner(dto),
    onSuccess: (r, dto) => {
      invalider();
      toast.success(
        dto.agent_id
          ? `${r.count} prospect${r.count > 1 ? "s" : ""} assigné${r.count > 1 ? "s" : ""}`
          : `${r.count} prospect${r.count > 1 ? "s" : ""} sans agent`,
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useAppelMutation = () => {
  const invalider = useInvalidateConversionQuery();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: IAppelDTO }) => prospectAPI.appeler(id, dto),
    onSuccess: (r) => {
      invalider();
      toast.success(`Appel enregistré : ${STATUT_META[r.statut].label.toLowerCase()}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useCouponMutation = () => {
  const invalider = useInvalidateConversionQuery();
  return useMutation({
    mutationFn: ({ id, offreId }: { id: string; offreId?: string }) => prospectAPI.envoyerCoupon(id, offreId),
    onSuccess: (r) => {
      invalider();
      if (r.envoye) toast.success(`Coupon ${r.coupon.code} envoyé par ${CANAL_LABEL[r.canal]}`);
      else toast(`Coupon ${r.coupon.code} créé, mais aucun message n'est parti : dictez-le au client`, { icon: "⚠️", duration: 8000 });
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useRenvoyerCouponMutation = () => {
  const invalider = useInvalidateConversionQuery();
  return useMutation({
    mutationFn: (id: string) => prospectAPI.renvoyerCoupon(id),
    onSuccess: (r) => {
      invalider();
      if (r.envoye) toast.success(`Coupon renvoyé par ${CANAL_LABEL[r.canal]}`);
      else toast("Aucun message n'est parti : dictez le code au client", { icon: "⚠️", duration: 8000 });
    },
    onError: (e: Error) => toast.error(e.message),
  });
};
