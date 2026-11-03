"use client";

import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import { Loader2, UserPlus } from "lucide-react";
import { useCreateAmbassadorMutation } from "../queries/referral.queries";
import { ReferralClientCandidat } from "../types/referral.types";
import ReferralClientPicker from "./ReferralClientPicker";

/**
 * « Ajouter un parrain » : un client existant reçoit son code. Laissé vide,
 * le code vaut CN- suivi de son prénom (son nom, ou un numéro, si c'est pris).
 */
export default function NouveauParrainModal({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (customerId: string) => void;
}) {
  const [client, setClient] = useState<ReferralClientCandidat | null>(null);
  const [code, setCode] = useState("");
  // Saisies remises à zéro à chaque ouverture : la liste remonte la fenêtre.
  const creer = useCreateAmbassadorMutation();

  const valider = () => {
    if (!client) return;
    creer.mutate(
      { customer_id: client.customer_id, code: code.trim() || undefined },
      { onSuccess: (fiche) => onCreated(fiche.customer_id) }
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ajouter un parrain">
      <div className="p-5 sm:p-6 space-y-5">
        {!client ? (
          <ReferralClientPicker pour="parrain" onPick={setClient} />
        ) : (
          <>
            <div className="flex items-center justify-between gap-3 rounded-lg border border-[#E4E4E7] px-3 py-2.5">
              <span>
                <span className="block text-sm font-medium text-[#18181B]">{client.fullname ?? "—"}</span>
                <span className="block text-xs text-[#9796A1]">{client.phone ?? "—"}</span>
              </span>
              <button
                type="button"
                onClick={() => setClient(null)}
                className="text-sm font-medium text-[#F17922] hover:underline cursor-pointer"
              >
                Changer
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#71717A] mb-1.5">Code de parrainage</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="CN-PRENOM"
                maxLength={24}
                className="h-11 w-full rounded-lg border border-[#E4E4E7] px-3 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-[#F17922]/30"
              />
              <p className="mt-1 text-[11px] text-[#9796A1]">
                Laissé vide : CN- suivi du prénom, ou du nom si le prénom est déjà pris.
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={valider}
                disabled={creer.isPending}
                className="h-11 flex items-center gap-2 rounded-lg bg-[#F17922] px-5 text-sm font-semibold text-white hover:bg-[#e06816] disabled:opacity-50 cursor-pointer"
              >
                {creer.isPending ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                Ajouter le parrain
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
