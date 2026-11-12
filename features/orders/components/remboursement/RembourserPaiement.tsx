"use client";

import React, { useState } from "react";
import { AlertTriangle, CheckCircle2, Info, Loader2, RotateCcw, Undo2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { useRemboursementMutation, useVerificationRemboursementQuery } from "../../queries/remboursement.query";
import type { VerificationRemboursement } from "../../types/remboursement.types";
import { CODE_REMBOURSEE_CHEZ_KKIAPAY, formatJourHeure, formatMontant, messageErreurRemboursement } from "../../utils/remboursement";

function Ligne({ libelle, children }: { libelle: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5 text-[13px]">
      <dt className="shrink-0 text-gray-500">{libelle}</dt>
      <dd className="min-w-0 text-right font-semibold text-gray-900">{children}</dd>
    </div>
  );
}

/** Ce que KKiaPay sait de la transaction. */
function FicheKkiapay({ v }: { v: VerificationRemboursement }) {
  const k = v.kkiapay;
  const payee = k?.statut === "SUCCESS";
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-2">
      <dl className="divide-y divide-gray-100">
        <Ligne libelle="Transaction">
          <span className="font-mono text-[12px]">#{v.paiement.reference}</span>
        </Ligne>
        {k ? (
          <>
            <Ligne libelle="Chez KKiaPay">
              <span className={payee ? "text-green-700" : "text-amber-700"}>{k.libelle}</span>
            </Ligne>
            {k.montant !== null && <Ligne libelle="Montant">{formatMontant(k.montant)}</Ligne>}
            {k.frais !== null && k.frais > 0 && <Ligne libelle="Frais">{formatMontant(k.frais)}</Ligne>}
            {k.moyen && <Ligne libelle="Moyen">{k.moyen}</Ligne>}
            {k.date && <Ligne libelle="Payée le">{formatJourHeure(k.date)}</Ligne>}
          </>
        ) : (
          <Ligne libelle="Montant">{formatMontant(v.paiement.montant)}</Ligne>
        )}
        <Ligne libelle="Compte">{v.compte}</Ligne>
      </dl>
    </div>
  );
}

/**
 * Fenêtre « Rembourser un paiement » (12/11) : à l'ouverture, la transaction
 * est vérifiée auprès du compte KKiaPay qui a encaissé ; ensuite seulement le
 * bouton « Rembourser » apparaît, avec le montant. Si KKiaPay l'a déjà
 * remboursée, on propose de l'enregistrer. Sinon, la raison, et rien d'autre.
 */
export function FenetreRemboursement({ paiementId, onFermer }: { paiementId: string; onFermer: () => void }) {
  const verification = useVerificationRemboursementQuery(paiementId, true);
  const mutation = useRemboursementMutation(paiementId);
  const v = verification.data;
  const erreurGeste = mutation.isError ? messageErreurRemboursement(mutation.error) : null;
  const dejaRembourseeChezKkiapay = (mutation.error as { code?: string } | null)?.code === CODE_REMBOURSEE_CHEZ_KKIAPAY;
  const montant = v?.kkiapay?.montant ?? v?.paiement.montant ?? 0;

  const agir = (constater = false) => {
    if (!v) return;
    mutation.mutate({ reference: v.paiement.reference, constater }, { onSuccess: onFermer });
  };

  return (
    <Modal isOpen onClose={onFermer} title="Rembourser un paiement">
      <div className="flex flex-col gap-4">
        {verification.isPending ? (
          <p className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin text-[#F17922]" />
            Vérification auprès de KKiaPay…
          </p>
        ) : verification.isError || !v ? (
          <div className="flex flex-col items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <p>{messageErreurRemboursement(verification.error, "La vérification a échoué.")}</p>
            <button
              type="button"
              onClick={() => verification.refetch()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold hover:bg-red-50"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Vérifier à nouveau
            </button>
          </div>
        ) : (
          <>
            <FicheKkiapay v={v} />

            {v.remboursable && (
              <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] leading-relaxed text-amber-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Le client récupère <strong>{formatMontant(montant)}</strong> sur son moyen de paiement
                  {v.kkiapay?.moyen ? ` (${v.kkiapay.moyen})` : ""}. C&apos;est définitif : le paiement passe « Remboursé » et la
                  commande n&apos;est plus comptée comme payée.
                </span>
              </p>
            )}

            {v.constatable && (
              <p className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-[13px] leading-relaxed text-blue-900">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{v.raison}</span>
              </p>
            )}

            {!v.remboursable && !v.constatable && v.raison && (
              <p className="flex items-start gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-[13px] leading-relaxed text-gray-700">
                {v.paiement.statut === "REVERTED" ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                ) : (
                  <Info className="mt-0.5 h-4 w-4 shrink-0" />
                )}
                <span>{v.raison}</span>
              </p>
            )}

            {erreurGeste && !dejaRembourseeChezKkiapay && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">{erreurGeste}</p>
            )}
          </>
        )}

        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onFermer}
            className="h-10 rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            {v?.remboursable || v?.constatable ? "Annuler" : "Fermer"}
          </button>
          {v?.remboursable && (
            <button
              type="button"
              onClick={() => agir(false)}
              disabled={mutation.isPending}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Undo2 className="h-4 w-4" />}
              Rembourser {formatMontant(montant)}
            </button>
          )}
          {v?.constatable && (
            <button
              type="button"
              onClick={() => agir(true)}
              disabled={mutation.isPending}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#F17922] px-4 text-sm font-semibold text-white hover:bg-[#e06a15] disabled:opacity-60"
            >
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Enregistrer le remboursement
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

/** Bouton « Rembourser » d'une ligne de paiement ; la fenêtre ne s'ouvre (et ne vérifie) qu'au clic. */
export function RembourserPaiement({ paiementId }: { paiementId: string }) {
  const [ouvert, setOuvert] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOuvert(true)}
        title="Rembourser ce paiement par KKiaPay"
        className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-semibold text-gray-500 hover:bg-red-50 hover:text-red-600"
      >
        <Undo2 className="h-3.5 w-3.5" />
        Rembourser
      </button>
      {ouvert && <FenetreRemboursement paiementId={paiementId} onFermer={() => setOuvert(false)} />}
    </>
  );
}

export default RembourserPaiement;
