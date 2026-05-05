"use client";

import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { OrderFormData } from "../../types/order-form.types";
import { DeliveryService, OrderType } from "../../types/order.types";
import {
  getCurrentDate,
  getCurrentTime,
} from "../../../../utils/date/format-date";
import AddressSearchInput from "./AddressSearchInput";
import { getParsedAddress } from "../../utils/getParsedAddress";
import { useDeliveryFeeQuery } from "../../queries/delivery-fee.query";

interface DeliveryInfoSectionProps {
  formData: OrderFormData;
  onFormDataChange: (data: Partial<OrderFormData>) => void;
}

const DeliveryInfoSection: React.FC<DeliveryInfoSectionProps> = ({
  formData,
  onFormDataChange,
}) => {
  const isDelivery = formData.type === OrderType.DELIVERY;

  // Initialiser date et heure par défaut
  useEffect(() => {
    const update: Partial<OrderFormData> = {};
    if (!formData.date) update.date = getCurrentDate();
    if (!formData.time) update.time = getCurrentTime();
    if (Object.keys(update).length > 0) onFormDataChange(update);
  }, [formData.date, formData.time, onFormDataChange]);

  // Remettre delivery_fee à 0 quand le type change de DELIVERY → autre
  useEffect(() => {
    if (!isDelivery && formData.delivery_fee && formData.delivery_fee > 0) {
      onFormDataChange({ delivery_fee: 0 });
    }
  }, [isDelivery]);

  // Query frais de livraison
  const adresse = getParsedAddress(formData.address);
  const { data: deliveryFee } = useDeliveryFeeQuery(
    isDelivery && adresse
      ? {
          lat: adresse.latitude,
          long: adresse.longitude,
          restaurant_id: formData.restaurant_id || undefined,
        }
      : undefined
  );

  // Auto-mettre à jour les frais de livraison quand la query retourne un nouveau résultat
  // (changement d'adresse ou de restaurant)
  useEffect(() => {
    if (isDelivery && deliveryFee?.montant !== undefined) {
      onFormDataChange({ delivery_fee: deliveryFee.montant });
    }
  }, [deliveryFee?.montant, isDelivery]);

  const handleAddressChange = (addressData: unknown) => {
    if (addressData) {
      onFormDataChange({ address: JSON.stringify(addressData) });
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
      {isDelivery && (
        <AddressSearchInput
          value={getParsedAddress(formData.address)}
          onChange={handleAddressChange}
          placeholder="Rechercher votre adresse de livraison"
        />
      )}

      {/* Service de livraison — Override admin du choix auto */}
      {isDelivery && (
        <motion.div
          className="w-full px-3 py-2 border-2 border-[#D9D9D9]/50 rounded-2xl"
          whileHover={{ scale: 1.01 }}
        >
          <label className="text-xs font-semibold text-[#595959] mb-2 block">
            Service de livraison
          </label>
          <div className="flex gap-2">
            {(
              [
                { value: undefined, label: "Auto (selon zone)", desc: "Le backend choisit" },
                { value: DeliveryService.CHICKEN_NATION, label: "Chicken Nation", desc: "Livreur interne" },
                { value: DeliveryService.TURBO, label: "Turbo Delivery", desc: "Sous-traitant" },
              ] as const
            ).map((opt) => {
              const selected = formData.delivery_service === opt.value;
              return (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => onFormDataChange({ delivery_service: opt.value })}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border-2 transition ${
                    selected
                      ? "border-[#F17922] bg-orange-50 text-[#F17922]"
                      : "border-transparent bg-gray-50 text-[#595959] hover:bg-gray-100"
                  }`}
                >
                  <div>{opt.label}</div>
                  <div className="text-[10px] font-normal opacity-70 mt-0.5">{opt.desc}</div>
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

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

      {/* Frais de livraison — uniquement pour DELIVERY */}
      {isDelivery && (
        <motion.div
          className="w-full px-3 py-2 border-2 border-[#D9D9D9]/50 rounded-2xl focus-within:outline-none focus-within:ring-2 focus-within:ring-[#F17922] focus-within:border-transparent"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <label className="text-xs font-semibold text-[#595959] mb-1 block">
            Frais de livraison (XOF)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              id="delivery_fee"
              value={formData.delivery_fee || ""}
              onChange={(e) =>
                onFormDataChange({ delivery_fee: Number(e.target.value) })
              }
              placeholder={
                deliveryFee?.montant
                  ? `Auto: ${deliveryFee.montant.toLocaleString()} XOF`
                  : "0"
              }
              className="w-full py-1 text-[13px] focus:outline-none focus:border-transparent text-[#595959] font-semibold"
            />
            {deliveryFee?.montant && !formData.delivery_fee && (
              <span className="text-xs text-green-600 font-semibold whitespace-nowrap">
                Auto: {deliveryFee.montant.toLocaleString()}
              </span>
            )}
          </div>
          {deliveryFee?.zone && (
            <p className="text-xs text-gray-400 mt-1">
              Zone: {deliveryFee.zone} — {deliveryFee.distance?.toFixed(1)} km
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default DeliveryInfoSection;
