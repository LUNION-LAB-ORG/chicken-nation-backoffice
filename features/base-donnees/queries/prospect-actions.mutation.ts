import { useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

import {
  markProspectCall,
  markProspectCallBulk,
  resendProspectCoupon,
  sendProspectCoupon,
  sendProspectCouponBulk,
} from "../services/prospect.service";
import { CallResult, ResultatGroupe } from "../types/prospect.types";
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
      if (res.smsSent) {
        toast.success(`Coupon ${res.coupon.code} envoyé par SMS`);
      } else {
        toast(
          `Coupon ${res.coupon.code} généré — SMS non envoyé, communiquez le code au client`,
          { icon: "⚠️", duration: 6000 },
        );
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useResendCouponMutation = () => {
  const invalidate = useInvalidateProspectQuery();
  return useMutation({
    mutationFn: (id: string) => resendProspectCoupon(id),
    onSuccess: async (res) => {
      await invalidate();
      if (res.smsSent) {
        toast.success(`SMS du coupon ${res.code} renvoyé`);
      } else {
        toast(
          `SMS non envoyé (code ${res.code}) — vérifiez le numéro / Twilio`,
          { icon: "⚠️", duration: 6000 },
        );
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

/**
 * Résumé lisible d'un lot : ce qui est passé, ce qui ne l'est pas.
 * Le détail des écartés est rendu par l'écran, une notification ne peut pas
 * porter vingt lignes.
 */
const resumer = (r: ResultatGroupe, verbe: string) => {
  const pluriel = r.reussis > 1 ? "s" : "";
  if (r.echecs.length === 0) {
    return `${r.reussis} contact${pluriel} ${verbe}`;
  }
  return `${r.reussis} sur ${r.demandes} ${verbe}, ${r.echecs.length} écarté${
    r.echecs.length > 1 ? "s" : ""
  }`;
};

export const useMarkCallBulkMutation = () => {
  const invalidate = useInvalidateProspectQuery();
  return useMutation({
    mutationFn: (vars: { ids: string[]; result: CallResult; note?: string }) =>
      markProspectCallBulk(vars),
    onSuccess: async (res) => {
      await invalidate();
      if (res.reussis === 0) toast.error("Aucun contact qualifié");
      else toast.success(resumer(res, "qualifiés"));
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useSendCouponBulkMutation = () => {
  const invalidate = useInvalidateProspectQuery();
  return useMutation({
    mutationFn: (ids: string[]) => sendProspectCouponBulk(ids),
    onSuccess: async (res) => {
      await invalidate();
      if (res.reussis === 0) {
        toast.error("Aucun coupon envoyé");
        return;
      }
      toast.success(resumer(res, "servis"));
      // Le coupon existe, le SMS n'est pas parti : il faut dicter le code au
      // client. Ça se signale à part, sinon ça passe pour un envoi réussi.
      if (res.sansSms && res.sansSms > 0) {
        toast(
          `${res.sansSms} coupon(s) générés sans SMS, communiquez le code au client`,
          { icon: "⚠️", duration: 6000 },
        );
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });
};
