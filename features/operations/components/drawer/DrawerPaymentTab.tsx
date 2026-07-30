"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import {
  Banknote,
  Check,
  CheckCircle,
  CreditCard,
  Pencil,
  Receipt,
  Smartphone,
  Trash2,
  Wallet,
  X,
  XCircle,
} from "lucide-react";

import { paiementDataSelect } from "../../../orders/constantes/paiement-data-select";
import { usePaiementAddMutation } from "../../../orders/queries/paiement-add.mutation";
import { usePaiementRemoveMutation } from "../../../orders/queries/paiement-delete.mutation";
import { usePaiementUpdateMutation } from "../../../orders/queries/paiement-update.mutation";
import { type Order, PaymentMethod } from "../../../orders/types/order.types";
import { PaiementMode, PaiementStatus, type Paiement } from "../../../orders/types/paiement.types";
import { mapApiOrderToUiOrder } from "../../../orders/utils/orderMapper";
import { useIsAdmin } from "../../../users/hook/useIsAdmin";
import ConfirmPaymentAction from "../../../orders/components/detail-order/ConfirmPaymentAction";
import PendingCollectionAction from "../../../orders/components/detail-order/PendingCollectionAction";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

interface Props {
  order: Order;
}

interface IPaiementLine {
  mode: PaiementMode;
  source: string;
  amount: number;
}

function formatPrix(n: number): string {
  return n.toLocaleString("fr-FR").replace(/\s/g, ".") + " F";
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const MODE_META: Record<PaiementMode, { label: string; color: string; bg: string; Icon: React.FC<{ className?: string }> }> = {
  CASH: { label: "Espèces", color: "#166534", bg: "#DCFCE7", Icon: Banknote },
  MOBILE_MONEY: { label: "Mobile Money", color: "#1E40AF", bg: "#DBEAFE", Icon: Smartphone },
  WALLET: { label: "Wallet", color: "#92400E", bg: "#FEF3C7", Icon: Wallet },
  CARD: { label: "Carte", color: "#7C3AED", bg: "#EDE9FE", Icon: CreditCard },
};

const STATUS_META: Record<PaiementStatus, { label: string; color: string; Icon: React.FC<{ className?: string }> }> = {
  SUCCESS: { label: "Réussi", color: "#166534", Icon: CheckCircle },
  FAILED: { label: "Échec", color: "#991B1B", Icon: XCircle },
  REVERTED: { label: "Annulé", color: "#52525B", Icon: XCircle },
  // Encaissement livreur déclaré à la livraison — à confirmer (bloc dédié).
  PENDING: { label: "À confirmer", color: "#92400E", Icon: CheckCircle },
};

/**
 * Tab Paiement du drawer Opérations — REFONTE « 3 blocs maximum ».
 *
 * L'ancien empilement (bannière + récapitulatif + état vide + formulaire à
 * selects + total saisi) répétait trois fois les mêmes montants. La caissière
 * n'a qu'UN travail ici : enregistrer comment le reste dû a été payé.
 *
 *  1. EN-TÊTE unique : reste à encaisser (ou soldée) + une ligne de contexte.
 *  2. Paiements existants : encaissements livreur à confirmer (1 clic) puis
 *     historique — uniquement s'il y en a (aucun bloc vide).
 *  3. ENCAISSEMENT : les moyens en pastilles (mêmes visuels que partout) —
 *     un tap = montant pré-rempli au reste dû ; plusieurs taps = paiement
 *     partagé avec un montant par moyen. Un seul bouton, qui porte le montant.
 *
 * Même modèle mental que l'app livreur (chips multi + somme contrôlée) :
 * l'équipe n'apprend qu'un seul geste. Mutation inchangée
 * (`usePaiementAddMutation` → le backend marque payée / termine si couvert).
 */
export function DrawerPaymentTab({ order }: Props) {
  const { mutate: addPaiement, isPending } = usePaiementAddMutation();
  const uiOrder = useMemo(() => mapApiOrderToUiOrder(order), [order]);
  // ADMIN : accès aux contrôles d'édition / suppression de l'historique.
  const isAdmin = useIsAdmin();

  // Déjà encaissé (paiements réussis existants) → reste réellement dû.
  const successPaiements = useMemo(
    () =>
      (order.paiements ?? [])
        .filter((p) => p.status === PaiementStatus.SUCCESS)
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        ),
    [order.paiements],
  );
  const totalEncaisse = successPaiements.reduce((sum, p) => sum + p.amount, 0);
  const remainingDu = Math.max(0, order.amount - totalEncaisse);

  // Sélection par pastilles : Espèces pré-sélectionné au reste dû (le cas
  // majoritaire se règle donc en UN clic sur « Encaisser »).
  const [lignes, setLignes] = useState<IPaiementLine[]>(() => [
    { mode: PaiementMode.CASH, source: "cash", amount: remainingDu },
  ]);

  const totalAmount = lignes.reduce((sum, p) => sum + (p.amount || 0), 0);
  const remainingAmount = Math.max(0, remainingDu - totalAmount);
  const excessAmount = Math.max(0, totalAmount - remainingDu);

  /** Tap sur une pastille : ajoute (pré-rempli au restant) ou retire le moyen. */
  const toggleMoyen = (source: string, mode: PaiementMode) => {
    setLignes((prev) => {
      if (prev.some((l) => l.source === source)) {
        return prev.filter((l) => l.source !== source);
      }
      const dejaSaisi = prev.reduce((sum, l) => sum + (l.amount || 0), 0);
      const montant = prev.length === 0 ? remainingDu : Math.max(0, remainingDu - dejaSaisi);
      return [...prev, { mode, source, amount: montant }];
    });
  };

  const setMontant = (source: string, amount: number) => {
    setLignes((prev) => prev.map((l) => (l.source === source ? { ...l, amount } : l)));
  };

  const handleSave = () => {
    // amountDue = reste dû (déduit des paiements déjà réussis) pour autoriser
    // les paiements partiels (ex. 500 F restants sur 8 000 F).
    addPaiement({
      items: lignes.filter((l) => (l.amount || 0) > 0),
      order: uiOrder,
      amountDue: remainingDu,
    });
  };

  const isFullyPaid = order.paied || remainingDu === 0;
  const canSave =
    lignes.some((l) => (l.amount || 0) > 0) && totalAmount >= remainingDu && !isPending;

  // ── EN-TÊTE unique : montant + contexte en UNE carte ──────────────────────
  const header = isFullyPaid ? (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase font-bold text-green-700 tracking-wider">
            Paiement encaissé
          </p>
          <p className="mt-1 text-3xl font-black text-green-700 tabular-nums">
            {formatPrix(totalEncaisse)}
          </p>
        </div>
        <CheckCircle className="w-6 h-6 text-green-600 shrink-0" />
      </div>
      <p className="text-xs text-green-700/80 mt-1">
        Commande soldée
        {order.paied_at && ` · le ${formatDateTime(order.paied_at)}`}
      </p>
    </div>
  ) : (
    <div className="bg-gradient-to-br from-[#FFF0E4] to-amber-50 border border-[#F17922]/20 rounded-2xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase font-bold text-[#F17922] tracking-wider">
            Reste à encaisser
          </p>
          <p className="mt-1 text-3xl font-black text-[#F17922] tabular-nums">
            {formatPrix(remainingDu)}
          </p>
        </div>
        <span
          className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-full ${
            totalEncaisse > 0 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-600"
          }`}
        >
          {totalEncaisse > 0 ? "Partiellement payée" : "Non payée"}
        </span>
      </div>
      <p className="text-xs text-gray-500 mt-1">
        {totalEncaisse > 0
          ? `Perçu ${formatPrix(totalEncaisse)} sur ${formatPrix(order.amount)}`
          : `Total commande ${formatPrix(order.amount)}`}
      </p>
    </div>
  );

  // ── ONLINE : pas d'encaissement manuel, contexte + historique seulement ───
  if (order.payment_method !== PaymentMethod.OFFLINE) {
    return (
      <div className="p-4 space-y-4">
        {header}
        <p className="text-xs text-gray-400 flex items-center gap-1.5 px-1">
          <CreditCard className="w-3.5 h-3.5" />
          Paiement en ligne — pas d&apos;encaissement manuel.
        </p>
        {/* Encaissement livreur (Turbo) déclaré à la livraison — à confirmer. */}
        <PendingCollectionAction order={uiOrder} />
        {/* Réconciliation admin d'une commande en ligne restée PENDING
            (webhook KKiaPay perdu). S'auto-masque hors PENDING. */}
        {isAdmin && <ConfirmPaymentAction order={uiOrder} />}
        <PaiementsHistory paiements={successPaiements} canEdit={isAdmin} />
      </div>
    );
  }

  // ── OFFLINE ───────────────────────────────────────────────────────────────
  return (
    <div className="p-4 space-y-4">
      {header}

      {/* Encaissement livreur déclaré à la livraison — prioritaire, 1 clic. */}
      <PendingCollectionAction order={uiOrder} />

      {/* Historique : uniquement s'il y a des paiements (aucun bloc vide). */}
      <PaiementsHistory paiements={successPaiements} canEdit={isAdmin} />

      {/* ── ENCAISSER : pastilles de moyens + un bouton ── */}
      {!isFullyPaid && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-600">
            Comment le client paie-t-il ?
          </p>

          {/* Pastilles — mêmes visuels que partout (référentiel caissière).
              Plusieurs sélections = paiement partagé. */}
          <div className="flex flex-wrap gap-2">
            {paiementDataSelect.map((opt) => {
              const selected = lignes.some((l) => l.source === opt.source);
              return (
                <button
                  key={opt.source}
                  type="button"
                  onClick={() => toggleMoyen(opt.source, opt.key)}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    selected
                      ? "border-[#F17922] bg-orange-50 text-[#F17922]"
                      : "border-gray-200 bg-white text-gray-600 hover:border-[#F17922]/40 hover:bg-gray-50"
                  }`}
                >
                  <Image
                    src={opt.image}
                    alt=""
                    width={18}
                    height={18}
                    className="rounded-full object-cover"
                  />
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* Montant par moyen sélectionné — pré-rempli, éditable. */}
          {lignes.length > 0 && (
            <div className="space-y-2">
              {lignes.map((l) => {
                const opt = paiementDataSelect.find((o) => o.source === l.source);
                return (
                  <div
                    key={l.source}
                    className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 px-3 py-2"
                  >
                    <span className="text-sm font-semibold text-gray-700">
                      {opt?.label ?? l.source}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        inputMode="numeric"
                        value={l.amount || ""}
                        onChange={(e) => setMontant(l.source, Number(e.target.value) || 0)}
                        className="w-28 rounded-lg border border-gray-200 px-2.5 py-1.5 text-right text-sm font-bold tabular-nums focus:outline-none focus:border-[#F17922] focus:ring-2 focus:ring-[#F17922]/15 transition"
                      />
                      <span className="text-xs text-gray-400">F</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Contrôle de somme — visible seulement en cas d'écart. */}
          {lignes.length > 0 && remainingAmount > 0 && (
            <p className="text-[11px] font-semibold text-amber-600 text-right">
              Reste {formatPrix(remainingAmount)} à répartir
            </p>
          )}
          {excessAmount > 0 && (
            <p className="text-[11px] font-semibold text-blue-600 text-right">
              Excédent {formatPrix(excessAmount)}
            </p>
          )}

          <button
            onClick={handleSave}
            disabled={!canSave}
            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            {isPending
              ? "Enregistrement…"
              : lignes.length === 0
                ? "Choisissez un moyen de paiement"
                : `Encaisser ${formatPrix(totalAmount)}`}
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// HISTORIQUE DES PAIEMENTS
// ============================================================

const PaiementsHistory: React.FC<{ paiements: Paiement[]; canEdit: boolean }> = ({
  paiements,
  canEdit,
}) => {
  // Aucun paiement → RIEN (l'ancien bloc « Aucun paiement enregistré »
  // n'apportait que du bruit : le formulaire en dessous dit déjà tout).
  if (paiements.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-2 px-1">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-600 flex items-center gap-1.5">
          <Receipt className="w-3.5 h-3.5" />
          Historique ({paiements.length})
        </h4>
        {canEdit && (
          <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
            Mode admin
          </span>
        )}
      </div>
      <div className="space-y-2">
        {paiements.map((p) => (
          <PaiementRow key={p.id} paiement={p} canEdit={canEdit} />
        ))}
      </div>
    </div>
  );
};

const PaiementRow: React.FC<{ paiement: Paiement; canEdit: boolean }> = ({
  paiement,
  canEdit,
}) => {
  const modeMeta = MODE_META[paiement.mode] ?? MODE_META.CASH;
  const statusMeta = STATUS_META[paiement.status];

  const { mutate: updatePaiement, isPending: isUpdating } = usePaiementUpdateMutation();
  const { mutate: removePaiement, isPending: isRemoving } = usePaiementRemoveMutation();
  const isMutating = isUpdating || isRemoving;

  const [isEditing, setIsEditing] = useState(false);
  const [draftAmount, setDraftAmount] = useState<number>(paiement.amount);
  const [askDelete, setAskDelete] = useState(false);

  const startEdit = () => {
    setDraftAmount(paiement.amount);
    setIsEditing(true);
  };

  const saveEdit = () => {
    if (!draftAmount || draftAmount <= 0) return;
    if (draftAmount === paiement.amount) {
      setIsEditing(false);
      return;
    }
    updatePaiement(
      { id: paiement.id, patch: { amount: draftAmount } },
      { onSuccess: () => setIsEditing(false) },
    );
  };

  const cancelEdit = () => setIsEditing(false);

  const confirmDelete = () => {
    removePaiement(paiement.id, {
      onSuccess: () => setAskDelete(false),
      onError: () => setAskDelete(false),
    });
  };

  return (
    <div
      className={`bg-white border rounded-xl p-3 flex items-start gap-3 transition ${
        isEditing ? "border-[#F17922] ring-2 ring-[#F17922]/20" : "border-gray-200 hover:border-gray-300"
      } ${isMutating ? "opacity-60 pointer-events-none" : ""}`}
    >
      {/* Icône mode */}
      <div
        className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: modeMeta.bg }}
      >
        <modeMeta.Icon className="w-4 h-4" style={{ color: modeMeta.color }} />
      </div>

      {/* Détails */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          {isEditing ? (
            <div className="flex items-center gap-1 flex-1">
              <input
                type="number"
                inputMode="numeric"
                value={draftAmount || ""}
                onChange={(e) => setDraftAmount(Number(e.target.value) || 0)}
                autoFocus
                className="flex-1 min-w-0 bg-white border border-[#F17922] rounded-lg px-2 py-1 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-[#F17922] tabular-nums"
              />
              <button
                onClick={saveEdit}
                disabled={!draftAmount || draftAmount <= 0 || isUpdating}
                className="p-1.5 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-300 transition"
                aria-label="Valider"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={cancelEdit}
                disabled={isUpdating}
                className="p-1.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
                aria-label="Annuler"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm font-bold text-gray-900 tabular-nums">
                {formatPrix(paiement.amount)}
              </p>
              <div className="flex items-center gap-1 shrink-0">
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                  style={{ color: statusMeta.color, backgroundColor: `${statusMeta.color}15` }}
                >
                  <statusMeta.Icon className="w-2.5 h-2.5" />
                  {statusMeta.label}
                </span>
                {canEdit && (
                  <>
                    <button
                      onClick={startEdit}
                      title="Modifier le montant"
                      className="p-1 text-gray-400 hover:text-[#F17922] hover:bg-orange-50 rounded transition"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setAskDelete(true)}
                      title="Supprimer ce paiement"
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 mt-0.5">
          <span
            className="text-[11px] font-semibold"
            style={{ color: modeMeta.color }}
          >
            {modeMeta.label}
          </span>
          {paiement.source && paiement.source !== "cash" && (
            <span className="text-[11px] text-gray-500">· {paiement.source}</span>
          )}
        </div>

        <div className="flex items-center justify-between mt-1">
          <p className="text-[11px] text-gray-500">{formatDateTime(paiement.created_at)}</p>
          {paiement.reference && (
            <p className="text-[10px] font-mono text-gray-400 truncate ml-2">
              #{paiement.reference.slice(0, 12)}
            </p>
          )}
        </div>

        {paiement.fees > 0 && (
          <p className="text-[10px] text-gray-400 mt-0.5">
            Frais : {formatPrix(paiement.fees)} · Total {formatPrix(paiement.total)}
          </p>
        )}
      </div>

      <ConfirmDialog
        isOpen={askDelete}
        onClose={() => setAskDelete(false)}
        onConfirm={confirmDelete}
        title="Supprimer ce paiement ?"
        description={
          <>
            Paiement de <b>{formatPrix(paiement.amount)}</b> ({modeMeta.label}).
            <br />
            Cette action est définitive et le solde de la commande sera recalculé.
          </>
        }
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="danger"
        isLoading={isRemoving}
      />
    </div>
  );
};
