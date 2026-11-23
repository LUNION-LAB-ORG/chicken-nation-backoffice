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
  Undo2,
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
import { estDuSite } from "../../../orders/utils/canal-commande";
import { useIsAdmin } from "../../../users/hook/useIsAdmin";
import ConfirmPaymentAction from "../../../orders/components/detail-order/ConfirmPaymentAction";
import PendingCollectionAction from "../../../orders/components/detail-order/PendingCollectionAction";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { RembourserPaiement } from "../../../orders/components/remboursement/RembourserPaiement";
import { estRemboursable, peutRembourser, texteRembourse } from "../../../orders/utils/remboursement";
import { cumulPaiements, estRefuse } from "../../../orders/utils/encaissement-livreur";
import { useAuthStore } from "../../../users/hook/authStore";

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

// Couleurs en classes du thème (mêmes codes qu'avant) : en sombre, le texte
// s'éclaircit et le fond pâle devient une teinte sombre (src/app/theme.css).
const MODE_META: Record<PaiementMode, { label: string; texte: string; fond: string; Icon: React.FC<{ className?: string }> }> = {
  CASH: { label: "Espèces", texte: "text-hex-166534", fond: "bg-hex-dcfce7", Icon: Banknote },
  MOBILE_MONEY: { label: "Mobile Money", texte: "text-hex-1e40af", fond: "bg-hex-dbeafe", Icon: Smartphone },
  WALLET: { label: "Wallet", texte: "text-hex-92400e", fond: "bg-hex-fef3c7", Icon: Wallet },
  CARD: { label: "Carte", texte: "text-[#7C3AED]", fond: "bg-hex-ede9fe", Icon: CreditCard },
};

const STATUS_META: Record<PaiementStatus, { label: string; classe: string; Icon: React.FC<{ className?: string }> }> = {
  SUCCESS: { label: "Réussi", classe: "text-hex-166534 bg-hex-166534/10", Icon: CheckCircle },
  FAILED: { label: "Échec", classe: "text-hex-991b1b bg-hex-991b1b/10", Icon: XCircle },
  // Seul le remboursement KKiaPay mène à cet état (12/11).
  REVERTED: { label: "Remboursé", classe: "text-hex-52525b bg-hex-52525b/10", Icon: Undo2 },
  // Encaissement livreur déclaré à la livraison — à confirmer (bloc dédié).
  PENDING: { label: "À confirmer", classe: "text-hex-92400e bg-hex-92400e/10", Icon: CheckCircle },
};

/** Déclaration du livreur refusée par la caisse, ou d'office après un paiement en ligne (18/11). */
const STATUT_REFUSE = { label: "Refusé", classe: "text-hex-52525b bg-hex-52525b/10", Icon: XCircle };

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
  // Remboursement KKiaPay (12/11) : administrateur, et manager de CE restaurant.
  const rembourser = useAuthStore((s) => peutRembourser(s.user, order.restaurant_id));
  const estCentreAppels = String(useAuthStore((s) => s.user?.role)) === "CALL_CENTER";

  /**
   * ENCAISSER À LA MAIN UNE COMMANDE EN LIGNE.
   *
   * Ce n'est pas le cas courant, mais il arrive : paiement web jamais abouti
   * (webhook perdu), ou client qui finit par régler le livreur en espèces.
   * L'argent est là, la commande restait « non payée » et rien à l'écran ne
   * permettait de le dire — alors que le serveur, lui, accepte parfaitement
   * l'enregistrement. En attente, elle se confirme à l'encaissement (14/11).
   *
   * Administrateur et centre d'appels (14/11 : c'est lui qui rappelle, depuis
   * « À relancer », le client qui a payé). Pas un poste de caisse : contourner
   * le moyen de paiement déclaré reste un geste de correction.
   */
  const enLigne = order.payment_method !== PaymentMethod.OFFLINE;
  const encaisseEnLigne = isAdmin || estCentreAppels;

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
  // Historique : les paiements réussis, ceux remboursés et les déclarations du
  // livreur refusées (la trace reste visible).
  const historique = useMemo(
    () =>
      (order.paiements ?? [])
        .filter((p) => p.status === PaiementStatus.SUCCESS || p.status === PaiementStatus.REVERTED || estRefuse(p))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [order.paiements],
  );
  const remainingDu = Math.max(0, order.amount - totalEncaisse);
  /**
   * PAIEMENTS DE TROP (18/11) : ce que la caisse peut encore encaisser. Ce que
   * le livreur a déclaré, en attente, en est retiré : la caissière le confirme
   * ou le refuse au-dessus, au lieu d'encaisser une seconde fois le même
   * argent. Le serveur applique la même règle.
   */
  const { enAttente } = cumulPaiements(order.paiements ?? []);
  const aEncaisser = Math.max(0, remainingDu - enAttente);

  // Sélection par pastilles : Espèces pré-sélectionné au reste dû (le cas
  // majoritaire se règle donc en UN clic sur « Encaisser »).
  const [lignes, setLignes] = useState<IPaiementLine[]>(() => [
    { mode: PaiementMode.CASH, source: "cash", amount: aEncaisser },
  ]);
  // Le reste a changé (paiement ajouté, déclaration refusée ou confirmée) :
  // le formulaire repart du nouveau reste, sinon il proposait l'ancien.
  const [resteVu, setResteVu] = useState(aEncaisser);
  if (resteVu !== aEncaisser) {
    setResteVu(aEncaisser);
    setLignes([{ mode: PaiementMode.CASH, source: "cash", amount: aEncaisser }]);
  }

  const totalAmount = lignes.reduce((sum, p) => sum + (p.amount || 0), 0);
  // Avec la répartition automatique, la somme ne dépasse jamais le reste dû ;
  // un écart ne subsiste que si l'unique ligne a été réduite à la main.
  const remainingAmount = Math.max(0, aEncaisser - totalAmount);

  /**
   * Tap sur une pastille : ajoute ou retire le moyen. La somme des lignes est
   * MAINTENUE automatiquement au reste dû : au retrait d'un moyen, son montant
   * retourne sur la première ligne restante — zéro re-saisie sur écran tactile.
   */
  const toggleMoyen = (source: string, mode: PaiementMode) => {
    setLignes((prev) => {
      if (prev.some((l) => l.source === source)) {
        const restantes = prev.filter((l) => l.source !== source).map((l) => ({ ...l }));
        if (restantes.length > 0) {
          const deficit = aEncaisser - restantes.reduce((s, l) => s + (l.amount || 0), 0);
          restantes[0].amount = Math.max(0, (restantes[0].amount || 0) + deficit);
        }
        return restantes;
      }
      // Nouveau moyen : il démarre à 0 — la caissière tape SON montant et les
      // autres lignes se réduisent automatiquement (cf. setMontant). Premier
      // moyen sélectionné = tout le reste dû.
      return [...prev, { mode, source, amount: prev.length === 0 ? aEncaisser : 0 }];
    });
  };

  /**
   * RÉPARTITION AUTOMATIQUE (écrans de caisse tactiles) : le montant tapé fait
   * foi sur SA ligne, et les AUTRES lignes absorbent la différence — dans
   * l'ordre de sélection, plancher 0 — pour que la somme vaille TOUJOURS le
   * reste dû. Taper 800 sur Orange réduit Espèces à 1 200 tout seul : on ne
   * manipule jamais deux champs.
   */
  const setMontant = (source: string, montantBrut: number) => {
    setLignes((prev) => {
      const montant = Math.max(0, Math.min(montantBrut, aEncaisser));
      const lignes = prev.map((l) =>
        l.source === source ? { ...l, amount: montant } : { ...l },
      );
      let reste = aEncaisser - lignes.reduce((s, l) => s + (l.amount || 0), 0);
      for (const l of lignes) {
        if (l.source === source || reste === 0) continue;
        const nouveau = Math.max(0, (l.amount || 0) + reste);
        reste -= nouveau - (l.amount || 0);
        l.amount = nouveau;
      }
      return lignes;
    });
  };

  const handleSave = () => {
    // amountDue = reste dû (déduit des paiements déjà réussis) pour autoriser
    // les paiements partiels (ex. 500 F restants sur 8 000 F).
    addPaiement({
      items: lignes.filter((l) => (l.amount || 0) > 0),
      order: uiOrder,
      amountDue: aEncaisser,
    });
  };

  const isFullyPaid = order.paied || remainingDu === 0;
  const canSave =
    lignes.some((l) => (l.amount || 0) > 0) &&
    // Ni moins (le reste doit être réparti), ni plus (paiement de trop, 18/11).
    Math.round(totalAmount) === Math.round(aEncaisser) &&
    !isPending;

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
    <div className="bg-gradient-to-br from-hex-fff0e4 to-amber-50 border border-[#F17922]/20 rounded-2xl p-4">
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
  if (enLigne && !encaisseEnLigne) {
    return (
      <div className="p-4 space-y-4">
        {header}
        <p className="text-xs text-gray-400 flex items-center gap-1.5 px-1">
          <CreditCard className="w-3.5 h-3.5" />
          Paiement en ligne : pas d&apos;encaissement manuel.
        </p>
        {/* Encaissement livreur (Turbo) déclaré à la livraison — à confirmer. */}
        <PendingCollectionAction order={uiOrder} />
        {/* Réconciliation admin d'une commande en ligne restée PENDING
            (webhook KKiaPay perdu). S'auto-masque hors PENDING. */}
        {isAdmin && <ConfirmPaymentAction order={uiOrder} />}
        <PaiementsHistory paiements={historique} canEdit={isAdmin} peutRembourser={rembourser} />
      </div>
    );
  }

  // ── OFFLINE, ou EN LIGNE repris par un administrateur ou le centre d'appels ──
  return (
    <div className="p-4 space-y-4">
      {header}

      {/* Le contournement est nommé : personne ne doit encaisser à la main une
          commande en ligne en croyant que c'est la marche normale. */}
      {enLigne && (
        <p className="flex items-start gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] leading-relaxed text-amber-900">
          <CreditCard className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            Commande <strong className="font-semibold">en ligne</strong> : le paiement aurait dû se faire
            {/* Commande du site : le client payait sur le site, pas dans l'application. */}
            {estDuSite(order) ? " sur le site" : " sur l'application"}. Enregistrez ici ce qui a réellement été perçu, par exemple un
            règlement au livreur ou un paiement web jamais remonté.
          </span>
        </p>
      )}

      {/* Réconciliation par référence de transaction, quand elle s'applique.
          Route réservée à l'administrateur : le centre d'appels encaisse. */}
      {enLigne && isAdmin && <ConfirmPaymentAction order={uiOrder} />}

      {/* Encaissement livreur déclaré à la livraison — prioritaire, 1 clic. */}
      <PendingCollectionAction order={uiOrder} />

      {/* Historique : uniquement s'il y a des paiements (aucun bloc vide). */}
      <PaiementsHistory paiements={historique} canEdit={isAdmin} peutRembourser={rembourser} />

      {/* ── ENCAISSER : pastilles de moyens + un bouton ──
          Masqué quand la déclaration du livreur couvre le reste : il faut
          d'abord la confirmer ou la refuser (bloc au-dessus). */}
      {!isFullyPaid && aEncaisser > 0 && (
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

          {/* Écart possible uniquement si l'unique ligne a été réduite à la
              main (la répartition automatique maintient la somme sinon). */}
          {lignes.length > 0 && remainingAmount > 0 && (
            <p className="text-[11px] font-semibold text-amber-600 text-right">
              Reste {formatPrix(remainingAmount)} à répartir
            </p>
          )}

          <button
            onClick={handleSave}
            disabled={!canSave}
            className="w-full py-3 bg-green-600 hover:bg-green-700 dark:hover:bg-green-500 text-blanc font-semibold rounded-xl disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
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

const PaiementsHistory: React.FC<{ paiements: Paiement[]; canEdit: boolean; peutRembourser: boolean }> = ({
  paiements,
  canEdit,
  peutRembourser,
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
          <PaiementRow key={p.id} paiement={p} canEdit={canEdit} peutRembourser={peutRembourser} />
        ))}
      </div>
    </div>
  );
};

const PaiementRow: React.FC<{ paiement: Paiement; canEdit: boolean; peutRembourser: boolean }> = ({
  paiement,
  canEdit,
  peutRembourser,
}) => {
  const rembourse = paiement.status === PaiementStatus.REVERTED;
  // Déclaration du livreur refusée (18/11) : trace seulement.
  const refuse = estRefuse(paiement);
  // Un paiement remboursé ou refusé ne se corrige plus : sa trace reste telle quelle.
  const modifiable = canEdit && !rembourse && !refuse;
  const modeMeta = MODE_META[paiement.mode] ?? MODE_META.CASH;
  const statusMeta = refuse ? STATUT_REFUSE : STATUS_META[paiement.status];

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
        className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${modeMeta.fond}`}
      >
        <modeMeta.Icon className={`w-4 h-4 ${modeMeta.texte}`} />
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
                className="p-1.5 bg-green-500 text-blanc rounded-md hover:bg-green-600 disabled:bg-gray-300 transition"
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
                  className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${statusMeta.classe}`}
                >
                  <statusMeta.Icon className="w-2.5 h-2.5" />
                  {statusMeta.label}
                </span>
                {peutRembourser && estRemboursable(paiement) && <RembourserPaiement paiementId={paiement.id} />}
                {modifiable && (
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
            className={`text-[11px] font-semibold ${modeMeta.texte}`}
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

        {refuse && paiement.failure_message && (
          <p className="mt-1 text-[11px] font-semibold text-gray-600">{paiement.failure_message}</p>
        )}

        {rembourse && (
          <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-gray-600">
            <Undo2 className="h-3 w-3" />
            {texteRembourse(paiement)}
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
