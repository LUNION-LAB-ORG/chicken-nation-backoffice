"use client";

import SimpleSelect from "@/components/ui/SimpleSelect";
import { motion } from "framer-motion";
import { useOrderForm } from "../../hooks/useOrderForm";
import CustomerInfoSection from "./CustomerInfoSection";
import DeliveryInfoSection from "./DeliveryInfoSection";
import OrderItemsSection from "./OrderItemsSection";
import OrderTypeSelector from "./OrderTypeSelector";

const AddOrderForm = () => {
  const {
    formData,
    setFormData,
    restaurants,
    isLoadingRestaurants,
    isSubmitting,
    handleSubmit,
    handleCancel,
    handleCustomerChange,
  } = useOrderForm();

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="space-y-8 max-w-7xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* En-tête */}
      <div className="bg-white rounded-2xl p-6 border-2 border-[#D9D9D9]/50">
        <h2 className="text-2xl font-bold text-[#595959] mb-6">
          Nouvelle Commande
        </h2>

        {/* Type de commande */}
        <OrderTypeSelector
          selectedType={formData.type}
          onChange={(type) => setFormData({ ...formData, type })}
        />

        {/* Restaurant */}
        <div className="mt-6">
          <motion.div
            className="px-3 py-4 border-2 border-[#D9D9D9]/50 flex flex-col sm:flex-row items-center justify-between rounded-2xl"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <span className="text-lg text-[#595959] font-semibold">
              Restaurant *
            </span>

            <div className="ml-2 min-w-0 w-64 relative z-50">
              {isLoadingRestaurants ? (
                <div className="bg-[#d8d8d8] text-[#595959] font-semibold px-4 py-2 rounded-xl text-sm">
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
          </motion.div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Colonne gauche - Informations client */}
        <div className="bg-white rounded-2xl p-6 border-2 border-[#D9D9D9]/50">
          <CustomerInfoSection
            formData={formData}
            onFormDataChange={(data) => setFormData({ ...formData, ...data })}
            onCustomerChange={handleCustomerChange}
          />
        </div>

        {/* Colonne droite - Information de livraison */}
        <div className="bg-white rounded-2xl p-6 border-2 border-[#D9D9D9]/50">
          <DeliveryInfoSection
            formData={formData}
            onFormDataChange={(data) => setFormData({ ...formData, ...data })}
          />
        </div>
      </div>
      {/* Articles */}
      <div className="bg-white rounded-2xl p-6 border-2 border-[#D9D9D9]/50">
        <OrderItemsSection
          formData={formData}
          items={formData.items}
          onItemsChange={(items) => setFormData({ ...formData, items })}
        />
      </div>

      {/* Boutons d'action */}
      <div className="flex items-center justify-center gap-4 mt-6">
        <motion.button
          type="button"
          onClick={handleCancel}
          className="h-[40px] text-[#9796A1] px-10 rounded-[10px] bg-[#ECECEC] text-[14px] font-semibold items-center justify-center hover:bg-gray-100 min-w-[180px]"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={isSubmitting}
        >
          Annuler
        </motion.button>
        <motion.button
          type="submit"
          className="h-[40px] px-10 rounded-[10px] bg-[#F17922] hover:bg-[#F17922]/90 text-white text-[14px] font-semibold min-w-[180px] disabled:opacity-50 disabled:cursor-not-allowed"
          whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
          whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
          disabled={isSubmitting || formData.items.length === 0}
        >
          {isSubmitting ? "Enregistrement..." : "✓ Enregistrer la commande"}
        </motion.button>
      </div>
    </motion.form>
  );
};

export default AddOrderForm;
