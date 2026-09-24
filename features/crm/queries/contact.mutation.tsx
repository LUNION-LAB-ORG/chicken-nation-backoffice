import { useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { contactAPI } from "../apis/contact.api";
import { IAppelDTO, IAssignerDTO } from "../types/contact.type";
import { CANAL_LABEL, STATUT_META } from "../utils/crm-ui";
import { useInvalidateCrmQuery } from "./index.query";

export const useAssignerMutation = () => {
  const invalider = useInvalidateCrmQuery();
  return useMutation({
    mutationFn: (dto: IAssignerDTO) => contactAPI.assigner(dto),
    onSuccess: (r, dto) => {
      invalider();
      toast.success(
        dto.agent_id
          ? `${r.count} contact${r.count > 1 ? "s" : ""} assigné${r.count > 1 ? "s" : ""}`
          : `${r.count} contact${r.count > 1 ? "s" : ""} sans agent`,
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useAppelMutation = () => {
  const invalider = useInvalidateCrmQuery();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: IAppelDTO }) => contactAPI.appeler(id, dto),
    onSuccess: (r) => {
      invalider();
      toast.success(`Appel enregistré : ${STATUT_META[r.statut].label.toLowerCase()}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useCouponMutation = () => {
  const invalider = useInvalidateCrmQuery();
  return useMutation({
    mutationFn: ({ id, offreId }: { id: string; offreId?: string }) => contactAPI.envoyerCoupon(id, offreId),
    onSuccess: (r) => {
      invalider();
      if (r.envoye) toast.success(`Coupon ${r.coupon.code} envoyé par ${CANAL_LABEL[r.canal]}`);
      else toast(`Coupon ${r.coupon.code} créé, mais aucun message n'est parti : dictez-le au client`, { icon: "⚠️", duration: 8000 });
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useRenvoyerCouponMutation = () => {
  const invalider = useInvalidateCrmQuery();
  return useMutation({
    mutationFn: (id: string) => contactAPI.renvoyerCoupon(id),
    onSuccess: (r) => {
      invalider();
      if (r.envoye) toast.success(`Coupon renvoyé par ${CANAL_LABEL[r.canal]}`);
      else toast("Aucun message n'est parti : dictez le code au client", { icon: "⚠️", duration: 8000 });
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

/**
 * Prise d'un client de la file commune, au moment où l'agent compose son
 * numéro. Un collègue plus rapide l'a déjà pris : la file est rafraîchie et
 * l'agent passe au suivant.
 */
export const usePrendreMutation = () => {
  const invalider = useInvalidateCrmQuery();
  return useMutation({
    mutationFn: (id: string) => contactAPI.prendre(id),
    onSuccess: () => invalider(),
    onError: (e: Error & { status?: number }) => {
      toast.error(e.status === 409 ? `${e.message} : passez au suivant` : e.message);
      invalider();
    },
  });
};
