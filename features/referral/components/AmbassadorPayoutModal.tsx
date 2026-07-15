"use client";

import React, { useEffect, useMemo, useState } from "react";
import Modal from "@/components/ui/Modal";
import { Loader2, Wallet, CheckCircle2, BadgeCheck } from "lucide-react";
import {
  useAmbassadorDetailQuery,
  useMarkPaidMutation,
  useMarkPayableMutation,
} from "../queries/referral.queries";
import {
  ReferralEarning,
  ReferralEarningStatus,
} from "../types/referral.types";
import { fcfa, shortDate } from "../utils/format";
import toast from "react-hot-toast";

const STATUS_STYLE: Record<ReferralEarningStatus, { label: string; cls: string }> = {
  PENDING: { label: "En attente", cls: "bg-[#FFF6E9] text-[#B45309]" },
  PAYABLE: { label: "Payable", cls: "bg-[#EAF6FF] text-[#0369A1]" },
  PAID: { label: "Payé", cls: "bg-[#E7F7EE] text-[#1E8E5A]" },
  CANCELLED: { label: "Annulé", cls: "bg-[#F3F3F3] text-[#71717A]" },
};

const SoldeCard: React.FC<{ label: string; value: number; color: string }> = ({
  label,
  value,
  color,
}) => (
  <div className="flex-1 min-w-[130px] bg-white border border-[#E4E4E7] rounded-xl p-3">
    <div className="text-[11px] uppercase tracking-wide text-[#9796A1]">{label}</div>
    <div className="text-lg font-bold mt-1" style={{ color }}>
      {fcfa(value)}
    </div>
  </div>
);

const EarningRow: React.FC<{ e: ReferralEarning }> = ({ e }) => {
  const st = STATUS_STYLE[e.status] ?? STATUS_STYLE.PENDING;
  return (
    <tr className="border-b border-[#F2F2F4] last:border-0">
      <td className="py-2.5 px-3">
        <span
          className={
            "inline-block text-[10px] font-semibold rounded-full px-2 py-0.5 " +
            (e.kind === "PRIME"
              ? "bg-[#FDEDD3] text-[#B45309]"
              : "bg-[#EEF2FF] text-[#4338CA]")
          }
        >
          {e.kind === "PRIME" ? "Prime" : "Commission"}
        </span>
      </td>
      <td className="py-2.5 px-3 text-sm text-[#18181B]">{e.referee_name ?? "—"}</td>
      <td className="py-2.5 px-3 text-xs text-[#71717A]">
        {e.order_number ? `#${e.order_number}` : "—"}
        {e.order_amount != null && (
          <span className="text-[#9796A1]"> · {fcfa(e.order_amount)}</span>
        )}
      </td>
      <td className="py-2.5 px-3 text-sm font-semibold text-[#18181B] whitespace-nowrap">
        {fcfa(e.amount)}
      </td>
      <td className="py-2.5 px-3">
        <span className={"text-[10px] font-semibold rounded-full px-2 py-0.5 " + st.cls}>
          {st.label}
        </span>
      </td>
      <td className="py-2.5 px-3 text-xs text-[#9796A1] whitespace-nowrap">
        {shortDate(e.created_at)}
      </td>
    </tr>
  );
};

export default function AmbassadorPayoutModal({
  ambassadorId,
  isOpen,
  onClose,
}: {
  ambassadorId: string | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const detailQuery = useAmbassadorDetailQuery(isOpen ? ambassadorId : null);
  const markPayable = useMarkPayableMutation(ambassadorId ?? "");
  const markPaid = useMarkPaidMutation(ambassadorId ?? "");

  const detail = detailQuery.data;
  const payable = detail?.payable_amount ?? 0;

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    setAmount(payable ? String(payable) : "");
    setNote("");
  }, [payable, ambassadorId]);

  const sortedEarnings = useMemo(() => {
    return (detail?.earnings ?? []).slice().sort((a, b) => {
      const order: Record<ReferralEarningStatus, number> = {
        PAYABLE: 0,
        PENDING: 1,
        PAID: 2,
        CANCELLED: 3,
      };
      return (order[a.status] ?? 9) - (order[b.status] ?? 9);
    });
  }, [detail?.earnings]);

  const doPay = () => {
    const a = Number(amount);
    if (!(a > 0)) return toast.error("Montant du versement invalide.");
    if (a > payable)
      return toast.error("Le montant dépasse le solde payable.");
    markPaid.mutate(
      { amount: a, note: note.trim() || undefined },
      { onSuccess: () => setNote("") }
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={detail?.fullname ? `Ambassadeur — ${detail.fullname}` : "Ambassadeur"}
      size="large"
    >
      <div className="p-5 sm:p-6 space-y-5">
        {detailQuery.isLoading ? (
          <div className="flex items-center gap-2 text-sm text-[#9796A1] py-10 justify-center">
            <Loader2 size={18} className="animate-spin" /> Chargement…
          </div>
        ) : detailQuery.isError ? (
          <div className="text-sm text-red-500 py-8 text-center">
            {(detailQuery.error as Error)?.message ?? "Erreur de chargement"}
          </div>
        ) : detail ? (
          <>
            {/* Identité */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className="text-[#71717A]">
                {detail.phone ?? "—"}
              </span>
              {detail.referral_code && (
                <span className="inline-flex items-center gap-1 text-[#F17922] font-semibold">
                  <BadgeCheck size={14} /> {detail.referral_code}
                </span>
              )}
              <span className="text-[#9796A1]">
                {detail.qualified_referees_count}/{detail.referees_count} filleuls
                qualifiés · {fcfa(detail.generated_sales)} de ventes
              </span>
            </div>

            {/* Soldes */}
            <div className="flex flex-wrap gap-3">
              <SoldeCard label="En attente" value={detail.pending_amount} color="#B45309" />
              <SoldeCard label="Payable" value={detail.payable_amount} color="#0369A1" />
              <SoldeCard label="Déjà payé" value={detail.paid_amount} color="#1E8E5A" />
              <SoldeCard label="Total gagné" value={detail.total_earned} color="#18181B" />
            </div>

            {/* Actions versement */}
            <div className="bg-[#FAFAFA] border border-[#E4E4E7] rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="text-sm font-semibold text-[#18181B]">
                  Gérer le versement
                </div>
                <button
                  type="button"
                  onClick={() => markPayable.mutate()}
                  disabled={markPayable.isPending || detail.pending_amount <= 0}
                  className="flex items-center gap-2 text-sm font-medium text-[#0369A1] border border-[#0369A1]/30 bg-white rounded-lg px-3 py-2 hover:bg-[#EAF6FF] disabled:opacity-50 cursor-pointer"
                  title="Basculer les gains éligibles (en attente) en payable"
                >
                  {markPayable.isPending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={16} />
                  )}
                  Passer en payable
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr_auto] gap-3 items-end">
                <div>
                  <label className="block text-xs font-medium text-[#71717A] mb-1.5">
                    Montant versé (FCFA)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={payable || undefined}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full h-11 rounded-lg border border-[#E4E4E7] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F17922]/30"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#71717A] mb-1.5">
                    Note (réf. mobile money, remarque…)
                  </label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full h-11 rounded-lg border border-[#E4E4E7] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F17922]/30"
                    placeholder="Ex. Wave 07xx — réf 12345"
                  />
                </div>
                <button
                  type="button"
                  onClick={doPay}
                  disabled={markPaid.isPending || payable <= 0}
                  className="h-11 flex items-center justify-center gap-2 bg-[#1E8E5A] text-white font-semibold px-5 rounded-lg hover:bg-[#177a4c] disabled:opacity-50 cursor-pointer"
                >
                  {markPaid.isPending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Wallet size={16} />
                  )}
                  Marquer payé
                </button>
              </div>
              <p className="text-[11px] text-[#9796A1]">
                Le versement est effectué hors-système (V1 = marquage manuel). Seuls
                les gains « payable » peuvent être soldés.
              </p>
            </div>

            {/* Gains détaillés */}
            <div>
              <h4 className="text-sm font-semibold text-[#18181B] mb-2">
                Gains ({sortedEarnings.length})
              </h4>
              <div className="border border-[#E4E4E7] rounded-xl overflow-x-auto">
                <table className="w-full min-w-[560px]">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wide text-[#9796A1] bg-[#FAFAFA]">
                      <th className="py-2 px-3 font-medium">Type</th>
                      <th className="py-2 px-3 font-medium">Filleul</th>
                      <th className="py-2 px-3 font-medium">Commande</th>
                      <th className="py-2 px-3 font-medium">Montant</th>
                      <th className="py-2 px-3 font-medium">Statut</th>
                      <th className="py-2 px-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedEarnings.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-sm text-[#9796A1]">
                          Aucun gain pour le moment.
                        </td>
                      </tr>
                    ) : (
                      sortedEarnings.map((e) => <EarningRow key={e.id} e={e} />)
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Historique versements */}
            <div>
              <h4 className="text-sm font-semibold text-[#18181B] mb-2">
                Historique des versements ({detail.payouts?.length ?? 0})
              </h4>
              {(detail.payouts?.length ?? 0) === 0 ? (
                <div className="text-sm text-[#9796A1]">Aucun versement enregistré.</div>
              ) : (
                <ul className="space-y-2">
                  {detail.payouts.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-start justify-between gap-3 border border-[#E4E4E7] rounded-lg px-3 py-2.5"
                    >
                      <div className="text-sm">
                        <div className="font-semibold text-[#1E8E5A]">{fcfa(p.amount)}</div>
                        {p.note && (
                          <div className="text-xs text-[#71717A] mt-0.5">{p.note}</div>
                        )}
                        {p.paid_by_name && (
                          <div className="text-[11px] text-[#9796A1] mt-0.5">
                            par {p.paid_by_name}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-[#9796A1] whitespace-nowrap">
                        {shortDate(p.created_at)}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        ) : null}
      </div>
    </Modal>
  );
}
