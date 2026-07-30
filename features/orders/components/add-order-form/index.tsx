"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ClipboardList, Loader2, Store } from "lucide-react";

import SimpleSelect from "@/components/ui/SimpleSelect";
import { useOrderForm } from "../../hooks/useOrderForm";
import { OrderType } from "../../types/order.types";
import { OrderTable } from "../../types/ordersTable.types";
import CustomerInfoSection from "./CustomerInfoSection";
import DeliveryInfoSection from "./DeliveryInfoSection";
import OrderItemsSection from "./OrderItemsSection";
import OrderTypeSelector from "./OrderTypeSelector";

interface AddOrderFormProps {
  editOrder?: OrderTable;
}

/** Carte blanche standard des sections du formulaire. */
const CARD_CLASS = "bg-white rounded-2xl border border-gray-200 p-5 sm:p-6";

const AddOrderForm = ({ editOrder }: AddOrderFormProps) => {
  const {
    formData,
    setFormData,
    restaurants,
    isLoadingRestaurants,
    isSubmitting,
    handleSubmit,
    handleCancel,
    handleCustomerChange,
  } = useOrderForm(editOrder);

  // Sous-total (plats+suppléments) remonté par OrderItemsSection → transmis au calcul
  // des frais pour appliquer les offres de livraison à montant minimum (aperçu backoffice).
  const [subtotal, setSubtotal] = useState(0);

  // Récap de la barre collante — toujours visible pendant la composition.
  const itemsCount = formData.items.reduce((sum, item) => sum + item.quantity, 0);
  const deliveryFee =
    formData.type === OrderType.DELIVERY ? formData.delivery_fee || 0 : 0;
  const grandTotal = subtotal + deliveryFee;

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
        />
      </div>

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
                {subtotal.toLocaleString()} XOF
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
