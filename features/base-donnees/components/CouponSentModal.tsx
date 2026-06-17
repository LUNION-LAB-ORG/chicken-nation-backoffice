"use client";

import React, { useState } from "react";
import { AlertTriangle, CheckCircle2, Copy } from "lucide-react";

import BottomSheet from "@/components/ui/BottomSheet";
import { SendCouponResult } from "../types/prospect.types";

const ORANGE = "#F17922";

/**
 * Modal de confirmation après envoi d'un coupon (call center).
 *
 * Avant : seul un toast fugace s'affichait → l'agent ne voyait ni le code ni le
 * message, donc ne savait pas quoi communiquer au client. Ce modal montre, de
 * façon STABLE : le code promo en gros (copiable), le message envoyé, et le
 * statut de délivrance. L'agent peut le lire au client / le copier.
 */
export function CouponSentModal({
  result,
  onClose,
}: {
  result: SendCouponResult | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  if (!result) return null;
  const { coupon, message, smsSent } = result;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(coupon.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* presse-papiers indispo — non bloquant */
    }
  };

  return (
    <BottomSheet isOpen={!!result} onClose={onClose} className="md:max-w-md">
      <div className="px-6 py-6">
        {/* En-tête : statut d'envoi */}
        <div className="text-center mb-4">
          <div
            className={`w-16 h-16 rounded-full grid place-items-center mx-auto mb-3 ${
              smsSent
                ? "bg-green-50 text-green-600"
                : "bg-amber-50 text-amber-600"
            }`}
          >
            {smsSent ? (
              <CheckCircle2 className="w-9 h-9" />
            ) : (
              <AlertTriangle className="w-9 h-9" />
            )}
          </div>
          <h3 className="text-lg font-bold text-gray-900">
            {smsSent ? "Coupon envoyé au client" : "Coupon généré"}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {smsSent
              ? "Le message a bien été transmis au client."
              : "Le message n'a pas pu être envoyé — communiquez le code au client par téléphone."}
          </p>
        </div>

        {/* Code en gros + copier */}
        <div className="rounded-xl border-2 border-dashed border-[#F17922]/40 bg-orange-50 p-4 text-center mb-4">
          <div className="text-[11px] font-bold text-[#F17922] uppercase tracking-wide mb-1">
            Code promo
          </div>
          <div className="text-3xl font-extrabold tracking-widest text-gray-900 tabular-nums break-all">
            {coupon.code}
          </div>
          <button
            type="button"
            onClick={copy}
            className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#F17922] text-white text-sm font-semibold hover:bg-[#F17922]/90"
          >
            <Copy className="w-4 h-4" />
            {copied ? "Copié !" : "Copier le code"}
          </button>
          {coupon.expiration_date && (
            <div className="text-xs text-gray-500 mt-2">
              Valable jusqu&apos;au{" "}
              {new Date(coupon.expiration_date).toLocaleDateString("fr-FR")}
            </div>
          )}
        </div>

        {/* Message envoyé */}
        <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 mb-5">
          <div className="text-[10px] font-bold text-gray-500 uppercase mb-1">
            Message envoyé
          </div>
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
            {message}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-lg text-white text-sm font-semibold"
          style={{ backgroundColor: ORANGE }}
        >
          Terminé
        </button>
      </div>
    </BottomSheet>
  );
}
