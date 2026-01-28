"use client";

import Image from "next/image";
import React from "react";
import {
  DeliveryStatsData,
  DeliveryFeeBreakdown,
} from "../../../../features/statistics/types/statistics.types";

interface DeliveryStatsProps {
  data?: DeliveryStatsData;
  isLoading?: boolean;
}

const DeliveryStats: React.FC<DeliveryStatsProps> = ({ data, isLoading }) => {
  // Palette de couleurs pour les segments (Gratuit -> Cher)
  const colors = [
    "#10B981",
    "#3B82F6",
    "#F59E0B",
    "#8B5CF6",
    "#EC4899",
    "#6366F1",
    "#9CA3AF",
  ];

  // Données par défaut pour l'affichage vide
  const defaultBreakdown: DeliveryFeeBreakdown[] = [
    {
      label: "Gratuit",
      feeAmount: 0,
      orderCount: 0,
      revenueGenerated: "0",
      deliveryFeesCollected: 0,
      percentage: 0,
    },
    {
      label: "Payant",
      feeAmount: 0,
      orderCount: 0,
      revenueGenerated: "0",
      deliveryFeesCollected: 0,
      percentage: 0,
    },
  ];

  const breakdown =
    data?.breakdown && data.breakdown.length > 0
      ? data.breakdown
      : defaultBreakdown;
  const totalFees = data?.totalDeliveryFees || 0;

  // Calcul pour la barre de progression visuelle
  const totalPercentage = breakdown.reduce(
    (sum, item) => sum + item.percentage,
    0,
  );

  // Si vide, on distribue équitablement pour l'esthétique "vide"
  const displayData =
    totalPercentage === 0
      ? breakdown.map((item, index) => ({
          ...item,
          displayPercentage: 100 / breakdown.length,
          color: colors[index % colors.length],
        }))
      : breakdown.map((item, index) => ({
          ...item,
          displayPercentage: item.percentage,
          color: colors[index % colors.length],
        }));

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 h-full">
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center">
          {/* Icône de camion ou de livraison */}
          <div className="w-[14px] h-[14px] mr-2 flex items-center justify-center">
            <Image
              src="/icons/delivery-icon.png"
              alt="delivery"
              width={14}
              height={14}
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          </div>
          <h3 className="text-[#F17922] font-bold text-[15px]">
            Statistiques de Livraison
          </h3>
        </div>
        <div className="text-right">
          <span className="text-xs text-gray-400 block">Total Frais</span>
          <span className="text-sm font-bold text-gray-700">
            {totalFees.toLocaleString("fr-FR")} XOF
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">Chargement des livraisons...</div>
        </div>
      ) : (
        <>
          {/* Barre de progression */}
          <div className="w-full h-10 rounded-2xl overflow-hidden flex mb-8 relative bg-gray-50">
            {displayData.map((item, index) => (
              <div
                key={index}
                className="h-full flex items-center justify-center transition-all duration-500"
                style={{
                  width: `${item.displayPercentage}%`,
                  backgroundColor: item.color,
                }}
              >
                {item.percentage > 5 && (
                  <span className="text-white text-xs font-bold drop-shadow-md">
                    {item.percentage}%
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Liste détaillée */}
          <div className="space-y-4 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
            {breakdown.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center flex-1">
                  <div
                    className="w-3 h-3 rounded-full mr-3 shrink-0"
                    style={{ backgroundColor: colors[index % colors.length] }}
                  />
                  <div>
                    <span className="text-gray-600 font-medium block">
                      {item.label}
                    </span>
                    <span className="text-xs text-gray-400">
                      {item.orderCount} commandes
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-gray-700 font-bold">
                    {/* On affiche le total des frais collectés pour cette catégorie */}
                    {item.deliveryFeesCollected.toLocaleString("fr-FR")} XOF
                  </div>
                  {/* Optionnel: Afficher le CA généré par ces commandes */}
                  <div className="text-[10px] text-gray-400">
                    CA: {item.revenueGenerated}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default DeliveryStats;
