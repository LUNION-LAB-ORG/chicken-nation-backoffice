"use client";

import React from "react";
import { useCustomerLoyaltyInfoQuery } from "../queries/loyalty.queries";
import { getLoyaltyLevelBadge, formatPoints } from "../utils/loyalty.utils";
import { Award, TrendingUp, Gift, Clock } from "lucide-react";

interface CustomerLoyaltyCardProps {
  customerId: string;
}

export function CustomerLoyaltyCard({ customerId }: CustomerLoyaltyCardProps) {
  const { data: loyaltyInfo, isLoading } =
    useCustomerLoyaltyInfoQuery(customerId);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!loyaltyInfo) {
    return null;
  }

  return (
    <div className="bg-linear-to-br from-[#F17922] to-[#ff9f5a] rounded-xl shadow-lg p-6 text-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold mb-1">Programme de Fidélité</h3>
          {getLoyaltyLevelBadge(loyaltyInfo.current_level)}
        </div>
        <Award className="w-12 h-12 opacity-80" />
      </div>

      {/* Points principaux */}
      <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 mb-4">
        <div className="text-sm opacity-90 mb-1">Points disponibles</div>
        <div className="text-3xl font-bold">
          {formatPoints(loyaltyInfo.available_points)}
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4" />
            <div className="text-xs opacity-80">Total</div>
          </div>
          <div className="font-semibold">
            {formatPoints(loyaltyInfo.total_points)}
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Gift className="w-4 h-4" />
            <div className="text-xs opacity-80">Utilisés</div>
          </div>
          <div className="font-semibold">
            {formatPoints(loyaltyInfo.used_points)}
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4" />
            <div className="text-xs opacity-80">Expirés</div>
          </div>
          <div className="font-semibold">
            {formatPoints(loyaltyInfo.expired_points)}
          </div>
        </div>
      </div>

      {/* Progression vers le niveau suivant */}
      {loyaltyInfo.next_level && loyaltyInfo.points_to_next_level !== null && (
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm">
              Prochain niveau: {loyaltyInfo.next_level}
            </span>
            <span className="text-sm font-semibold">
              {formatPoints(loyaltyInfo.points_to_next_level)} pts
            </span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div
              className="bg-white h-2 rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(
                  100,
                  (loyaltyInfo.total_points /
                    (loyaltyInfo.total_points +
                      loyaltyInfo.points_to_next_level)) *
                    100,
                )}%`,
              }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}
