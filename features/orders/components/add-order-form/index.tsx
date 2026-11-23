"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { ArrowLeftRight, Ban, ClipboardList, Loader2, Store } from "lucide-react";

import ConfirmDialog from "@/components/ui/ConfirmDialog";
import SimpleSelect from "@/components/ui/SimpleSelect";
import { useDashboardStore } from "@/store/dashboardStore";
import { useOrderForm } from "../../hooks/useOrderForm";
import { OrderStatus, OrderType } from "../../types/order.types";
import { ReductionAffichee } from "../../types/coupon.types";
import { OrderTable } from "../../types/ordersTable.types";
import CouponSection, { CouponIndisponible, CouponLectureSeule } from "./CouponSection";
import CustomerInfoSection from "./CustomerInfoSection";
import DeliveryInfoSection from "./DeliveryInfoSection";
import EnTeteSection from "./EnTeteSection";
import OrderItemsSection from "./OrderItemsSection";
import OrderTypeSelector from "./OrderTypeSelector";
import OrigineSelector from "./OrigineSelector";
import PanierCommande from "./PanierCommande";
import { apresBascule, estAConfirmer, panierAnnuleParLeClient } from "../../utils/bascule";
import { estDuSite } from "../../utils/canal-commande";
import { MESSAGE_COMMANDE_PAYEE } from "../../utils/modification-coupon";
import { TrajetLivraison } from "../../utils/panier";

interface AddOrderFormProps {
  editOrder?: OrderTable;
  /** Quitte le formulaire : retour à l'écran d'où il a été ouvert. */
  onFermer?: () => void;
}

/** Carte blanche standard des sections du formulaire. */
const CARD_CLASS = "bg-white rounded-2xl border border-gray-200 p-5 sm:p-6";

const AddOrderForm = ({ editOrder, onFermer }: AddOrderFormProps) => {
  // « Reprendre au téléphone » : lu une fois à l'ouverture, puis effacé à la
  // fermeture du formulaire pour ne pas resservir à une autre modification.
  const repriseTelephoneId = useDashboardStore((s) => s.repriseTelephoneId);
  const setRepriseTelephone = useDashboardStore((s) => s.setRepriseTelephone);
  // Jamais sur une commande annulée (la reprise bascule l'origine, voir plus
  // bas), SAUF le panier annulé par le client (application, ou site à payer
  // à la livraison) : « Reprendre au téléphone » n'existe que dans « À
  // relancer », qui ne montre d'annulées que celles-là.
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
  // taxe à zéro, total refait, paiement à la caisse (une commande du site à
  // payer à la livraison aussi, depuis le 24/10). Le calcul se fait donc
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
    annulation,
    handleCustomerChange,
    coupon,
    couponModif,
  } = useOrderForm(editOrder, { repriseTelephone, onFermer });

  // Livraison et frais à l'ouverture du formulaire. MODIFICATION : les frais
  // enregistrés restent tant que la livraison ne change pas, l'écran ne les
  // recalcule plus (23/11). Avant, seule la commande du site à payer à la
  // livraison les gardait ; pour elle, le serveur les impose aussi pendant la
  // reprise au téléphone (`fraisDuSite`), le champ est alors fermé.
  const [depart] = useState(() => formData);
  const fraisEnregistres = editOrder
    ? {
        type: depart.type,
        address: depart.address,
        restaurant_id: depart.restaurant_id,
        delivery_fee: depart.delivery_fee || 0,
      }
    : null;

  // Sous-total (plats+suppléments) remonté par OrderItemsSection → transmis au calcul
  // des frais pour appliquer les offres de livraison à montant minimum (aperçu backoffice).
  const [subtotal, setSubtotal] = useState(0);

  // Panneau du panier : OrderItemsSection y rend les lignes (leur prix et
  // leurs gestes vivent avec le catalogue).
  const [ciblePanier, setCiblePanier] = useState<HTMLElement | null>(null);
  // Distance et durée du trajet de livraison, affichées dans le panier.
  const [trajet, setTrajet] = useState<TrajetLivraison | null>(null);

  // Récap du panier et de la barre collante, toujours visibles pendant la composition.
  const itemsCount = formData.items.reduce((sum, item) => sum + item.quantity, 0);
  const deliveryFee =
    formData.type === OrderType.DELIVERY ? formData.delivery_fee || 0 : 0;

  // Réduction : en modification, la remise en place (le serveur la reconduit),
  // sauf si son retrait est demandé ; sinon celle du dernier aperçu réussi du
  // serveur (création, ou coupon appliqué en modification).
  const retraitDemande = !!couponModif?.retraitDemande;
  const remiseFigee = editOrder && !retraitDemande && editOrder.discount > 0 ? editOrder.discount : 0;
  const reduction: ReductionAffichee | undefined =
    remiseFigee > 0
      ? { libelle: editOrder?.codePromo || undefined, montant: remiseFigee }
      : coupon.reduction;
  const remise = reduction?.montant ?? 0;
  // Modification : le serveur reconduit aussi la taxe figée (commandes de
  // l'app ; zéro pour celles du personnel). Sans elle, le total affiché
  // était inférieur au montant enregistré. Passage en manuel (« Call
  // center ») d'une commande non payée : la taxe tombe à zéro (24/10).
  const passeEnManuel = !!editOrder?.auto && !formData.auto;
  const taxeFigee =
    editOrder && editOrder.tax > 0 && !(passeEnManuel && bascule?.montantFige === null) ? editOrder.tax : 0;
  // Coupon vérifié : sous-total et articles remisés sont ceux du serveur, donc
  // le total affiché égale celui que la création enregistrera. Sinon, calcul
  // de l'écran. Le coupon ne couvre jamais la livraison.
  const sousTotalAffiche = reduction?.sousTotal ?? subtotal;
  const articlesApresRemise = reduction?.totalArticles ?? Math.max(0, subtotal - remise);
  const grandTotal = articlesApresRemise + taxeFigee + deliveryFee;
  const sousTotalRecalcule = Math.round(sousTotalAffiche) !== Math.round(subtotal);
  const restaurantChoisi = restaurants.find((r) => r.value === formData.restaurant_id)?.label;

  // ── Réduction : code promo ou bon, affichée dans le panier ──────────────
  // MODIFICATION (rôles qui créent une commande) : le coupon en place se
  // retire, et un coupon s'applique sur une commande qui n'en a pas (ou dont
  // le retrait est demandé : remplacement en une seule requête). Le serveur
  // refuse tout changement sur une commande payée. Les autres rôles voient
  // la réduction en lecture seule.
  const saisieCoupon = (
    <CouponSection coupon={coupon} totalApresRemise={grandTotal} verrouille={isSubmitting} />
  );
  const blocReduction: ReactNode =
    editOrder && couponModif ? (
      retraitDemande ? (
        <CouponSection
          coupon={coupon}
          totalApresRemise={grandTotal}
          verrouille={isSubmitting}
          retraitPrevu={{
            code: editOrder.codePromo,
            remise: editOrder.discount,
            annuler: couponModif.annulerRetrait,
          }}
        />
      ) : editOrder.discount > 0 || editOrder.codePromo ? (
        <CouponLectureSeule
          code={editOrder.codePromo}
          remise={editOrder.discount}
          // 0 pendant le chargement du catalogue : pas d'alerte à tort.
          sousTotal={formData.items.length > 0 && subtotal > 0 ? subtotal : undefined}
          motif={couponModif.droit ? couponModif.motifFige : null}
          onRetirer={
            couponModif.peutChanger && couponModif.aUnCoupon ? couponModif.demanderRetrait : undefined
          }
          verrouille={isSubmitting}
        />
      ) : coupon.actif ? (
        saisieCoupon
      ) : couponModif.droit && couponModif.motifFige === MESSAGE_COMMANDE_PAYEE ? (
        <CouponIndisponible motif={couponModif.motifFige} />
      ) : null
    ) : coupon.actif ? (
      saisieCoupon
    ) : null;

  return (
    <>
    <motion.form
      onSubmit={handleSubmit}
      // Conteneur de requête : la disposition suit la largeur RÉELLE du
      // formulaire (menu ouvert ou replié, petit ou grand écran), pas celle de
      // l'écran. ⚠️ Aucune fenêtre (`fixed`) dedans : elles sont posées sur
      // la page (fenêtre du plat, confirmations).
      className="w-full @container/commande"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/*
        Assez de place (environ 900 px) : la saisie à gauche, le panier à
        droite, toujours visible (il reste en place quand la page défile).
        Sinon : une seule colonne, le panier sous les articles. La réduction
        vit dans le panier.
      */}
      <div className="grid grid-cols-1 gap-5 @4xl/commande:grid-cols-[minmax(0,1fr)_320px] @4xl/commande:items-start @5xl/commande:grid-cols-[minmax(0,1fr)_340px] @7xl/commande:grid-cols-[minmax(0,1fr)_380px]">
      <div className="min-w-0 space-y-5">
      {/* ── 1. Type de commande + restaurant ─────────────────────────────── */}
      <div className={CARD_CLASS}>
        <div className="mb-5">
          <EnTeteSection
            Icone={ClipboardList}
            titre={editOrder ? `Modifier la commande #${editOrder.reference}` : "Nouvelle commande"}
            sousTitre="Choisissez le type de commande et le restaurant qui prépare."
          />
        </div>

        {/* Type et restaurant côte à côte quand la place le permet ; l'un sous
            l'autre tant que le panier, à droite, resserre la colonne. */}
        <div className="grid grid-cols-1 items-end gap-4 @7xl/commande:grid-cols-[1fr_300px] @7xl/commande:gap-6">
          <OrderTypeSelector
            selectedType={formData.type}
            onChange={(type) => setFormData({ ...formData, type })}
          />

          {/* Sans `z-40` : la liste du sélecteur est posée sur la page, et ce
              rang faisait passer le champ par-dessus l'en-tête fixe au défilement. */}
          <div className="relative">
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
      </div>

      {/* ── Source : Manuel ou Auto, en modification seulement ───────────── */}
        {/*
          Pas de bascule d'origine sur une commande annulée : la bascule
          transmet la commande au restaurant et met le paiement à la caisse,
          ce qui n'a aucun sens pour une commande qui ne sera pas préparée.
          L'origine enregistrée est renvoyée telle quelle. Exception : le
          panier annulé par le client repris au téléphone (`reactivation`),
          que l'enregistrement sur « Call center » réactive.
        */}
      {editOrder && bascule && (!annulee || reactivation) && (
        <div className={CARD_CLASS}>
          <div className="mb-5">
            <EnTeteSection
              Icone={ArrowLeftRight}
              titre="Source de la commande"
              sousTitre="Manuel (call center) ou Auto (application ou site)."
            />
          </div>
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
              // Commande du site à payer à la livraison, encore à confirmer :
              // seule la bascule au call center la transmet au restaurant.
              aConfirmer={estAConfirmer(editOrder)}
              onChange={(auto) => setFormData({ ...formData, auto })}
            />
        </div>
      )}

      {/* ── 2. Client | Livraison ────────────────────────────────────────── */}
      {/* Côte à côte sur un très grand écran seulement : le panier prend la
          droite. La livraison reçoit la colonne la plus large (la carte).
          Empilés, chacun range ses champs sur plusieurs colonnes. */}
      <div className="grid grid-cols-1 min-[1800px]:grid-cols-5 gap-5 items-start">
        <div className={`${CARD_CLASS} min-[1800px]:col-span-2`}>
          <CustomerInfoSection
            formData={formData}
            onFormDataChange={(data) => setFormData({ ...formData, ...data })}
            onCustomerChange={handleCustomerChange}
            isEditMode={!!editOrder}
          />
        </div>

        <div className={`${CARD_CLASS} min-[1800px]:col-span-3`}>
          <DeliveryInfoSection
            formData={formData}
            onFormDataChange={(data) => setFormData({ ...formData, ...data })}
            orderAmount={subtotal}
            fraisEnregistres={fraisEnregistres}
            fraisDuSite={!!bascule?.fraisDuSite && !formData.auto}
            onTrajet={setTrajet}
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
          ciblePanier={ciblePanier}
          enModification={!!editOrder}
        />
      </div>
      </div>

      {/* ── Panier : à côté de la saisie, toujours visible ───────────────── */}
      {/* `top` : sous l'en-tête fixe de la page (3,5 rem) plus une marge. */}
      <aside className="min-w-0 @4xl/commande:sticky @4xl/commande:top-[4.5rem]">
        <PanierCommande
          formData={formData}
          restaurant={restaurantChoisi}
          trajet={formData.type === OrderType.DELIVERY ? trajet : null}
          nombreArticles={itemsCount}
          cibleLignes={setCiblePanier}
          blocReduction={blocReduction}
          sousTotal={sousTotalAffiche}
          sousTotalRecalcule={sousTotalRecalcule}
          fraisLivraison={deliveryFee}
          taxe={taxeFigee}
          reduction={reduction}
          total={grandTotal}
          enModification={!!editOrder}
          envoiEnCours={isSubmitting}
          onAnnuler={handleCancel}
        />
      </aside>

      </div>

      {/* ── Barre récap collante : total + actions toujours visibles ─────── */}
      {/* Une seule colonne seulement : à côté du formulaire, le panier les porte. */}
      <div className="sticky bottom-4 z-30 mt-5 @4xl/commande:hidden">
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
              className="inline-flex h-10 min-w-[200px] items-center justify-center gap-2 rounded-xl bg-[#F17922] px-6 text-[13px] font-semibold text-blanc transition hover:bg-[#F17922]/90 disabled:cursor-not-allowed disabled:opacity-50"
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

    {/*
      Hors du formulaire et posée sur la page : l'animation d'entrée du
      formulaire décalerait une fenêtre placée dedans.
    */}
    {typeof document !== "undefined" &&
      createPortal(
        <ConfirmDialog
          isOpen={annulation.ouverte}
          onClose={annulation.continuer}
          onConfirm={annulation.confirmer}
          title="Annuler la prise de commande ?"
          description="Toutes les données saisies seront perdues."
          confirmLabel="Oui, annuler"
          cancelLabel="Continuer la saisie"
          variant="danger"
        />,
        document.body,
      )}
    </>
  );
};

export default AddOrderForm;
