"use client";

import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { OrderFormData } from "../../types/order-form.types";
import { OrderType } from "../../types/order.types";
import {
  getCurrentDate,
  getCurrentTime,
} from "../../../../utils/date/format-date";
import AddressSearchInput from "./AddressSearchInput"; // Importer le composant
import { getParsedAddress } from "../../utils/getParsedAddress";

interface DeliveryInfoSectionProps {
  formData: OrderFormData;
  onFormDataChange: (data: Partial<OrderFormData>) => void;
}

const DeliveryInfoSection: React.FC<DeliveryInfoSectionProps> = ({
  formData,
  onFormDataChange,
}) => {
  // ----------------------------------------------------------
  // EFFET POUR INITIALISER DATE ET HEURE PAR DÉFAUT
  // ----------------------------------------------------------
  useEffect(() => {
    const update: Partial<OrderFormData> = {};

    // Si la date n'est pas déjà définie dans le formulaire, utiliser la date actuelle
    if (!formData.date) {
      update.date = getCurrentDate();
    }

    // Si l'heure n'est pas déjà définie, utiliser l'heure actuelle
    if (!formData.time) {
      update.time = getCurrentTime();
    }

    // Appliquer les changements si des mises à jour sont nécessaires
    if (Object.keys(update).length > 0) {
      onFormDataChange(update);
    }
  }, [formData.date, formData.time, onFormDataChange]);

  // Gérer le changement d'adresse
  const handleAddressChange = (addressData: any) => {
    if (addressData) {
      // Convertir AddressData en string JSON pour OrderFormData
      onFormDataChange({
        address: JSON.stringify(addressData),
      });
    } else {
      onFormDataChange({ address: "" });
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-[#595959]">
        Informations de{" "}
        {formData.type === OrderType.DELIVERY
          ? "livraison"
          : formData.type === OrderType.PICKUP
          ? "retrait"
          : "service"}
      </h3>

      {/* Adresse avec recherche Google Maps */}
      <AddressSearchInput
        value={getParsedAddress(formData.address)}
        onChange={handleAddressChange}
        placeholder="Rechercher votre adresse de livraison"
      />

      <div className="grid grid-cols-2 gap-4">
        {/* Date */}
        <motion.div
          className="w-full px-3 py-2 border-2 border-[#D9D9D9]/50 rounded-2xl focus-within:outline-none focus-within:ring-2 focus-within:ring-[#F17922] focus-within:border-transparent"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <label className="text-xs font-semibold text-[#595959] mb-1 block">
            Date souhaitée
          </label>
          <input
            type="date"
            id="date"
            value={formData.date || ""}
            onChange={(e) => onFormDataChange({ date: e.target.value })}
            className="w-full py-1 text-[13px] focus:outline-none focus:border-transparent text-[#595959] font-semibold"
          />
        </motion.div>

        {/* Heure */}
        <motion.div
          className="w-full px-3 py-2 border-2 border-[#D9D9D9]/50 rounded-2xl focus-within:outline-none focus-within:ring-2 focus-within:ring-[#F17922] focus-within:border-transparent"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <label className="text-xs font-semibold text-[#595959] mb-1 block">
            Heure souhaitée
          </label>
          <input
            type="time"
            id="time"
            value={formData.time || ""}
            onChange={(e) => onFormDataChange({ time: e.target.value })}
            className="w-full py-1 text-[13px] focus:outline-none focus:border-transparent text-[#595959] font-semibold"
          />
        </motion.div>
      </div>

      {/* Note */}
      <motion.div
        className="w-full px-3 py-2 border-2 border-[#D9D9D9]/50 rounded-2xl focus-within:ring-2 focus-within:ring-[#F17922] focus-within:border-transparent"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <label className="text-xs font-semibold text-[#595959] mb-1 block">
          Note ou commentaire
        </label>
        <textarea
          id="note"
          value={formData.note || ""}
          onChange={(e) => onFormDataChange({ note: e.target.value })}
          className="w-full text-[#595959] font-semibold text-[13px] py-1 focus:outline-none focus:border-transparent"
          rows={3}
          placeholder="Instructions particulières, allergies, etc."
        />
      </motion.div>
    </div>
  );
};

export default DeliveryInfoSection;
