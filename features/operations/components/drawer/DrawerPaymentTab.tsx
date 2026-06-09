"use client";

import React, { useMemo, useState } from "react";
import {
  Banknote,
  Check,
  CheckCircle,
  Clock,
  CreditCard,
  Pencil,
  Plus,
  Receipt,
  Smartphone,
  Trash2,
  Wallet,
  X,
  XCircle,
} from "lucide-react";

import { CustomPaymentSelect } from "../../../orders/components/CustomPaymentSelect";
import { paiementDataSelect } from "../../../orders/constantes/paiement-data-select";
import { usePaiementAddMutation } from "../../../orders/queries/paiement-add.mutation";
import { usePaiementRemoveMutation } from "../../../orders/queries/paiement-delete.mutation";
import { usePaiementUpdateMutation } from "../../../orders/queries/paiement-update.mutation";
import { type Order, PaymentMethod } from "../../../orders/types/order.types";
import { PaiementMode, PaiementStatus, type Paiement } from "../../../orders/types/paiement.types";
import { mapApiOrderToUiOrder } from "../../../orders/utils/orderMapper";
import { useIsAdmin } from "../../../users/hook/useIsAdmin";
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
};

/**
 * Tab Paiement du drawer Opérations — caissière encaisse le livreur.
 *
 * Alignement avec `AddPaiementModal` de la page Commandes :
 *  - Un paiement est **pré-rempli au montant total** en mode Espèce (cas majoritaire).
 *  - La caissière peut changer le mode (Orange Money, MTN, Wave, Carte…) via `CustomPaymentSelect`.
 *  - Bouton « Ajouter un paiement » pour split (ex: partiel espèce + partiel MoMo).
 *  - Total saisi doit couvrir le montant dû pour activer le bouton « Enregistrer ».
 *  - Mutation : `usePaiementAddMutation` crée les Paiement côté backend, qui eux-mêmes
 *    marquent la Order `paied=true` et `COMPLETED` si le total est couvert.
 *
 * Visible uniquement pour OFFLINE non payée (condition côté `showPayment` dans OperationsDrawer).
 */
export function DrawerPaymentTab({ order }: Props) {
  const { mutate: addPaiement, isPending } = usePaiementAddMutation();
  const uiOrder = useMemo(() => mapApiOrderToUiOrder(order), [order]);
  // ADMIN : peut toujours ajouter/corriger un paiement, même après clôture
  // (ex: ajustement comptable, paiement complémentaire, correction d'erreur de caisse).
  const isAdmin = useIsAdmin();

  // Pré-remplissage : un paiement au montant total en Espèce (le plus courant).
  // Si la commande est DÉJÀ payée (cas admin uniquement, paiement complémentaire),
  // on initialise à 0 : l'admin saisit explicitement le montant correctif.
  const [paiements, setPaiements] = useState<IPaiementLine[]>(() => [
    { mode: PaiementMode.CASH, source: "cash", amount: order.paied ? 0 : order.amount },
  ]);

  const totalAmount = paiements.reduce((sum, p) => sum + (p.amount || 0), 0);
  const remainingAmount = Math.max(0, order.amount - totalAmount);
  const excessAmount = Math.max(0, totalAmount - order.amount);

  const updatePaiement = (index: number, updates: Partial<IPaiementLine>) => {
    setPaiements((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updates };
      return copy;
    });
  };

  const addNewPaiement = () => {
    setPaiements([
      ...paiements,
      { mode: PaiementMode.CASH, source: "cash", amount: remainingAmount },
    ]);
  };

  const removePaiement = (index: number) => {
    setPaiements(paiements.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    addPaiement({ items: paiements, order: uiOrder });
  };

  // ── Historique : tri chronologique (plus récent en premier) ─────────────
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

  // ── Gardes ──────────────────────────────────────────────────────────────

  if (order.payment_method !== PaymentMethod.OFFLINE) {
    // ONLINE : pas de formulaire mais on affiche quand même l'historique des
    // paiements (utile pour voir les transactions KKiaPay, MoMo, etc.)
    return (
      <div className="p-4 space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
          <CreditCard className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-blue-900">Paiement en ligne</p>
            <p className="text-xs text-blue-700 mt-0.5">
              Pas d&apos;encaissement manuel — voir l&apos;historique ci-dessous.
            </p>
          </div>
        </div>
        <PaiementsHistory paiements={successPaiements} canEdit={isAdmin} />
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────

  const isFullyPaid = order.paied || remainingDu === 0;
  // ADMIN : peut enregistrer tout montant > 0 (correction comptable, complément).
  // Autres : doit couvrir au moins le restant dû (comportement standard caisse).
  const canSave =
    paiements.length > 0 &&
    totalAmount > 0 &&
    (isAdmin || totalAmount >= order.amount) &&
    !isPending;

  return (
    <div className="p-4 space-y-4">
      {/* Hero : à encaisser OU encaissé */}
      {isFullyPaid ? (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-[10px] uppercase font-bold text-green-700 tracking-wider">
                Paiement encaissé
              </p>
              <p className="mt-1 text-3xl font-black text-green-700 tabular-nums">
                {formatPrix(totalEncaisse)}
              </p>
              <p className="text-xs text-green-700 mt-1">
                Commande #{order.reference}
                {order.paied_at && ` · clôturée le ${formatDateTime(order.paied_at)}`}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-[#FFF0E4] to-amber-50 border border-[#F17922]/20 rounded-2xl p-4">
          <p className="text-[10px] uppercase font-bold text-[#F17922] tracking-wider">
            À encaisser
          </p>
          <p className="mt-1 text-3xl font-black text-[#F17922] tabular-nums">
            {formatPrix(remainingDu)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Commande #{order.reference}
            {totalEncaisse > 0 && ` · déjà perçu ${formatPrix(totalEncaisse)} sur ${formatPrix(order.amount)}`}
          </p>
        </div>
      )}

      {/* Historique des paiements — toujours affiché si présent */}
      <PaiementsHistory paiements={successPaiements} canEdit={isAdmin} />

      {/* Si entièrement payée → message neutre pour les non-admin ; l'admin garde
          l'accès au formulaire pour saisir un paiement correctif/complémentaire. */}
      {isFullyPaid && !isAdmin && (
        <div className="text-center py-2">
          <p className="text-xs text-gray-400">
            Cette commande a été encaissée. Aucune action supplémentaire requise.
          </p>
        </div>
      )}

      {isFullyPaid && isAdmin && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
          <span className="text-amber-700 text-base">⚠️</span>
          <div className="flex-1">
            <p className="text-xs font-semibold text-amber-900">Mode admin — paiement correctif</p>
            <p className="text-[11px] text-amber-700 mt-0.5">
              La commande est déjà encaissée. Tout paiement ajouté ici sera tracé comme une correction comptable.
            </p>
          </div>
        </div>
      )}

      {/* Lignes de paiement (formulaire) — visible si non-payée OU si admin */}
      {(!isFullyPaid || isAdmin) && (
        <>
      <div className="space-y-3">
        {paiements.map((p, i) => (
          <div
            key={i}
            className="bg-white border border-gray-200 rounded-2xl p-3.5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                Paiement {i + 1}
              </span>
              {paiements.length > 1 && (
                <button
                  onClick={() => removePaiement(i)}
                  className="p-1 text-red-500 hover:bg-red-50 rounded-md transition"
                  aria-label="Retirer ce paiement"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <CustomPaymentSelect
              value={p.source}
              onChange={(newSource) => {
                const mode =
                  paiementDataSelect.find((opt) => opt.source === newSource)?.key ??
                  PaiementMode.CASH;
                updatePaiement(i, { source: newSource, mode });
              }}
            />

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Montant (FCFA)
              </label>
              <input
                type="number"
                inputMode="numeric"
                value={p.amount || ""}
                onChange={(e) =>
                  updatePaiement(i, { amount: Number(e.target.value) || 0 })
                }
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#F17922] transition tabular-nums"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Bouton ajout ligne — admin peut toujours en ajouter (split correctif). */}
      <button
        onClick={addNewPaiement}
        disabled={isPending || (!isAdmin && totalAmount >= order.amount)}
        className="w-full py-2.5 px-4 border-2 border-dashed border-[#F17922] rounded-xl text-[#F17922] font-semibold hover:bg-orange-50 transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400"
      >
        <Plus className="w-4 h-4" />
        Ajouter un paiement
      </button>

      {/* Récap total saisi */}
      <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
        <span className="text-sm text-gray-600">Total saisi</span>
        <div className="text-right">
          <span
            className={`text-lg font-bold tabular-nums ${
              totalAmount >= order.amount ? "text-green-600" : "text-[#F17922]"
            }`}
          >
            {formatPrix(totalAmount)}
          </span>
          {remainingAmount > 0 && (
            <p className="text-[11px] text-amber-600 mt-0.5">
              Reste {formatPrix(remainingAmount)}
            </p>
          )}
          {excessAmount > 0 && (
            <p className="text-[11px] text-blue-600 mt-0.5">
              Excédent {formatPrix(excessAmount)}
            </p>
          )}
        </div>
      </div>

      {/* Bouton validation */}
      <button
        onClick={handleSave}
        disabled={!canSave}
        className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
      >
        <CheckCircle className="w-4 h-4" />
        {isPending ? "Enregistrement…" : "Enregistrer les paiements"}
      </button>
        </>
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
  if (paiements.length === 0) {
    return (
      <div className="bg-gray-50 border border-dashed border-gray-300 rounded-2xl p-4 text-center">
        <Clock className="w-5 h-5 text-gray-400 mx-auto mb-1.5" />
        <p className="text-xs text-gray-500">Aucun paiement enregistré pour le moment</p>
      </div>
    );
  }

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
