"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Ban, ClipboardList, Loader2, Store } from "lucide-react";

import SimpleSelect from "@/components/ui/SimpleSelect";
import { useDashboardStore } from "@/store/dashboardStore";
import { useOrderForm } from "../../hooks/useOrderForm";
import { OrderStatus, OrderType } from "../../types/order.types";
import { ReductionAffichee } from "../../types/coupon.types";
import { OrderTable } from "../../types/ordersTable.types";
import { PaiementStatus } from "../../types/paiement.types";
import CouponSection, { CouponLectureSeule } from "./CouponSection";
import CustomerInfoSection from "./CustomerInfoSection";
import DeliveryInfoSection from "./DeliveryInfoSection";
import OrderItemsSection from "./OrderItemsSection";
import OrderTypeSelector from "./OrderTypeSelector";
import OrigineSelector from "./OrigineSelector";
import { estDuSite } from "../../utils/canal-commande";

interface AddOrderFormProps {
  editOrder?: OrderTable;
}

/**
 * Ce que deviendra la commande si elle passe au call center. Miroir des règles
 * du serveur (`OrderService.update`, reprise par le personnel).
 *
 * Le MONTANT reste tel quel quand il est déjà engagé : commande payée, ou
 * commande à livrer prête ou plus loin (la course est partie avec ce montant
 * à encaisser).
 *
 * Le PAIEMENT passe à la caisse quand la commande était payable dans
 * l'application, qu'il reste à payer, et qu'aucun encaissement de livreur
 * n'attend sa confirmation. Un paiement en ligne partiel ne l'empêche pas :
 * la caisse encaisse le reste. `paymentChannel` vaut « Appli » pour une
 * commande de l'application payable en ligne.
 */
function apresBascule(commande: OrderTable): {
  montantFige: "payee" | "livraison" | null;
  paiement: "caisse" | "livreur" | "inchange";
} {
  const livraisonLancee =
    commande.orderType === "À livrer" &&
    commande.rawStatus !== OrderStatus.PENDING &&
    commande.rawStatus !== OrderStatus.ACCEPTED &&
    commande.rawStatus !== OrderStatus.IN_PROGRESS;
  const montantFige = commande.paied ? "payee" : livraisonLancee ? "livraison" : null;

  const paiements = commande.paiements ?? [];
  const dejaPercu = paiements
    .filter((p) => p.status === PaiementStatus.SUCCESS)
    .reduce((somme, p) => somme + (p.total ?? p.amount ?? 0), 0);
  let paiement: "caisse" | "livreur" | "inchange" = "inchange";
  if (commande.paymentChannel === "Appli" && !commande.paied && commande.amount - dejaPercu > 50) {
    paiement = paiements.some((p) => p.status === PaiementStatus.PENDING) ? "livreur" : "caisse";
  }
  return { montantFige, paiement };
}

/**
 * Panier de l'application annulé par son client sans avoir payé : le seul
 * cas où une commande annulée se reprend au téléphone. Le serveur reste juge
 * (409 si le panier n'est plus relançable).
 */
function panierAnnuleParLeClient(commande: OrderTable): boolean {
  return (
    commande.rawStatus === OrderStatus.CANCELLED &&
    commande.auto &&
    commande.paymentChannel === "Appli" &&
    !commande.paied
  );
}

/** Carte blanche standard des sections du formulaire. */
const CARD_CLASS = "bg-white rounded-2xl border border-gray-200 p-5 sm:p-6";

const AddOrderForm = ({ editOrder }: AddOrderFormProps) => {
  // « Reprendre au téléphone » : lu une fois à l'ouverture, puis effacé à la
  // fermeture du formulaire pour ne pas resservir à une autre modification.
  const repriseTelephoneId = useDashboardStore((s) => s.repriseTelephoneId);
  const setRepriseTelephone = useDashboardStore((s) => s.setRepriseTelephone);
  // Jamais sur une commande annulée (la reprise bascule l'origine, voir plus
  // bas), SAUF le panier annulé par le client : « Reprendre au téléphone »
  // n'existe que dans « À relancer », qui ne montre d'annulées que celles-là.
  const [repriseTelephone] = useState(
    () =>
      !!editOrder &&
      repriseTelephoneId === editOrder.id &&
      (editOrder.rawStatus !== OrderStatus.CANCELLED || panierAnnuleParLeClient(editOrder)),
  );
  useEffect(() => {
    if (!repriseTelephone) return;
    return () => setRepriseTelephone(null);
  }, [repriseTelephone, setRepriseTelephone]);

  const annulee = editOrder?.rawStatus === OrderStatus.CANCELLED;
  // Panier annulé par le client repris au téléphone : l'enregistrement sur
  // « Call center » le RÉACTIVE (serveur, `OrderService.update`). Toute autre
  // modification d'une annulée la laisse annulée.
  const reactivation = repriseTelephone && annulee;
  // Après réactivation, la commande part comme un panier en attente repris :
  // taxe à zéro, total refait, paiement à la caisse. Le calcul se fait donc
  // sur le statut d'avant l'annulation, jamais sur « annulée ».
  const bascule = editOrder
    ? apresBascule(reactivation ? { ...editOrder, rawStatus: OrderStatus.PENDING } : editOrder)
    : null;

  const {
    formData,
    setFormData,
    restaurants,
    isLoadingRestaurants,
    isSubmitting,
    handleSubmit,
    handleCancel,
    handleCustomerChange,
    coupon,
  } = useOrderForm(editOrder, { repriseTelephone });

  // Sous-total (plats+suppléments) remonté par OrderItemsSection → transmis au calcul
  // des frais pour appliquer les offres de livraison à montant minimum (aperçu backoffice).
  const [subtotal, setSubtotal] = useState(0);

  // Récap de la barre collante — toujours visible pendant la composition.
  const itemsCount = formData.items.reduce((sum, item) => sum + item.quantity, 0);
  const deliveryFee =
    formData.type === OrderType.DELIVERY ? formData.delivery_fee || 0 : 0;

  // Réduction : en création, celle du dernier aperçu réussi du serveur ; en
  // modification, la remise figée à la création (le serveur la reconduit).
  const remiseFigee = editOrder && editOrder.discount > 0 ? editOrder.discount : 0;
  const reduction: ReductionAffichee | undefined = editOrder
    ? remiseFigee > 0
      ? { libelle: editOrder.codePromo || undefined, montant: remiseFigee }
      : undefined
    : coupon.reduction;
  const remise = reduction?.montant ?? 0;
  // Modification : le serveur reconduit aussi la taxe figée (commandes de
  // l'app ; zéro pour celles du personnel). Sans elle, le total affiché
  // était inférieur au montant enregistré.
  const taxeFigee = editOrder && editOrder.tax > 0 ? editOrder.tax : 0;
  // Coupon vérifié : sous-total et articles remisés sont ceux du serveur, donc
  // le total affiché égale celui que la création enregistrera. Sinon, calcul
  // de l'écran. Le coupon ne couvre jamais la livraison.
  const sousTotalAffiche = reduction?.sousTotal ?? subtotal;
  const articlesApresRemise = reduction?.totalArticles ?? Math.max(0, subtotal - remise);
  const grandTotal = articlesApresRemise + taxeFigee + deliveryFee;

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="w-full space-y-5"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* ── 1. Type de commande + restaurant ─────────────────────────────── */}
      <div className={CARD_CLASS}>
        <div className="flex items-center gap-2.5 mb-5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-[#F17922]">
            <ClipboardList className="w-4 h-4" />
          </span>
          <div>
            <h2 className="text-[15px] font-bold text-gray-800">
              {editOrder
                ? `Modifier la commande #${editOrder.reference}`
                : "Nouvelle commande"}
            </h2>
            <p className="text-xs text-gray-400">
              Choisissez le type de commande et le restaurant qui prépare.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 lg:gap-6 items-end">
          <OrderTypeSelector
            selectedType={formData.type}
            onChange={(type) => setFormData({ ...formData, type })}
          />

          <div className="relative z-40">
            <label className="text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-gray-400" />
              Restaurant *
            </label>
            {isLoadingRestaurants ? (
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-[13px] text-gray-400">
                Chargement...
              </div>
            ) : (
              <SimpleSelect
                options={restaurants}
                value={formData.restaurant_id}
                onChange={(value) =>
                  setFormData({ ...formData, restaurant_id: value })
                }
                placeholder="Sélectionnez un restaurant"
              />
            )}
          </div>
        </div>

        {/*
          ORIGINE : en modification seulement. Une commande saisie ici est par
          définition une commande du personnel ; proposer la bascule à la
          création permettrait de fabriquer de fausses commandes « application »
          et de fausser durablement le suivi de l'acquisition.
        */}
        {/*
          COMMANDE ANNULÉE (ADMIN, ou CALL_CENTER depuis le 01/10) : les
          corrections s'enregistrent mais la commande RESTE annulée. Le
          formulaire n'envoie jamais de statut (voir prepareOrderData).
        */}
        {annulee && !reactivation && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5">
            <Ban className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <p className="text-xs text-red-800">
              Cette commande est annulée. Vos modifications seront enregistrées,
              mais la commande restera annulée.
            </p>
          </div>
        )}

        {/*
          Pas de bascule d'origine sur une commande annulée : la bascule
          transmet la commande au restaurant et met le paiement à la caisse,
          ce qui n'a aucun sens pour une commande qui ne sera pas préparée.
          L'origine enregistrée est renvoyée telle quelle. Exception : le
          panier annulé par le client repris au téléphone (`reactivation`),
          que l'enregistrement sur « Call center » réactive.
        */}
        {editOrder && bascule && (!annulee || reactivation) && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            <OrigineSelector
              auto={!!formData.auto}
              // `status` est un libellé d'affichage (« EN ATTENTE ») ; `rawStatus`
              // est l'enum du serveur, seule source de vérité pour une règle.
              enAttente={editOrder.rawStatus === OrderStatus.PENDING}
              etaitAuto={editOrder.auto}
              montantFige={bascule.montantFige}
              paiementApresBascule={bascule.paiement}
              annuleeParClient={reactivation}
              // Commande du site : libellés et avertissements parlent du site.
              duSite={estDuSite(editOrder)}
              // Panier de l'application payable en ligne, non payé : même
              // prédicat que le serveur (auto, ONLINE, PENDING, non payé).
              // « Appli » suppose déjà auto et le paiement en ligne.
              brouillon={
                editOrder.paymentChannel === "Appli" &&
                editOrder.rawStatus === OrderStatus.PENDING &&
                !editOrder.paied
              }
              onChange={(auto) => setFormData({ ...formData, auto })}
            />
          </div>
        )}
      </div>

      {/* ── 2. Client | Livraison ────────────────────────────────────────── */}
      {/* La livraison reçoit la colonne la plus large : elle porte la carte. */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5 items-start">
        <div className={`${CARD_CLASS} xl:col-span-2`}>
          <CustomerInfoSection
            formData={formData}
            onFormDataChange={(data) => setFormData({ ...formData, ...data })}
            onCustomerChange={handleCustomerChange}
            isEditMode={!!editOrder}
          />
        </div>

        <div className={`${CARD_CLASS} xl:col-span-3`}>
          <DeliveryInfoSection
            formData={formData}
            onFormDataChange={(data) => setFormData({ ...formData, ...data })}
            orderAmount={subtotal}
          />
        </div>
      </div>

      {/* ── 3. Articles ──────────────────────────────────────────────────── */}
      <div className={CARD_CLASS}>
        <OrderItemsSection
          formData={formData}
          items={formData.items}
          onItemsChange={(items) => setFormData({ ...formData, items })}
          onSubtotalChange={setSubtotal}
          reduction={reduction}
          taxe={taxeFigee}
        />
      </div>

      {/* ── 4. Réduction : code promo ou bon ─────────────────────────────── */}
      {editOrder ? (
        (remiseFigee > 0 || editOrder.codePromo) && (
          <div className={CARD_CLASS}>
            <CouponLectureSeule
              code={editOrder.codePromo}
              remise={remiseFigee}
              // 0 pendant le chargement du catalogue : pas d'alerte à tort.
              sousTotal={formData.items.length > 0 && subtotal > 0 ? subtotal : undefined}
            />
          </div>
        )
      ) : (
        coupon.actif && (
          <div className={CARD_CLASS}>
            <CouponSection
              coupon={coupon}
              totalApresRemise={grandTotal}
              verrouille={isSubmitting}
            />
          </div>
        )
      )}

      {/* ── Barre récap collante : total + actions toujours visibles ─────── */}
      <div className="sticky bottom-4 z-30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white/95 backdrop-blur px-4 sm:px-6 py-3.5 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
          <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1 text-[13px]">
            <span className="text-gray-500">
              {itemsCount} article{itemsCount > 1 ? "s" : ""}
            </span>
            <span className="text-gray-500">
              Sous-total{" "}
              <span className="font-semibold text-gray-700">
                {sousTotalAffiche.toLocaleString()} XOF
              </span>
            </span>
            {deliveryFee > 0 && (
              <span className="text-gray-500">
                Frais{" "}
                <span className="font-semibold text-gray-700">
                  {deliveryFee.toLocaleString()} XOF
                </span>
              </span>
            )}
            {taxeFigee > 0 && (
              <span className="text-gray-500">
                Taxe{" "}
                <span className="font-semibold text-gray-700">
                  {taxeFigee.toLocaleString()} XOF
                </span>
              </span>
            )}
            {reduction && (
              <span className="text-green-700">
                Réduction{" "}
                <span className="font-semibold">
                  {reduction.montant === null
                    ? "en attente"
                    : `−${reduction.montant.toLocaleString()} XOF`}
                </span>
              </span>
            )}
            <span className="text-[15px] font-bold text-gray-900">
              Total{" "}
              <span className="text-[#F17922]">
                {grandTotal.toLocaleString()} XOF
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="h-10 rounded-xl bg-gray-100 px-6 text-[13px] font-semibold text-gray-500 transition hover:bg-gray-200 disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting || formData.items.length === 0}
              className="inline-flex h-10 min-w-[200px] items-center justify-center gap-2 rounded-xl bg-[#F17922] px-6 text-[13px] font-semibold text-white transition hover:bg-[#F17922]/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enregistrement...
                </>
              ) : editOrder ? (
                "Mettre à jour la commande"
              ) : (
                "Enregistrer la commande"
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.form>
  );
};

export default AddOrderForm;
