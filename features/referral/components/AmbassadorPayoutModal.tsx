"use client";

import React, { useMemo, useState } from "react";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { Loader2, Wallet, CheckCircle2, BadgeCheck, Pencil, UserPlus } from "lucide-react";
import {
  useAddFilleulMutation,
  useAmbassadorDetailQuery,
  useCancelReferralMutation,
  useChangeAmbassadorCodeMutation,
  useMarkPaidMutation,
  useMarkPayableMutation,
} from "../queries/referral.queries";
import {
  AmbassadorFilleul,
  ReferralEarning,
  ReferralEarningStatus,
} from "../types/referral.types";
import ReferralClientPicker from "./ReferralClientPicker";
import { fcfa, shortDate } from "../utils/format";
import { STATUT_FILLEUL, STATUT_GAIN } from "../utils/statuts";
import toast from "react-hot-toast";
import { useAuthStore } from "../../users/hook/authStore";
import { Action, Modules } from "../../users/types/auth.type";

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
  const st = STATUT_GAIN[e.status] ?? STATUT_GAIN.PENDING;
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
      <td className="py-2.5 px-3 text-sm text-[#18181B]">{e.referee_name ?? "Sans nom"}</td>
      <td className="py-2.5 px-3 text-xs text-[#71717A]">
        {e.order_number ? `#${e.order_number}` : ""}
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
  const changerCode = useChangeAmbassadorCodeMutation(ambassadorId ?? "");
  const ajouterFilleul = useAddFilleulMutation(ambassadorId ?? "");
  const annuler = useCancelReferralMutation();
  // Tous les gestes de la fiche : FIDELITE UPDATE côté serveur.
  const peutVerser = useAuthStore((s) => s.can(Modules.FIDELITE, Action.UPDATE));

  const detail = detailQuery.data;
  const payable = detail?.payable_amount ?? 0;

  const [note, setNote] = useState("");
  const [code, setCode] = useState<string | null>(null);
  const [ajout, setAjout] = useState(false);
  // Saisies remises à zéro d'un parrain à l'autre : la liste remonte la
  // fenêtre (clé = parrain).
  const [aAnnuler, setAAnnuler] = useState<AmbassadorFilleul | null>(null);

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
    if (!(payable > 0)) return toast.error("Aucun gain payable à verser.");
    markPaid.mutate(
      { amount: payable, note: note.trim() || undefined },
      { onSuccess: () => setNote("") }
    );
  };

  const enregistrerCode = () => {
    if (!code?.trim()) return toast.error("Saisissez un code, par exemple CN-AWA.");
    changerCode.mutate(code, { onSuccess: () => setCode(null) });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={detail?.fullname ? `Ambassadeur : ${detail.fullname}` : "Ambassadeur"}
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
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                {detail.phone && <span className="text-[#71717A]">{detail.phone}</span>}
                {code === null ? (
                  <span className="inline-flex items-center gap-2">
                    {detail.referral_code && (
                      <span className="inline-flex items-center gap-1 text-[#F17922] font-semibold">
                        <BadgeCheck size={14} /> {detail.referral_code}
                      </span>
                    )}
                    {peutVerser && (
                      <button
                        type="button"
                        onClick={() => setCode(detail.referral_code ?? "")}
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#71717A] hover:text-[#F17922] cursor-pointer"
                      >
                        <Pencil size={12} /> Modifier le code
                      </button>
                    )}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <input
                      autoFocus
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === "Enter" && enregistrerCode()}
                      maxLength={24}
                      className="h-9 w-44 rounded-lg border border-[#E4E4E7] px-3 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-[#F17922]/30"
                    />
                    <button
                      type="button"
                      onClick={enregistrerCode}
                      disabled={changerCode.isPending}
                      className="h-9 px-3 rounded-lg bg-[#F17922] text-white text-xs font-semibold hover:bg-[#e06816] disabled:opacity-50 cursor-pointer"
                    >
                      {changerCode.isPending ? <Loader2 size={14} className="animate-spin" /> : "Enregistrer"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCode(null)}
                      className="text-xs text-[#71717A] hover:underline cursor-pointer"
                    >
                      Annuler
                    </button>
                  </span>
                )}
                <span className="text-[#9796A1]">
                  {detail.qualified_referees_count}/{detail.referees_count} filleuls
                  qualifiés · {fcfa(detail.generated_sales)} de ventes
                </span>
              </div>
              {code !== null && detail.referral_code && (
                <p className="text-[11px] text-[#9796A1]">
                  Le code {detail.referral_code} ne marchera plus.
                </p>
              )}
              {detail.referral_code_ancien && (
                <p className="text-[11px] text-[#9796A1]">
                  Ancien code toujours valable : {detail.referral_code_ancien}
                </p>
              )}
            </div>

            {/* Soldes */}
            <div className="flex flex-wrap gap-3">
              <SoldeCard label="En attente" value={detail.pending_amount} color="#B45309" />
              <SoldeCard label="Payable" value={detail.payable_amount} color="#0369A1" />
              <SoldeCard label="Déjà payé" value={detail.paid_amount} color="#1E8E5A" />
              <SoldeCard label="Total gagné" value={detail.total_earned} color="#18181B" />
            </div>

            {/* Actions versement */}
            {peutVerser && (
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
                    <div className="w-full h-11 flex items-center rounded-lg border border-[#E4E4E7] bg-white px-3 text-sm font-semibold text-[#18181B]">
                      {fcfa(payable)}
                    </div>
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
                      placeholder="Ex. Wave 07xx, réf. 12345"
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
                  Le versement se fait hors du système (Wave, espèces). « Marquer payé »
                  solde tous les gains « payable ».
                </p>
              </div>
            )}

            {/* Filleuls */}
            <div>
              <div className="flex items-center justify-between gap-3 mb-2">
                <h4 className="text-sm font-semibold text-[#18181B]">
                  Filleuls ({detail.filleuls?.length ?? 0})
                </h4>
                {peutVerser && !ajout && (
                  <button
                    type="button"
                    onClick={() => setAjout(true)}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-[#F17922] hover:underline cursor-pointer"
                  >
                    <UserPlus size={15} /> Ajouter un filleul
                  </button>
                )}
              </div>

              {ajout && (
                <div className="mb-3 rounded-xl border border-[#E4E4E7] bg-[#FAFAFA] p-3 space-y-2">
                  <p className="text-xs text-[#71717A]">
                    Pour un nouveau client qui a oublié le code à l&apos;inscription. Il reçoit
                    son cadeau de bienvenue.
                  </p>
                  {ajouterFilleul.isPending ? (
                    <div className="flex items-center gap-2 text-sm text-[#9796A1] py-2">
                      <Loader2 size={16} className="animate-spin" /> Rattachement…
                    </div>
                  ) : (
                    <ReferralClientPicker
                      pour="filleul"
                      onPick={(c) =>
                        ajouterFilleul.mutate(c.customer_id, { onSuccess: () => setAjout(false) })
                      }
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => setAjout(false)}
                    className="text-xs text-[#71717A] hover:underline cursor-pointer"
                  >
                    Fermer
                  </button>
                </div>
              )}

              <div className="border border-[#E4E4E7] rounded-xl overflow-x-auto">
                <table className="w-full min-w-[560px]">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wide text-[#9796A1] bg-[#FAFAFA]">
                      <th className="py-2 px-3 font-medium">Filleul</th>
                      <th className="py-2 px-3 font-medium">Inscrit le</th>
                      <th className="py-2 px-3 font-medium">Statut</th>
                      <th className="py-2 px-3 font-medium text-right">Ventes</th>
                      {peutVerser && <th className="py-2 px-3 font-medium text-right">Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {(detail.filleuls?.length ?? 0) === 0 ? (
                      <tr>
                        <td colSpan={peutVerser ? 5 : 4} className="py-6 text-center text-sm text-[#9796A1]">
                          Aucun filleul pour le moment.
                        </td>
                      </tr>
                    ) : (
                      detail.filleuls.map((f) => {
                        const st = STATUT_FILLEUL[f.status] ?? STATUT_FILLEUL.PENDING;
                        return (
                          <tr key={f.id} className="border-b border-[#F2F2F4] last:border-0">
                            <td className="py-2.5 px-3">
                              <div className="text-sm text-[#18181B]">{f.fullname ?? "Sans nom"}</div>
                              <div className="text-xs text-[#9796A1]">{f.phone}</div>
                            </td>
                            <td className="py-2.5 px-3 text-xs text-[#71717A] whitespace-nowrap">
                              {shortDate(f.joined_at)}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={"text-[10px] font-semibold rounded-full px-2 py-0.5 " + st.cls}>
                                {st.label}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right text-sm text-[#18181B] whitespace-nowrap">
                              {fcfa(f.sales)}
                              <span className="text-xs text-[#9796A1]">
                                {" "}· {f.orders_count} commande{f.orders_count > 1 ? "s" : ""}
                              </span>
                            </td>
                            {peutVerser && (
                              <td className="py-2.5 px-3 text-right">
                                {f.status !== "CANCELLED" && (
                                  <button
                                    type="button"
                                    onClick={() => setAAnnuler(f)}
                                    className="text-xs font-medium text-red-600 hover:underline cursor-pointer"
                                  >
                                    Annuler
                                  </button>
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
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

      <ConfirmDialog
        isOpen={aAnnuler !== null}
        onClose={() => setAAnnuler(null)}
        onConfirm={() =>
          aAnnuler &&
          annuler.mutate(aAnnuler.id, { onSettled: () => setAAnnuler(null) })
        }
        title="Annuler ce parrainage ?"
        description={
          <p>
            <b>{aAnnuler?.fullname ?? "Ce filleul"}</b> ne rapportera plus ni prime ni
            commission. Les gains non versés sont annulés, ceux déjà versés restent. Il ne
            pourra plus être rattaché à un autre parrain.
          </p>
        }
        confirmLabel="Annuler le parrainage"
        cancelLabel="Garder"
        variant="danger"
        isLoading={annuler.isPending}
      />
    </Modal>
  );
}
