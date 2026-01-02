"use client";

import React from "react";
import Image from "next/image";
import { formatImageUrl } from "@/utils/imageHelpers";

export interface PromoCardData {
  id: string;
  title?: string;
  discount?: string;
  description?: string;
  background?: string;
  textColor?: string;
  caracter?: string;
  image?: string;
  type?: "percentage" | "fixed";
  status?: "active" | "expired" | "upcoming";
  validUntil?: string;

  // Tous les champs de l'API pour préserver l'intégralité des données
  discount_type?: "PERCENTAGE" | "FIXED_AMOUNT" | "BUY_X_GET_Y";
  discount_value?: number;
  target_type?: "ALL_PRODUCTS" | "SPECIFIC_PRODUCTS" | "CATEGORIES";
  targeted_dish_ids?: string[];
  offered_dishes?: Array<{
    dish_id: string;
    quantity: number;
  }>;
  min_order_amount?: number;
  max_discount_amount?: number;
  max_total_usage?: number;
  max_usage_per_user?: number;
  current_usage?: number;
  start_date?: string;
  expiration_date?: string;
  visibility?: "PUBLIC" | "PRIVATE";
  target_standard?: boolean;
  target_premium?: boolean;
  target_gold?: boolean;
  background_color?: string;
  text_color?: string;
  coupon_image_url?: string;
  created_at?: string;
  updated_at?: string;
  created_by_id?: string;
}

interface PromoCardProps {
  promo: PromoCardData;
  onClick?: (promo: PromoCardData) => void;
  className?: string;
}

const PromoCard = ({ promo, onClick, className = "" }: PromoCardProps) => {
  const handleClick = () => {
    if (onClick) {
      onClick(promo);
    }
  };

  const getStatusBadge = () => {
    switch (promo.status) {
      case "active":
        return (
          <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
            Actif
          </div>
        );
      case "expired":
        return (
          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
            Expiré
          </div>
        );
      case "upcoming":
        return (
          <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
            À venir
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`
        relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300
        hover:scale-105 hover:shadow-lg
        ${className}
      `}
      style={{ backgroundColor: promo.background }}
      onClick={handleClick}
    >
      {promo.status && getStatusBadge()}

      <div className="p-4 h-32 flex flex-col justify-between">
        <div>
          {promo.discount && (
            <div
              className="text-2xl font-bold mb-1"
              style={{ color: promo.textColor }}
            >
              {promo.discount}
            </div>
          )}
          {promo.title && (
            <div
              className="text-sm font-medium mb-1"
              style={{ color: promo.textColor }}
            >
              {promo.title}
            </div>
          )}
          {promo.description && (
            <div
              className="text-xs opacity-90"
              style={{ color: promo.textColor }}
            >
              {promo.description}
            </div>
          )}
        </div>

        {promo.validUntil && (
          <div
            className="text-xs opacity-75"
            style={{ color: promo.textColor }}
          >
            Valide jusqu&apos;au {promo.validUntil}
          </div>
        )}
      </div>

      {/* Affichage de l'image avec validation sécurisée */}
      {(promo.image || promo.coupon_image_url) && (
        <div className="absolute bottom-2 right-2 w-12 h-12">
          <Image
            src={formatImageUrl(promo.coupon_image_url || promo.image)}
            alt={promo.title || "Promotion"}
            width={48}
            height={48}
            className="object-contain"
          />
        </div>
      )}
    </div>
  );
};

export default PromoCard;
